# Setup script for npm and Node.js
Write-Host "Setting up npm and Node.js..." -ForegroundColor Green

# Define the Node.js path
$nodePath = "C:\Program Files\nodejs"

# Check if Node.js directory exists
if (-not (Test-Path $nodePath)) {
    Write-Host "Error: Node.js directory not found at $nodePath" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Add to current session PATH
$env:Path = "$env:Path;$nodePath"
Write-Host "Added Node.js to current session PATH" -ForegroundColor Green

# Add to user PATH permanently
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notlike "*$nodePath*") {
    $newPath = "$userPath;$nodePath"
    [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
    Write-Host "Added Node.js to User PATH permanently" -ForegroundColor Green
} else {
    Write-Host "Node.js already in User PATH" -ForegroundColor Yellow
}

# Add to system PATH permanently
$systemPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
if ($systemPath -notlike "*$nodePath*") {
    $newPath = "$systemPath;$nodePath"
    [Environment]::SetEnvironmentVariable("Path", $newPath, "Machine")
    Write-Host "Added Node.js to System PATH permanently" -ForegroundColor Green
} else {
    Write-Host "Node.js already in System PATH" -ForegroundColor Yellow
}

# Verify npm is working
try {
    $npmVersion = & "$nodePath\npm.cmd" --version
    Write-Host "npm is working! Version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "Error running npm. Please check your installation." -ForegroundColor Red
}

# Create npm command alias for the current session
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Set-Alias -Name npm -Value "$nodePath\npm.cmd" -Scope Global
    Write-Host "Created npm alias for current session" -ForegroundColor Green
}

# Create npx command alias for the current session
if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
    Set-Alias -Name npx -Value "$nodePath\npx.cmd" -Scope Global
    Write-Host "Created npx alias for current session" -ForegroundColor Green
}

Write-Host "`nSetup complete! You may need to restart your terminal or computer for changes to take effect." -ForegroundColor Cyan
Write-Host "To use npm in the current session, run: & '$nodePath\npm.cmd' <command>" -ForegroundColor Cyan
Write-Host "Example: & '$nodePath\npm.cmd' run dev" -ForegroundColor Cyan
