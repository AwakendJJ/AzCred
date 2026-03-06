// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./IdentityRegistry.sol";
import "./ReputationRegistry.sol";

/**
 * @title AzCredCreditLine
 * @notice AzCred core contract — reads ERC-8004 identity and reputation
 *         signals to assign tiered CTC credit limits to registered AI agents.
 *
 * Credit scoring formula (weighted average, 0–100):
 *   score = successRate × 0.40 + uptime × 0.35 + starred × 0.25
 *
 * Tier mapping:
 *   0–33   → 100  tCTC
 *   34–66  → 500  tCTC
 *   67–100 → 1000 tCTC
 *
 * Credit limits are assigned once via assignCredit() and cached.
 * The deployer pre-funds the contract pool via fundPool().
 */
contract AzCredCreditLine is Ownable, ReentrancyGuard {

    // -----------------------------------------------------------------------
    // Constants
    // -----------------------------------------------------------------------

    uint256 public constant TIER1_LIMIT = 100 ether;   // 100 tCTC
    uint256 public constant TIER2_LIMIT = 500 ether;   // 500 tCTC
    uint256 public constant TIER3_LIMIT = 1000 ether;  // 1000 tCTC

    uint8 public constant TIER1_MAX_SCORE = 33;
    uint8 public constant TIER2_MAX_SCORE = 66;

    // -----------------------------------------------------------------------
    // Storage
    // -----------------------------------------------------------------------

    IdentityRegistry public immutable identityRegistry;
    ReputationRegistry public immutable reputationRegistry;

    /// agentId => assigned credit limit (0 = not yet assigned)
    mapping(uint256 => uint256) public creditLimit;

    /// agentId => outstanding drawn balance
    mapping(uint256 => uint256) public outstandingBalance;

    /// agentId => cached credit score at time of assignment
    mapping(uint256 => uint8) public creditScore;

    // -----------------------------------------------------------------------
    // Events
    // -----------------------------------------------------------------------

    event CreditAssigned(
        uint256 indexed agentId,
        uint256 creditLimit,
        uint8 score
    );

    event CreditDrawn(
        uint256 indexed agentId,
        uint256 amount,
        uint256 outstandingBalance
    );

    event CreditRepaid(
        uint256 indexed agentId,
        uint256 amount,
        uint256 outstandingBalance
    );

    event CreditUpgradeRequested(
        uint256 indexed agentId,
        address indexed owner
    );

    event PoolFunded(address indexed funder, uint256 amount);
    event PoolWithdrawn(address indexed to, uint256 amount);

    // -----------------------------------------------------------------------
    // Errors
    // -----------------------------------------------------------------------

    error AgentNotRegistered(uint256 agentId);
    error CreditAlreadyAssigned(uint256 agentId);
    error CreditNotAssigned(uint256 agentId);
    error NotAgentOwner(uint256 agentId);
    error InsufficientAvailableCredit(uint256 requested, uint256 available);
    error InsufficientPoolBalance(uint256 requested, uint256 poolBalance);
    error RepaymentExceedsOutstanding(uint256 repaid, uint256 outstanding);
    error NoOutstandingBalance(uint256 agentId);
    error InsufficientRepayment();
    error NoSignalsFound(uint256 agentId);
    error WithdrawFailed();

    // -----------------------------------------------------------------------
    // Constructor
    // -----------------------------------------------------------------------

    constructor(
        address _identityRegistry,
        address _reputationRegistry
    ) Ownable(msg.sender) {
        identityRegistry = IdentityRegistry(_identityRegistry);
        reputationRegistry = ReputationRegistry(_reputationRegistry);
    }

    // -----------------------------------------------------------------------
    // Credit Assignment
    // -----------------------------------------------------------------------

    /**
     * @notice Assign a credit limit to a registered agent based on its
     *         on-chain ERC-8004 reputation signals. Can only be called once
     *         per agent — limits are cached and do not recalculate on draws.
     * @param agentId The ERC-8004 agentId to score and assign credit.
     */
    function assignCredit(uint256 agentId) external {
        // Verify agent is registered
        if (!_agentExists(agentId)) revert AgentNotRegistered(agentId);
        // Prevent reassignment
        if (creditLimit[agentId] > 0) revert CreditAlreadyAssigned(agentId);

        uint8 score = _computeScore(agentId);
        uint256 limit = _getCreditLimit(score);

        creditScore[agentId] = score;
        creditLimit[agentId] = limit;

        emit CreditAssigned(agentId, limit, score);
    }

    // -----------------------------------------------------------------------
    // Draw
    // -----------------------------------------------------------------------

    /**
     * @notice Draw CTC from the credit line. Caller must be the agentId owner.
     * @param agentId The agent drawing credit.
     * @param amount  Amount of tCTC to draw (in wei).
     */
    function drawCredit(uint256 agentId, uint256 amount) external nonReentrant {
        if (creditLimit[agentId] == 0) revert CreditNotAssigned(agentId);
        if (identityRegistry.ownerOf(agentId) != msg.sender)
            revert NotAgentOwner(agentId);

        uint256 available = creditLimit[agentId] - outstandingBalance[agentId];
        if (amount > available)
            revert InsufficientAvailableCredit(amount, available);

        uint256 currentPool = address(this).balance;
        if (amount > currentPool)
            revert InsufficientPoolBalance(amount, currentPool);

        outstandingBalance[agentId] += amount;
        emit CreditDrawn(agentId, amount, outstandingBalance[agentId]);

        // Transfer CTC to agent owner
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
    }

    // -----------------------------------------------------------------------
    // Repayment
    // -----------------------------------------------------------------------

    /**
     * @notice Repay outstanding credit. Send tCTC as msg.value.
     *         Accepts partial or full repayment.
     * @param agentId The agent whose credit is being repaid.
     */
    function repayCredit(uint256 agentId) external payable nonReentrant {
        if (creditLimit[agentId] == 0) revert CreditNotAssigned(agentId);
        if (outstandingBalance[agentId] == 0) revert NoOutstandingBalance(agentId);
        if (msg.value == 0) revert InsufficientRepayment();
        if (msg.value > outstandingBalance[agentId])
            revert RepaymentExceedsOutstanding(msg.value, outstandingBalance[agentId]);

        outstandingBalance[agentId] -= msg.value;
        emit CreditRepaid(agentId, msg.value, outstandingBalance[agentId]);
    }

    // -----------------------------------------------------------------------
    // Credit Upgrade Request (post-MVP mechanics)
    // -----------------------------------------------------------------------

    /**
     * @notice Signal intent to upgrade credit limit. Emits an event for
     *         off-chain processing. Re-scoring mechanics are post-MVP.
     */
    function requestCreditUpgrade(uint256 agentId) external {
        if (creditLimit[agentId] == 0) revert CreditNotAssigned(agentId);
        if (identityRegistry.ownerOf(agentId) != msg.sender)
            revert NotAgentOwner(agentId);
        emit CreditUpgradeRequested(agentId, msg.sender);
    }

    // -----------------------------------------------------------------------
    // View Functions
    // -----------------------------------------------------------------------

    /**
     * @notice Read the full credit profile for an agent.
     */
    function getCreditProfile(
        uint256 agentId
    )
        external
        view
        returns (
            uint256 limit,
            uint256 outstanding,
            uint256 available,
            uint8 score
        )
    {
        limit = creditLimit[agentId];
        outstanding = outstandingBalance[agentId];
        available = limit > outstanding ? limit - outstanding : 0;
        score = creditScore[agentId];
    }

    /**
     * @notice Preview what credit score and tier an agent would receive
     *         if assignCredit() were called now. Does not assign.
     */
    function previewScore(
        uint256 agentId
    ) external view returns (uint8 score, uint256 limit) {
        if (!_agentExists(agentId)) revert AgentNotRegistered(agentId);
        score = _computeScore(agentId);
        limit = _getCreditLimit(score);
    }

    /**
     * @notice Total tCTC held in the credit pool.
     */
    function poolBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // -----------------------------------------------------------------------
    // Admin
    // -----------------------------------------------------------------------

    /**
     * @notice Fund the credit pool. Owner only.
     */
    function fundPool() external payable onlyOwner {
        emit PoolFunded(msg.sender, msg.value);
    }

    /**
     * @notice Emergency withdrawal from the pool. Owner only.
     */
    function withdrawPool(uint256 amount) external onlyOwner {
        if (amount > address(this).balance)
            revert InsufficientPoolBalance(amount, address(this).balance);
        (bool success, ) = payable(owner()).call{value: amount}("");
        if (!success) revert WithdrawFailed();
        emit PoolWithdrawn(owner(), amount);
    }

    // Accept direct tCTC transfers to pool
    receive() external payable {
        emit PoolFunded(msg.sender, msg.value);
    }

    // -----------------------------------------------------------------------
    // Internal: Credit Score Computation
    // -----------------------------------------------------------------------

    /**
     * @dev Reads successRate, uptime, and starred signals from the
     *      ReputationRegistry and computes a weighted score (0–100).
     *      Returns 0 if no signals are found (agent gets no credit).
     */
    function _computeScore(uint256 agentId) internal view returns (uint8) {
        (int128 successRate, , bool srFound) =
            reputationRegistry.getLatestSignal(agentId, "successRate");
        (int128 uptime, , bool upFound) =
            reputationRegistry.getLatestSignal(agentId, "uptime");
        (int128 starred, , bool stFound) =
            reputationRegistry.getLatestSignal(agentId, "starred");

        if (!srFound || !upFound || !stFound) return 0;

        // Clamp each signal to 0–100 before weighting
        uint256 sr = _clamp(successRate, 0, 100);
        uint256 up = _clamp(uptime, 0, 100);
        uint256 st = _clamp(starred, 0, 100);

        // Weighted average × 100 to keep integer precision, then divide
        uint256 weighted = (sr * 40 + up * 35 + st * 25) / 100;

        return uint8(weighted > 100 ? 100 : weighted);
    }

    function _getCreditLimit(uint8 score) internal pure returns (uint256) {
        if (score <= TIER1_MAX_SCORE) return TIER1_LIMIT;
        if (score <= TIER2_MAX_SCORE) return TIER2_LIMIT;
        return TIER3_LIMIT;
    }

    function _clamp(int128 value, int128 min, int128 max) internal pure returns (uint256) {
        if (value < min) return uint256(uint128(min));
        if (value > max) return uint256(uint128(max));
        return uint256(uint128(value));
    }

    function _agentExists(uint256 agentId) internal view returns (bool) {
        try identityRegistry.ownerOf(agentId) returns (address owner) {
            return owner != address(0);
        } catch {
            return false;
        }
    }
}
