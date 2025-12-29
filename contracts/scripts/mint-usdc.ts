import { ethers } from "hardhat";

// The MockUSDC address - UPDATE THIS after deploying!
const MOCK_USDC_ADDRESS = process.env.MOCK_USDC_ADDRESS || "";

// Amount to mint: 10,000 USDC
const MINT_AMOUNT = ethers.parseUnits("10000", 6);

async function main() {
  if (!MOCK_USDC_ADDRESS) {
    console.error("Error: Set MOCK_USDC_ADDRESS in .env or as environment variable");
    console.log("\nUsage:");
    console.log("  MOCK_USDC_ADDRESS=0x... npx hardhat run scripts/mint-usdc.ts --network baseSepolia");
    process.exit(1);
  }

  const [signer] = await ethers.getSigners();
  const recipientAddress = process.env.MINT_TO_ADDRESS || signer.address;

  console.log("MockUSDC address:", MOCK_USDC_ADDRESS);
  console.log("Minting to:", recipientAddress);
  console.log("Amount:", ethers.formatUnits(MINT_AMOUNT, 6), "USDC");

  // Get MockUSDC contract
  const mockUsdc = await ethers.getContractAt("MockUSDC", MOCK_USDC_ADDRESS);

  // Mint tokens
  console.log("\nMinting...");
  const tx = await mockUsdc.mint(recipientAddress, MINT_AMOUNT);
  await tx.wait();

  // Check balance
  const balance = await mockUsdc.balanceOf(recipientAddress);
  console.log("New balance:", ethers.formatUnits(balance, 6), "USDC");
  console.log("\nDone!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

