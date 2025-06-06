#!/bin/bash

# Setup script for Cursor Configuration Sync
# This script helps you integrate the cursor sync functionality

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SYNC_SCRIPT="$SCRIPT_DIR/sync-cursor-config.sh"

echo "🚀 Setting up Cursor Configuration Sync"
echo "======================================="

# Check if sync script exists
if [ ! -f "$SYNC_SCRIPT" ]; then
    echo "❌ Sync script not found: $SYNC_SCRIPT"
    exit 1
fi

echo "✅ Found sync script: $SYNC_SCRIPT"

# Function to add cursor sync to shell profile
setup_shell_integration() {
    local shell_profile=""

    # Detect shell and set appropriate profile file
    case "$SHELL" in
        */zsh)
            shell_profile="$HOME/.zshrc"
            ;;
        */bash)
            shell_profile="$HOME/.bashrc"
            ;;
        *)
            echo "⚠️  Unsupported shell: $SHELL"
            echo "Please manually add the sync function to your shell profile"
            return 1
            ;;
    esac

    echo "🐚 Detected shell profile: $shell_profile"

    # Check if function already exists
    if grep -q "cursor-sync" "$shell_profile" 2>/dev/null; then
        echo "ℹ️  Cursor sync function already exists in $shell_profile"
        return 0
    fi

    # Add function to shell profile
    cat >> "$shell_profile" << 'EOF'

# Cursor Configuration Sync
cursor-sync() {
    "/Users/bo/Repos/andybowu/vibe-coding/.cursor/sync-cursor-config.sh"
}

# Auto-sync on directory change (optional)
cursor-auto-sync() {
    if command -v cursor-sync >/dev/null 2>&1; then
        cursor-sync
    fi
}

# Uncomment the next line to enable auto-sync when changing directories
# alias cd='cursor-auto-sync; cd'

EOF

    echo "✅ Added cursor-sync function to $shell_profile"
    echo ""
    echo "📝 Available commands after restarting your shell:"
    echo "   cursor-sync          - Manually sync cursor configuration"
    echo "   cursor-auto-sync     - Run sync with minimal output"
    echo ""
    echo "💡 To enable automatic syncing when changing directories,"
    echo "   uncomment the last line in the added section in $shell_profile"
}

# Function to create a launcher script in PATH
setup_global_command() {
    local bin_dir="$HOME/.local/bin"
    local launcher="$bin_dir/cursor-sync"

    # Create bin directory if it doesn't exist
    mkdir -p "$bin_dir"

    # Create launcher script
    cat > "$launcher" << EOF
#!/bin/bash
exec "$SYNC_SCRIPT" "\$@"
EOF

    chmod +x "$launcher"

    echo "✅ Created global command: $launcher"
    echo "💡 Make sure $bin_dir is in your PATH"
}

# Function to create VS Code / Cursor task
setup_vscode_task() {
    local vscode_dir=".vscode"
    local cursor_dir=".cursor"

    # Check if we should create in .vscode or .cursor
    if [ -d "$cursor_dir" ]; then
        local task_dir="$cursor_dir"
    else
        local task_dir="$vscode_dir"
        mkdir -p "$task_dir"
    fi

    local tasks_file="$task_dir/tasks.json"

    # Create or update tasks.json
    if [ ! -f "$tasks_file" ]; then
        cat > "$tasks_file" << 'EOF'
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "Sync Cursor Config",
            "type": "shell",
            "command": "/Users/bo/Repos/andybowu/vibe-coding/.cursor/sync-cursor-config.sh",
            "group": "build",
            "presentation": {
                "echo": true,
                "reveal": "always",
                "focus": false,
                "panel": "shared"
            },
            "problemMatcher": []
        }
    ]
}
EOF
        echo "✅ Created tasks.json with cursor sync task"
    else
        echo "ℹ️  tasks.json already exists. Please manually add the sync task if needed."
    fi
}

# Main setup menu
main() {
    echo ""
    echo "Choose setup options:"
    echo "1) Add shell integration (recommended)"
    echo "2) Create global command"
    echo "3) Setup VS Code/Cursor task"
    echo "4) All of the above"
    echo "5) Test sync script"
    echo "6) Exit"
    echo ""

    read -p "Select option (1-6): " choice

    case $choice in
        1)
            setup_shell_integration
            ;;
        2)
            setup_global_command
            ;;
        3)
            setup_vscode_task
            ;;
        4)
            setup_shell_integration
            setup_global_command
            setup_vscode_task
            ;;
        5)
            echo "🧪 Testing sync script..."
            "$SYNC_SCRIPT"
            ;;
        6)
            echo "👋 Goodbye!"
            exit 0
            ;;
        *)
            echo "❌ Invalid option"
            main
            ;;
    esac

    echo ""
    echo "🎉 Setup complete!"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Restart your shell or run: source ~/.zshrc"
    echo "   2. Navigate to any repository (not vibe-coding)"
    echo "   3. Run: cursor-sync"
    echo ""
    echo "💡 Tips:"
    echo "   - The script will only sync if changes are detected in the source"
    echo "   - A backup of the existing .cursor folder will be created"
    echo "   - The script automatically detects repository names to avoid self-sync"
}

# Run main function
main "$@"
