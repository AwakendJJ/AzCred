// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./IdentityRegistry.sol";

/**
 * @title ReputationRegistry
 * @notice ERC-8004 Reputation Registry — on-chain feedback signals for
 *         registered AI agents. Clients submit signed fixed-point values
 *         tagged with signal names (e.g. "successRate", "uptime", "starred").
 *         AzCredCreditLine reads these signals to compute agent credit scores.
 */
contract ReputationRegistry {

    // -----------------------------------------------------------------------
    // Storage
    // -----------------------------------------------------------------------

    IdentityRegistry private _identityRegistry;

    struct FeedbackRecord {
        int128 value;
        uint8 valueDecimals;
        string tag1;
        string tag2;
        bool isRevoked;
    }

    /// agentId => clientAddress => feedbackIndex (1-based) => FeedbackRecord
    mapping(uint256 => mapping(address => mapping(uint64 => FeedbackRecord))) private _feedback;

    /// agentId => clientAddress => last feedback index used
    mapping(uint256 => mapping(address => uint64)) private _lastIndex;

    /// agentId => list of clients who submitted feedback
    mapping(uint256 => address[]) private _clients;

    /// agentId => clientAddress => has submitted at least once
    mapping(uint256 => mapping(address => bool)) private _hasSubmitted;

    bool private _initialized;

    // -----------------------------------------------------------------------
    // Events
    // -----------------------------------------------------------------------

    event NewFeedback(
        uint256 indexed agentId,
        address indexed clientAddress,
        uint64 feedbackIndex,
        int128 value,
        uint8 valueDecimals,
        string indexed indexedTag1,
        string tag1,
        string tag2,
        string endpoint,
        string feedbackURI,
        bytes32 feedbackHash
    );

    event FeedbackRevoked(
        uint256 indexed agentId,
        address indexed clientAddress,
        uint64 indexed feedbackIndex
    );

    event ResponseAppended(
        uint256 indexed agentId,
        address indexed clientAddress,
        uint64 feedbackIndex,
        address indexed responder,
        string responseURI,
        bytes32 responseHash
    );

    // -----------------------------------------------------------------------
    // Errors
    // -----------------------------------------------------------------------

    error AlreadyInitialized();
    error NotInitialized();
    error AgentDoesNotExist(uint256 agentId);
    error SelfFeedbackNotAllowed(uint256 agentId);
    error InvalidValueDecimals(uint8 decimals);
    error FeedbackNotFound(uint256 agentId, address client, uint64 index);
    error AlreadyRevoked(uint256 agentId, address client, uint64 index);

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
    // Feedback Submission
    // -----------------------------------------------------------------------

    /**
     * @notice Submit feedback for a registered agent.
     * @param agentId       The ERC-8004 agentId to rate.
     * @param value         Fixed-point feedback value (positive or negative).
     * @param valueDecimals Number of decimal places in value (0–18).
     * @param tag1          Primary signal tag (e.g. "successRate", "uptime").
     * @param tag2          Secondary tag (optional, pass "" to omit).
     * @param endpoint      Endpoint URI this feedback relates to (optional).
     * @param feedbackURI   URI to off-chain feedback detail file (optional).
     * @param feedbackHash  keccak256 of feedbackURI content (optional, 0 for IPFS).
     */
    function giveFeedback(
        uint256 agentId,
        int128 value,
        uint8 valueDecimals,
        string calldata tag1,
        string calldata tag2,
        string calldata endpoint,
        string calldata feedbackURI,
        bytes32 feedbackHash
    ) external {
        if (!_initialized) revert NotInitialized();
        if (!_agentExists(agentId)) revert AgentDoesNotExist(agentId);
        if (valueDecimals > 18) revert InvalidValueDecimals(valueDecimals);

        // Prevent agent owner / operator from rating themselves
        address agentOwner = _identityRegistry.ownerOf(agentId);
        if (
            msg.sender == agentOwner ||
            _identityRegistry.isApprovedForAll(agentOwner, msg.sender) ||
            _identityRegistry.getApproved(agentId) == msg.sender
        ) revert SelfFeedbackNotAllowed(agentId);

        uint64 index = _lastIndex[agentId][msg.sender] + 1;
        _lastIndex[agentId][msg.sender] = index;

        _feedback[agentId][msg.sender][index] = FeedbackRecord({
            value: value,
            valueDecimals: valueDecimals,
            tag1: tag1,
            tag2: tag2,
            isRevoked: false
        });

        if (!_hasSubmitted[agentId][msg.sender]) {
            _clients[agentId].push(msg.sender);
            _hasSubmitted[agentId][msg.sender] = true;
        }

        emit NewFeedback(
            agentId,
            msg.sender,
            index,
            value,
            valueDecimals,
            tag1,
            tag1,
            tag2,
            endpoint,
            feedbackURI,
            feedbackHash
        );
    }

    // -----------------------------------------------------------------------
    // Revocation
    // -----------------------------------------------------------------------

    /**
     * @notice Revoke previously submitted feedback.
     */
    function revokeFeedback(uint256 agentId, uint64 feedbackIndex) external {
        FeedbackRecord storage record = _feedback[agentId][msg.sender][feedbackIndex];
        if (record.valueDecimals == 0 && record.value == 0 && bytes(record.tag1).length == 0)
            revert FeedbackNotFound(agentId, msg.sender, feedbackIndex);
        if (record.isRevoked) revert AlreadyRevoked(agentId, msg.sender, feedbackIndex);
        record.isRevoked = true;
        emit FeedbackRevoked(agentId, msg.sender, feedbackIndex);
    }

    // -----------------------------------------------------------------------
    // Response Appending
    // -----------------------------------------------------------------------

    /**
     * @notice Append a response (e.g. refund proof, spam flag) to feedback.
     *         Anyone can call this — filtering is done off-chain.
     */
    function appendResponse(
        uint256 agentId,
        address clientAddress,
        uint64 feedbackIndex,
        string calldata responseURI,
        bytes32 responseHash
    ) external {
        emit ResponseAppended(
            agentId,
            clientAddress,
            feedbackIndex,
            msg.sender,
            responseURI,
            responseHash
        );
    }

    // -----------------------------------------------------------------------
    // Read Functions
    // -----------------------------------------------------------------------

    /**
     * @notice Read a single feedback entry.
     */
    function readFeedback(
        uint256 agentId,
        address clientAddress,
        uint64 feedbackIndex
    )
        external
        view
        returns (
            int128 value,
            uint8 valueDecimals,
            string memory tag1,
            string memory tag2,
            bool isRevoked
        )
    {
        FeedbackRecord storage r = _feedback[agentId][clientAddress][feedbackIndex];
        return (r.value, r.valueDecimals, r.tag1, r.tag2, r.isRevoked);
    }

    /**
     * @notice Get a summary (count + sum) of feedback for an agent,
     *         filtered by clientAddresses and optional tag1/tag2.
     *         clientAddresses MUST be non-empty to prevent Sybil/spam.
     */
    function getSummary(
        uint256 agentId,
        address[] calldata clientAddresses,
        string calldata tag1Filter,
        string calldata tag2Filter
    )
        external
        view
        returns (
            uint64 count,
            int128 summaryValue,
            uint8 summaryValueDecimals
        )
    {
        bool filterTag1 = bytes(tag1Filter).length > 0;
        bool filterTag2 = bytes(tag2Filter).length > 0;

        for (uint256 i = 0; i < clientAddresses.length; i++) {
            address client = clientAddresses[i];
            uint64 lastIdx = _lastIndex[agentId][client];
            for (uint64 j = 1; j <= lastIdx; j++) {
                FeedbackRecord storage r = _feedback[agentId][client][j];
                if (r.isRevoked) continue;
                if (filterTag1 && keccak256(bytes(r.tag1)) != keccak256(bytes(tag1Filter))) continue;
                if (filterTag2 && keccak256(bytes(r.tag2)) != keccak256(bytes(tag2Filter))) continue;
                count++;
                summaryValue += r.value;
                summaryValueDecimals = r.valueDecimals;
            }
        }
    }

    /**
     * @notice Read the latest non-revoked feedback value for a specific tag1
     *         from any client. Used by AzCredCreditLine for credit scoring.
     * @return value         The latest signal value (0 if none found).
     * @return valueDecimals Decimal places for the value.
     * @return found         Whether a non-revoked entry was found.
     */
    function getLatestSignal(
        uint256 agentId,
        string calldata tag1
    )
        external
        view
        returns (int128 value, uint8 valueDecimals, bool found)
    {
        address[] storage clients = _clients[agentId];
        bytes32 tag1Hash = keccak256(bytes(tag1));

        for (uint256 i = 0; i < clients.length; i++) {
            address client = clients[i];
            uint64 lastIdx = _lastIndex[agentId][client];
            // Iterate newest to oldest to get the latest entry
            for (uint64 j = lastIdx; j >= 1; j--) {
                FeedbackRecord storage r = _feedback[agentId][client][j];
                if (!r.isRevoked && keccak256(bytes(r.tag1)) == tag1Hash) {
                    return (r.value, r.valueDecimals, true);
                }
                if (j == 1) break;
            }
        }
        return (0, 0, false);
    }

    /**
     * @notice Get all clients who have submitted feedback for an agent.
     */
    function getClients(uint256 agentId) external view returns (address[] memory) {
        return _clients[agentId];
    }

    /**
     * @notice Get the last feedback index for a client on an agent.
     */
    function getLastIndex(
        uint256 agentId,
        address clientAddress
    ) external view returns (uint64) {
        return _lastIndex[agentId][clientAddress];
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
