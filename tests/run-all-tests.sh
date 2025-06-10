#!/bin/bash

# StoryHouse.vip Test Suite Runner
# Runs all test categories in sequence

echo "🧪 StoryHouse.vip Complete Test Suite"
echo "====================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run a test and track results
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "\n${BLUE}🔍 Running: $test_name${NC}"
    echo "Command: $test_command"
    echo "---"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if eval "$test_command"; then
        echo -e "${GREEN}✅ $test_name: PASSED${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ $test_name: FAILED${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    echo ""
}

# Change to project root
cd "$(dirname "$0")/.."

echo -e "${YELLOW}Starting test suite...${NC}"
echo "Test environment: ${TEST_ENV:-local}"
echo ""

# 1. Local Services Health Check
run_test "Local Services Health Check" "./tests/scripts/test-local-services.sh"

# 2. Smart Contract Verification
run_test "Smart Contract Verification" "node ./tests/scripts/test-contracts.js"

# 3. API Endpoints Integration Tests
run_test "API Endpoints Integration" "node ./tests/integration/api-endpoints.test.js"

# 4. Frontend Tests (if available)
if [ -f "./tests/frontend/components.test.js" ]; then
    run_test "Frontend Components" "node ./tests/frontend/components.test.js"
fi

# 5. Backend Tests (if available)
if [ -f "./tests/backend/books-api.test.js" ]; then
    run_test "Backend API Tests" "node ./tests/backend/books-api.test.js"
fi

# 6. Smart Contract Tests (via symlink)
if [ -d "./packages/contracts/test" ]; then
    run_test "Smart Contract Tests" "cd ./packages/contracts && npm run test"
fi

# Test Summary
echo "=================================="
echo -e "${BLUE}📊 Test Suite Summary${NC}"
echo "=================================="
echo "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed!${NC}"
    echo "StoryHouse.vip is ready for deployment."
    exit 0
else
    echo -e "\n${RED}⚠️  $FAILED_TESTS test(s) failed.${NC}"
    echo "Please check the test output above."
    exit 1
fi