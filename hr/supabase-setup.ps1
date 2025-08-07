# HR Management System - Supabase Setup Script
# Automates Supabase database and storage setup

param(
    [string]$SupabaseUrl = "",
    [string]$ServiceRoleKey = "",
    [switch]$SkipMigrations = $false,
    [switch]$SkipStorage = $false
)

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor $Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor $Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor $Blue
}

Write-Host "🚀 HR Management System - Supabase Setup" -ForegroundColor $Green
Write-Host "=============================================" -ForegroundColor $Green
Write-Host ""

# Check if Supabase CLI is available
$supabaseAvailable = $false
try {
    $supabaseVersion = supabase --version 2>$null
    if ($supabaseVersion) {
        $supabaseAvailable = $true
        Write-Status "Supabase CLI found"
    }
} catch {
    Write-Warning "Supabase CLI not found"
}

# If no parameters provided, prompt for them
if (-not $SupabaseUrl) {
    $SupabaseUrl = Read-Host "Enter your Supabase URL (e.g., https://your-project.supabase.co)"
}

if (-not $ServiceRoleKey) {
    $ServiceRoleKey = Read-Host "Enter your Supabase Service Role Key"
}

if (-not $SupabaseUrl -or -not $ServiceRoleKey) {
    Write-Error "Supabase URL and Service Role Key are required"
    exit 1
}

Write-Status "Configuration loaded"

# Function to execute SQL via Supabase API
function Invoke-SupabaseSQL {
    param(
        [string]$SQL,
        [string]$Description
    )
    
    Write-Info "Executing: $Description"
    
    $headers = @{
        "apikey" = $ServiceRoleKey
        "Authorization" = "Bearer $ServiceRoleKey"
        "Content-Type" = "application/json"
        "Prefer" = "return=minimal"
    }
    
    $body = @{
        query = $SQL
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$SupabaseUrl/rest/v1/rpc/exec_sql" -Method POST -Headers $headers -Body $body
        Write-Status "$Description completed successfully"
        return $true
    } catch {
        Write-Error "Failed to execute $Description"
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor $Red
        return $false
    }
}

# Function to create storage bucket
function New-SupabaseStorageBucket {
    param(
        [string]$BucketName,
        [bool]$Public = $false
    )
    
    Write-Info "Creating storage bucket: $BucketName"
    
    $headers = @{
        "apikey" = $ServiceRoleKey
        "Authorization" = "Bearer $ServiceRoleKey"
        "Content-Type" = "application/json"
    }
    
    $body = @{
        name = $BucketName
        public = $Public
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$SupabaseUrl/rest/v1/storage/buckets" -Method POST -Headers $headers -Body $body
        Write-Status "Storage bucket '$BucketName' created successfully"
        return $true
    } catch {
        Write-Error "Failed to create storage bucket '$BucketName'"
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor $Red
        return $false
    }
}

# Execute migrations if not skipped
if (-not $SkipMigrations) {
    Write-Host ""
    Write-Info "Executing database migrations..."
    
    # Read and execute migration files
    $migrationFiles = @(
        "migrations/001_create_files_table.sql",
        "migrations/004_create_profiles_table.sql"
    )
    
    foreach ($file in $migrationFiles) {
        if (Test-Path $file) {
            $sql = Get-Content $file -Raw
            $description = "Migration: $file"
            $success = Invoke-SupabaseSQL -SQL $sql -Description $description
            
            if (-not $success) {
                Write-Error "Migration failed: $file"
                exit 1
            }
        } else {
            Write-Warning "Migration file not found: $file"
        }
    }
    
    Write-Status "Database migrations completed"
} else {
    Write-Warning "Skipping database migrations"
}

# Create storage bucket if not skipped
if (-not $SkipStorage) {
    Write-Host ""
    Write-Info "Setting up storage..."
    
    $bucketCreated = New-SupabaseStorageBucket -BucketName "user-files" -Public $false
    
    if ($bucketCreated) {
        # Execute storage policies
        $storageSQL = Get-Content "migrations/002_create_storage_bucket.sql" -Raw
        $success = Invoke-SupabaseSQL -SQL $storageSQL -Description "Storage policies"
        
        if (-not $success) {
            Write-Error "Failed to create storage policies"
            exit 1
        }
    }
    
    Write-Status "Storage setup completed"
} else {
    Write-Warning "Skipping storage setup"
}

# Verify setup
Write-Host ""
Write-Info "Verifying setup..."

$verifySQL = Get-Content "migrations/003_verify_setup.sql" -Raw
$success = Invoke-SupabaseSQL -SQL $verifySQL -Description "Setup verification"

if ($success) {
    Write-Status "Setup verification completed"
} else {
    Write-Warning "Setup verification failed - check manually"
}

Write-Host ""
Write-Status "Supabase setup completed successfully!"
Write-Host ""
Write-Info "Next steps:"
Write-Host "1. Update your backend/.env file with the Supabase credentials"
Write-Host "2. Test the setup using: .\test_anonymous_access.ps1"
Write-Host "3. Start your application using: .\start-hr-system.ps1"
Write-Host "" 