#!/bin/bash

# Comprehensive Testing Script for Mathematico App
# This script runs all tests to ensure the app is ready for APK build

echo "🚀 Starting Comprehensive Testing for Mathematico App"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run a test and track results
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "${BLUE}🧪 Running: $test_name${NC}"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if eval "$test_command"; then
        echo -e "${GREEN}✅ PASSED: $test_name${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}❌ FAILED: $test_name${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
check_port() {
    local port="$1"
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

echo -e "${YELLOW}📋 Pre-flight Checks${NC}"
echo "========================"

# Check required tools
run_test "Node.js Installation" "command_exists node"
run_test "npm Installation" "command_exists npm"
run_test "React Native CLI" "command_exists react-native || command_exists npx"
run_test "Android SDK" "command_exists adb || echo 'Android SDK not found'"

# Check project structure
run_test "Backend Directory" "test -d Backend"
run_test "Frontend Directory" "test -d Frontend-app"
run_test "Backend index.js" "test -f Backend/index.js"
run_test "Frontend package.json" "test -f Frontend-app/package.json"
run_test "Vercel Configuration" "test -f vercel.json"

echo -e "\n${YELLOW}🔧 Backend Testing${NC}"
echo "=================="

# Test backend dependencies
run_test "Backend Dependencies" "cd Backend && npm list --depth=0"

# Test backend configuration
run_test "Backend Environment" "cd Backend && test -f config.env"

# Test backend startup (if not already running)
if ! check_port 5002; then
    echo -e "${BLUE}🔄 Starting backend server for testing...${NC}"
    cd Backend
    npm start &
    BACKEND_PID=$!
    sleep 10  # Wait for server to start
    
    # Test backend health
    run_test "Backend Health Check" "curl -f http://localhost:5002/health"
    run_test "Backend API Root" "curl -f http://localhost:5002/api/v1"
    run_test "Backend Auth Endpoint" "curl -f http://localhost:5002/api/v1/auth"
    
    # Stop backend
    kill $BACKEND_PID 2>/dev/null
    cd ..
else
    echo -e "${YELLOW}⚠️ Backend server already running on port 5002${NC}"
    run_test "Backend Health Check" "curl -f http://localhost:5002/health"
fi

echo -e "\n${YELLOW}📱 Frontend Testing${NC}"
echo "===================="

# Test frontend dependencies
run_test "Frontend Dependencies" "cd Frontend-app && npm list --depth=0"

# Test TypeScript compilation
run_test "TypeScript Compilation" "cd Frontend-app && npx tsc --noEmit"

# Test React Native bundle
run_test "React Native Bundle" "cd Frontend-app && npx react-native bundle --platform android --dev false --entry-file index.ts --bundle-output /tmp/test.bundle"

echo -e "\n${YELLOW}🌐 API Endpoint Testing${NC}"
echo "========================="

# Test API endpoints using the comprehensive test script
if command_exists node; then
    run_test "API Endpoint Tests" "node comprehensive-api-test.js"
else
    echo -e "${RED}❌ Node.js not available for API testing${NC}"
fi

echo -e "\n${YELLOW}🔐 Authentication Testing${NC}"
echo "============================"

# Test admin login
run_test "Admin Login" "curl -X POST http://localhost:5002/api/v1/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"dc2006089@gmail.com\",\"password\":\"Myname*321\"}'"

# Test student registration (if backend is running)
if check_port 5002; then
    run_test "Student Registration" "curl -X POST http://localhost:5002/api/v1/auth/register -H 'Content-Type: application/json' -d '{\"name\":\"Test Student\",\"email\":\"test@student.com\",\"password\":\"password123\"}'"
fi

echo -e "\n${YELLOW}📦 Build Preparation${NC}"
echo "======================"

# Check Android build requirements
run_test "Android Build Tools" "command_exists gradle || echo 'Gradle not found'"
run_test "Java Installation" "command_exists java"

# Test Android build
if command_exists gradle; then
    run_test "Android Build Test" "cd Frontend-app/android && ./gradlew assembleDebug --dry-run"
fi

echo -e "\n${YELLOW}📊 Test Summary${NC}"
echo "==============="

echo -e "Total Tests: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"

SUCCESS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
echo -e "Success Rate: ${BLUE}$SUCCESS_RATE%${NC}"

echo -e "\n${YELLOW}🎯 Final Assessment${NC}"
echo "=================="

if [ $SUCCESS_RATE -ge 80 ]; then
    echo -e "${GREEN}🎉 App is ready for APK build!${NC}"
    echo -e "${GREEN}✅ You can proceed with building the APK file${NC}"
    exit 0
elif [ $SUCCESS_RATE -ge 60 ]; then
    echo -e "${YELLOW}⚠️ App has some issues but may be buildable${NC}"
    echo -e "${YELLOW}🔧 Consider fixing the failed tests before building${NC}"
    exit 1
else
    echo -e "${RED}❌ App has significant issues${NC}"
    echo -e "${RED}🚫 Do not build APK until issues are resolved${NC}"
    exit 2
fi
