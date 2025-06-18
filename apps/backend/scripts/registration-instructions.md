# Registering Project Phoenix in HybridRevenueController

## Current Status
- ❌ Book is NOT registered in HybridRevenueController
- ❌ Chapter attributions are NOT set

## What needs to be done

### Option 1: Manual Registration (Recommended for now)

You need an account with `STORY_MANAGER_ROLE` on the HybridRevenueController to execute these transactions.

1. **Get the STORY_MANAGER_ROLE holder**
   - Check who deployed the HybridRevenueController or has admin access
   - This is likely the account that deployed the contract

2. **Add the private key to .env.local**
   ```bash
   ADMIN_PRIVATE_KEY=0x... # Your admin private key here
   ```

3. **Run the registration script**
   ```bash
   npm run register-book
   ```

### Option 2: Using Etherscan/StoryScan

If you prefer to do it manually via the blockchain explorer:

1. Go to the HybridRevenueController on StoryScan:
   https://aeneid.storyscan.io/address/0xd1F7e8c6FD77dADbE946aE3e4141189b39Ef7b08

2. Connect your wallet (must have STORY_MANAGER_ROLE)

3. Call `registerBook` with these parameters:
   - bookId: `0x3078333837336330643162636661323435373733623133623639346134396461`
   - curator: `0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2`
   - isDerivative: `false`
   - parentBookId: `0x0000000000000000000000000000000000000000000000000000000000000000`
   - totalChapters: `4`
   - ipfsMetadataHash: `` (empty string)

4. Then call `setChapterAttribution` for each chapter:
   
   **Chapter 1 (FREE)**:
   - bookId: `0x3078333837336330643162636661323435373733623133623639346134396461`
   - chapterNumber: `1`
   - originalAuthor: `0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2`
   - sourceBookId: `0x3078333837336330643162636661323435373733623133623639346134396461`
   - unlockPrice: `0`
   - isOriginalContent: `true`

   **Chapter 2 (FREE)**:
   - Same as above but chapterNumber: `2`

   **Chapter 3 (FREE)**:
   - Same as above but chapterNumber: `3`

   **Chapter 4 (0.5 TIP)**:
   - bookId: `0x3078333837336330643162636661323435373733623133623639346134396461`
   - chapterNumber: `4`
   - originalAuthor: `0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2`
   - sourceBookId: `0x3078333837336330643162636661323435373733623133623639346134396461`
   - unlockPrice: `500000000000000000` (0.5 * 10^18)
   - isOriginalContent: `true`

### Option 3: Create Admin UI (Future)

For the future, we should create an admin UI that allows book authors to:
1. Register their books in HybridRevenueController
2. Set chapter attributions and prices
3. Manage revenue sharing for derivative works

## After Registration

Once registered, the book will automatically use HybridRevenueController for all payments:
- 70% to author
- 20% to curator (same as author for original books)
- 10% to platform

Users will no longer see "waiting for TIP transfer" and will instead see the proper HybridRevenueController flow.