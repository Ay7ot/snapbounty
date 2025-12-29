import { ethers } from "hardhat";

const ESCROW = "0x683E131dD6ee598E537ce155BFc0aAF0e19d0107";
const USDC = "0xC821CdC016583D29e307E06bd96587cAC1757bB4";
const USER = "0xa09CD14EeE6Fec947ff5e328a1956Ba7d9578FEe";

async function main() {
  console.log("Checking wallet:", USER);
  console.log("=".repeat(50));

  const usdc = await ethers.getContractAt("MockUSDC", USDC);
  const escrow = await ethers.getContractAt("SnapBountyEscrow", ESCROW);
  
  const balance = await usdc.balanceOf(USER);
  const allowance = await usdc.allowance(USER, ESCROW);
  const activeClaim = await escrow.activeClaim(USER);
  
  console.log("USDC Balance:", ethers.formatUnits(balance, 6), "USDC");
  console.log("Allowance for Escrow:", allowance > 0n ? ethers.formatUnits(allowance, 6) : "0", "USDC");
  console.log("Has max allowance:", allowance >= ethers.parseUnits("1000000000", 6) ? "YES" : "NO");
  console.log("Active Bounty Claim ID:", activeClaim.toString());
  
  // Check escrow's USDC balance
  const escrowBalance = await usdc.balanceOf(ESCROW);
  console.log("\nEscrow USDC Balance:", ethers.formatUnits(escrowBalance, 6), "USDC");
  
  // Check bounty count
  const bountyCount = await escrow.bountyCount();
  console.log("Total Bounties Created:", bountyCount.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

