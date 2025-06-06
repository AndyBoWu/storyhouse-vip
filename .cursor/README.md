# Cursor Configuration Sync

This system automatically syncs your Cursor configuration from the `vibe-coding` repository to other repositories, ensuring consistent settings across all your projects.

## How It Works

The system consists of two main scripts:

1. **`sync-cursor-config.sh`** - The main sync script that:

   - Detects if you're in a repository other than `vibe-coding`
   - Checks for recent changes in the source `.cursor` directory
   - Syncs the configuration if changes are detected
   - Creates backups of existing configurations

2. **`setup-cursor-sync.sh`** - The setup script that helps you integrate the sync functionality into your workflow

## Quick Start

1. **Run the setup script:**

   ```bash
   ./setup-cursor-sync.sh
   ```

2. **Choose option 1 or 4** to add shell integration (recommended)

3. **Restart your shell or reload your profile:**

   ```bash
   source ~/.zshrc
   ```

4. **Navigate to any repository (except vibe-coding) and run:**
   ```bash
   cursor-sync
   ```

## Setup Options

### Option 1: Shell Integration (Recommended)

Adds a `cursor-sync` function to your shell profile that you can run manually:

```bash
cursor-sync
```

### Option 2: Global Command

Creates a globally accessible command in `~/.local/bin/cursor-sync`

### Option 3: VS Code/Cursor Task

Adds a task to your `.cursor/tasks.json` that you can run from the Command Palette:

- `Cmd+Shift+P` → "Tasks: Run Task" → "Sync Cursor Config"

### Option 4: All of the Above

Sets up all integration methods for maximum flexibility

## Automatic Sync Options

### On Directory Change

If you want automatic syncing when changing directories, uncomment this line in your shell profile:

```bash
# alias cd='cursor-auto-sync; cd'
```

### Manual Trigger

You can always run the sync manually:

- Command line: `cursor-sync`
- VS Code/Cursor: Run the "Sync Cursor Config" task
- Direct execution: `./sync-cursor-config.sh`

## Features

- ✅ **Smart Detection**: Only syncs when changes are detected in source
- ✅ **Repository Aware**: Automatically skips sync in vibe-coding repository
- ✅ **Backup Creation**: Creates timestamped backups of existing configurations
- ✅ **Cross-Platform**: Works on macOS, Linux, and WSL
- ✅ **Safe**: Uses `rsync` for reliable file synchronization
- ✅ **Logging**: Provides clear feedback about what's happening

## File Structure

```
.cursor/
├── sync-cursor-config.sh    # Main sync script
├── setup-cursor-sync.sh     # Setup and configuration script
├── README.md               # This documentation
└── rules/                  # Your cursor rules and configuration
```

## Troubleshooting

### Script Not Found

Make sure you're running the script from the correct directory or that the global command is properly installed.

### Permission Denied

Ensure the scripts are executable:

```bash
chmod +x sync-cursor-config.sh setup-cursor-sync.sh
```

### No Changes Detected

The script only syncs when it detects changes in the source `.cursor` directory. If no changes are found, it will skip the sync.

### Path Issues

If the global command doesn't work, make sure `~/.local/bin` is in your PATH:

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

## Customization

You can modify the sync behavior by editing `sync-cursor-config.sh`:

- **Change source directory**: Modify `SOURCE_CURSOR_DIR` variable
- **Adjust change detection**: Modify the `check_source_changes()` function
- **Customize sync options**: Modify the `rsync` command options

## Limitations

- Currently designed for the specific path structure mentioned
- Requires git repositories for repository name detection
- Only works with the predefined source directory

## Security Note

This script performs file system operations and should be reviewed before use. It creates backups and uses `rsync --delete` which removes files in the target that don't exist in the source.
