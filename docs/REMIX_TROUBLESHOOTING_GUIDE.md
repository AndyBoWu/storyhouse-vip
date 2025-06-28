# Book Remixing Troubleshooting Guide

## Overview
This guide walks through the complete process of remixing (branching) a book on StoryHouse.vip, identifying common issues and their solutions.

## Prerequisites
1. **Original book must exist** with at least 3 chapters
2. **Original book must be marked as remixable**
3. **User must have a connected wallet** (MetaMask)
4. **Original book should be registered** in HybridRevenueControllerV2

## Step-by-Step Remixing Process

### Step 1: Navigate to Branch Page
- Go to `/write/branch`
- Select the book you want to remix
- Choose the chapter to branch from (must be chapter 3 or later)

### Step 2: Configure Your Remix
- Enter new book title
- Add description
- Select genres
- Choose content rating
- Optionally upload a new cover

### Step 3: Create the Branch
When you click "Continue to Write Chapter":

1. **Frontend calls** `POST /api/books/branch` with:
   ```json
   {
     "parentBookId": "0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/shadows-and-light",
     "branchPoint": "ch3",
     "newTitle": "Shadows and Light - Remix",
     "authorAddress": "0x71b93d154886c297f4b6e6219c47d378f6ac6a70",
     "genres": ["Mystery", "Adventure"],
     "contentRating": "PG"
   }
   ```

2. **Backend creates derivative book**:
   - Generates new book ID
   - Copies chapter references (ch1, ch2, ch3)
   - Sets up revenue sharing structure
   - Stores book metadata in R2

3. **Story Protocol Registration** (if parent has IP):
   - Registers derivative IP asset
   - Links to parent IP
   - Sets up licensing

4. **Book Registration Required** ⚠️
   - The derivative book needs to be registered in HybridRevenueControllerV2
   - This step is currently missing/failing

### Step 4: Write New Chapter
- Redirected to `/write/chapter?bookId={newBookId}&chapterNumber=4`
- Write your new chapter content
- Publish the chapter

## Common Issues & Solutions

### Issue 1: "Pending Registration" Status
**Problem**: Book created but not registered in smart contract
**Solution**: 
1. Go to book page
2. Look for "Register Book" option
3. Complete MetaMask transaction
4. Wait for confirmation

### Issue 2: "Failed to retrieve chapter information"
**Problem**: Backend can't serve inherited chapters for unregistered books
**Solution**: Register the book first (see Issue 1)

### Issue 3: "No Attribution" for inherited chapters
**Problem**: Attribution not set for inherited chapters
**Solution**: 
- For now, the frontend fix detects inherited chapters and queries parent book
- Future: May need contract update to copy attributions during branching

### Issue 4: Cannot access chapters 1-3 in remix
**Problem**: Chapter map exists but content not accessible
**Solution**: Ensure book is registered before trying to view chapters

## Technical Flow Diagram

```
User Selects Book to Remix
    ↓
Branch Configuration
    ↓
POST /api/books/branch
    ↓
Create Derivative Book Metadata
    ↓
Copy Chapter References (ch1-ch3)
    ↓
[Missing] Register Book in Contract ← THIS IS THE ISSUE
    ↓
Redirect to Write Chapter 4
    ↓
Publish New Chapter
    ↓
[Issue] Attribution Check Fails for Unregistered Book
```

## Required Fixes

### 1. Immediate Fix (Backend)
Add automatic book registration to the branching process:
```typescript
// In /api/books/branch/route.ts
if (derivativeBookMetadata) {
  // Register the book automatically
  await registerBookInContract({
    bookId: newBookId,
    totalChapters: 100,
    isDerivative: true,
    parentBookId: parentBookId
  });
}
```

### 2. Frontend Handling
- Show clear status when book needs registration
- Provide "Register Book" button for pending books
- Disable chapter viewing until registered

### 3. Attribution Enhancement
Current fix (implemented):
- Frontend detects inherited chapters
- Queries parent book for attribution
- Shows "Inherited" badge

## Testing Checklist

- [ ] Original book has 3+ chapters
- [ ] Original book is registered
- [ ] Original book marked as remixable
- [ ] Branch creation completes
- [ ] New book shows in library
- [ ] New book is registered (not "Pending")
- [ ] Can view inherited chapters (1-3)
- [ ] Attribution shows correctly for inherited chapters
- [ ] Can write and publish new chapter (4+)
- [ ] Revenue sharing is set up correctly

## Manual Book Deletion (Admin)

Since books are in Cloudflare R2, deletion requires:
1. Backend API endpoint for book deletion
2. Or direct R2 access via Cloudflare dashboard
3. Or create admin script to clean up test books

Currently, there's no user-facing delete option for books stored in R2.