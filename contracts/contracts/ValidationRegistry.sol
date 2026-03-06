// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./IdentityRegistry.sol";

/**
 * @title ValidationRegistry
 * @notice ERC-8004 Validation Registry — agents can request verification of
 *         their work and validators respond on-chain. In the AzCred MVP this
 *         registry is deployed as a dependency and read-only from the credit
 *         scoring perspective; the full validation mechanics are post-MVP.
 */
contract ValidationRegistry {

    // -----------------------------------------------------------------------
    // Storage
    // -----------------------------------------------------------------------

    IdentityRegistry private _identityRegistry;
    bool private _initialized;

    struct ValidationRecord {
        address validatorAddress;
        uint256 agentId;
        uint8 response;
        bytes32 responseHash;
        string tag;
        uint256 lastUpdate;
    }

    /// requestHash => ValidationRecord
    mapping(bytes32 => ValidationRecord) private _validations;

    /// agentId => list of requestHashes
    mapping(uint256 => bytes32[]) private _agentValidations;

    /// validatorAddress => list of requestHashes
    mapping(address => bytes32[]) private _validatorRequests;

    // -----------------------------------------------------------------------
    // Events
    // -----------------------------------------------------------------------

    event ValidationRequest(
        address indexed validatorAddress,
        uint256 indexed agentId,
        string requestURI,
        bytes32 indexed requestHash
    );

    event ValidationResponse(
        address indexed validatorAddress,
        uint256 indexed agentId,
        bytes32 indexed requestHash,
        uint8 response,
        string responseURI,
        bytes32 responseHash,
        string tag
    );

    // -----------------------------------------------------------------------
    // Errors
    // -----------------------------------------------------------------------

    error AlreadyInitialized();
    error NotInitialized();
    error AgentDoesNotExist(uint256 agentId);
    error NotOwnerOrOperator(uint256 agentId);
    error RequestNotFound(bytes32 requestHash);
    error NotDesignatedValidator(bytes32 requestHash);
    error InvalidResponse(uint8 response);

    // -----------------------------------------------------------------------
    // Initializer
    // -----------------------------------------------------------------------

    /**
     * @notice Set the Identity Registry address. Can only be called once.
     */
    function initialize(address identityRegistry) external {
        if (_initialized) revert AlreadyInitialized();
        _identityRegistry = IdentityRegistry(identityRegistry);
        _initialized = true;
    }

    /**
     * @notice Returns the address of the linked Identity Registry.
     */
    function getIdentityRegistry() external view returns (address) {
        return address(_identityRegistry);
    }

    // -----------------------------------------------------------------------
    // Validation Request
    // -----------------------------------------------------------------------

    /**
     * @notice Request validation of agent work from a specific validator.
     *         Must be called by the agentId owner or an approved operator.
     * @param validatorAddress Address of the validator smart contract.
     * @param agentId          The ERC-8004 agentId requesting validation.
     * @param requestURI       URI to off-chain data the validator needs.
     * @param requestHash      keccak256 commitment to the request payload.
     */
    function validationRequest(
        address validatorAddress,
        uint256 agentId,
        string calldata requestURI,
        bytes32 requestHash
    ) external {
        if (!_initialized) revert NotInitialized();
        if (!_agentExists(agentId)) revert AgentDoesNotExist(agentId);

        address agentOwner = _identityRegistry.ownerOf(agentId);
        if (
            msg.sender != agentOwner &&
            !_identityRegistry.isApprovedForAll(agentOwner, msg.sender) &&
            _identityRegistry.getApproved(agentId) != msg.sender
        ) revert NotOwnerOrOperator(agentId);

        _validations[requestHash] = ValidationRecord({
            validatorAddress: validatorAddress,
            agentId: agentId,
            response: 0,
            responseHash: bytes32(0),
            tag: "",
            lastUpdate: 0
        });

        _agentValidations[agentId].push(requestHash);
        _validatorRequests[validatorAddress].push(requestHash);

        emit ValidationRequest(validatorAddress, agentId, requestURI, requestHash);
    }

    // -----------------------------------------------------------------------
    // Validation Response
    // -----------------------------------------------------------------------

    /**
     * @notice Submit a validation response. Must be called by the designated
     *         validator for the given requestHash.
     * @param requestHash  The commitment hash from the original request.
     * @param response     Score 0–100 (0 = failed, 100 = passed, or gradient).
     * @param responseURI  URI to off-chain evidence (optional).
     * @param responseHash keccak256 of responseURI content (optional).
     * @param tag          Custom categorization or finality tag (optional).
     */
    function validationResponse(
        bytes32 requestHash,
        uint8 response,
        string calldata responseURI,
        bytes32 responseHash,
        string calldata tag
    ) external {
        ValidationRecord storage record = _validations[requestHash];
        if (record.validatorAddress == address(0)) revert RequestNotFound(requestHash);
        if (record.validatorAddress != msg.sender) revert NotDesignatedValidator(requestHash);
        if (response > 100) revert InvalidResponse(response);

        record.response = response;
        record.responseHash = responseHash;
        record.tag = tag;
        record.lastUpdate = block.timestamp;

        emit ValidationResponse(
            msg.sender,
            record.agentId,
            requestHash,
            response,
            responseURI,
            responseHash,
            tag
        );
    }

    // -----------------------------------------------------------------------
    // Read Functions
    // -----------------------------------------------------------------------

    /**
     * @notice Get the current validation status for a request hash.
     */
    function getValidationStatus(
        bytes32 requestHash
    )
        external
        view
        returns (
            address validatorAddress,
            uint256 agentId,
            uint8 response,
            bytes32 responseHash,
            string memory tag,
            uint256 lastUpdate
        )
    {
        ValidationRecord storage r = _validations[requestHash];
        return (r.validatorAddress, r.agentId, r.response, r.responseHash, r.tag, r.lastUpdate);
    }

    /**
     * @notice Get aggregated validation statistics for an agent.
     */
    function getSummary(
        uint256 agentId,
        address[] calldata validatorAddresses,
        string calldata tag
    ) external view returns (uint64 count, uint8 averageResponse) {
        bytes32[] storage hashes = _agentValidations[agentId];
        bool filterValidator = validatorAddresses.length > 0;
        bool filterTag = bytes(tag).length > 0;
        uint256 total;

        for (uint256 i = 0; i < hashes.length; i++) {
            ValidationRecord storage r = _validations[hashes[i]];
            if (r.lastUpdate == 0) continue;
            if (filterTag && keccak256(bytes(r.tag)) != keccak256(bytes(tag))) continue;
            if (filterValidator) {
                bool found;
                for (uint256 j = 0; j < validatorAddresses.length; j++) {
                    if (r.validatorAddress == validatorAddresses[j]) {
                        found = true;
                        break;
                    }
                }
                if (!found) continue;
            }
            count++;
            total += r.response;
        }

        averageResponse = count > 0 ? uint8(total / count) : 0;
    }

    /**
     * @notice Get all request hashes for a given agentId.
     */
    function getAgentValidations(uint256 agentId) external view returns (bytes32[] memory) {
        return _agentValidations[agentId];
    }

    /**
     * @notice Get all request hashes submitted to a given validator.
     */
    function getValidatorRequests(address validatorAddress) external view returns (bytes32[] memory) {
        return _validatorRequests[validatorAddress];
    }

    // -----------------------------------------------------------------------
    // Internal helpers
    // -----------------------------------------------------------------------

    function _agentExists(uint256 agentId) private view returns (bool) {
        try _identityRegistry.ownerOf(agentId) returns (address owner) {
            return owner != address(0);
        } catch {
            return false;
        }
    }
}
