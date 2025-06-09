#!/bin/bash

# watch.sh - Watch for changes and auto-rebuild StoryHouse.vip whitepaper
# Usage: ./scripts/watch.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}👀 Watching for changes in LaTeX files...${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop watching${NC}"

# Check if fswatch is available (macOS)
if command -v fswatch &> /dev/null; then
    echo -e "${GREEN}Using fswatch for file monitoring${NC}"
    
    # Watch src directory for changes
    fswatch -o src/ | while read f; do
        echo -e "${YELLOW}📝 Changes detected, rebuilding...${NC}"
        ./scripts/build.sh
        echo -e "${GREEN}✅ Rebuild complete, watching for more changes...${NC}"
    done

# Check if inotifywait is available (Linux)
elif command -v inotifywait &> /dev/null; then
    echo -e "${GREEN}Using inotifywait for file monitoring${NC}"
    
    while true; do
        inotifywait -r -e modify,create,delete src/
        echo -e "${YELLOW}📝 Changes detected, rebuilding...${NC}"
        ./scripts/build.sh
        echo -e "${GREEN}✅ Rebuild complete, watching for more changes...${NC}"
    done

else
    echo -e "${RED}❌ No file watcher found. Please install fswatch (macOS) or inotify-tools (Linux)${NC}"
    echo -e "${YELLOW}MacOS: brew install fswatch${NC}"
    echo -e "${YELLOW}Ubuntu: sudo apt-get install inotify-tools${NC}"
    echo -e "${BLUE}Falling back to manual polling every 5 seconds...${NC}"
    
    # Fallback: manual polling
    LAST_MODIFIED=""
    
    while true; do
        # Get the most recent modification time of any .tex file
        CURRENT_MODIFIED=$(find src/ -name "*.tex" -exec stat -f %m {} \; 2>/dev/null | sort -n | tail -1)
        
        if [ "$CURRENT_MODIFIED" != "$LAST_MODIFIED" ]; then
            if [ -n "$LAST_MODIFIED" ]; then
                echo -e "${YELLOW}📝 Changes detected, rebuilding...${NC}"
                ./scripts/build.sh
                echo -e "${GREEN}✅ Rebuild complete, watching for more changes...${NC}"
            fi
            LAST_MODIFIED="$CURRENT_MODIFIED"
        fi
        
        sleep 5
    done
fi