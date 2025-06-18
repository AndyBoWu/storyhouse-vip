# Deploying HybridRevenueControllerV2

## Overview
HybridRevenueControllerV2 is a decentralized version that allows anyone to register their own books without needing special roles.

## Key Improvements
- ✅ **Permissionless Registration**: Anyone can register their books
- ✅ **Author Control**: Book authors become curators and control their chapters
- ✅ **No Admin Keys**: Frontend users sign transactions with MetaMask
- ✅ **Same Revenue Split**: 70% author, 20% curator, 10% platform

## Deployment Steps

### Option 1: Using Remix (Recommended for Quick Deploy)

1. **Open Remix IDE**
   - Go to https://remix.ethereum.org

2. **Create Contract File**
   - Create new file: `HybridRevenueControllerV2.sol`
   - Copy the content from `contracts/HybridRevenueControllerV2-Simplified.sol`

3. **Compile**
   - Select compiler version 0.8.20 or higher
   - Enable optimization (200 runs)
   - Compile the contract

4. **Deploy**
   - Environment: "Injected Provider - MetaMask"
   - Select Story Testnet in MetaMask
   - Constructor parameter: `0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E` (TIP Token address)
   - Click "Deploy"

5. **Save the Contract Address**
   - Copy the deployed contract address
   - You'll need this for frontend configuration

### Option 2: Using Hardhat/Foundry

```bash
# Install dependencies
cd contracts
npm install

# Configure network in hardhat.config.js
# Add Story testnet RPC

# Deploy
npx hardhat run scripts/deploy-hybrid-v2.js --network story-testnet
```

### Option 3: Using Cast (Foundry)

```bash
# Set private key
export PRIVATE_KEY=0x...

# Deploy
cast send --rpc-url https://aeneid.storyrpc.io \
  --private-key $PRIVATE_KEY \
  --create $(cat HybridRevenueControllerV2.bin) \
  "constructor(address)" \
  0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E
```

## After Deployment

1. **Save the contract address**
2. **Update frontend configuration** (see next steps)
3. **Test with a sample book registration**

## Contract Addresses

### Testnet (Aeneid)
- TIP Token: `0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E`
- HybridRevenueControllerV1: `0xd1F7e8c6FD77dADbE946aE3e4141189b39Ef7b08` (old, requires roles)
- HybridRevenueControllerV2: `[TO BE DEPLOYED]` (new, permissionless)

## Testing the Contract

After deployment, test these functions:

1. **Register a book** (anyone can do this)
   ```
   registerBook(
     bookId: bytes32 (from "authorAddress/bookSlug"),
     isDerivative: false,
     parentBookId: 0x0000...0000,
     totalChapters: 4,
     ipfsMetadataHash: ""
   )
   ```

2. **Set chapter attribution** (only book curator)
   ```
   setChapterAttribution(
     bookId: bytes32,
     chapterNumber: 1,
     originalAuthor: authorAddress,
     sourceBookId: bookId,
     unlockPrice: 0 (for free chapters) or 500000000000000000 (0.5 TIP),
     isOriginalContent: true
   )
   ```

3. **Unlock a chapter** (readers)
   ```
   unlockChapter(bookId, chapterNumber)
   ```