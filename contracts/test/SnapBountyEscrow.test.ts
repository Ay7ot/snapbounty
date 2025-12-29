import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("SnapBountyEscrow", function () {
  // Constants
  const REWARD = ethers.parseUnits("100", 6); // 100 USDC
  const PLATFORM_FEE_BPS = 500n; // 5%
  const BPS_DENOMINATOR = 10000n;

  // Fixture to deploy contracts
  async function deployFixture() {
    const [owner, treasury, creator, hunter, hunter2] = await ethers.getSigners();

    // Deploy MockUSDC - using deployContract for proper typing
    const usdc = await ethers.deployContract("MockUSDC");

    // Deploy SnapBountyEscrow
    const escrow = await ethers.deployContract("SnapBountyEscrow", [
      await usdc.getAddress(),
      treasury.address,
      PLATFORM_FEE_BPS,
    ]);

    // Mint USDC to creator
    await usdc.mint(creator.address, ethers.parseUnits("1000", 6));

    // Approve escrow to spend creator's USDC
    await usdc.connect(creator).approve(await escrow.getAddress(), ethers.MaxUint256);

    return { escrow, usdc, owner, treasury, creator, hunter, hunter2 };
  }

  describe("Constructor", function () {
    it("Should set correct initial values", async function () {
      const { escrow, usdc, treasury, owner } = await loadFixture(deployFixture);

      expect(await escrow.usdc()).to.equal(await usdc.getAddress());
      expect(await escrow.treasury()).to.equal(treasury.address);
      expect(await escrow.platformFeeBps()).to.equal(PLATFORM_FEE_BPS);
      expect(await escrow.owner()).to.equal(owner.address);
      expect(await escrow.bountyCount()).to.equal(0);
    });

    it("Should revert if USDC address is zero", async function () {
      const [, treasury] = await ethers.getSigners();
      const SnapBountyEscrow = await ethers.getContractFactory("SnapBountyEscrow");

      await expect(
        SnapBountyEscrow.deploy(ethers.ZeroAddress, treasury.address, PLATFORM_FEE_BPS)
      ).to.be.revertedWithCustomError(SnapBountyEscrow, "InvalidAddress");
    });

    it("Should revert if treasury address is zero", async function () {
      const { usdc } = await loadFixture(deployFixture);
      const SnapBountyEscrow = await ethers.getContractFactory("SnapBountyEscrow");

      await expect(
        SnapBountyEscrow.deploy(await usdc.getAddress(), ethers.ZeroAddress, PLATFORM_FEE_BPS)
      ).to.be.revertedWithCustomError(SnapBountyEscrow, "InvalidAddress");
    });

    it("Should revert if fee is too high", async function () {
      const { usdc } = await loadFixture(deployFixture);
      const [, treasury] = await ethers.getSigners();
      const SnapBountyEscrow = await ethers.getContractFactory("SnapBountyEscrow");

      await expect(
        SnapBountyEscrow.deploy(await usdc.getAddress(), treasury.address, 1001) // > 10%
      ).to.be.revertedWithCustomError(SnapBountyEscrow, "InvalidFee");
    });
  });

  describe("Create Bounty", function () {
    it("Should create a bounty successfully", async function () {
      const { escrow, usdc, creator } = await loadFixture(deployFixture);

      await expect(escrow.connect(creator).createBounty(REWARD, 0))
        .to.emit(escrow, "BountyCreated")
        .withArgs(1, creator.address, REWARD, 0);

      expect(await escrow.bountyCount()).to.equal(1);
      expect(await usdc.balanceOf(await escrow.getAddress())).to.equal(REWARD);

      const bounty = await escrow.getBounty(1);
      expect(bounty.creator).to.equal(creator.address);
      expect(bounty.hunter).to.equal(ethers.ZeroAddress);
      expect(bounty.reward).to.equal(REWARD);
      expect(bounty.status).to.equal(0); // Open
      expect(bounty.deadline).to.equal(0);
    });

    it("Should create a bounty with deadline", async function () {
      const { escrow, creator } = await loadFixture(deployFixture);
      const deadline = (await time.latest()) + 86400; // 1 day from now

      await escrow.connect(creator).createBounty(REWARD, deadline);

      const bounty = await escrow.getBounty(1);
      expect(bounty.deadline).to.equal(deadline);
    });

    it("Should revert if reward is zero", async function () {
      const { escrow, creator } = await loadFixture(deployFixture);

      await expect(escrow.connect(creator).createBounty(0, 0)).to.be.revertedWithCustomError(
        escrow,
        "InvalidAmount"
      );
    });

    it("Should revert if deadline is in the past", async function () {
      const { escrow, creator } = await loadFixture(deployFixture);
      const pastDeadline = (await time.latest()) - 1;

      await expect(
        escrow.connect(creator).createBounty(REWARD, pastDeadline)
      ).to.be.revertedWithCustomError(escrow, "BountyExpired");
    });
  });

  describe("Claim Bounty", function () {
    it("Should claim a bounty successfully", async function () {
      const { escrow, creator, hunter } = await loadFixture(deployFixture);

      await escrow.connect(creator).createBounty(REWARD, 0);

      await expect(escrow.connect(hunter).claimBounty(1))
        .to.emit(escrow, "BountyClaimed")
        .withArgs(1, hunter.address, await time.latest() + 1);

      const bounty = await escrow.getBounty(1);
      expect(bounty.hunter).to.equal(hunter.address);
      expect(bounty.status).to.equal(1); // Claimed

      expect(await escrow.activeClaim(hunter.address)).to.equal(1);
    });

    it("Should revert if bounty is not open", async function () {
      const { escrow, creator, hunter, hunter2 } = await loadFixture(deployFixture);

      await escrow.connect(creator).createBounty(REWARD, 0);
      await escrow.connect(hunter).claimBounty(1);

      await expect(escrow.connect(hunter2).claimBounty(1)).to.be.revertedWithCustomError(
        escrow,
        "InvalidStatus"
      );
    });

    it("Should revert if hunter already has active claim", async function () {
      const { escrow, usdc, creator, hunter } = await loadFixture(deployFixture);

      await escrow.connect(creator).createBounty(REWARD, 0);
      await escrow.connect(creator).createBounty(REWARD, 0);
      await escrow.connect(hunter).claimBounty(1);

      await expect(escrow.connect(hunter).claimBounty(2)).to.be.revertedWithCustomError(
        escrow,
        "AlreadyHasActiveClaim"
      );
    });

    it("Should revert if creator tries to claim own bounty", async function () {
      const { escrow, creator } = await loadFixture(deployFixture);

      await escrow.connect(creator).createBounty(REWARD, 0);

      await expect(escrow.connect(creator).claimBounty(1)).to.be.revertedWithCustomError(
        escrow,
        "InvalidAddress"
      );
    });

    it("Should revert if bounty is expired", async function () {
      const { escrow, creator, hunter } = await loadFixture(deployFixture);
      const deadline = (await time.latest()) + 86400;

      await escrow.connect(creator).createBounty(REWARD, deadline);

      await time.increaseTo(deadline + 1);

      await expect(escrow.connect(hunter).claimBounty(1)).to.be.revertedWithCustomError(
        escrow,
        "BountyExpired"
      );
    });
  });

  describe("Submit Work", function () {
    it("Should submit work successfully", async function () {
      const { escrow, creator, hunter } = await loadFixture(deployFixture);

      await escrow.connect(creator).createBounty(REWARD, 0);
      await escrow.connect(hunter).claimBounty(1);

      const proofHash = ethers.keccak256(ethers.toUtf8Bytes("ipfs://QmTest123"));

      await expect(escrow.connect(hunter).submitWork(1, proofHash))
        .to.emit(escrow, "WorkSubmitted")
        .withArgs(1, hunter.address, proofHash);

      const bounty = await escrow.getBounty(1);
      expect(bounty.status).to.equal(2); // Submitted
      expect(bounty.proofHash).to.equal(proofHash);
    });

    it("Should revert if not the hunter", async function () {
      const { escrow, creator, hunter, hunter2 } = await loadFixture(deployFixture);

      await escrow.connect(creator).createBounty(REWARD, 0);
      await escrow.connect(hunter).claimBounty(1);

      await expect(
        escrow.connect(hunter2).submitWork(1, ethers.randomBytes(32))
      ).to.be.revertedWithCustomError(escrow, "NotBountyHunter");
    });

    it("Should revert if proof hash is empty", async function () {
      const { escrow, creator, hunter } = await loadFixture(deployFixture);

      await escrow.connect(creator).createBounty(REWARD, 0);
      await escrow.connect(hunter).claimBounty(1);

      await expect(
        escrow.connect(hunter).submitWork(1, ethers.ZeroHash)
      ).to.be.revertedWithCustomError(escrow, "InvalidAmount");
    });
  });

  describe("Approve Work", function () {
    it("Should approve work and distribute funds correctly", async function () {
      const { escrow, usdc, creator, hunter, treasury } = await loadFixture(deployFixture);

      await escrow.connect(creator).createBounty(REWARD, 0);
      await escrow.connect(hunter).claimBounty(1);
      await escrow.connect(hunter).submitWork(1, ethers.randomBytes(32));

      const hunterBalanceBefore = await usdc.balanceOf(hunter.address);
      const treasuryBalanceBefore = await usdc.balanceOf(treasury.address);

      const expectedFee = (REWARD * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
      const expectedPayout = REWARD - expectedFee;

      await expect(escrow.connect(creator).approveWork(1))
        .to.emit(escrow, "WorkApproved")
        .withArgs(1, hunter.address, expectedPayout, expectedFee);

      expect(await usdc.balanceOf(hunter.address)).to.equal(hunterBalanceBefore + expectedPayout);
      expect(await usdc.balanceOf(treasury.address)).to.equal(treasuryBalanceBefore + expectedFee);
      expect(await usdc.balanceOf(await escrow.getAddress())).to.equal(0);

      const bounty = await escrow.getBounty(1);
      expect(bounty.status).to.equal(3); // Completed

      expect(await escrow.activeClaim(hunter.address)).to.equal(0);
    });

    it("Should revert if not the creator", async function () {
      const { escrow, creator, hunter } = await loadFixture(deployFixture);

      await escrow.connect(creator).createBounty(REWARD, 0);
      await escrow.connect(hunter).claimBounty(1);
      await escrow.connect(hunter).submitWork(1, ethers.randomBytes(32));

      await expect(escrow.connect(hunter).approveWork(1)).to.be.revertedWithCustomError(
        escrow,
        "NotBountyCreator"
      );
    });

    it("Should revert if work not submitted", async function () {
      const { escrow, creator, hunter } = await loadFixture(deployFixture);

      await escrow.connect(creator).createBounty(REWARD, 0);
      await escrow.connect(hunter).claimBounty(1);

      await expect(escrow.connect(creator).approveWork(1)).to.be.revertedWithCustomError(
        escrow,
        "InvalidStatus"
      );
    });
  });

  describe("Reject Work", function () {
    it("Should reject work and allow resubmission", async function () {
      const { escrow, creator, hunter } = await loadFixture(deployFixture);

      await escrow.connect(creator).createBounty(REWARD, 0);
      await escrow.connect(hunter).claimBounty(1);
      await escrow.connect(hunter).submitWork(1, ethers.randomBytes(32));

      await expect(escrow.connect(creator).rejectWork(1, "Needs improvement"))
        .to.emit(escrow, "WorkRejected")
        .withArgs(1, hunter.address, "Needs improvement");

      const bounty = await escrow.getBounty(1);
      expect(bounty.status).to.equal(1); // Back to Claimed
      expect(bounty.proofHash).to.equal(ethers.ZeroHash);

      // Hunter can resubmit
      const newProof = ethers.randomBytes(32);
      await expect(escrow.connect(hunter).submitWork(1, newProof)).to.not.be.reverted;
    });
  });

  describe("Cancel Bounty", function () {
    it("Should cancel open bounty and refund creator", async function () {
      const { escrow, usdc, creator } = await loadFixture(deployFixture);

      await escrow.connect(creator).createBounty(REWARD, 0);
      const creatorBalanceBefore = await usdc.balanceOf(creator.address);

      await expect(escrow.connect(creator).cancelBounty(1))
        .to.emit(escrow, "BountyCancelled")
        .withArgs(1, creator.address, REWARD);

      expect(await usdc.balanceOf(creator.address)).to.equal(creatorBalanceBefore + REWARD);

      const bounty = await escrow.getBounty(1);
      expect(bounty.status).to.equal(4); // Cancelled
    });

    it("Should cancel claimed bounty after deadline", async function () {
      const { escrow, usdc, creator, hunter } = await loadFixture(deployFixture);
      const deadline = (await time.latest()) + 86400;

      await escrow.connect(creator).createBounty(REWARD, deadline);
      await escrow.connect(hunter).claimBounty(1);

      await time.increaseTo(deadline + 1);

      await expect(escrow.connect(creator).cancelBounty(1)).to.not.be.reverted;

      expect(await escrow.activeClaim(hunter.address)).to.equal(0);
    });

    it("Should revert if not the creator", async function () {
      const { escrow, creator, hunter } = await loadFixture(deployFixture);

      await escrow.connect(creator).createBounty(REWARD, 0);

      await expect(escrow.connect(hunter).cancelBounty(1)).to.be.revertedWithCustomError(
        escrow,
        "NotBountyCreator"
      );
    });

    it("Should revert if claimed before deadline", async function () {
      const { escrow, creator, hunter } = await loadFixture(deployFixture);
      const deadline = (await time.latest()) + 86400;

      await escrow.connect(creator).createBounty(REWARD, deadline);
      await escrow.connect(hunter).claimBounty(1);

      await expect(escrow.connect(creator).cancelBounty(1)).to.be.revertedWithCustomError(
        escrow,
        "BountyNotExpired"
      );
    });

    it("Should revert if no deadline when claimed", async function () {
      const { escrow, creator, hunter } = await loadFixture(deployFixture);

      await escrow.connect(creator).createBounty(REWARD, 0);
      await escrow.connect(hunter).claimBounty(1);

      await expect(escrow.connect(creator).cancelBounty(1)).to.be.revertedWithCustomError(
        escrow,
        "BountyNotExpired"
      );
    });
  });

  describe("Release Claim", function () {
    it("Should release claim and reopen bounty", async function () {
      const { escrow, creator, hunter, hunter2 } = await loadFixture(deployFixture);

      await escrow.connect(creator).createBounty(REWARD, 0);
      await escrow.connect(hunter).claimBounty(1);

      await expect(escrow.connect(hunter).releaseClaim(1))
        .to.emit(escrow, "ClaimReleased")
        .withArgs(1, hunter.address);

      const bounty = await escrow.getBounty(1);
      expect(bounty.hunter).to.equal(ethers.ZeroAddress);
      expect(bounty.status).to.equal(0); // Open

      expect(await escrow.activeClaim(hunter.address)).to.equal(0);

      // Another hunter can claim
      await expect(escrow.connect(hunter2).claimBounty(1)).to.not.be.reverted;
    });
  });

  describe("View Functions", function () {
    it("Should return correct active claim", async function () {
      const { escrow, creator, hunter } = await loadFixture(deployFixture);

      expect(await escrow.getActiveClaim(hunter.address)).to.equal(0);

      await escrow.connect(creator).createBounty(REWARD, 0);
      await escrow.connect(hunter).claimBounty(1);

      expect(await escrow.getActiveClaim(hunter.address)).to.equal(1);
    });

    it("Should return correct isExpired", async function () {
      const { escrow, creator } = await loadFixture(deployFixture);
      const deadline = (await time.latest()) + 86400;

      await escrow.connect(creator).createBounty(REWARD, deadline);

      expect(await escrow.isExpired(1)).to.be.false;

      await time.increaseTo(deadline + 1);

      expect(await escrow.isExpired(1)).to.be.true;
    });

    it("Should revert getBounty for invalid ID", async function () {
      const { escrow } = await loadFixture(deployFixture);

      await expect(escrow.getBounty(0)).to.be.revertedWithCustomError(escrow, "InvalidBountyId");
      await expect(escrow.getBounty(999)).to.be.revertedWithCustomError(escrow, "InvalidBountyId");
    });
  });

  describe("Admin Functions", function () {
    it("Should update treasury", async function () {
      const { escrow, owner, hunter } = await loadFixture(deployFixture);

      await escrow.connect(owner).setTreasury(hunter.address);
      expect(await escrow.treasury()).to.equal(hunter.address);
    });

    it("Should update platform fee", async function () {
      const { escrow, owner } = await loadFixture(deployFixture);

      await escrow.connect(owner).setPlatformFee(300);
      expect(await escrow.platformFeeBps()).to.equal(300);
    });

    it("Should transfer ownership", async function () {
      const { escrow, owner, hunter } = await loadFixture(deployFixture);

      await escrow.connect(owner).transferOwnership(hunter.address);
      expect(await escrow.owner()).to.equal(hunter.address);
    });

    it("Should revert if not owner", async function () {
      const { escrow, creator, hunter } = await loadFixture(deployFixture);

      await expect(escrow.connect(creator).setTreasury(hunter.address)).to.be.revertedWithCustomError(
        escrow,
        "NotOwner"
      );
    });
  });

  describe("Full Flow Integration", function () {
    it("Should complete full bounty lifecycle", async function () {
      const { escrow, usdc, creator, hunter, treasury } = await loadFixture(deployFixture);

      // 1. Creator creates bounty
      await escrow.connect(creator).createBounty(REWARD, 0);

      // 2. Hunter claims bounty
      await escrow.connect(hunter).claimBounty(1);

      // 3. Hunter submits work
      const proofHash = ethers.keccak256(ethers.toUtf8Bytes("ipfs://QmProof123"));
      await escrow.connect(hunter).submitWork(1, proofHash);

      // 4. Creator approves work
      const hunterBalanceBefore = await usdc.balanceOf(hunter.address);
      await escrow.connect(creator).approveWork(1);

      // 5. Verify final state
      const expectedPayout = REWARD - (REWARD * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
      expect(await usdc.balanceOf(hunter.address)).to.equal(hunterBalanceBefore + expectedPayout);

      const bounty = await escrow.getBounty(1);
      expect(bounty.status).to.equal(3); // Completed
      expect(await escrow.activeClaim(hunter.address)).to.equal(0);
    });

    it("Should handle rejection and resubmission flow", async function () {
      const { escrow, creator, hunter } = await loadFixture(deployFixture);

      // Create and claim
      await escrow.connect(creator).createBounty(REWARD, 0);
      await escrow.connect(hunter).claimBounty(1);

      // First submission
      await escrow.connect(hunter).submitWork(1, ethers.randomBytes(32));

      // Rejection
      await escrow.connect(creator).rejectWork(1, "Needs improvement");

      // Second submission
      await escrow.connect(hunter).submitWork(1, ethers.randomBytes(32));

      // Approval
      await escrow.connect(creator).approveWork(1);

      const bounty = await escrow.getBounty(1);
      expect(bounty.status).to.equal(3); // Completed
    });
  });
});


