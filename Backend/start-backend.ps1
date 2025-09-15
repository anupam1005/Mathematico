Write-Host "🚀 Starting Mathematico Backend Server..." -ForegroundColor Green
Write-Host ""

# Check if Node.js is installed
Write-Host "🔍 Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    Write-Host "Press any key to continue..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# Check if npm is available
Write-Host "🔍 Checking npm installation..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✅ npm found: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found. Please reinstall Node.js" -ForegroundColor Red
    Write-Host "Press any key to continue..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# Check if dependencies are installed
Write-Host "🔍 Checking if dependencies are installed..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
    try {
        npm install
        Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        Write-Host "Press any key to continue..." -ForegroundColor Yellow
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit 1
    }
} else {
    Write-Host "✅ Dependencies already installed" -ForegroundColor Green
}

# Check if config.env exists
Write-Host "🔍 Checking configuration..." -ForegroundColor Yellow
if (-not (Test-Path "config.env")) {
    Write-Host "⚠️  config.env not found. Creating from example..." -ForegroundColor Yellow
    if (Test-Path "config.env.example") {
        Copy-Item "config.env.example" "config.env"
        Write-Host "✅ config.env created from example" -ForegroundColor Green
        Write-Host "⚠️  Please update config.env with your database credentials" -ForegroundColor Yellow
    } else {
        Write-Host "❌ config.env.example not found" -ForegroundColor Red
    }
} else {
    Write-Host "✅ Configuration file found" -ForegroundColor Green
}

# Check if uploads directory exists
Write-Host "🔍 Checking uploads directory..." -ForegroundColor Yellow
if (-not (Test-Path "uploads")) {
    Write-Host "📁 Creating uploads directory..." -ForegroundColor Cyan
    New-Item -ItemType Directory -Path "uploads" -Force | Out-Null
    Write-Host "✅ Uploads directory created" -ForegroundColor Green
} else {
    Write-Host "✅ Uploads directory exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "📋 Prerequisites check completed!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Make sure you have:" -ForegroundColor Yellow
Write-Host "   1. MySQL running on localhost:3306" -ForegroundColor White
Write-Host "   2. Database 'mathematico' created" -ForegroundColor White
Write-Host "   3. Database credentials configured in config.env" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Starting server..." -ForegroundColor Cyan

try {
    # Start the development server
    npm run dev
} catch {
    Write-Host "❌ Error starting server: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Troubleshooting tips:" -ForegroundColor Yellow
    Write-Host "   1. Check if MySQL is running" -ForegroundColor White
    Write-Host "   2. Verify database credentials in config.env" -ForegroundColor White
    Write-Host "   3. Ensure database 'mathematico' exists" -ForegroundColor White
    Write-Host "   4. Check if port 5000 is available" -ForegroundColor White
    Write-Host ""
    Write-Host "Press any key to continue..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}
