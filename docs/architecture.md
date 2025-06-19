# Architecture

## Stack
- **Frontend**: Next.js + Story Protocol SDK
- **Blockchain**: Story Protocol (no custom contracts)
- **Backend**: Minimal - only AI verification
- **Storage**: R2 for metadata

## Key Design
1. **Frontend-first** - Users interact directly with blockchain
2. **Author owns all IPs** - Translations, audio, video
3. **Service providers** - Get revenue shares, not ownership
4. **AI verification** - Quality control for translations

## Data Flow
```
User → Frontend → Story Protocol
                ↓
                AI Backend (verification only)
```