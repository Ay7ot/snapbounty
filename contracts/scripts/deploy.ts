import { ethers, network } from "hardhat";

// USDC addresses
const USDC_ADDRESSES: Record<string, string> = {
  base: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Official USDC on Base
  baseSepolia: "0xC821CdC016583D29e307E06bd96587cAC1757bB4", // MockUSDC on Base Sepolia (for testing)
  hardhat: "", // Will deploy MockUSDC
  localhost: "", // Will deploy MockUSDC
};

// Platform fee: 5% = 500 basis points
const PLATFORM_FEE_BPS = 500;

// Dispute fee: 1 USDC (6 decimals)
const DISPUTE_FEE = ethers.parseUnits("1", 6);

async function main() {
  const [deployer] = await ethers.getSigners();
  const networkName = network.name;

  console.log("Deploying contracts with account:", deployer.address);
  console.log("Network:", networkName);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  let usdcAddress = USDC_ADDRESSES[networkName];
  let mockUsdc;

  // Deploy MockUSDC for local testing
  if (!usdcAddress) {
    console.log("\nDeploying MockUSDC for testing...");
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    mockUsdc = await MockUSDC.deploy();
    await mockUsdc.waitForDeployment();
    usdcAddress = await mockUsdc.getAddress();
    console.log("MockUSDC deployed to:", usdcAddress);
  }

  // Get treasury address from env or use deployer
  const treasuryAddress = process.env.TREASURY_ADDRESS || deployer.address;
  console.log("\nTreasury address:", treasuryAddress);

  // Get arbiter address from env or use deployer
  const arbiterAddress = process.env.ARBITER_ADDRESS || deployer.address;
  console.log("Arbiter address:", arbiterAddress);

  // Deploy SnapBountyEscrow
  console.log("\nDeploying SnapBountyEscrow...");
  const SnapBountyEscrow = await ethers.getContractFactory("SnapBountyEscrow");
  const escrow = await SnapBountyEscrow.deploy(
    usdcAddress,
    treasuryAddress,
    PLATFORM_FEE_BPS,
    arbiterAddress,
    DISPUTE_FEE
  );
  await escrow.waitForDeployment();

  const escrowAddress = await escrow.getAddress();
  console.log("SnapBountyEscrow deployed to:", escrowAddress);

  // Log deployment summary
  console.log("\n========== Deployment Summary ==========");
  console.log("Network:", networkName);
  console.log("USDC Address:", usdcAddress);
  console.log("Treasury Address:", treasuryAddress);
  console.log("Arbiter Address:", arbiterAddress);
  console.log("Platform Fee:", PLATFORM_FEE_BPS / 100, "%");
  console.log("Dispute Fee:", ethers.formatUnits(DISPUTE_FEE, 6), "USDC");
  console.log("SnapBountyEscrow:", escrowAddress);
  console.log("=========================================\n");

  // For local testing, mint some USDC to deployer
  if (mockUsdc) {
    console.log("Minting 10,000 USDC to deployer for testing...");
    await mockUsdc.mint(deployer.address, ethers.parseUnits("10000", 6));
    console.log("Done!");
  }

  // Return addresses for verification
  return {
    usdc: usdcAddress,
    escrow: escrowAddress,
    treasury: treasuryAddress,
    arbiter: arbiterAddress,
  };
}

main()
  .then((addresses) => {
    console.log("\nDeployment complete!");
    console.log("Contract addresses:", addresses);
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


