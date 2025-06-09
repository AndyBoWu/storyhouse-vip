#!/bin/bash

# build-bilingual.sh - Build both English and Chinese versions of StoryHouse.vip whitepaper
# Usage: ./scripts/build-bilingual.sh

set -e  # Exit on any error

# Configuration
SOURCE_DIR="src"
OUTPUT_DIR="output"
EN_MAIN_FILE="main-en.tex"
CN_MAIN_FILE="main-cn.tex"
EN_OUTPUT_FILE="STORYHOUSE_WHITEPAPER_EN.pdf"
CN_OUTPUT_FILE="STORYHOUSE_WHITEPAPER_CN.pdf"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔨 Building StoryHouse.vip Bilingual Whitepaper...${NC}"

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

# Check if XeLaTeX is available for Chinese support
if ! command -v xelatex &> /dev/null; then
    echo -e "${YELLOW}⚠️  Warning: xelatex not found. Chinese version may not compile properly.${NC}"
    echo -e "${YELLOW}Attempting to use pdflatex for both versions...${NC}"
fi

# Navigate to source directory
cd "$SOURCE_DIR"

# Build English version
echo -e "${BLUE}📄 Building English version...${NC}"
echo -e "${YELLOW}📝 Running first LaTeX compilation (English)...${NC}"

pdflatex -interaction=nonstopmode -output-directory="../$OUTPUT_DIR" "$EN_MAIN_FILE" > /dev/null 2>&1 || {
    echo -e "${RED}❌ English first compilation failed. Check log file for details.${NC}"
    cat "../$OUTPUT_DIR/main-en.log" | tail -20
    exit 1
}

echo -e "${YELLOW}📝 Running second LaTeX compilation (English)...${NC}"
pdflatex -interaction=nonstopmode -output-directory="../$OUTPUT_DIR" "$EN_MAIN_FILE" > /dev/null 2>&1 || {
    echo -e "${RED}❌ English second compilation failed. Check log file for details.${NC}"
    cat "../$OUTPUT_DIR/main-en.log" | tail -20
    exit 1
}

# Move and rename English output
cd ..
mv "$OUTPUT_DIR/main-en.pdf" "$OUTPUT_DIR/$EN_OUTPUT_FILE"

echo -e "${GREEN}✅ English version compiled successfully!${NC}"

# Build Chinese version
echo -e "${BLUE}📄 Building Chinese version...${NC}"
cd "$SOURCE_DIR"

# Try XeLaTeX first for better Chinese support, fallback to pdflatex
if command -v xelatex &> /dev/null; then
    echo -e "${YELLOW}📝 Running first XeLaTeX compilation (Chinese)...${NC}"
    
    xelatex -interaction=nonstopmode -output-directory="../$OUTPUT_DIR" "$CN_MAIN_FILE" > /dev/null 2>&1 || {
        echo -e "${YELLOW}⚠️  XeLaTeX failed, trying pdflatex...${NC}"
        
        pdflatex -interaction=nonstopmode -output-directory="../$OUTPUT_DIR" "$CN_MAIN_FILE" > /dev/null 2>&1 || {
            echo -e "${RED}❌ Chinese first compilation failed. Check log file for details.${NC}"
            cat "../$OUTPUT_DIR/main-cn.log" | tail -20
            exit 1
        }
    }
    
    echo -e "${YELLOW}📝 Running second XeLaTeX compilation (Chinese)...${NC}"
    
    xelatex -interaction=nonstopmode -output-directory="../$OUTPUT_DIR" "$CN_MAIN_FILE" > /dev/null 2>&1 || {
        echo -e "${YELLOW}⚠️  XeLaTeX failed, trying pdflatex...${NC}"
        
        pdflatex -interaction=nonstopmode -output-directory="../$OUTPUT_DIR" "$CN_MAIN_FILE" > /dev/null 2>&1 || {
            echo -e "${RED}❌ Chinese second compilation failed. Check log file for details.${NC}"
            cat "../$OUTPUT_DIR/main-cn.log" | tail -20
            exit 1
        }
    }
else
    echo -e "${YELLOW}📝 Running first pdflatex compilation (Chinese)...${NC}"
    
    pdflatex -interaction=nonstopmode -output-directory="../$OUTPUT_DIR" "$CN_MAIN_FILE" > /dev/null 2>&1 || {
        echo -e "${RED}❌ Chinese first compilation failed. Check log file for details.${NC}"
        cat "../$OUTPUT_DIR/main-cn.log" | tail -20
        exit 1
    }
    
    echo -e "${YELLOW}📝 Running second pdflatex compilation (Chinese)...${NC}"
    
    pdflatex -interaction=nonstopmode -output-directory="../$OUTPUT_DIR" "$CN_MAIN_FILE" > /dev/null 2>&1 || {
        echo -e "${RED}❌ Chinese second compilation failed. Check log file for details.${NC}"
        cat "../$OUTPUT_DIR/main-cn.log" | tail -20
        exit 1
    }
fi

# Move and rename Chinese output
cd ..
mv "$OUTPUT_DIR/main-cn.pdf" "$OUTPUT_DIR/$CN_OUTPUT_FILE"

echo -e "${GREEN}✅ Chinese version compiled successfully!${NC}"

# Create versioned copies
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
cp "$OUTPUT_DIR/$EN_OUTPUT_FILE" "$OUTPUT_DIR/versions/${EN_OUTPUT_FILE%.pdf}_v${TIMESTAMP}.pdf"
cp "$OUTPUT_DIR/$CN_OUTPUT_FILE" "$OUTPUT_DIR/versions/${CN_OUTPUT_FILE%.pdf}_v${TIMESTAMP}.pdf"

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
echo -e "${GREEN}✅ Bilingual whitepaper compilation successful!${NC}"
echo -e "${BLUE}📄 English: $OUTPUT_DIR/$EN_OUTPUT_FILE${NC}"
echo -e "${BLUE}📄 Chinese: $OUTPUT_DIR/$CN_OUTPUT_FILE${NC}"

# Display file sizes and page counts
if command -v pdfinfo &> /dev/null; then
    EN_PAGES=$(pdfinfo "$OUTPUT_DIR/$EN_OUTPUT_FILE" 2>/dev/null | grep "Pages:" | awk '{print $2}' || echo "Unknown")
    EN_SIZE=$(ls -lh "$OUTPUT_DIR/$EN_OUTPUT_FILE" 2>/dev/null | awk '{print $5}' || echo "Unknown")
    CN_PAGES=$(pdfinfo "$OUTPUT_DIR/$CN_OUTPUT_FILE" 2>/dev/null | grep "Pages:" | awk '{print $2}' || echo "Unknown")
    CN_SIZE=$(ls -lh "$OUTPUT_DIR/$CN_OUTPUT_FILE" 2>/dev/null | awk '{print $5}' || echo "Unknown")
    
    echo -e "${BLUE}📊 English: $EN_PAGES pages, $EN_SIZE${NC}"
    echo -e "${BLUE}📊 Chinese: $CN_PAGES pages, $CN_SIZE${NC}"
fi

# Open PDFs if on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo -e "${YELLOW}🔍 Opening PDFs...${NC}"
    open "$OUTPUT_DIR/$EN_OUTPUT_FILE"
    open "$OUTPUT_DIR/$CN_OUTPUT_FILE"
fi

echo -e "${GREEN}🎉 Bilingual build complete!${NC}"