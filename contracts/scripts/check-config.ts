import { ethers } from "hardhat";

// Addresses from contracts.ts
const ESCROW_ADDRESS = "0x683E131dD6ee598E537ce155BFc0aAF0e19d0107";
const EXPECTED_USDC = "0xC821CdC016583D29e307E06bd96587cAC1757bB4";

async function main() {
  console.log("=".repeat(50));
  console.log("Checking Contract Configuration");
  console.log("=".repeat(50));

  // Get the escrow contract
  const escrow = await ethers.getContractAt("SnapBountyEscrow", ESCROW_ADDRESS);
  
  // Read the USDC address from the contract
  const actualUsdc = await escrow.usdc();
  const treasury = await escrow.treasury();
  const platformFee = await escrow.platformFeeBps();
  const bountyCount = await escrow.bountyCount();

  console.log("\nEscrow Contract:", ESCROW_ADDRESS);
  console.log("Expected USDC:", EXPECTED_USDC);
  console.log("Actual USDC:  ", actualUsdc);
  console.log("Treasury:", treasury);
  console.log("Platform Fee:", platformFee.toString(), "bps (" + Number(platformFee) / 100 + "%)");
  console.log("Bounty Count:", bountyCount.toString());

  if (actualUsdc.toLowerCase() !== EXPECTED_USDC.toLowerCase()) {
    console.log("\n⚠️  USDC ADDRESS MISMATCH!");
    console.log("The escrow contract is using a different USDC token.");
    console.log("You need to redeploy the escrow contract with the correct USDC address.");
    console.log("\nRun: npm run deploy:mock");
  } else {
    console.log("\n✅ USDC address matches!");
  }

  // Check user's balance and allowance if we have the USDC contract
  const [signer] = await ethers.getSigners();
  console.log("\nChecking for wallet:", signer.address);

  try {
    const usdc = await ethers.getContractAt("MockUSDC", EXPECTED_USDC);
    const balance = await usdc.balanceOf(signer.address);
    const allowance = await usdc.allowance(signer.address, ESCROW_ADDRESS);
    
    console.log("USDC Balance:", ethers.formatUnits(balance, 6), "USDC");
    console.log("USDC Allowance for Escrow:", ethers.formatUnits(allowance, 6), "USDC");
  } catch (e) {
    console.log("Could not check balance/allowance - contract may not exist");
  }

  console.log("\n" + "=".repeat(50));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

