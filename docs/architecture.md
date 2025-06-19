# Architecture

## Stack
- **Frontend**: Next.js + Story Protocol SDK
- **Blockchain**: Story Protocol + HybridRevenueControllerV2
- **Backend**: Minimal - only AI verification
- **Storage**: R2 for metadata

## Hybrid Approach
1. **Story Protocol** - IP registration, licensing, derivatives
2. **HybridRevenueController** - TIP token payments, revenue splits
3. **Author owns all IPs** - Translations, audio, video
4. **Service providers** - Get revenue shares via contract

## Data Flow
```
User → Frontend → Story Protocol (IP registration)
              ↘
                HybridRevenueController (TIP payments)
                ↓
                AI Backend (verification only)
```