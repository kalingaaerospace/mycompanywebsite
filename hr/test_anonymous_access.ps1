# PowerShell test script to verify anonymous access is blocked
# Replace with your actual Supabase project URL and keys

$SUPABASE_URL = "https://ddyrpqrnxtquthalgjqg.supabase.co"
$ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkeXJwcXJueHRxdXRoYWxnanFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMjkwODksImV4cCI6MjA2OTkwNTA4OX0._VcxFRIYl9UbddXTjdG6ZjoTsDbI5pbi_4M5E9seS6M"

Write-Host "Testing anonymous access to files table..." -ForegroundColor Yellow

# Test 1: Try to select from files table without authentication (should fail)
Write-Host "`n1. Testing SELECT on files table without auth:" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/files" `
        -Method GET `
        -Headers @{
            "apikey" = $ANON_KEY
            "Content-Type" = "application/json"
        }
    Write-Host "Response: $response" -ForegroundColor Red
} catch {
    Write-Host "Error (Expected): $($_.Exception.Message)" -ForegroundColor Green
}

# Test 2: Try to select from files table with invalid JWT (should fail)
Write-Host "`n2. Testing SELECT on files table with invalid JWT:" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/files" `
        -Method GET `
        -Headers @{
            "apikey" = $ANON_KEY
            "Authorization" = "Bearer invalid_jwt_token"
            "Content-Type" = "application/json"
        }
    Write-Host "Response: $response" -ForegroundColor Red
} catch {
    Write-Host "Error (Expected): $($_.Exception.Message)" -ForegroundColor Green
}

# Test 3: Try to access storage bucket without authentication (should fail)
Write-Host "`n3. Testing storage bucket access without auth:" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/storage/v1/object/user-files/test-file.txt" `
        -Method GET `
        -Headers @{
            "apikey" = $ANON_KEY
        }
    Write-Host "Response: $response" -ForegroundColor Red
} catch {
    Write-Host "Error (Expected): $($_.Exception.Message)" -ForegroundColor Green
}

# Test 4: Try to list storage bucket contents without authentication (should fail)
Write-Host "`n4. Testing storage bucket listing without auth:" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/storage/v1/object/list/user-files" `
        -Method GET `
        -Headers @{
            "apikey" = $ANON_KEY
            "Content-Type" = "application/json"
        }
    Write-Host "Response: $response" -ForegroundColor Red
} catch {
    Write-Host "Error (Expected): $($_.Exception.Message)" -ForegroundColor Green
}

Write-Host "`nAll tests completed. If RLS is properly configured, all requests should be denied or return empty results." -ForegroundColor Yellow
