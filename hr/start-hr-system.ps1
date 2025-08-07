# HR Management System Startup Script
# This script starts both frontend and backend servers

Write-Host "🚀 Starting HR Management System..." -ForegroundColor Green
Write-Host ""

# Check if required tools are available
$phpAvailable = $false
$nodeAvailable = $false

try {
    $phpVersion = php -v 2>$null
    if ($phpVersion) {
        $phpAvailable = $true
        Write-Host "✅ PHP is available" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ PHP not found. Please install PHP 8.0+ or XAMPP" -ForegroundColor Red
}

try {
    $nodeVersion = node -v 2>$null
    if ($nodeVersion) {
        $nodeAvailable = $true
        Write-Host "✅ Node.js is available" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js" -ForegroundColor Red
}

Write-Host ""

if (-not $phpAvailable -or -not $nodeAvailable) {
    Write-Host "❌ Missing required tools. Please install PHP and Node.js first." -ForegroundColor Red
    Write-Host ""
    Write-Host "Installation options:" -ForegroundColor Yellow
    Write-Host "1. XAMPP (includes PHP): https://www.apachefriends.org/" -ForegroundColor Cyan
    Write-Host "2. Node.js: https://nodejs.org/" -ForegroundColor Cyan
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if dependencies are installed
$composerLock = Test-Path "backend/composer.lock"
$nodeModules = Test-Path "frontend/node_modules"

if (-not $composerLock) {
    Write-Host "📦 Installing PHP dependencies..." -ForegroundColor Yellow
    Set-Location backend
    composer install
    Set-Location ..
}

if (-not $nodeModules) {
    Write-Host "📦 Installing Node.js dependencies..." -ForegroundColor Yellow
    Set-Location frontend  
    npm install
    Set-Location ..
}

# Check if .env exists
$envExists = Test-Path "backend/.env"
if (-not $envExists) {
    Write-Host "⚠️  Warning: backend/.env file not found!" -ForegroundColor Yellow
    Write-Host "Please ensure your Supabase credentials are configured." -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "🌐 Starting servers..." -ForegroundColor Green
Write-Host ""

# Function to start backend
$backendJob = Start-Job -ScriptBlock {
    Set-Location $args[0]
    Set-Location backend
    php -S localhost:8000
} -ArgumentList (Get-Location)

# Function to start frontend  
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $args[0]
    Set-Location frontend
    npx live-server --port=3000 --open
} -ArgumentList (Get-Location)

Write-Host "✅ Backend server started on http://localhost:8000" -ForegroundColor Green
Write-Host "✅ Frontend server started on http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 HR Management System is running!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Access your application at: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop the servers, press Ctrl+C or close this window." -ForegroundColor Yellow
Write-Host ""

# Wait for user input to stop
try {
    Read-Host "Press Enter to stop the servers"
} finally {
    Write-Host "🛑 Stopping servers..." -ForegroundColor Yellow
    Stop-Job $backendJob, $frontendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob, $frontendJob -ErrorAction SilentlyContinue
    Write-Host "✅ Servers stopped." -ForegroundColor Green
}
