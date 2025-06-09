#!/bin/bash

# build.sh - LaTeX compilation script for StoryHouse.vip whitepaper
# Usage: ./scripts/build.sh

set -e  # Exit on any error

# Configuration
SOURCE_DIR="src"
OUTPUT_DIR="output"
MAIN_FILE="main.tex"
OUTPUT_FILE="STORYHOUSE_WHITEPAPER.pdf"
LIGHT_OUTPUT_FILE="STORYHOUSE_WHITEPAPER_LIGHT.pdf"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔨 Building StoryHouse.vip Whitepaper...${NC}"

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR/versions"

# Check if LaTeX is installed
if ! command -v pdflatex &> /dev/null; then
    echo -e "${RED}❌ Error: pdflatex not found. Please install LaTeX distribution.${NC}"
    echo -e "${YELLOW}MacOS: brew install --cask mactex${NC}"
    echo -e "${YELLOW}Ubuntu: sudo apt-get install texlive-full${NC}"
    exit 1
fi

# Navigate to source directory
cd "$SOURCE_DIR"

echo -e "${YELLOW}📝 Running first LaTeX compilation...${NC}"
# First compilation
pdflatex -interaction=nonstopmode -output-directory="../$OUTPUT_DIR" "$MAIN_FILE" > /dev/null 2>&1 || {
    echo -e "${RED}❌ First LaTeX compilation failed. Check log file for details.${NC}"
    cat "../$OUTPUT_DIR/main.log" | tail -20
    exit 1
}

echo -e "${YELLOW}📝 Running second LaTeX compilation (for cross-references)...${NC}"
# Second compilation for cross-references and table of contents
pdflatex -interaction=nonstopmode -output-directory="../$OUTPUT_DIR" "$MAIN_FILE" > /dev/null 2>&1 || {
    echo -e "${RED}❌ Second LaTeX compilation failed. Check log file for details.${NC}"
    cat "../$OUTPUT_DIR/main.log" | tail -20
    exit 1
}

# If using bibliography, uncomment these lines:
# echo -e "${YELLOW}📚 Processing bibliography...${NC}"
# biber "../$OUTPUT_DIR/main" > /dev/null 2>&1 || echo "No bibliography found, skipping..."
# pdflatex -interaction=nonstopmode -output-directory="../$OUTPUT_DIR" "$MAIN_FILE" > /dev/null 2>&1 || {
#     echo -e "${RED}❌ Final LaTeX compilation failed. Check log file for details.${NC}"
#     exit 1
# }

# Move and rename output file
cd ..
mv "$OUTPUT_DIR/main.pdf" "$OUTPUT_DIR/$OUTPUT_FILE"

# Create a light version without appendices (if needed)
# This would require a separate main-light.tex file or conditional compilation
# cp "$OUTPUT_DIR/$OUTPUT_FILE" "$OUTPUT_DIR/$LIGHT_OUTPUT_FILE"

# Create versioned copy
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
cp "$OUTPUT_DIR/$OUTPUT_FILE" "$OUTPUT_DIR/versions/${OUTPUT_FILE%.pdf}_v${TIMESTAMP}.pdf"

# Clean up auxiliary files
echo -e "${YELLOW}🧹 Cleaning up auxiliary files...${NC}"
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

# Success message
echo -e "${GREEN}✅ Whitepaper compilation successful!${NC}"
echo -e "${BLUE}📄 Output: $OUTPUT_DIR/$OUTPUT_FILE${NC}"

# Display file size and page count
if command -v pdfinfo &> /dev/null; then
    PAGES=$(pdfinfo "$OUTPUT_DIR/$OUTPUT_FILE" | grep "Pages:" | awk '{print $2}')
    SIZE=$(ls -lh "$OUTPUT_DIR/$OUTPUT_FILE" | awk '{print $5}')
    echo -e "${BLUE}📊 Document: $PAGES pages, $SIZE${NC}"
fi

# Open PDF if on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo -e "${YELLOW}🔍 Opening PDF...${NC}"
    open "$OUTPUT_DIR/$OUTPUT_FILE"
fi

echo -e "${GREEN}🎉 Build complete!${NC}"