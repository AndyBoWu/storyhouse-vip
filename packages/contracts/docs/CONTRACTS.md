# Contract Documentation

## TIPToken.sol

### Purpose
Core ERC-20 token for the StoryHouse.vip ecosystem with controlled minting and pausable transfers.

### Key Features
- **Supply Management**: 1B initial supply, 10B total cap
- **Controlled Minting**: Only authorized minters can create new tokens
- **Pausable Transfers**: Emergency pause functionality
- **Burnable**: Users can burn their own tokens

### Functions
- `addMinter(address)` - Add authorized minter (owner only)
- `removeMinter(address)` - Remove minter authorization (owner only)  
- `mint(address, uint256)` - Mint tokens to address (minters only)
- `updateSupplyCap(uint256)` - Update maximum supply (owner only)
- `pause()/unpause()` - Emergency pause controls (owner only)

### Events
- `MinterAdded(address indexed minter)`
- `MinterRemoved(address indexed minter)`
- `SupplyCapUpdated(uint256 oldCap, uint256 newCap)`

---

## ChapterAccessController.sol

### Purpose
Manages chapter access control with tiered pricing model and author revenue distribution.

### Key Features
- **Tiered Access**: Free chapters 1-3, paid chapters 4+ (0.5 TIP each)
- **IP Integration**: Supports Story Protocol IP asset registration
- **Author Revenue**: Direct payments to chapter authors
- **Access Tracking**: Prevents double payments for same chapter

### Functions
- `registerChapter()` - Register new chapter with metadata
- `unlockChapter()` - Pay to unlock premium chapter
- `setChapterPrice()` - Update chapter pricing (admin only)
- `isChapterUnlocked()` - Check if user has access to chapter

### Events
- `ChapterRegistered(bytes32 indexed bookId, uint256 chapterNumber, address indexed author, string ipAssetId, bool isFree)`
- `ChapterUnlocked(address indexed reader, bytes32 indexed bookId, uint256 chapterNumber, uint256 unlockPrice, uint256 timestamp)`
- `AuthorRevenueDistributed(bytes32 indexed bookId, uint256 chapterNumber, address indexed author, uint256 amount)`

---

## HybridRevenueControllerV2.sol

### Purpose
**PERMISSIONLESS** multi-author revenue sharing system for collaborative books. V2 removes admin approval requirements.

### Key Features
- **Permissionless Registration**: Anyone can register books and become curator
- **Revenue Splitting**: 70% author, 20% curator, 10% platform
- **Chapter Attribution**: Track which author wrote each chapter
- **Derivative Support**: Books can be derivatives of other books

### Functions
- `registerBook()` - Register new book (permissionless, caller becomes curator)
- `setChapterAttribution()` - Set author for specific chapter
- `unlockChapter()` - Purchase chapter access with revenue distribution
- `setRevenueShares()` - Update revenue percentages (admin only)

### Events
- `BookRegistered(bytes32 indexed bookId, address indexed curator, bool isDerivative, bytes32 parentBookId)`
- `ChapterUnlocked(address indexed reader, bytes32 indexed bookId, uint256 chapterNumber, uint256 totalPrice, uint256 timestamp)`
- `RevenueDistributed(bytes32 indexed bookId, uint256 chapterNumber, address indexed chapterAuthor, address indexed bookCurator, uint256 authorShare, uint256 curatorShare, uint256 platformShare)`

### Key Changes from V1
- ❌ Removed `STORY_MANAGER_ROLE` requirement for book registration
- ✅ `msg.sender` automatically becomes curator when registering
- ✅ Maintains same revenue distribution model (70/20/10)
- ✅ Backward compatible with V1 interfaces

---

## HybridRevenueControllerV2Standalone.sol

### Purpose
Clean implementation of V2 without external dependencies for simplified deployment.

### Key Features
- **No External Dependencies**: Doesn't require RewardsManager or other contracts
- **Same Core Features**: Identical functionality to V2
- **Simplified Deployment**: Single contract deployment
- **Testing Friendly**: Easier to test in isolation

### Differences from V2
- Removed RewardsManager dependency
- Self-contained revenue distribution logic
- Simplified constructor parameters
- Independent of other contract upgrades

---

## Legacy Contracts

### HybridRevenueController.sol (V1)
Original revenue controller that requires `STORY_MANAGER_ROLE` for book registration. Kept for backward compatibility with existing books.

**Status**: Legacy - use V2 for new implementations

### Removed Contracts
- **RewardsManager.sol** - Removed due to farming vulnerability in automatic reward distribution
- **UnifiedRewardsController.sol** - Removed as automatic creation rewards were prone to bot exploitation

## Contract Interactions

### Typical Flow
1. Author deploys/uses TIPToken for platform currency
2. Author registers book using HybridRevenueControllerV2 (becomes curator automatically)
3. Author registers chapters using ChapterAccessController
4. Author sets chapter attribution in HybridRevenueControllerV2
5. Readers purchase chapter access through ChapterAccessController
6. Revenue automatically distributes via HybridRevenueControllerV2

### Security Considerations
- All contracts use OpenZeppelin's battle-tested security patterns
- ReentrancyGuard protects against reentrancy attacks
- AccessControl provides role-based permissions
- Pausable functionality for emergency scenarios
- Input validation on all external functions

### Gas Optimization
- Minimal cross-contract calls
- Efficient storage patterns
- Batch operations where possible
- Optimized for common user operations