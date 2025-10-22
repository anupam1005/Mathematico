@echo off
echo 🚀 Redeploying Mathematico Backend to Vercel...
echo ================================================

echo 📦 Building and deploying...
vercel --prod --yes

echo ✅ Deployment complete!
echo.
echo 🧪 Testing endpoints...
node test-mobile-api.js

echo.
echo 🎉 Your serverless backend has been updated!
echo 📊 Check your API at: https://mathematico-backend-new.vercel.app
pause
