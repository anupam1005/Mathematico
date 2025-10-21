#!/bin/bash

echo "🚀 Deploying Mathematico Backend to Vercel..."

# Check if we're in the right directory
if [ ! -f "vercel.json" ]; then
    echo "❌ Error: vercel.json not found. Please run this script from the project root."
    exit 1
fi

# Check if Backend directory exists
if [ ! -d "Backend" ]; then
    echo "❌ Error: Backend directory not found."
    exit 1
fi

# Install Vercel CLI if not already installed
echo "📦 Installing Vercel CLI..."
npm install vercel --save-dev

# Deploy to Vercel with proper project name
echo "🚀 Deploying to Vercel with project name 'mathematico-backend'..."
npx vercel --prod --yes --name mathematico-backend

# Check if deployment was successful
if [ $? -eq 0 ]; then
    echo "✅ Vercel deployment successful!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Set your environment variables in the Vercel dashboard:"
    echo "   - MONGODB_URI"
    echo "   - MONGODB_DB" 
    echo "   - JWT_SECRET"
    echo "   - JWT_REFRESH_SECRET"
    echo "   - CLOUDINARY_CLOUD_NAME (optional)"
    echo "   - CLOUDINARY_API_KEY (optional)"
    echo "   - CLOUDINARY_API_SECRET (optional)"
    echo "   - ADMIN_EMAIL (optional)"
    echo "   - ADMIN_PASSWORD (optional)"
    echo ""
    echo "2. Create admin user by calling:"
    echo "   POST https://mathematico-backend.vercel.app/api/v1/auth/create-admin"
    echo ""
    echo "3. Test the deployment:"
    echo "   GET https://mathematico-backend.vercel.app/api/v1/auth/health"
else
    echo "❌ Vercel deployment failed."
    exit 1
fi

echo "Deployment script finished."
