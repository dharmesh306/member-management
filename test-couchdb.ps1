# CouchDB Connection Test Script

# Test CouchDB server connectivity and setup

Write-Host "🔍 Testing CouchDB Connection..." -ForegroundColor Cyan
Write-Host ""

# Configuration
$server = "astworkbench03"
$port = "5984"
$database = "member_management"
$username = "admin"
$password = "password"

$baseUrl = "http://${server}:${port}"
$authUrl = "http://${username}:${password}@${server}:${port}"
$dbUrl = "${authUrl}/${database}"

# Test 1: Server Reachability
Write-Host "Test 1: Checking if server is reachable..." -ForegroundColor Yellow
try {
    $pingResult = Test-Connection -ComputerName $server -Count 1 -Quiet
    if ($pingResult) {
        Write-Host "✓ Server '$server' is reachable" -ForegroundColor Green
    } else {
        Write-Host "✗ Server '$server' is NOT reachable" -ForegroundColor Red
        Write-Host "  Please check network connection and server name" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ Failed to ping server" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 2: CouchDB Service
Write-Host "Test 2: Checking if CouchDB is running..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri $baseUrl -Method Get -ErrorAction Stop
    Write-Host "✓ CouchDB is running" -ForegroundColor Green
    Write-Host "  Version: $($response.version)" -ForegroundColor Gray
    Write-Host "  Vendor: $($response.vendor.name)" -ForegroundColor Gray
} catch {
    Write-Host "✗ CouchDB is NOT running on port $port" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 3: Authentication
Write-Host "Test 3: Testing authentication..." -ForegroundColor Yellow
try {
    $headers = @{
        Authorization = "Basic " + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${username}:${password}"))
    }
    $response = Invoke-RestMethod -Uri "${baseUrl}/_session" -Method Get -Headers $headers -ErrorAction Stop
    Write-Host "✓ Authentication successful" -ForegroundColor Green
    Write-Host "  User: $($response.userCtx.name)" -ForegroundColor Gray
    Write-Host "  Roles: $($response.userCtx.roles -join ', ')" -ForegroundColor Gray
} catch {
    Write-Host "✗ Authentication failed" -ForegroundColor Red
    Write-Host "  Please check username and password" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 4: Database Existence
Write-Host "Test 4: Checking database '$database'..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri $dbUrl -Method Get -ErrorAction Stop
    Write-Host "✓ Database '$database' exists" -ForegroundColor Green
    Write-Host "  Document count: $($response.doc_count)" -ForegroundColor Gray
    Write-Host "  Database size: $([math]::Round($response.data_size / 1KB, 2)) KB" -ForegroundColor Gray
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 404) {
        Write-Host "⚠ Database '$database' does NOT exist" -ForegroundColor Yellow
        Write-Host "  Creating database..." -ForegroundColor Yellow
        
        try {
            Invoke-RestMethod -Uri $dbUrl -Method Put -ErrorAction Stop | Out-Null
            Write-Host "✓ Database '$database' created successfully" -ForegroundColor Green
        } catch {
            Write-Host "✗ Failed to create database" -ForegroundColor Red
            Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "✗ Error checking database" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}
Write-Host ""

# Test 5: CORS Configuration (important for web app)
Write-Host "Test 5: Checking CORS configuration..." -ForegroundColor Yellow
try {
    $corsConfig = Invoke-RestMethod -Uri "${authUrl}/_node/_local/_config/cors" -Method Get -ErrorAction Stop
    
    if ($corsConfig.origins -or $corsConfig.enable_cors) {
        Write-Host "✓ CORS is configured" -ForegroundColor Green
        if ($corsConfig.origins) {
            Write-Host "  Origins: $($corsConfig.origins)" -ForegroundColor Gray
        }
        if ($corsConfig.credentials) {
            Write-Host "  Credentials: $($corsConfig.credentials)" -ForegroundColor Gray
        }
    } else {
        Write-Host "⚠ CORS might not be configured" -ForegroundColor Yellow
        Write-Host "  This may cause issues with web browser access" -ForegroundColor Yellow
        Write-Host "  See COUCHDB_SETUP.md for CORS configuration" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠ Could not check CORS configuration" -ForegroundColor Yellow
    Write-Host "  You may need to configure CORS manually" -ForegroundColor Yellow
}
Write-Host ""

# Test 6: Test Write Operation
Write-Host "Test 6: Testing write permissions..." -ForegroundColor Yellow
try {
    $testDoc = @{
        _id = "test_connection_" + (Get-Date -Format "yyyyMMddHHmmss")
        type = "test"
        message = "Connection test from PowerShell"
        timestamp = (Get-Date -Format o)
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri $dbUrl -Method Post -Body $testDoc -ContentType "application/json" -ErrorAction Stop
    Write-Host "✓ Write test successful" -ForegroundColor Green
    Write-Host "  Created document: $($response.id)" -ForegroundColor Gray
    
    # Clean up test document
    $deleteUrl = "${dbUrl}/$($response.id)?rev=$($response.rev)"
    Invoke-RestMethod -Uri $deleteUrl -Method Delete -ErrorAction SilentlyContinue | Out-Null
    Write-Host "  Test document cleaned up" -ForegroundColor Gray
} catch {
    Write-Host "✗ Write test failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Summary
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✓ ALL TESTS PASSED!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "CouchDB Connection Details:" -ForegroundColor White
Write-Host "  Server: $server" -ForegroundColor Gray
Write-Host "  Port: $port" -ForegroundColor Gray
Write-Host "  Database: $database" -ForegroundColor Gray
Write-Host "  URL: ${baseUrl}/${database}" -ForegroundColor Gray
Write-Host ""
Write-Host "You can now run your app:" -ForegroundColor White
Write-Host "  npm run web" -ForegroundColor Cyan
Write-Host ""
Write-Host "Access Fauxton web interface:" -ForegroundColor White
Write-Host "  ${baseUrl}/_utils/" -ForegroundColor Cyan
Write-Host ""
