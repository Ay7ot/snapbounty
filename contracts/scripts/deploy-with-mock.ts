import { ethers, network } from "hardhat";

// Platform fee: 5% = 500 basis points
const PLATFORM_FEE_BPS = 500;

// Amount to mint: 100,000 USDC
const MINT_AMOUNT = ethers.parseUnits("100000", 6);

async function main() {
    const [deployer] = await ethers.getSigners();
    const networkName = network.name;

    console.log("=".repeat(50));
    console.log("Deploying with MockUSDC (for testnet)");
    console.log("=".repeat(50));
    console.log("\nDeploying contracts with account:", deployer.address);
    console.log("Network:", networkName);
    console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

    // Deploy MockUSDC
    console.log("\n1. Deploying MockUSDC...");
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUsdc = await MockUSDC.deploy();
    await mockUsdc.waitForDeployment();
    const usdcAddress = await mockUsdc.getAddress();
    console.log("   MockUSDC deployed to:", usdcAddress);

    // Mint tokens to deployer
    console.log("\n2. Minting", ethers.formatUnits(MINT_AMOUNT, 6), "USDC to deployer...");
    await mockUsdc.mint(deployer.address, MINT_AMOUNT);
    const balance = await mockUsdc.balanceOf(deployer.address);
    console.log("   Deployer USDC balance:", ethers.formatUnits(balance, 6), "USDC");

    // Get treasury address from env or use deployer
    const treasuryAddress = process.env.TREASURY_ADDRESS || deployer.address;
    console.log("\n3. Treasury address:", treasuryAddress);

    // Deploy SnapBountyEscrow
    console.log("\n4. Deploying SnapBountyEscrow...");
    const SnapBountyEscrow = await ethers.getContractFactory("SnapBountyEscrow");
    const escrow = await SnapBountyEscrow.deploy(usdcAddress, treasuryAddress, PLATFORM_FEE_BPS);
    await escrow.waitForDeployment();
    const escrowAddress = await escrow.getAddress();
    console.log("   SnapBountyEscrow deployed to:", escrowAddress);

    // Log deployment summary
    console.log("\n" + "=".repeat(50));
    console.log("DEPLOYMENT COMPLETE!");
    console.log("=".repeat(50));
    console.log("\nNetwork:", networkName);
    console.log("MockUSDC Address:", usdcAddress);
    console.log("Escrow Address:", escrowAddress);
    console.log("Treasury Address:", treasuryAddress);
    console.log("Platform Fee:", PLATFORM_FEE_BPS / 100, "%");
    console.log("Deployer USDC Balance:", ethers.formatUnits(balance, 6), "USDC");

    console.log("\n" + "=".repeat(50));
    console.log("NEXT STEPS:");
    console.log("=".repeat(50));
    console.log("\n1. Update src/config/contracts.ts with these addresses:");
    console.log(`
export const ESCROW_ADDRESSES: Record<number, \`0x\${string}\`> = {
  [baseSepolia.id]: "${escrowAddress}",
  [base.id]: "0x0000000000000000000000000000000000000000",
};

export const USDC_ADDRESSES: Record<number, \`0x\${string}\`> = {
  [baseSepolia.id]: "${usdcAddress}",
  [base.id]: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
};
`);

    console.log("2. To mint more USDC to any address, run:");
    console.log(`   npx hardhat run scripts/mint-usdc.ts --network ${networkName}`);
    console.log("");

    return {
        mockUsdc: usdcAddress,
        escrow: escrowAddress,
        treasury: treasuryAddress,
    };
}

main()
    .then((addresses) => {
        console.log("Contract addresses:", addresses);
        process.exit(0);
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

