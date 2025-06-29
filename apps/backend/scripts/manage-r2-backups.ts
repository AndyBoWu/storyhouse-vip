#!/usr/bin/env -S npx tsx
import { R2Service } from '../lib/r2';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') });

interface BackupCommand {
  action: 'create' | 'restore' | 'list' | 'cleanup';
  sourceKey?: string;
  targetKey?: string;
  daysToKeep?: number;
}

async function createBackup(sourceKey: string): Promise<void> {
  try {
    console.log(`📦 Creating backup for: ${sourceKey}`);
    const backupKey = await R2Service.createBackup(sourceKey);
    console.log(`✅ Backup created: ${backupKey}`);
  } catch (error) {
    console.error(`❌ Failed to create backup: ${error}`);
    process.exit(1);
  }
}

async function restoreBackup(backupKey: string, targetKey: string): Promise<void> {
  try {
    console.log(`🔄 Restoring backup: ${backupKey} -> ${targetKey}`);
    await R2Service.restoreFromBackup(backupKey, targetKey);
    console.log(`✅ Restore completed successfully`);
  } catch (error) {
    console.error(`❌ Failed to restore backup: ${error}`);
    process.exit(1);
  }
}

async function listBackups(prefix?: string): Promise<void> {
  try {
    console.log(`📋 Listing backups${prefix ? ` for prefix: ${prefix}` : ''}...`);
    const backups = await R2Service.listBackups(prefix);
    
    if (backups.length === 0) {
      console.log('No backups found');
      return;
    }
    
    console.log(`\nFound ${backups.length} backups:\n`);
    
    for (const backup of backups) {
      const sizeKB = (backup.size / 1024).toFixed(2);
      const date = backup.lastModified.toISOString();
      console.log(`📄 ${backup.key}`);
      console.log(`   Size: ${sizeKB} KB`);
      console.log(`   Modified: ${date}`);
      console.log('');
    }
  } catch (error) {
    console.error(`❌ Failed to list backups: ${error}`);
    process.exit(1);
  }
}

async function cleanupBackups(daysToKeep: number): Promise<void> {
  try {
    console.log(`🧹 Cleaning up backups older than ${daysToKeep} days...`);
    const deleted = await R2Service.cleanupOldBackups(daysToKeep);
    console.log(`✅ Cleanup complete: deleted ${deleted} backups`);
  } catch (error) {
    console.error(`❌ Failed to cleanup backups: ${error}`);
    process.exit(1);
  }
}

function printUsage(): void {
  console.log(`
R2 Backup Management Tool

Usage:
  npm run backup:create <source-key>                    Create backup of a file/folder
  npm run backup:restore <backup-key> <target-key>      Restore from backup
  npm run backup:list [prefix]                          List all backups
  npm run backup:cleanup [days-to-keep]                 Clean up old backups (default: 30 days)

Examples:
  # Create backup of a book
  npm run backup:create "books/0x123/my-book/"
  
  # Restore a specific backup
  npm run backup:restore "backups/2024-12-15T10-30-00-000Z/books/0x123/my-book/" "books/0x123/my-book/"
  
  # List all backups
  npm run backup:list
  
  # List backups for specific book
  npm run backup:list "books/0x123"
  
  # Clean up backups older than 7 days
  npm run backup:cleanup 7
`);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    printUsage();
    process.exit(0);
  }
  
  const action = args[0];
  
  switch (action) {
    case 'create':
      if (!args[1]) {
        console.error('❌ Source key required for create action');
        printUsage();
        process.exit(1);
      }
      await createBackup(args[1]);
      break;
      
    case 'restore':
      if (!args[1] || !args[2]) {
        console.error('❌ Backup key and target key required for restore action');
        printUsage();
        process.exit(1);
      }
      await restoreBackup(args[1], args[2]);
      break;
      
    case 'list':
      await listBackups(args[1]);
      break;
      
    case 'cleanup':
      const days = args[1] ? parseInt(args[1]) : 30;
      if (isNaN(days) || days < 1) {
        console.error('❌ Days must be a positive number');
        process.exit(1);
      }
      await cleanupBackups(days);
      break;
      
    default:
      console.error(`❌ Unknown action: ${action}`);
      printUsage();
      process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});