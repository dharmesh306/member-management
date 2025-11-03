# Enable CORS on CouchDB Server
# This allows the web browser to connect to CouchDB from localhost

Write-Host "🔧 Enabling CORS on CouchDB..." -ForegroundColor Cyan
Write-Host ""

$server = "astworkbench03:5984"
$auth = "admin:password"
$base = "http://$auth@$server"

Write-Host "Setting CORS configuration..." -ForegroundColor Yellow

# Enable CORS
Write-Host "1. Enabling CORS..." -NoNewline
try {
    $response = Invoke-RestMethod -Uri "$base/_node/_local/_config/httpd/enable_cors" -Method Put -Body '"true"' -ContentType "application/json"
    Write-Host " ✅" -ForegroundColor Green
} catch {
    Write-Host " ❌ $($_.Exception.Message)" -ForegroundColor Red
}

# Set allowed origins
Write-Host "2. Setting allowed origins (*) ..." -NoNewline
try {
    $response = Invoke-RestMethod -Uri "$base/_node/_local/_config/cors/origins" -Method Put -Body '"*"' -ContentType "application/json"
    Write-Host " ✅" -ForegroundColor Green
} catch {
    Write-Host " ❌ $($_.Exception.Message)" -ForegroundColor Red
}

# Enable credentials
Write-Host "3. Enabling credentials..." -NoNewline
try {
    $response = Invoke-RestMethod -Uri "$base/_node/_local/_config/cors/credentials" -Method Put -Body '"true"' -ContentType "application/json"
    Write-Host " ✅" -ForegroundColor Green
} catch {
    Write-Host " ❌ $($_.Exception.Message)" -ForegroundColor Red
}

# Set allowed methods
Write-Host "4. Setting allowed methods..." -NoNewline
try {
    $response = Invoke-RestMethod -Uri "$base/_node/_local/_config/cors/methods" -Method Put -Body '"GET, PUT, POST, HEAD, DELETE"' -ContentType "application/json"
    Write-Host " ✅" -ForegroundColor Green
} catch {
    Write-Host " ❌ $($_.Exception.Message)" -ForegroundColor Red
}

# Set allowed headers
Write-Host "5. Setting allowed headers..." -NoNewline
try {
    $response = Invoke-RestMethod -Uri "$base/_node/_local/_config/cors/headers" -Method Put -Body '"accept, authorization, content-type, origin, referer, x-requested-with"' -ContentType "application/json"
    Write-Host " ✅" -ForegroundColor Green
} catch {
    Write-Host " ❌ $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "CORS configuration completed!" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "You can now access CouchDB from your web browser." -ForegroundColor White
Write-Host "Try reloading your application" -ForegroundColor White
Write-Host ""
