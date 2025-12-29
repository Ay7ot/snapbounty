# Deployment Guide

## Prerequisites

1. **Base Sepolia ETH** - You need testnet ETH to pay for gas

   - Get some from: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
   - Or: https://www.alchemy.com/faucets/base-sepolia (Alchemy)
   - Or: Bridge from Ethereum Sepolia via https://bridge.base.org/deposit

2. **Private Key** - The private key of the account you want to deploy from
   - Format: Private key without the `0x` prefix
   - Example: `abc123def456...` (64 characters)

## Setup

1. **Add your private key to `.env`**:

   ```bash
   PRIVATE_KEY=your_private_key_here_without_0x_prefix
   TREASURY_ADDRESS=0xYourTreasuryAddress  # Optional: defaults to deployer
   ```

2. **Verify your account has Base Sepolia ETH**:
   ```bash
   # This will show your balance when you deploy
   npx hardhat run scripts/deploy.ts --network baseSepolia
   ```

## Deploy to Base Sepolia

```bash
cd contracts
npm run deploy:sepolia
# OR
npx hardhat run scripts/deploy.ts --network baseSepolia
```

## After Deployment

1. **Copy the deployed contract address** from the output

2. **Update `src/config/contracts.ts`**:

   ```typescript
   export const ESCROW_ADDRESSES: Record<number, `0x${string}`> = {
     [baseSepolia.id]: "0xYOUR_DEPLOYED_ADDRESS_HERE", // ← Update this
     [base.id]: "0x0000000000000000000000000000000000000000",
   };
   ```

3. **Optional: Verify on BaseScan**:
   ```bash
   # Add BASESCAN_API_KEY to .env first (get from https://basescan.org)
   npx hardhat verify --network baseSepolia 0xYOUR_CONTRACT_ADDRESS "0x036CbD53842c5426634e7929541eC2318f3dCF7e" "0xTREASURY_ADDRESS" "500"
   ```

## Deploy to Base Mainnet

⚠️ **Only deploy to mainnet when you're ready for production!**

```bash
npm run deploy:mainnet
# OR
npx hardhat run scripts/deploy.ts --network base
```

Make sure you:

- Have enough Base ETH for gas
- Have tested thoroughly on testnet
- Update `ESCROW_ADDRESSES` for mainnet

## USDC Addresses

- **Base Sepolia (testnet)**: `0x036CbD53842c5426634e7929541eC2318f3dCF7e` (Circle USDC)
- **Base Mainnet**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (Official USDC)

### Getting Testnet USDC on Base Sepolia

Get testnet USDC from Circle's faucet:
- https://faucet.circle.com/ (select Base Sepolia)
