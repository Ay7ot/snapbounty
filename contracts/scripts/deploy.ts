import { ethers, network } from "hardhat";

// USDC addresses
const USDC_ADDRESSES: Record<string, string> = {
  base: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Official USDC on Base
  baseSepolia: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Circle USDC on Base Sepolia
  hardhat: "", // Will deploy MockUSDC
  localhost: "", // Will deploy MockUSDC
};

// Platform fee: 5% = 500 basis points
const PLATFORM_FEE_BPS = 500;

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

  // Deploy SnapBountyEscrow
  console.log("\nDeploying SnapBountyEscrow...");
  const SnapBountyEscrow = await ethers.getContractFactory("SnapBountyEscrow");
  const escrow = await SnapBountyEscrow.deploy(usdcAddress, treasuryAddress, PLATFORM_FEE_BPS);
  await escrow.waitForDeployment();

  const escrowAddress = await escrow.getAddress();
  console.log("SnapBountyEscrow deployed to:", escrowAddress);

  // Log deployment summary
  console.log("\n========== Deployment Summary ==========");
  console.log("Network:", networkName);
  console.log("USDC Address:", usdcAddress);
  console.log("Treasury Address:", treasuryAddress);
  console.log("Platform Fee:", PLATFORM_FEE_BPS / 100, "%");
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


