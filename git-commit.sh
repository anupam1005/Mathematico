#!/bin/bash

echo "🔄 Committing and pushing changes to GitHub..."

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: Not a git repository. Please initialize git first."
    exit 1
fi

# Add all changes
echo "📁 Adding all changes..."
git add .

# Check if there are changes to commit
if git diff --cached --quiet; then
    echo "ℹ️ No changes to commit."
    exit 0
fi

# Commit changes
echo "💾 Committing changes..."
git commit -m "Fix Vercel deployment configuration and add admin user creation

- Fixed vercel.json configuration for proper serverless deployment
- Added admin user creation endpoint for development
- Removed conflicting Vercel configuration options
- Added comprehensive deployment guide
- Optimized for Vercel serverless functions"

# Push to GitHub
echo "🚀 Pushing to GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    echo "✅ Successfully pushed to GitHub!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Deploy to Vercel: npm run deploy"
    echo "2. Set environment variables in Vercel dashboard"
    echo "3. Create admin user: POST /api/v1/auth/create-admin"
    echo "4. Test deployment with the health endpoint"
else
    echo "❌ Failed to push to GitHub. Please check your git configuration."
    exit 1
fi

echo "Git operations completed."
