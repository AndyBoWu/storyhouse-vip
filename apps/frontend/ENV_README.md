# Environment Configuration

## Environment Files

This project uses network-specific environment files to manage different blockchain networks:

### Available Environment Files

- **`.env.testnet`** - Story Protocol Aeneid Testnet configuration
- **`.env.mainnet`** - Story Protocol Mainnet configuration (when available)

### Usage

The development scripts automatically copy the appropriate environment file to `.env.local`:

```bash
# Start development server with testnet configuration (default)
npm run dev

# Explicitly use testnet
npm run dev:testnet

# Use mainnet (when .env.mainnet exists)
npm run dev:mainnet
```

### Environment Variables

#### Testnet Configuration (`.env.testnet`)

- `NEXT_PUBLIC_ENABLE_TESTNET=false` - Toggle between mock and real blockchain operations
- `STORY_PRIVATE_KEY` - Your private key for Story Protocol transactions
- `STORY_RPC_URL` - Story Protocol RPC endpoint
- `R2_*` - Cloud storage configuration

#### Network-Specific Settings

**Aeneid Testnet:**

- Network ID: Aeneid
- Explorer: https://aeneid.storyscan.io/
- RPC: https://testnet.storyrpc.io

### Security Notes

- Never commit private keys to git
- The `.env.local` file is temporary and should not be committed
- Keep your `.env.testnet` and `.env.mainnet` files secure
