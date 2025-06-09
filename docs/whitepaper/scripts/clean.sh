#!/bin/bash

# clean.sh - Clean temporary LaTeX files for StoryHouse.vip whitepaper
# Usage: ./scripts/clean.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧹 Cleaning LaTeX temporary files...${NC}"

# Remove temporary files from output directory
OUTPUT_DIR="output"

if [ -d "$OUTPUT_DIR" ]; then
    echo -e "${YELLOW}Removing auxiliary files from $OUTPUT_DIR...${NC}"
    
    rm -f "$OUTPUT_DIR"/*.aux
    rm -f "$OUTPUT_DIR"/*.log
    rm -f "$OUTPUT_DIR"/*.toc
    rm -f "$OUTPUT_DIR"/*.out
    rm -f "$OUTPUT_DIR"/*.fls
    rm -f "$OUTPUT_DIR"/*.fdb_latexmk
    rm -f "$OUTPUT_DIR"/*.synctex.gz
    rm -f "$OUTPUT_DIR"/*.bbl
    rm -f "$OUTPUT_DIR"/*.blg
    rm -f "$OUTPUT_DIR"/*.bcf
    rm -f "$OUTPUT_DIR"/*.run.xml
    rm -f "$OUTPUT_DIR"/*.idx
    rm -f "$OUTPUT_DIR"/*.ilg
    rm -f "$OUTPUT_DIR"/*.ind
    rm -f "$OUTPUT_DIR"/*.lof
    rm -f "$OUTPUT_DIR"/*.lot
    rm -f "$OUTPUT_DIR"/*.nav
    rm -f "$OUTPUT_DIR"/*.snm
    rm -f "$OUTPUT_DIR"/*.vrb
    rm -f "$OUTPUT_DIR"/*.figlist
    rm -f "$OUTPUT_DIR"/*.makefile
    rm -f "$OUTPUT_DIR"/*.fls
    rm -f "$OUTPUT_DIR"/*.fdb_latexmk
    
    echo -e "${GREEN}✅ Auxiliary files cleaned${NC}"
else
    echo -e "${YELLOW}No output directory found, nothing to clean${NC}"
fi

# Remove temporary files from source directory
SOURCE_DIR="src"

if [ -d "$SOURCE_DIR" ]; then
    echo -e "${YELLOW}Removing auxiliary files from $SOURCE_DIR...${NC}"
    
    find "$SOURCE_DIR" -name "*.aux" -delete
    find "$SOURCE_DIR" -name "*.log" -delete
    find "$SOURCE_DIR" -name "*.toc" -delete
    find "$SOURCE_DIR" -name "*.out" -delete
    find "$SOURCE_DIR" -name "*.fls" -delete
    find "$SOURCE_DIR" -name "*.fdb_latexmk" -delete
    find "$SOURCE_DIR" -name "*.synctex.gz" -delete
    find "$SOURCE_DIR" -name "*.bbl" -delete
    find "$SOURCE_DIR" -name "*.blg" -delete
    find "$SOURCE_DIR" -name "*.bcf" -delete
    find "$SOURCE_DIR" -name "*.run.xml" -delete
    
    echo -e "${GREEN}✅ Source directory cleaned${NC}"
fi

# Optional: Remove all PDFs (uncomment if you want to clean everything)
# echo -e "${YELLOW}Removing generated PDFs...${NC}"
# rm -f "$OUTPUT_DIR"/*.pdf
# echo -e "${GREEN}✅ PDFs removed${NC}"

echo -e "${GREEN}🎉 Cleanup complete!${NC}"