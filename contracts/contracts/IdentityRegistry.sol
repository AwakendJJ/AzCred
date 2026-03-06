// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/interfaces/IERC1271.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title IdentityRegistry
 * @notice ERC-8004 Identity Registry — ERC-721 based agent registration.
 *         Each minted token represents a registered AI agent with a globally
 *         unique agentId. The token owner controls the agent's URI, metadata,
 *         and payment wallet.
 */
contract IdentityRegistry is
    ERC721,
    ERC721Enumerable,
    ERC721URIStorage,
    EIP712,
    Ownable
{
    using ECDSA for bytes32;

    // -----------------------------------------------------------------------
    // Storage
    // -----------------------------------------------------------------------

    uint256 private _nextAgentId;

    /// @dev Key-value metadata store per agentId (excludes reserved "agentWallet")
    mapping(uint256 agentId => mapping(string key => bytes value)) private _metadata;

    /// @dev Reserved: agent payment wallet (cleared on token transfer)
    mapping(uint256 agentId => address wallet) private _agentWallets;

    // -----------------------------------------------------------------------
    // EIP-712 typed data
    // -----------------------------------------------------------------------

    bytes32 private constant SET_AGENT_WALLET_TYPEHASH =
        keccak256("SetAgentWallet(uint256 agentId,address newWallet,uint256 deadline)");

    // -----------------------------------------------------------------------
    // Events
    // -----------------------------------------------------------------------

    event Registered(uint256 indexed agentId, string agentURI, address indexed owner);
    event URIUpdated(uint256 indexed agentId, string newURI, address indexed updatedBy);
    event MetadataSet(
        uint256 indexed agentId,
        string indexed indexedMetadataKey,
        string metadataKey,
        bytes metadataValue
    );

    // -----------------------------------------------------------------------
    // Structs
    // -----------------------------------------------------------------------

    struct MetadataEntry {
        string metadataKey;
        bytes metadataValue;
    }

    // -----------------------------------------------------------------------
    // Errors
    // -----------------------------------------------------------------------

    error AgentDoesNotExist(uint256 agentId);
    error NotOwnerOrApproved(uint256 agentId);
    error ReservedMetadataKey(string key);
    error InvalidDeadline();
    error InvalidSignature();
    error NotAgentOwner(uint256 agentId);

    // -----------------------------------------------------------------------
    // Constructor
    // -----------------------------------------------------------------------

    constructor()
        ERC721("AzCred Identity Registry", "AGNT")
        EIP712("IdentityRegistry", "1")
        Ownable(msg.sender)
    {
        _nextAgentId = 1;
    }

    // -----------------------------------------------------------------------
    // Registration
    // -----------------------------------------------------------------------

    /**
     * @notice Register a new agent with a URI pointing to its registration file.
     */
    function register(string calldata agentURI) external returns (uint256 agentId) {
        agentId = _mintAgent(msg.sender);
        _setTokenURI(agentId, agentURI);
        _setAgentWalletInternal(agentId, msg.sender);
        emit Registered(agentId, agentURI, msg.sender);
    }

    /**
     * @notice Register a new agent with a URI and additional on-chain metadata.
     */
    function register(
        string calldata agentURI,
        MetadataEntry[] calldata metadata
    ) external returns (uint256 agentId) {
        agentId = _mintAgent(msg.sender);
        _setTokenURI(agentId, agentURI);
        _setAgentWalletInternal(agentId, msg.sender);
        _setMetadataBatch(agentId, metadata);
        emit Registered(agentId, agentURI, msg.sender);
    }

    /**
     * @notice Register a new agent without a URI — set later via setAgentURI().
     */
    function register() external returns (uint256 agentId) {
        agentId = _mintAgent(msg.sender);
        _setAgentWalletInternal(agentId, msg.sender);
        emit Registered(agentId, "", msg.sender);
    }

    // -----------------------------------------------------------------------
    // URI Management
    // -----------------------------------------------------------------------

    /**
     * @notice Update the agentURI for a registered agent.
     *         Only callable by the token owner or an approved operator.
     */
    function setAgentURI(uint256 agentId, string calldata newURI) external {
        if (!_existsAgent(agentId)) revert AgentDoesNotExist(agentId);
        if (!_isAuthorized(ownerOf(agentId), msg.sender, agentId))
            revert NotOwnerOrApproved(agentId);
        _setTokenURI(agentId, newURI);
        emit URIUpdated(agentId, newURI, msg.sender);
    }

    // -----------------------------------------------------------------------
    // Metadata
    // -----------------------------------------------------------------------

    /**
     * @notice Read arbitrary on-chain metadata for an agent.
     */
    function getMetadata(
        uint256 agentId,
        string memory metadataKey
    ) external view returns (bytes memory) {
        if (!_existsAgent(agentId)) revert AgentDoesNotExist(agentId);
        return _metadata[agentId][metadataKey];
    }

    /**
     * @notice Set arbitrary on-chain metadata for an agent.
     *         The "agentWallet" key is reserved — use setAgentWallet() instead.
     *         Only callable by the token owner or an approved operator.
     */
    function setMetadata(
        uint256 agentId,
        string calldata metadataKey,
        bytes calldata metadataValue
    ) external {
        if (!_existsAgent(agentId)) revert AgentDoesNotExist(agentId);
        if (!_isAuthorized(ownerOf(agentId), msg.sender, agentId))
            revert NotOwnerOrApproved(agentId);
        if (_isReservedKey(metadataKey)) revert ReservedMetadataKey(metadataKey);
        _metadata[agentId][metadataKey] = metadataValue;
        emit MetadataSet(agentId, metadataKey, metadataKey, metadataValue);
    }

    // -----------------------------------------------------------------------
    // Agent Wallet
    // -----------------------------------------------------------------------

    /**
     * @notice Set the agent's payment wallet. The new wallet must provide a
     *         valid EIP-712 signature (EOA) or ERC-1271 signature (smart wallet).
     *         Only the token owner can call this.
     */
    function setAgentWallet(
        uint256 agentId,
        address newWallet,
        uint256 deadline,
        bytes calldata signature
    ) external {
        if (!_existsAgent(agentId)) revert AgentDoesNotExist(agentId);
        if (ownerOf(agentId) != msg.sender) revert NotAgentOwner(agentId);
        if (block.timestamp > deadline) revert InvalidDeadline();

        bytes32 structHash = keccak256(
            abi.encode(SET_AGENT_WALLET_TYPEHASH, agentId, newWallet, deadline)
        );
        bytes32 digest = _hashTypedDataV4(structHash);

        if (!_isValidSignature(newWallet, digest, signature)) revert InvalidSignature();

        _agentWallets[agentId] = newWallet;

        bytes memory encoded = abi.encode(newWallet);
        emit MetadataSet(agentId, "agentWallet", "agentWallet", encoded);
    }

    /**
     * @notice Read the current payment wallet for an agent.
     *         Returns the owner address if no wallet has been set.
     */
    function getAgentWallet(uint256 agentId) external view returns (address) {
        if (!_existsAgent(agentId)) revert AgentDoesNotExist(agentId);
        address wallet = _agentWallets[agentId];
        return wallet == address(0) ? ownerOf(agentId) : wallet;
    }

    /**
     * @notice Clear the agent wallet, resetting it to the zero address.
     *         Only the token owner can call this.
     */
    function unsetAgentWallet(uint256 agentId) external {
        if (!_existsAgent(agentId)) revert AgentDoesNotExist(agentId);
        if (ownerOf(agentId) != msg.sender) revert NotAgentOwner(agentId);
        delete _agentWallets[agentId];
    }

    // -----------------------------------------------------------------------
    // Internal helpers
    // -----------------------------------------------------------------------

    function _mintAgent(address to) private returns (uint256 agentId) {
        agentId = _nextAgentId++;
        _safeMint(to, agentId);
    }

    function _setAgentWalletInternal(uint256 agentId, address wallet) private {
        _agentWallets[agentId] = wallet;
        bytes memory encoded = abi.encode(wallet);
        emit MetadataSet(agentId, "agentWallet", "agentWallet", encoded);
    }

    function _setMetadataBatch(
        uint256 agentId,
        MetadataEntry[] calldata entries
    ) private {
        for (uint256 i = 0; i < entries.length; i++) {
            if (_isReservedKey(entries[i].metadataKey))
                revert ReservedMetadataKey(entries[i].metadataKey);
            _metadata[agentId][entries[i].metadataKey] = entries[i].metadataValue;
            emit MetadataSet(
                agentId,
                entries[i].metadataKey,
                entries[i].metadataKey,
                entries[i].metadataValue
            );
        }
    }

    function _existsAgent(uint256 agentId) private view returns (bool) {
        return _ownerOf(agentId) != address(0);
    }

    function _isReservedKey(string memory key) private pure returns (bool) {
        return keccak256(bytes(key)) == keccak256(bytes("agentWallet"));
    }

    function _isValidSignature(
        address signer,
        bytes32 digest,
        bytes calldata signature
    ) private view returns (bool) {
        if (signer.code.length > 0) {
            // ERC-1271: smart contract wallet
            try IERC1271(signer).isValidSignature(digest, signature) returns (bytes4 result) {
                return result == IERC1271.isValidSignature.selector;
            } catch {
                return false;
            }
        }
        // EOA: ECDSA recover
        return ECDSA.recover(digest, signature) == signer;
    }

    // -----------------------------------------------------------------------
    // Token transfer hook — clear agentWallet on transfer
    // -----------------------------------------------------------------------

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable) returns (address) {
        address from = super._update(to, tokenId, auth);
        // Clear payment wallet whenever ownership changes
        if (from != address(0) && to != address(0) && from != to) {
            delete _agentWallets[tokenId];
        }
        return from;
    }

    // -----------------------------------------------------------------------
    // Required overrides (OZ v5 multi-inheritance)
    // -----------------------------------------------------------------------

    function _increaseBalance(
        address account,
        uint128 value
    ) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721Enumerable, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
