# Deploy HybridRevenueControllerV2

## Quick Deploy Instructions

The deployment script has been updated to deploy HybridRevenueControllerV2 as the only revenue controller.

### 1. Deploy All Contracts

```bash
cd packages/contracts
forge script script/Deploy.s.sol:Deploy --broadcast --rpc-url $STORY_RPC_URL
```

### 2. Update Frontend Environment

After deployment, update the frontend `.env.local` with the V2 contract address:

```bash
HYBRID_REVENUE_CONTROLLER_V2_ADDRESS=0x[deployed_address_here]
```

### 3. Verify Deployment

The deployment script will output all contract addresses including:
- HybridRevenueControllerV2 - The only revenue controller (permissionless)

## Key Features

- **Permissionless Registration**: Authors can register their own books without admin approval
- **Automatic Curator Assignment**: The registering address becomes the curator
- **Revenue Model**: 70% author, 20% curator, 10% platform
- **Frontend Integration**: Users register directly through MetaMask
- **No Admin Keys**: Fully decentralized book registration

## What Happens Next

1. Authors register their books through the frontend UI
2. The backend directs all registration to frontend (no server-side registration)
3. All books use the permissionless system
4. No centralized control over book registration

## Testing the Deployment

After deployment, test the contract:
1. Publish a new book
2. The system will prompt to register in HybridRevenueControllerV2
3. Complete registration through MetaMask
4. Set chapter prices
5. Verify revenue sharing works correctly (70/20/10 split)