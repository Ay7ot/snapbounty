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
        Open,       // Bounty is available to claim
        Claimed,    // Hunter has claimed the bounty
        Submitted,  // Hunter has submitted work
        Completed,  // Work approved, payment released
        Cancelled   // Bounty cancelled, funds refunded
    }

    struct Bounty {
        address creator;        // Address that created the bounty
        address hunter;         // Address that claimed the bounty
        uint256 reward;         // Reward amount in USDC (6 decimals)
        BountyStatus status;    // Current status
        bytes32 proofHash;      // Hash of the submission proof
        uint256 deadline;       // Optional deadline (0 = no deadline)
        uint256 createdAt;      // Timestamp of creation
        uint256 claimedAt;      // Timestamp when claimed
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

    /// @notice Owner of the contract
    address public owner;

    // ============ Constants ============

    /// @notice Maximum platform fee (10%)
    uint256 public constant MAX_FEE_BPS = 1000;

    /// @notice Basis points denominator
    uint256 public constant BPS_DENOMINATOR = 10000;

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

    event ClaimReleased(
        uint256 indexed bountyId,
        address indexed hunter
    );

    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event FeeUpdated(uint256 oldFee, uint256 newFee);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

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

    // ============ Modifiers ============

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
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
     */
    constructor(address _usdc, address _treasury, uint256 _platformFeeBps) {
        if (_usdc == address(0) || _treasury == address(0)) revert InvalidAddress();
        if (_platformFeeBps > MAX_FEE_BPS) revert InvalidFee();

        usdc = IERC20(_usdc);
        treasury = _treasury;
        platformFeeBps = _platformFeeBps;
        owner = msg.sender;
    }

    // ============ Bounty Creator Functions ============

    /**
     * @notice Create a new bounty with USDC deposit
     * @param reward Amount of USDC to offer as reward (6 decimals)
     * @param deadline Optional deadline timestamp (0 = no deadline)
     * @return bountyId The ID of the created bounty
     */
    function createBounty(uint256 reward, uint256 deadline) external nonReentrant returns (uint256 bountyId) {
        if (reward == 0) revert InvalidAmount();
        if (deadline != 0 && deadline <= block.timestamp) revert BountyExpired();

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
            claimedAt: 0
        });

        emit BountyCreated(bountyId, msg.sender, reward, deadline);
    }

    /**
     * @notice Approve submitted work and release payment to hunter
     * @param bountyId ID of the bounty to approve
     */
    function approveWork(uint256 bountyId) external nonReentrant validBounty(bountyId) {
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
    function rejectWork(uint256 bountyId, string calldata reason) external validBounty(bountyId) {
        Bounty storage bounty = bounties[bountyId];

        if (msg.sender != bounty.creator) revert NotBountyCreator();
        if (bounty.status != BountyStatus.Submitted) revert InvalidStatus();

        // Reset to claimed status so hunter can resubmit
        bounty.status = BountyStatus.Claimed;
        bounty.proofHash = bytes32(0);

        emit WorkRejected(bountyId, bounty.hunter, reason);
    }

    /**
     * @notice Cancel a bounty and refund the creator
     * @param bountyId ID of the bounty to cancel
     */
    function cancelBounty(uint256 bountyId) external nonReentrant validBounty(bountyId) {
        Bounty storage bounty = bounties[bountyId];

        if (msg.sender != bounty.creator) revert NotBountyCreator();
        
        // Can only cancel if Open, or if Claimed/Submitted but deadline passed
        if (bounty.status == BountyStatus.Completed || bounty.status == BountyStatus.Cancelled) {
            revert InvalidStatus();
        }

        // If claimed or submitted, require deadline to have passed
        if (bounty.status == BountyStatus.Claimed || bounty.status == BountyStatus.Submitted) {
            if (bounty.deadline == 0 || block.timestamp < bounty.deadline) {
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
        if (bounty.deadline != 0 && block.timestamp >= bounty.deadline) revert BountyExpired();
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
    function submitWork(uint256 bountyId, bytes32 proofHash) external validBounty(bountyId) {
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

    // ============ View Functions ============

    /**
     * @notice Get bounty details
     * @param bountyId ID of the bounty
     * @return Bounty struct
     */
    function getBounty(uint256 bountyId) external view validBounty(bountyId) returns (Bounty memory) {
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
     * @notice Check if a bounty is expired
     * @param bountyId ID of the bounty
     * @return True if expired
     */
    function isExpired(uint256 bountyId) external view validBounty(bountyId) returns (bool) {
        Bounty storage bounty = bounties[bountyId];
        return bounty.deadline != 0 && block.timestamp >= bounty.deadline;
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
}

