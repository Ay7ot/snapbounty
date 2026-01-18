// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "./interfaces/IERC20.sol";
import {ReentrancyGuard} from "./utils/ReentrancyGuard.sol";

/**
 * @title SnapBountyEscrow
 * @notice A simple escrow contract for micro-bounties with USDC payments
 * @dev Handles bounty creation, claiming, submission, approval, rejection, and cancellation
 */
contract SnapBountyEscrow is ReentrancyGuard {
    // ============ Types ============

    enum BountyStatus {
        Open, // Bounty is available to claim
        Claimed, // Hunter has claimed the bounty
        Submitted, // Hunter has submitted work
        Completed, // Work approved, payment released
        Cancelled, // Bounty cancelled, funds refunded
        Disputed // Dispute opened, awaiting arbitration
    }

    enum DisputeResolution {
        Pending, // Dispute not yet resolved
        HunterWins, // Hunter gets full payment
        CreatorWins, // Creator gets full refund
        Split // 50/50 split between parties
    }

    struct Bounty {
        address creator; // Address that created the bounty
        address hunter; // Address that claimed the bounty
        uint256 reward; // Reward amount in USDC (6 decimals)
        BountyStatus status; // Current status
        bytes32 proofHash; // Hash of the submission proof
        uint256 deadline; // Optional deadline (0 = no deadline)
        uint256 createdAt; // Timestamp of creation
        uint256 claimedAt; // Timestamp when claimed
        uint8 rejectionCount; // Number of times work was rejected
    }

    struct Dispute {
        uint256 bountyId; // Associated bounty
        address initiator; // Who opened the dispute (hunter)
        bytes32 hunterEvidence; // Hunter's evidence hash
        bytes32 creatorEvidence; // Creator's evidence hash
        uint256 openedAt; // When dispute was opened
        uint256 disputeFee; // Fee paid by hunter
        DisputeResolution resolution; // Final resolution
        bool resolved; // Whether dispute is resolved
    }

    // ============ State Variables ============

    /// @notice The USDC token contract
    IERC20 public immutable usdc;

    /// @notice Platform treasury address for fee collection
    address public treasury;

    /// @notice Platform fee in basis points (500 = 5%)
    uint256 public platformFeeBps;

    /// @notice Counter for bounty IDs
    uint256 public bountyCount;

    /// @notice Mapping of bounty ID to Bounty struct
    mapping(uint256 => Bounty) public bounties;

    /// @notice Mapping of hunter address to their active bounty claim (0 = no active claim)
    mapping(address => uint256) public activeClaim;

    /// @notice Mapping of bounty ID to dispute
    mapping(uint256 => Dispute) public disputes;

    /// @notice Counter for total disputes
    uint256 public disputeCount;

    /// @notice Arbiter address for dispute resolution
    address public arbiter;

    /// @notice Dispute fee in USDC (6 decimals) - e.g., 1000000 = 1 USDC
    uint256 public disputeFee;

    /// @notice Owner of the contract
    address public owner;

    // ============ Constants ============

    /// @notice Maximum platform fee (10%)
    uint256 public constant MAX_FEE_BPS = 1000;

    /// @notice Basis points denominator
    uint256 public constant BPS_DENOMINATOR = 10000;

    /// @notice Maximum time a hunter can hold a claim before creator can cancel (30 days)
    uint256 public constant MAX_CLAIM_DURATION = 30 days;

    /// @notice Maximum rejections before hunter can auto-escalate to dispute
    uint8 public constant MAX_REJECTIONS = 3;

    /// @notice Time window for arbiter to resolve dispute (14 days)
    uint256 public constant DISPUTE_RESOLUTION_WINDOW = 14 days;

    /// @notice Time for creator to submit evidence after dispute opened (7 days)
    uint256 public constant CREATOR_EVIDENCE_WINDOW = 7 days;

    // ============ Events ============

    event BountyCreated(
        uint256 indexed bountyId,
        address indexed creator,
        uint256 reward,
        uint256 deadline
    );

    event BountyClaimed(
        uint256 indexed bountyId,
        address indexed hunter,
        uint256 claimedAt
    );

    event WorkSubmitted(
        uint256 indexed bountyId,
        address indexed hunter,
        bytes32 proofHash
    );

    event WorkApproved(
        uint256 indexed bountyId,
        address indexed hunter,
        uint256 payout,
        uint256 fee
    );

    event WorkRejected(
        uint256 indexed bountyId,
        address indexed hunter,
        string reason
    );

    event BountyCancelled(
        uint256 indexed bountyId,
        address indexed creator,
        uint256 refundAmount
    );

    event ClaimReleased(uint256 indexed bountyId, address indexed hunter);

    event DisputeOpened(
        uint256 indexed bountyId,
        address indexed hunter,
        bytes32 evidenceHash,
        uint256 disputeFee
    );

    event DisputeEvidenceSubmitted(
        uint256 indexed bountyId,
        address indexed submitter,
        bytes32 evidenceHash
    );

    event DisputeResolved(
        uint256 indexed bountyId,
        DisputeResolution resolution,
        uint256 hunterPayout,
        uint256 creatorRefund
    );

    event ArbiterUpdated(
        address indexed oldArbiter,
        address indexed newArbiter
    );
    event DisputeFeeUpdated(uint256 oldFee, uint256 newFee);

    event TreasuryUpdated(
        address indexed oldTreasury,
        address indexed newTreasury
    );
    event FeeUpdated(uint256 oldFee, uint256 newFee);
    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    // ============ Errors ============

    error InvalidAddress();
    error InvalidAmount();
    error InvalidFee();
    error InvalidBountyId();
    error InvalidStatus();
    error NotBountyCreator();
    error NotBountyHunter();
    error AlreadyHasActiveClaim();
    error NoActiveClaim();
    error BountyExpired();
    error BountyNotExpired();
    error NotOwner();
    error TransferFailed();
    error NotArbiter();
    error DisputeAlreadyExists();
    error DisputeNotFound();
    error DisputeAlreadyResolved();
    error EvidenceWindowClosed();
    error CannotDisputeYet();
    error DisputeWindowExpired();

    // ============ Modifiers ============

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyArbiter() {
        if (msg.sender != arbiter) revert NotArbiter();
        _;
    }

    modifier validBounty(uint256 bountyId) {
        if (bountyId == 0 || bountyId > bountyCount) revert InvalidBountyId();
        _;
    }

    // ============ Constructor ============

    /**
     * @notice Initialize the escrow contract
     * @param _usdc Address of the USDC token contract
     * @param _treasury Address to receive platform fees
     * @param _platformFeeBps Platform fee in basis points (e.g., 500 = 5%)
     * @param _arbiter Address of the dispute arbiter
     * @param _disputeFee Fee required to open a dispute (in USDC, 6 decimals)
     */
    constructor(
        address _usdc,
        address _treasury,
        uint256 _platformFeeBps,
        address _arbiter,
        uint256 _disputeFee
    ) {
        if (
            _usdc == address(0) ||
            _treasury == address(0) ||
            _arbiter == address(0)
        ) revert InvalidAddress();
        if (_platformFeeBps > MAX_FEE_BPS) revert InvalidFee();

        usdc = IERC20(_usdc);
        treasury = _treasury;
        platformFeeBps = _platformFeeBps;
        arbiter = _arbiter;
        disputeFee = _disputeFee;
        owner = msg.sender;
    }

    // ============ Bounty Creator Functions ============

    /**
     * @notice Create a new bounty with USDC deposit
     * @param reward Amount of USDC to offer as reward (6 decimals)
     * @param deadline Optional deadline timestamp (0 = no deadline)
     * @return bountyId The ID of the created bounty
     */
    function createBounty(
        uint256 reward,
        uint256 deadline
    ) external nonReentrant returns (uint256 bountyId) {
        if (reward == 0) revert InvalidAmount();
        if (deadline != 0 && deadline <= block.timestamp)
            revert BountyExpired();

        // Transfer USDC from creator to contract
        bool success = usdc.transferFrom(msg.sender, address(this), reward);
        if (!success) revert TransferFailed();

        // Increment counter and create bounty
        bountyCount++;
        bountyId = bountyCount;

        bounties[bountyId] = Bounty({
            creator: msg.sender,
            hunter: address(0),
            reward: reward,
            status: BountyStatus.Open,
            proofHash: bytes32(0),
            deadline: deadline,
            createdAt: block.timestamp,
            claimedAt: 0,
            rejectionCount: 0
        });

        emit BountyCreated(bountyId, msg.sender, reward, deadline);
    }

    /**
     * @notice Approve submitted work and release payment to hunter
     * @param bountyId ID of the bounty to approve
     */
    function approveWork(
        uint256 bountyId
    ) external nonReentrant validBounty(bountyId) {
        Bounty storage bounty = bounties[bountyId];

        if (msg.sender != bounty.creator) revert NotBountyCreator();
        if (bounty.status != BountyStatus.Submitted) revert InvalidStatus();

        // Calculate fee and payout
        uint256 fee = (bounty.reward * platformFeeBps) / BPS_DENOMINATOR;
        uint256 payout = bounty.reward - fee;

        // Update status
        bounty.status = BountyStatus.Completed;

        // Clear hunter's active claim
        activeClaim[bounty.hunter] = 0;

        // Transfer payout to hunter
        bool payoutSuccess = usdc.transfer(bounty.hunter, payout);
        if (!payoutSuccess) revert TransferFailed();

        // Transfer fee to treasury
        if (fee > 0) {
            bool feeSuccess = usdc.transfer(treasury, fee);
            if (!feeSuccess) revert TransferFailed();
        }

        emit WorkApproved(bountyId, bounty.hunter, payout, fee);
    }

    /**
     * @notice Reject submitted work
     * @param bountyId ID of the bounty to reject
     * @param reason Reason for rejection
     */
    function rejectWork(
        uint256 bountyId,
        string calldata reason
    ) external validBounty(bountyId) {
        Bounty storage bounty = bounties[bountyId];

        if (msg.sender != bounty.creator) revert NotBountyCreator();
        if (bounty.status != BountyStatus.Submitted) revert InvalidStatus();

        // Increment rejection count
        bounty.rejectionCount++;

        // Reset to claimed status so hunter can resubmit
        bounty.status = BountyStatus.Claimed;
        bounty.proofHash = bytes32(0);

        emit WorkRejected(bountyId, bounty.hunter, reason);
    }

    /**
     * @notice Cancel a bounty and refund the creator
     * @param bountyId ID of the bounty to cancel
     * @dev Can cancel if: Open, OR (Claimed/Submitted AND either deadline passed OR claim exceeded MAX_CLAIM_DURATION)
     */
    function cancelBounty(
        uint256 bountyId
    ) external nonReentrant validBounty(bountyId) {
        Bounty storage bounty = bounties[bountyId];

        if (msg.sender != bounty.creator) revert NotBountyCreator();

        // Can only cancel if Open, or if Claimed/Submitted but expired
        if (
            bounty.status == BountyStatus.Completed ||
            bounty.status == BountyStatus.Cancelled
        ) {
            revert InvalidStatus();
        }

        // If claimed or submitted, require deadline to have passed OR claim duration exceeded
        if (
            bounty.status == BountyStatus.Claimed ||
            bounty.status == BountyStatus.Submitted
        ) {
            bool deadlinePassed = bounty.deadline != 0 &&
                block.timestamp >= bounty.deadline;
            bool claimDurationExceeded = block.timestamp >=
                bounty.claimedAt + MAX_CLAIM_DURATION;

            if (!deadlinePassed && !claimDurationExceeded) {
                revert BountyNotExpired();
            }
        }

        uint256 refundAmount = bounty.reward;

        // Clear hunter's active claim if applicable
        if (bounty.hunter != address(0)) {
            activeClaim[bounty.hunter] = 0;
        }

        // Update status
        bounty.status = BountyStatus.Cancelled;

        // Refund creator
        bool success = usdc.transfer(bounty.creator, refundAmount);
        if (!success) revert TransferFailed();

        emit BountyCancelled(bountyId, msg.sender, refundAmount);
    }

    // ============ Hunter Functions ============

    /**
     * @notice Claim an open bounty
     * @param bountyId ID of the bounty to claim
     */
    function claimBounty(uint256 bountyId) external validBounty(bountyId) {
        Bounty storage bounty = bounties[bountyId];

        if (bounty.status != BountyStatus.Open) revert InvalidStatus();
        if (bounty.deadline != 0 && block.timestamp >= bounty.deadline)
            revert BountyExpired();
        if (activeClaim[msg.sender] != 0) revert AlreadyHasActiveClaim();
        if (msg.sender == bounty.creator) revert InvalidAddress(); // Creator can't claim own bounty

        // Update bounty
        bounty.hunter = msg.sender;
        bounty.status = BountyStatus.Claimed;
        bounty.claimedAt = block.timestamp;

        // Set active claim
        activeClaim[msg.sender] = bountyId;

        emit BountyClaimed(bountyId, msg.sender, block.timestamp);
    }

    /**
     * @notice Submit work for a claimed bounty
     * @param bountyId ID of the bounty
     * @param proofHash Hash of the submission proof (e.g., IPFS hash or content hash)
     */
    function submitWork(
        uint256 bountyId,
        bytes32 proofHash
    ) external validBounty(bountyId) {
        Bounty storage bounty = bounties[bountyId];

        if (msg.sender != bounty.hunter) revert NotBountyHunter();
        if (bounty.status != BountyStatus.Claimed) revert InvalidStatus();
        if (proofHash == bytes32(0)) revert InvalidAmount();

        bounty.status = BountyStatus.Submitted;
        bounty.proofHash = proofHash;

        emit WorkSubmitted(bountyId, msg.sender, proofHash);
    }

    /**
     * @notice Release claim on a bounty (hunter gives up)
     * @param bountyId ID of the bounty
     */
    function releaseClaim(uint256 bountyId) external validBounty(bountyId) {
        Bounty storage bounty = bounties[bountyId];

        if (msg.sender != bounty.hunter) revert NotBountyHunter();
        if (bounty.status != BountyStatus.Claimed) revert InvalidStatus();

        // Reset bounty to open
        bounty.hunter = address(0);
        bounty.status = BountyStatus.Open;
        bounty.claimedAt = 0;

        // Clear active claim
        activeClaim[msg.sender] = 0;

        emit ClaimReleased(bountyId, msg.sender);
    }

    // ============ Dispute Functions ============

    /**
     * @notice Open a dispute after work rejection
     * @param bountyId ID of the bounty
     * @param evidenceHash Hash of evidence supporting hunter's claim
     * @dev Hunter must pay dispute fee. Can dispute if work was rejected OR after MAX_REJECTIONS
     */
    function openDispute(
        uint256 bountyId,
        bytes32 evidenceHash
    ) external nonReentrant validBounty(bountyId) {
        Bounty storage bounty = bounties[bountyId];

        if (msg.sender != bounty.hunter) revert NotBountyHunter();
        if (bounty.status == BountyStatus.Disputed)
            revert DisputeAlreadyExists();
        if (evidenceHash == bytes32(0)) revert InvalidAmount();

        // Can only dispute if:
        // 1. Status is Claimed (after rejection) and rejection count > 0, OR
        // 2. Status is Submitted and rejection count >= MAX_REJECTIONS (auto-escalate)
        bool canDispute = (bounty.status == BountyStatus.Claimed &&
            bounty.rejectionCount > 0) ||
            (bounty.status == BountyStatus.Submitted &&
                bounty.rejectionCount >= MAX_REJECTIONS);

        if (!canDispute) revert CannotDisputeYet();

        // Transfer dispute fee from hunter
        if (disputeFee > 0) {
            bool success = usdc.transferFrom(
                msg.sender,
                address(this),
                disputeFee
            );
            if (!success) revert TransferFailed();
        }

        // Update bounty status
        bounty.status = BountyStatus.Disputed;

        // Create dispute record
        disputeCount++;
        disputes[bountyId] = Dispute({
            bountyId: bountyId,
            initiator: msg.sender,
            hunterEvidence: evidenceHash,
            creatorEvidence: bytes32(0),
            openedAt: block.timestamp,
            disputeFee: disputeFee,
            resolution: DisputeResolution.Pending,
            resolved: false
        });

        emit DisputeOpened(bountyId, msg.sender, evidenceHash, disputeFee);
    }

    /**
     * @notice Submit evidence for a dispute (creator only)
     * @param bountyId ID of the bounty
     * @param evidenceHash Hash of evidence supporting creator's position
     */
    function submitDisputeEvidence(
        uint256 bountyId,
        bytes32 evidenceHash
    ) external validBounty(bountyId) {
        Bounty storage bounty = bounties[bountyId];
        Dispute storage dispute = disputes[bountyId];

        if (msg.sender != bounty.creator) revert NotBountyCreator();
        if (bounty.status != BountyStatus.Disputed) revert InvalidStatus();
        if (dispute.resolved) revert DisputeAlreadyResolved();
        if (evidenceHash == bytes32(0)) revert InvalidAmount();

        // Check evidence window
        if (block.timestamp > dispute.openedAt + CREATOR_EVIDENCE_WINDOW) {
            revert EvidenceWindowClosed();
        }

        dispute.creatorEvidence = evidenceHash;

        emit DisputeEvidenceSubmitted(bountyId, msg.sender, evidenceHash);
    }

    /**
     * @notice Resolve a dispute (arbiter only)
     * @param bountyId ID of the bounty
     * @param resolution The resolution decision
     */
    function resolveDispute(
        uint256 bountyId,
        DisputeResolution resolution
    ) external nonReentrant onlyArbiter validBounty(bountyId) {
        Bounty storage bounty = bounties[bountyId];
        Dispute storage dispute = disputes[bountyId];

        if (bounty.status != BountyStatus.Disputed) revert InvalidStatus();
        if (dispute.resolved) revert DisputeAlreadyResolved();
        if (resolution == DisputeResolution.Pending) revert InvalidStatus();

        dispute.resolution = resolution;
        dispute.resolved = true;
        bounty.status = BountyStatus.Completed;

        // Clear hunter's active claim
        activeClaim[bounty.hunter] = 0;

        uint256 hunterPayout = 0;
        uint256 creatorRefund = 0;
        uint256 fee = (bounty.reward * platformFeeBps) / BPS_DENOMINATOR;

        if (resolution == DisputeResolution.HunterWins) {
            // Hunter gets reward minus platform fee, plus dispute fee back
            hunterPayout = bounty.reward - fee + dispute.disputeFee;

            // Transfer to hunter
            bool success = usdc.transfer(bounty.hunter, hunterPayout);
            if (!success) revert TransferFailed();

            // Transfer fee to treasury
            if (fee > 0) {
                bool feeSuccess = usdc.transfer(treasury, fee);
                if (!feeSuccess) revert TransferFailed();
            }
        } else if (resolution == DisputeResolution.CreatorWins) {
            // Creator gets full refund, dispute fee goes to treasury
            creatorRefund = bounty.reward;

            bool success = usdc.transfer(bounty.creator, creatorRefund);
            if (!success) revert TransferFailed();

            // Dispute fee goes to treasury (penalty for frivolous dispute)
            if (dispute.disputeFee > 0) {
                bool feeSuccess = usdc.transfer(treasury, dispute.disputeFee);
                if (!feeSuccess) revert TransferFailed();
            }
        } else if (resolution == DisputeResolution.Split) {
            // 50/50 split, dispute fee returned to hunter
            uint256 halfReward = bounty.reward / 2;
            hunterPayout = halfReward - (fee / 2) + dispute.disputeFee;
            creatorRefund = bounty.reward - halfReward;

            // Transfer to hunter
            bool hunterSuccess = usdc.transfer(bounty.hunter, hunterPayout);
            if (!hunterSuccess) revert TransferFailed();

            // Transfer to creator
            bool creatorSuccess = usdc.transfer(bounty.creator, creatorRefund);
            if (!creatorSuccess) revert TransferFailed();

            // Transfer fee to treasury
            if (fee / 2 > 0) {
                bool feeSuccess = usdc.transfer(treasury, fee / 2);
                if (!feeSuccess) revert TransferFailed();
            }
        }

        emit DisputeResolved(bountyId, resolution, hunterPayout, creatorRefund);
    }

    /**
     * @notice Auto-resolve dispute in hunter's favor if arbiter doesn't act in time
     * @param bountyId ID of the bounty
     */
    function autoResolveDispute(
        uint256 bountyId
    ) external nonReentrant validBounty(bountyId) {
        Bounty storage bounty = bounties[bountyId];
        Dispute storage dispute = disputes[bountyId];

        if (bounty.status != BountyStatus.Disputed) revert InvalidStatus();
        if (dispute.resolved) revert DisputeAlreadyResolved();

        // Check if resolution window has passed
        if (block.timestamp < dispute.openedAt + DISPUTE_RESOLUTION_WINDOW) {
            revert DisputeWindowExpired();
        }

        // Auto-resolve in hunter's favor
        dispute.resolution = DisputeResolution.HunterWins;
        dispute.resolved = true;
        bounty.status = BountyStatus.Completed;

        // Clear hunter's active claim
        activeClaim[bounty.hunter] = 0;

        uint256 fee = (bounty.reward * platformFeeBps) / BPS_DENOMINATOR;
        uint256 hunterPayout = bounty.reward - fee + dispute.disputeFee;

        // Transfer to hunter
        bool success = usdc.transfer(bounty.hunter, hunterPayout);
        if (!success) revert TransferFailed();

        // Transfer fee to treasury
        if (fee > 0) {
            bool feeSuccess = usdc.transfer(treasury, fee);
            if (!feeSuccess) revert TransferFailed();
        }

        emit DisputeResolved(
            bountyId,
            DisputeResolution.HunterWins,
            hunterPayout,
            0
        );
    }

    // ============ View Functions ============

    /**
     * @notice Get bounty details
     * @param bountyId ID of the bounty
     * @return Bounty struct
     */
    function getBounty(
        uint256 bountyId
    ) external view validBounty(bountyId) returns (Bounty memory) {
        return bounties[bountyId];
    }

    /**
     * @notice Get the active claim for a hunter
     * @param hunter Address of the hunter
     * @return bountyId The bounty ID they have claimed (0 if none)
     */
    function getActiveClaim(address hunter) external view returns (uint256) {
        return activeClaim[hunter];
    }

    /**
     * @notice Check if a bounty is expired (deadline passed)
     * @param bountyId ID of the bounty
     * @return True if deadline has passed
     */
    function isExpired(
        uint256 bountyId
    ) external view validBounty(bountyId) returns (bool) {
        Bounty storage bounty = bounties[bountyId];
        return bounty.deadline != 0 && block.timestamp >= bounty.deadline;
    }

    /**
     * @notice Check if a bounty can be cancelled by the creator
     * @param bountyId ID of the bounty
     * @return canCancel True if the bounty can be cancelled
     * @return reason Human-readable reason
     */
    function canBeCancelled(
        uint256 bountyId
    )
        external
        view
        validBounty(bountyId)
        returns (bool canCancel, string memory reason)
    {
        Bounty storage bounty = bounties[bountyId];

        if (bounty.status == BountyStatus.Completed) {
            return (false, "Bounty already completed");
        }
        if (bounty.status == BountyStatus.Cancelled) {
            return (false, "Bounty already cancelled");
        }
        if (bounty.status == BountyStatus.Disputed) {
            return (false, "Bounty is in dispute");
        }
        if (bounty.status == BountyStatus.Open) {
            return (true, "Bounty is open");
        }

        // Claimed or Submitted status
        bool deadlinePassed = bounty.deadline != 0 &&
            block.timestamp >= bounty.deadline;
        bool claimDurationExceeded = block.timestamp >=
            bounty.claimedAt + MAX_CLAIM_DURATION;

        if (deadlinePassed) {
            return (true, "Deadline has passed");
        }
        if (claimDurationExceeded) {
            return (true, "Claim duration exceeded");
        }

        return (
            false,
            "Bounty is active - wait for deadline or max claim duration"
        );
    }

    /**
     * @notice Get the timestamp when a claimed bounty's protection expires
     * @param bountyId ID of the bounty
     * @return expiresAt Timestamp when creator can cancel (0 if already cancellable or not claimed)
     */
    function getClaimExpirationTime(
        uint256 bountyId
    ) external view validBounty(bountyId) returns (uint256 expiresAt) {
        Bounty storage bounty = bounties[bountyId];

        if (
            bounty.status != BountyStatus.Claimed &&
            bounty.status != BountyStatus.Submitted
        ) {
            return 0;
        }

        uint256 claimExpires = bounty.claimedAt + MAX_CLAIM_DURATION;
        uint256 deadlineExpires = bounty.deadline;

        // Return the earlier of the two (if deadline exists)
        if (deadlineExpires != 0 && deadlineExpires < claimExpires) {
            return deadlineExpires;
        }
        return claimExpires;
    }

    /**
     * @notice Get dispute details
     * @param bountyId ID of the bounty
     * @return Dispute struct
     */
    function getDispute(
        uint256 bountyId
    ) external view validBounty(bountyId) returns (Dispute memory) {
        return disputes[bountyId];
    }

    /**
     * @notice Check if hunter can open a dispute for a bounty
     * @param bountyId ID of the bounty
     * @return canDispute True if dispute can be opened
     * @return reason Human-readable reason
     */
    function canOpenDispute(
        uint256 bountyId
    )
        external
        view
        validBounty(bountyId)
        returns (bool canDispute, string memory reason)
    {
        Bounty storage bounty = bounties[bountyId];

        if (bounty.status == BountyStatus.Disputed) {
            return (false, "Dispute already exists");
        }
        if (bounty.status == BountyStatus.Completed) {
            return (false, "Bounty already completed");
        }
        if (bounty.status == BountyStatus.Cancelled) {
            return (false, "Bounty already cancelled");
        }
        if (bounty.status == BountyStatus.Open) {
            return (false, "Bounty not yet claimed");
        }
        if (bounty.rejectionCount == 0) {
            return (false, "No rejections yet - submit work first");
        }
        if (
            bounty.status == BountyStatus.Claimed && bounty.rejectionCount > 0
        ) {
            return (true, "Can dispute after rejection");
        }
        if (
            bounty.status == BountyStatus.Submitted &&
            bounty.rejectionCount >= MAX_REJECTIONS
        ) {
            return (true, "Can auto-escalate after max rejections");
        }

        return (false, "Cannot dispute at this time");
    }

    // ============ Admin Functions ============

    /**
     * @notice Update the treasury address
     * @param newTreasury New treasury address
     */
    function setTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert InvalidAddress();
        address oldTreasury = treasury;
        treasury = newTreasury;
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }

    /**
     * @notice Update the platform fee
     * @param newFeeBps New fee in basis points
     */
    function setPlatformFee(uint256 newFeeBps) external onlyOwner {
        if (newFeeBps > MAX_FEE_BPS) revert InvalidFee();
        uint256 oldFee = platformFeeBps;
        platformFeeBps = newFeeBps;
        emit FeeUpdated(oldFee, newFeeBps);
    }

    /**
     * @notice Transfer ownership of the contract
     * @param newOwner New owner address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidAddress();
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }

    /**
     * @notice Update the arbiter address
     * @param newArbiter New arbiter address
     */
    function setArbiter(address newArbiter) external onlyOwner {
        if (newArbiter == address(0)) revert InvalidAddress();
        address oldArbiter = arbiter;
        arbiter = newArbiter;
        emit ArbiterUpdated(oldArbiter, newArbiter);
    }

    /**
     * @notice Update the dispute fee
     * @param newDisputeFee New dispute fee in USDC (6 decimals)
     */
    function setDisputeFee(uint256 newDisputeFee) external onlyOwner {
        uint256 oldFee = disputeFee;
        disputeFee = newDisputeFee;
        emit DisputeFeeUpdated(oldFee, newDisputeFee);
    }
}
