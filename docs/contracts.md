# Smart Contracts

## HybridRevenueControllerV2
Handles TIP token payments and revenue distribution.

**Key Functions:**
- `registerBook()` - Author registers book (becomes curator)
- `unlockChapter()` - Reader pays TIP to access chapter
- `distributeRevenue()` - Auto-splits: 70% author, 20% curator, 10% platform
- `claimEarnings()` - Withdraw accumulated earnings

**For Translations:**
- Translator registered as "curator" for translation chapters
- Author gets 20% curator share (instead of 25% royalty)
- Simpler than Story Protocol royalties

## Why Hybrid?
- TIP token not whitelisted by Story Protocol
- Keep existing token economics
- Proven payment system
- Story Protocol for IP, HybridController for money