# CouchDB Local Installation Guide for Windows

## Option 1: Download and Install (Recommended - Easiest)

### Step 1: Download CouchDB
1. Open your browser and go to: https://couchdb.apache.org/
2. Click "Download" → "Windows"
3. Download the latest stable version (e.g., `apache-couchdb-3.3.3.msi`)

### Step 2: Install CouchDB
1. Run the downloaded `.msi` file
2. Follow the installation wizard:
   - Accept the license agreement
   - Choose installation directory (default: `C:\Program Files\Apache CouchDB`)
   - **Important:** When prompted, set admin credentials:
     - Username: `admin`
     - Password: `password` (or your preferred password)
   - Complete the installation

### Step 3: Verify Installation
1. Open your browser
2. Navigate to: http://localhost:5984/_utils
3. You should see Fauxton (CouchDB admin interface)
4. Login with your admin credentials

### Step 4: Create Database
1. In Fauxton, click "Create Database"
2. Database name: `member_management`
3. Click "Create"

### Step 5: Enable CORS (Important for browser access)
Run these PowerShell commands:

```powershell
$base64Auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("admin:password"))
$headers = @{Authorization = "Basic $base64Auth"}

# Enable CORS
Invoke-RestMethod -Uri "http://localhost:5984/_node/_local/_config/httpd/enable_cors" -Method Put -Body '"true"' -ContentType "application/json" -Headers $headers

# Allow all origins
Invoke-RestMethod -Uri "http://localhost:5984/_node/_local/_config/cors/origins" -Method Put -Body '"*"' -ContentType "application/json" -Headers $headers

# Enable credentials
Invoke-RestMethod -Uri "http://localhost:5984/_node/_local/_config/cors/credentials" -Method Put -Body '"true"' -ContentType "application/json" -Headers $headers

# Set allowed methods
Invoke-RestMethod -Uri "http://localhost:5984/_node/_local/_config/cors/methods" -Method Put -Body '"GET, PUT, POST, HEAD, DELETE"' -ContentType "application/json" -Headers $headers

# Set allowed headers
Invoke-RestMethod -Uri "http://localhost:5984/_node/_local/_config/cors/headers" -Method Put -Body '"accept, authorization, content-type, origin, referer, x-requested-with"' -ContentType "application/json" -Headers $headers

Write-Host "CORS enabled successfully!" -ForegroundColor Green
```

### Step 6: Update Application Configuration
Update your `.env` file:

```properties
# CouchDB Configuration (local installation)
REACT_APP_COUCHDB_URL=http://localhost:5984
REACT_APP_COUCHDB_USERNAME=admin
REACT_APP_COUCHDB_PASSWORD=password
REACT_APP_COUCHDB_DATABASE=member_management
REACT_APP_ENABLE_AUTO_SYNC=true
```

### Step 7: Remove Proxy Configuration
Edit `webpack.config.js` and remove the proxy section:

```javascript
devServer: {
  historyApiFallback: true,
  port: 3001,
  hot: true,
  // Remove the proxy section
},
```

---

## Option 2: Using Docker (Alternative)

If you have Docker Desktop installed:

```powershell
# Pull CouchDB image
docker pull couchdb:latest

# Run CouchDB container
docker run -d `
  --name couchdb-local `
  -e COUCHDB_USER=admin `
  -e COUCHDB_PASSWORD=password `
  -p 5984:5984 `
  couchdb:latest

# Wait a few seconds for startup
Start-Sleep -Seconds 10

# Configure CouchDB
$base64Auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("admin:password"))
$headers = @{Authorization = "Basic $base64Auth"}

# Create database
Invoke-RestMethod -Uri "http://localhost:5984/member_management" -Method Put -Headers $headers

# Enable CORS (same commands as above)
```

---

## Testing Your Local Installation

Run this PowerShell command to test:

```powershell
Invoke-RestMethod -Uri "http://localhost:5984/" -Method Get
```

You should see:
```json
{
  "couchdb": "Welcome",
  "version": "3.x.x",
  "vendor": {
    "name": "The Apache Software Foundation"
  }
}
```

---

## Generate Test Data

After installation, run:

```powershell
# Update scripts to use localhost
# Then generate test data
node scripts/generateTestData.js
```

---

## Troubleshooting

### CouchDB Service Not Running
```powershell
# Check service status
Get-Service -Name "Apache CouchDB"

# Start service
Start-Service -Name "Apache CouchDB"
```

### Cannot Access Admin Interface
- Make sure Windows Firewall allows port 5984
- Check if another application is using port 5984:
  ```powershell
  Get-NetTCPConnection -LocalPort 5984
  ```

### Reset Admin Password
1. Stop CouchDB service
2. Edit `C:\Program Files\Apache CouchDB\etc\local.ini`
3. Find `[admins]` section
4. Set password (will be hashed on restart)
5. Restart CouchDB service

---

## Benefits of Local Installation

✅ No network issues
✅ No CORS problems (same machine)
✅ Faster performance
✅ Works offline
✅ Full control over data
✅ Easy to backup and restore

---

## Next Steps

1. Install CouchDB using Option 1 (recommended)
2. Create the `member_management` database
3. Enable CORS
4. Update `.env` file
5. Remove webpack proxy
6. Generate test data
7. Start the application

Need help with any step? Let me know!
