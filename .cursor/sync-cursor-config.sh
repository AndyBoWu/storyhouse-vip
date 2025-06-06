#!/bin/bash

# Cursor Configuration Sync Script
# This script syncs .cursor folder from vibe-coding repo to other repositories

# Source .cursor folder (your master configuration)
SOURCE_CURSOR_DIR="/Users/bo/Repos/andybowu/vibe-coding/.cursor"

# Function to get current git repository name
get_repo_name() {
    if git rev-parse --git-dir > /dev/null 2>&1; then
        basename "$(git rev-parse --show-toplevel)"
    else
        echo "not-a-git-repo"
    fi
}

# Function to check if there are changes in source .cursor directory
check_source_changes() {
    if [ ! -d "$SOURCE_CURSOR_DIR" ]; then
        echo "❌ Source .cursor directory not found: $SOURCE_CURSOR_DIR"
        return 1
    fi

    cd "$SOURCE_CURSOR_DIR"

    # Check if there are any changes (uncommitted or recently committed)
    if ! git diff --quiet HEAD~1 2>/dev/null; then
        return 0  # Changes detected
    fi

    # Also check if working directory has changes
    if ! git diff --quiet 2>/dev/null; then
        return 0  # Changes detected
    fi

    return 1  # No changes
}

# Function to sync .cursor folder
sync_cursor_folder() {
    local current_dir="$(pwd)"
    local current_repo_name="$(get_repo_name)"

    echo "🔍 Current repository: $current_repo_name"
    echo "📁 Current directory: $current_dir"

    # Skip if we're already in vibe-coding repository
    if [ "$current_repo_name" = "vibe-coding" ]; then
        echo "✅ Already in vibe-coding repository, no sync needed"
        return 0
    fi

    # Check if source has changes
    echo "🔄 Checking for changes in source .cursor directory..."
    if ! check_source_changes; then
        echo "ℹ️  No recent changes detected in source .cursor directory"
        return 0
    fi

    echo "✨ Changes detected in source .cursor directory"

    # Find current .cursor directory (could be in current dir or parent dirs)
    local target_cursor_dir=""
    local search_dir="$current_dir"

    while [ "$search_dir" != "/" ]; do
        if [ -d "$search_dir/.cursor" ]; then
            target_cursor_dir="$search_dir/.cursor"
            break
        fi
        search_dir="$(dirname "$search_dir")"
    done

    if [ -z "$target_cursor_dir" ]; then
        echo "❌ No .cursor directory found in current repository"
        return 1
    fi

    echo "🎯 Target .cursor directory: $target_cursor_dir"

    # Create backup if target .cursor exists
    if [ -d "$target_cursor_dir" ]; then
        local backup_dir="${target_cursor_dir}.backup.$(date +%Y%m%d_%H%M%S)"
        echo "💾 Creating backup: $backup_dir"
        cp -r "$target_cursor_dir" "$backup_dir"
    fi

    # Sync the folders
    echo "🔄 Syncing .cursor configuration..."
    rsync -av --delete "$SOURCE_CURSOR_DIR/" "$target_cursor_dir/"

    if [ $? -eq 0 ]; then
        echo "✅ Successfully synced .cursor configuration"
        echo "📂 From: $SOURCE_CURSOR_DIR"
        echo "📂 To: $target_cursor_dir"
    else
        echo "❌ Failed to sync .cursor configuration"
        return 1
    fi
}

# Main execution
main() {
    echo "🚀 Cursor Configuration Sync Tool"
    echo "=================================="

    sync_cursor_folder
}

# Run the main function if script is executed directly
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi
