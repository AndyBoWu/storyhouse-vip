#!/usr/bin/env tsx
/**
 * Script to list all contents of the R2 bucket with various filtering and display options
 * 
 * Usage:
 *   List all contents: pnpm tsx scripts/list-r2-contents.ts
 *   List with prefix: pnpm tsx scripts/list-r2-contents.ts --prefix books/
 *   List specific book: pnpm tsx scripts/list-r2-contents.ts --prefix "books/0x123/my-book/"
 *   Show file sizes: pnpm tsx scripts/list-r2-contents.ts --sizes
 *   Show full details: pnpm tsx scripts/list-r2-contents.ts --details
 *   Export to JSON: pnpm tsx scripts/list-r2-contents.ts --json
 *   Count only: pnpm tsx scripts/list-r2-contents.ts --count
 *   Tree view: pnpm tsx scripts/list-r2-contents.ts --tree
 * 
 * Options:
 *   --prefix <path>  - Filter by prefix (e.g., "books/", "stories/")
 *   --sizes         - Show file sizes in human-readable format
 *   --details       - Show full details (size, last modified, etag)
 *   --json          - Export results as JSON
 *   --count         - Show count statistics only
 *   --tree          - Display in tree structure
 *   --max <number>  - Maximum number of items to list (default: 1000)
 */

import { S3Client, ListObjectsV2Command, ListObjectsV2CommandOutput } from '@aws-sdk/client-s3'
import { config } from 'dotenv'
import path from 'path'
import { readFileSync } from 'fs'

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env.local') })
config({ path: path.resolve(process.cwd(), '.env') })

// Parse command line arguments
const args = process.argv.slice(2)
const options = {
  prefix: '',
  showSizes: false,
  showDetails: false,
  exportJson: false,
  countOnly: false,
  treeView: false,
  maxKeys: 1000,
}

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--prefix':
      options.prefix = args[++i] || ''
      break
    case '--sizes':
      options.showSizes = true
      break
    case '--details':
      options.showDetails = true
      break
    case '--json':
      options.exportJson = true
      break
    case '--count':
      options.countOnly = true
      break
    case '--tree':
      options.treeView = true
      break
    case '--max':
      options.maxKeys = parseInt(args[++i]) || 1000
      break
  }
}

// Initialize R2 client
function initializeR2Client(): S3Client {
  const requiredEnvVars = ['R2_ENDPOINT', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME']
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required R2 environment variables: ${missingVars.join(', ')}`)
  }

  const cleanAccessKeyId = (process.env.R2_ACCESS_KEY_ID || '').replace(/[^a-zA-Z0-9]/g, '')
  const cleanSecretAccessKey = (process.env.R2_SECRET_ACCESS_KEY || '').replace(/[^a-zA-Z0-9]/g, '')
  const cleanEndpoint = (process.env.R2_ENDPOINT || '').replace(/[^a-zA-Z0-9.-]/g, '')

  return new S3Client({
    region: 'auto',
    endpoint: `https://${cleanEndpoint}`,
    credentials: {
      accessKeyId: cleanAccessKeyId,
      secretAccessKey: cleanSecretAccessKey,
    },
    forcePathStyle: false,
  })
}

