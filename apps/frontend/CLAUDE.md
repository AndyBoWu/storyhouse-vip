# Frontend CLAUDE.md

This file provides specific guidance for working with the StoryHouse.vip frontend application.

## Overview

Next.js 15.3.3 frontend application for StoryHouse.vip Web3 storytelling platform. Handles user interactions, wallet connections, and blockchain operations.

## Key Technologies

- **Framework**: Next.js 15.3.3 with App Router
- **Styling**: Tailwind CSS with custom gradient themes
- **State Management**: React hooks and context
- **Blockchain**: Wagmi v2, Viem for Web3 interactions
- **Wallet**: RainbowKit for wallet connections
- **API Client**: Custom axios-based client in `lib/api-client.ts`

## Directory Structure

```
apps/frontend/
├── app/                    # Next.js app router pages
│   ├── page.tsx           # Landing page with navigation
│   ├── read/              # Reading interface
│   ├── write/             # Writing interface
│   ├── own/               # Ownership dashboard
│   └── creator/           # Creator dashboard
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── publishing/       # Publishing workflow components
│   └── providers/        # Context providers
├── hooks/                # Custom React hooks
│   ├── useStoryProtocol.ts       # Story Protocol interactions
│   ├── useUnifiedPublishStory.ts # Publishing workflow
│   └── useBookRegistration.ts    # Book registration
└── lib/                  # Utilities and services
    ├── api-client.ts     # Backend API client
    ├── storyProtocol.ts  # Story Protocol setup
    └── utils/            # Helper functions
```

## Critical Components

### 1. Header Component (`components/ui/Header.tsx`)
- Unified navigation across all pages
- Active state highlighting based on current route
- Wallet connection integration
- Responsive design with mobile support

### 2. Publishing Flow (`hooks/useUnifiedPublishStory.ts`)
- **IMPORTANT**: All publishing uses unified registration (legacy removed)
- Client-side blockchain execution with MetaMask
- 60-second timeout for blockchain operations
- Graceful fallback if blockchain registration fails

### 3. API Client (`lib/api-client.ts`)
- Centralized backend communication
- Automatic error handling
- TypeScript interfaces for all API responses
- Base URL configuration via environment variables

## Environment Variables

```bash
# Required
NEXT_PUBLIC_API_URL=http://localhost:3002
NEXT_PUBLIC_STORY_SPG_NFT_CONTRACT=0x...
NEXT_PUBLIC_STORY_PIL_LICENSE_TEMPLATE=0x...
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=...

# Network Configuration
NEXT_PUBLIC_CHAIN_ID=513226
NEXT_PUBLIC_RPC_URL=https://rpc.storynetwork.io
```

## Development Guidelines

### 1. Component Patterns
- Use dynamic imports for Web3 components to avoid hydration issues
- Implement loading states for all async operations
- Handle wallet disconnection gracefully
- Show clear error messages for blockchain failures

### 2. State Management
- Keep blockchain state in hooks, not components
- Use React Query or SWR for data fetching (future improvement)
- Avoid prop drilling - use context for shared state

### 3. Error Handling
```typescript
// Always wrap blockchain operations
try {
  const result = await blockchainOperation();
  // Handle success
} catch (error) {
  console.error('Operation failed:', error);
  showToast.showError('User-friendly error message');
  // Don't throw - handle gracefully
}
```

### 4. Performance
- Lazy load heavy components (charts, editors)
- Optimize images with Next.js Image component
- Minimize blockchain calls - batch when possible
- Cache API responses appropriately

## Common Tasks

### Adding a New Page
1. Create directory in `app/` with `page.tsx`
2. Add route to Header navigation if needed
3. Ensure proper metadata and loading states
4. Test wallet connection states

### Implementing Blockchain Features
1. Create hook in `hooks/` directory
2. Use existing patterns from `useStoryProtocol.ts`
3. Add proper error handling and timeouts
4. Test with disconnected wallet

### Updating API Integration
1. Add types to `lib/api-client.ts`
2. Follow existing method patterns
3. Handle errors consistently
4. Update relevant hooks/components

## Testing Checklist
- [ ] Works with wallet disconnected
- [ ] Handles network switching
- [ ] Shows loading states
- [ ] Displays errors clearly
- [ ] Mobile responsive
- [ ] No hydration errors

## Known Issues & Solutions

1. **Hydration Errors**: Use dynamic imports for Web3 components
2. **Wallet Connection Issues**: Check RainbowKit configuration
3. **API Timeout**: Increase timeout in api-client.ts
4. **Gas Estimation**: Let MetaMask handle it, don't override

## Future Improvements
- Add comprehensive test coverage
- Implement proper caching strategy
- Add error boundary components
- Improve loading state animations
- Add analytics tracking
- Implement progressive web app features