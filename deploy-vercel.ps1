# PowerShell script to deploy Mathematico Backend to Vercel

Write-Host "🚀 Deploying Mathematico Backend to Vercel..." -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "vercel.json")) {
    Write-Host "❌ Error: vercel.json not found. Please run this script from the project root." -ForegroundColor Red
    exit 1
}

# Check if Backend directory exists
if (-not (Test-Path "Backend")) {
    Write-Host "❌ Error: Backend directory not found." -ForegroundColor Red
    exit 1
}

# Install Vercel CLI if not already installed
Write-Host "📦 Installing Vercel CLI..." -ForegroundColor Yellow
npm install vercel --save-dev

# Deploy to Vercel with proper project name
Write-Host "🚀 Deploying to Vercel with project name 'mathematico-backend'..." -ForegroundColor Green
npx vercel --prod --yes --name mathematico-backend

# Check if deployment was successful
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Vercel deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next steps:" -ForegroundColor Cyan
    Write-Host "1. Set your environment variables in the Vercel dashboard:" -ForegroundColor White
    Write-Host "   - MONGODB_URI" -ForegroundColor Gray
    Write-Host "   - MONGODB_DB" -ForegroundColor Gray
    Write-Host "   - JWT_SECRET" -ForegroundColor Gray
    Write-Host "   - JWT_REFRESH_SECRET" -ForegroundColor Gray
    Write-Host "   - CLOUDINARY_CLOUD_NAME (optional)" -ForegroundColor Gray
    Write-Host "   - CLOUDINARY_API_KEY (optional)" -ForegroundColor Gray
    Write-Host "   - CLOUDINARY_API_SECRET (optional)" -ForegroundColor Gray
    Write-Host "   - ADMIN_EMAIL (optional)" -ForegroundColor Gray
    Write-Host "   - ADMIN_PASSWORD (optional)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Create admin user by calling:" -ForegroundColor White
    Write-Host "   POST https://mathematico-backend.vercel.app/api/v1/auth/create-admin" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Test the deployment:" -ForegroundColor White
    Write-Host "   GET https://mathematico-backend.vercel.app/api/v1/auth/health" -ForegroundColor Gray
} else {
    Write-Host "❌ Vercel deployment failed." -ForegroundColor Red
    exit 1
}

Write-Host "Deployment script finished." -ForegroundColor Green
