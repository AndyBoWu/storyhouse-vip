# R2 Bucket Listing Guide

This guide explains how to list and explore the contents of the StoryHouse R2 bucket.

## Quick Start

```bash
# List all R2 contents
cd apps/backend
pnpm list-r2

# Show tree view
pnpm list-r2:tree

# Show statistics only
pnpm list-r2:count
```

## Available Scripts

### 1. List All Contents
```bash
pnpm tsx scripts/list-r2-contents.ts
```
Lists all objects in the R2 bucket in a flat format.

### 2. Filter by Prefix
```bash
# List all books
pnpm tsx scripts/list-r2-contents.ts --prefix books/

# List specific author's books
pnpm tsx scripts/list-r2-contents.ts --prefix "books/0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/"

# List specific book
pnpm tsx scripts/list-r2-contents.ts --prefix "books/0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/the-detectives-portal-7/"
```

### 3. Display Options

#### Show File Sizes
```bash
pnpm tsx scripts/list-r2-contents.ts --sizes
```

#### Show Full Details
```bash
pnpm tsx scripts/list-r2-contents.ts --details
```
Shows size, last modified date, and ETag for each object.

#### Tree View
```bash
pnpm tsx scripts/list-r2-contents.ts --tree
```
Displays contents in a hierarchical tree structure with folders and files.

#### Count Statistics
```bash
pnpm tsx scripts/list-r2-contents.ts --count
```
Shows only statistics: total objects, total size, and breakdown by directory.

### 4. Export Options

#### Export to JSON
```bash
# Export all contents
pnpm tsx scripts/list-r2-contents.ts --json > r2-contents.json

# Export specific book
pnpm tsx scripts/list-r2-contents.ts --prefix "books/0x123/my-book/" --json > book-contents.json
```

### 5. Advanced Options

#### Limit Results
```bash
# List only first 100 objects
pnpm tsx scripts/list-r2-contents.ts --max 100

# List up to 5000 objects
pnpm tsx scripts/list-r2-contents.ts --max 5000
```

#### Combine Options
```bash
# Tree view of books with sizes
pnpm tsx scripts/list-r2-contents.ts --prefix books/ --tree --sizes

# Detailed listing of specific book
pnpm tsx scripts/list-r2-contents.ts --prefix "books/0x123/my-book/" --details

# Count statistics for stories
pnpm tsx scripts/list-r2-contents.ts --prefix stories/ --count
```

## R2 Bucket Structure

The StoryHouse R2 bucket is organized as follows:

```
storyhouse-content/
├── books/                          # New book format
│   ├── {authorAddress}/           # Author's wallet address
│   │   └── {slug}/                # Book slug
│   │       ├── metadata.json      # Book metadata
│   │       ├── cover.jpg          # Book cover image
│   │       └── chapters/          # Chapter content
│   │           ├── ch1/           
│   │           │   ├── content.json
│   │           │   └── metadata.json
│   │           └── ch2/
│   │               ├── content.json
│   │               └── metadata.json
├── stories/                        # Legacy story format
│   └── {storyId}/                 # Story ID
│       ├── metadata.json
│       └── chapters/
│           ├── 1.json
│           └── 2.json
└── images/                         # Uploaded images
    └── {hash}.{ext}
```

## Other R2 Management Scripts

### List Books Only
```bash
pnpm list-books
```
Lists all books in the R2 bucket (specialized for book format).

### Check Specific Book
```bash
pnpm tsx scripts/manage-book-r2.ts check "0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/the-detectives-portal-7"
```

### Delete Book (Use with Caution!)
```bash
pnpm tsx scripts/manage-book-r2.ts delete "0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/the-detectives-portal-7"
```
⚠️ **Warning**: This permanently deletes all files for the book!

### Check Book Cover
```bash
pnpm check-cover "0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/the-detectives-portal-7"
```

## API Endpoints

### Debug Endpoints (Development Only)

#### List Book Contents via API
```bash
curl "http://localhost:3002/api/debug/r2-list-book?bookId=0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/the-detectives-portal-7"
```

#### Check R2 Cover
```bash
curl "http://localhost:3002/api/debug/r2-cover-check?bookId=0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/the-detectives-portal-7"
```

## Environment Setup

Ensure your `.env.local` file contains the R2 credentials:

```env
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_BUCKET_NAME=storyhouse-content
R2_ENDPOINT=your_account_id.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://your_public_url
```

## Troubleshooting

### Common Issues

1. **Missing environment variables**
   - Ensure all R2_ variables are set in `.env.local`
   - Run `cp .env.testnet .env.local` to copy testnet config

2. **Access denied errors**
   - Check R2 credentials are correct
   - Verify bucket permissions in Cloudflare dashboard

3. **No objects found**
   - Check the prefix is correct (case-sensitive)
   - Verify objects exist in the R2 bucket

4. **Header encoding errors**
   - The script automatically cleans credentials
   - If issues persist, check for special characters in env vars

## Performance Tips

1. Use `--prefix` to filter results and reduce API calls
2. Use `--count` for quick statistics without listing all files
3. Use `--max` to limit results when exploring large buckets
4. Export to JSON for offline analysis of large datasets

## Security Notes

- Never commit `.env.local` files with R2 credentials
- Use read-only credentials when possible
- Be careful with delete operations - they are permanent
- Debug endpoints should be disabled in production