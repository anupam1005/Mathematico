@echo off
REM Mathematico Serverless Deployment Script for Windows
REM This script deploys your backend to Vercel for serverless operation

echo 🚀 Starting Mathematico Serverless Deployment...

REM Check if Vercel CLI is installed
vercel --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Vercel CLI not found. Installing...
    npm install -g vercel
)

REM Check if user is logged in to Vercel
vercel whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo 🔐 Please log in to Vercel:
    vercel login
)

echo 📦 Building backend for production...

REM Set production environment
set NODE_ENV=production
set VERCEL=1

REM Deploy to Vercel
echo 🌐 Deploying to Vercel...
vercel --prod

echo ✅ Deployment complete!
echo 🔗 Your serverless backend is now live at: https://mathematico-backend-new.vercel.app
echo.
echo 📱 Next steps:
echo 1. Update your app's API endpoints to use the serverless URL
echo 2. Test the deployed backend
echo 3. Build and publish your app to Play Store
echo.
echo 🎉 Your app will now work without manual server startup!
pause