const BUCKET_NAME = (process.env.R2_BUCKET_NAME || '').trim().replace(/^["']|["']$/g, '').replace(/[\r\n]/g, '')

// Format bytes to human-readable size
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Build tree structure from flat list
interface TreeNode {
  name: string
  type: 'file' | 'directory'
  size?: number
  lastModified?: Date
  children?: Map<string, TreeNode>
}

function buildTree(objects: Array<{Key?: string, Size?: number, LastModified?: Date}>): TreeNode {
  const root: TreeNode = { name: '/', type: 'directory', children: new Map() }
  
  for (const obj of objects) {
    if (!obj.Key) continue
    
    const parts = obj.Key.split('/')
    let current = root
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const isLast = i === parts.length - 1
      
      if (!current.children) {
        current.children = new Map()
      }
      
      if (!current.children.has(part)) {
        current.children.set(part, {
          name: part,
          type: isLast ? 'file' : 'directory',
          size: isLast ? obj.Size : undefined,
          lastModified: isLast ? obj.LastModified : undefined,
          children: isLast ? undefined : new Map()
        })
      }
      
      current = current.children.get(part)!
    }
  }
  
  return root
}

// Print tree structure
function printTree(node: TreeNode, prefix = '', isLast = true, depth = 0): void {
  if (depth > 0) { // Skip printing root
    const connector = isLast ? '└── ' : '├── '
    const icon = node.type === 'directory' ? '📁' : '📄'
    let line = prefix + connector + icon + ' ' + node.name
    
    if (options.showSizes && node.size !== undefined) {
      line += ` (${formatBytes(node.size)})`
    }
    
    console.log(line)
  }
  
  if (node.children) {
    const children = Array.from(node.children.values())
    children.forEach((child, index) => {
      const extension = depth > 0 ? (isLast ? '    ' : '│   ') : ''
      const newPrefix = prefix + extension
      printTree(child, newPrefix, index === children.length - 1, depth + 1)
    })
  }
}

// Main function to list R2 contents
async function listR2Contents() {
  const client = initializeR2Client()
  
  if (!options.exportJson && !options.countOnly) {
    console.log('🗂️  R2 Bucket Contents Listing')
    console.log('================================')
    console.log(`📦 Bucket: ${BUCKET_NAME}`)
    if (options.prefix) {
      console.log(`🔍 Prefix: ${options.prefix}`)
    }
    console.log('')
  }
  
  try {
    let continuationToken: string | undefined
    let allObjects: Array<{Key?: string, Size?: number, LastModified?: Date, ETag?: string}> = []
    let totalSize = 0
    let objectCount = 0
    
    // Paginate through all results
    do {
      const command = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: options.prefix,
        MaxKeys: Math.min(options.maxKeys - allObjects.length, 1000),
        ContinuationToken: continuationToken,
      })
      
      const response: ListObjectsV2CommandOutput = await client.send(command)
      
      if (response.Contents) {
        allObjects = allObjects.concat(response.Contents)
        objectCount += response.Contents.length
        totalSize += response.Contents.reduce((sum, obj) => sum + (obj.Size || 0), 0)
      }
      
      continuationToken = response.NextContinuationToken
      
      // Stop if we've reached the max
      if (allObjects.length >= options.maxKeys) {
        break
      }
    } while (continuationToken)
    
    // Sort objects by key
    allObjects.sort((a, b) => (a.Key || '').localeCompare(b.Key || ''))
    
    if (options.exportJson) {
      // Export as JSON
      const output = {
        bucket: BUCKET_NAME,
        prefix: options.prefix,
        totalObjects: objectCount,
        totalSize: totalSize,
        objects: allObjects.map(obj => ({
          key: obj.Key,
          size: obj.Size,
          lastModified: obj.LastModified,
          etag: obj.ETag,
        }))
      }
      console.log(JSON.stringify(output, null, 2))
    } else if (options.countOnly) {
      // Show count statistics
      console.log('📊 R2 Bucket Statistics')
      console.log('======================')
      console.log(`📦 Bucket: ${BUCKET_NAME}`)
      if (options.prefix) {
        console.log(`🔍 Prefix: ${options.prefix}`)
      }
      console.log(`📄 Total Objects: ${objectCount}`)
      console.log(`💾 Total Size: ${formatBytes(totalSize)}`)
      
      // Group by top-level directory
      const prefixCounts: Map<string, {count: number, size: number}> = new Map()
      for (const obj of allObjects) {
        if (obj.Key) {
          const topLevel = obj.Key.split('/')[0]
          const current = prefixCounts.get(topLevel) || {count: 0, size: 0}
          current.count++
          current.size += obj.Size || 0
          prefixCounts.set(topLevel, current)
        }
      }
      
      if (prefixCounts.size > 0) {
        console.log('\n📁 By Directory:')
        const sortedPrefixes = Array.from(prefixCounts.entries()).sort((a, b) => b[1].size - a[1].size)
        for (const [prefix, stats] of sortedPrefixes) {
          console.log(`   ${prefix}/: ${stats.count} objects, ${formatBytes(stats.size)}`)
        }
      }
    } else if (options.treeView) {
      // Display as tree
      const tree = buildTree(allObjects)
      printTree(tree)
      console.log(`\n📊 Total: ${objectCount} objects, ${formatBytes(totalSize)}`)
    } else {
      // Regular listing
      for (const obj of allObjects) {
        if (obj.Key) {
          let line = obj.Key
          
          if (options.showDetails) {
            line += `\n  Size: ${formatBytes(obj.Size || 0)}`
            line += `\n  Modified: ${obj.LastModified?.toISOString() || 'Unknown'}`
            line += `\n  ETag: ${obj.ETag || 'Unknown'}`
            line += '\n'
          } else if (options.showSizes) {
            line += ` (${formatBytes(obj.Size || 0)})`
          }
          
          console.log(line)
        }
      }
      
      console.log(`\n📊 Total: ${objectCount} objects, ${formatBytes(totalSize)}`)
      
      if (allObjects.length >= options.maxKeys) {
        console.log(`⚠️  Listing limited to ${options.maxKeys} objects. Use --max to increase.`)
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to list R2 contents:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message)
      if (error.stack) {
        console.error('Stack trace:', error.stack)
      }
    }
    process.exit(1)
  }
}

// Show help if requested
if (args.includes('--help') || args.includes('-h')) {
  console.log(`R2 Bucket Contents Listing Tool

Usage:
  pnpm tsx scripts/list-r2-contents.ts [options]

Options:
  --prefix <path>  Filter by prefix (e.g., "books/", "stories/")
  --sizes         Show file sizes in human-readable format
  --details       Show full details (size, last modified, etag)
  --json          Export results as JSON
  --count         Show count statistics only
  --tree          Display in tree structure
  --max <number>  Maximum number of items to list (default: 1000)
  --help, -h      Show this help message

Examples:
  # List all contents
  pnpm tsx scripts/list-r2-contents.ts

  # List all books with sizes
  pnpm tsx scripts/list-r2-contents.ts --prefix books/ --sizes

  # Show statistics for a specific book
  pnpm tsx scripts/list-r2-contents.ts --prefix "books/0x123/my-book/" --count

  # Export all contents to JSON
  pnpm tsx scripts/list-r2-contents.ts --json > r2-contents.json

  # Show tree view of books
  pnpm tsx scripts/list-r2-contents.ts --prefix books/ --tree
`)
  process.exit(0)
}

// Run the listing
listR2Contents().catch(console.error)