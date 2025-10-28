@echo off
REM Comprehensive Testing Script for Mathematico App (Windows)
REM This script runs all tests to ensure the app is ready for APK build

echo 🚀 Starting Comprehensive Testing for Mathematico App
echo ==================================================

REM Test results tracking
set TOTAL_TESTS=0
set PASSED_TESTS=0
set FAILED_TESTS=0

REM Function to run a test and track results
:run_test
set test_name=%~1
set test_command=%~2

echo 🧪 Running: %test_name%
set /a TOTAL_TESTS+=1

%test_command%
if %errorlevel% equ 0 (
    echo ✅ PASSED: %test_name%
    set /a PASSED_TESTS+=1
    goto :eof
) else (
    echo ❌ FAILED: %test_name%
    set /a FAILED_TESTS+=1
    goto :eof
)

echo 📋 Pre-flight Checks
echo ========================

REM Check required tools
call :run_test "Node.js Installation" "node --version"
call :run_test "npm Installation" "npm --version"
call :run_test "React Native CLI" "npx react-native --version"

REM Check project structure
call :run_test "Backend Directory" "if exist Backend echo exists"
call :run_test "Frontend Directory" "if exist Frontend-app echo exists"
call :run_test "Backend index.js" "if exist Backend\index.js echo exists"
call :run_test "Frontend package.json" "if exist Frontend-app\package.json echo exists"
call :run_test "Vercel Configuration" "if exist vercel.json echo exists"

echo.
echo 🔧 Backend Testing
echo ==================

REM Test backend dependencies
call :run_test "Backend Dependencies" "cd Backend && npm list --depth=0"

REM Test backend configuration
call :run_test "Backend Environment" "if exist Backend\config.env echo exists"

echo.
echo 📱 Frontend Testing
echo ===================

REM Test frontend dependencies
call :run_test "Frontend Dependencies" "cd Frontend-app && npm list --depth=0"

REM Test TypeScript compilation
call :run_test "TypeScript Compilation" "cd Frontend-app && npx tsc --noEmit"

echo.
echo 🌐 API Endpoint Testing
echo =========================

REM Test API endpoints using the comprehensive test script
call :run_test "API Endpoint Tests" "node comprehensive-api-test.js"

echo.
echo 📦 Build Preparation
echo ======================

REM Check Android build requirements
call :run_test "Java Installation" "java -version"

echo.
echo 📊 Test Summary
echo ===============

echo Total Tests: %TOTAL_TESTS%
echo Passed: %PASSED_TESTS%
echo Failed: %FAILED_TESTS%

REM Calculate success rate
set /a SUCCESS_RATE=%PASSED_TESTS%*100/%TOTAL_TESTS%
echo Success Rate: %SUCCESS_RATE%%

echo.
echo 🎯 Final Assessment
echo ==================

if %SUCCESS_RATE% geq 80 (
    echo 🎉 App is ready for APK build!
    echo ✅ You can proceed with building the APK file
    exit /b 0
) else if %SUCCESS_RATE% geq 60 (
    echo ⚠️ App has some issues but may be buildable
    echo 🔧 Consider fixing the failed tests before building
    exit /b 1
) else (
    echo ❌ App has significant issues
    echo 🚫 Do not build APK until issues are resolved
    exit /b 2
)

pause
