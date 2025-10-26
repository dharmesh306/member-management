# ✅ CouchDB Remote Server Configuration Complete!

## 🎉 What's Been Configured

Your Member Management app is now configured to sync with your CouchDB server:

### 🔗 Connection Details
- **Server**: `astworkbench03:5984`
- **Database**: `member_management`
- **Username**: `admin`
- **Password**: `password`
- **Auto-sync**: ✅ **ENABLED**

### 📁 Files Updated/Created

1. **`src/config/config.js`** ✅ NEW
   - Centralized configuration file
   - Easy to update credentials and settings
   - Sync options configurable

2. **`src/services/DatabaseService.js`** ✅ UPDATED
   - Auto-connects to remote server on init
   - Uses config file for settings
   - Enhanced sync options

3. **`src/components/SyncStatus.js`** ✅ NEW
   - Visual sync status indicator
   - Shows: Synced, Syncing, Error, Disconnected
   - Real-time updates with color coding
   - Retry button on errors

4. **`src/screens/Dashboard.js`** ✅ UPDATED
   - Includes SyncStatus component at top
   - Shows sync status to users

5. **`COUCHDB_SETUP.md`** ✅ NEW
   - Complete CouchDB setup guide
   - Troubleshooting tips
   - Security recommendations
   - Testing instructions

## 🚀 How It Works

### Automatic Sync Flow

1. **App Starts** → Database initializes
2. **Auto-Connect** → Connects to `astworkbench03:5984`
3. **Continuous Sync** → Real-time bidirectional sync
4. **Status Updates** → Green badge shows "✓ Synced"
5. **Offline Support** → Works offline, syncs when online

### What Gets Synced

✅ **New members** - Added on any device
✅ **Updates** - Edit member on one device, see on all
✅ **Deletions** - Delete syncs to all devices
✅ **Conflict resolution** - Automatic handling of conflicts

## 🎯 Before You Start

### On CouchDB Server (astworkbench03)

**1. Ensure CouchDB is running:**
```bash
curl http://astworkbench03:5984/
```

**2. Create the database:**
```bash
curl -X PUT http://admin:password@astworkbench03:5984/member_management
```

**3. Enable CORS (for web access):**
```bash
# Add to CouchDB config
[cors]
origins = *
credentials = true
headers = accept, authorization, content-type, origin, referer
methods = GET, PUT, POST, HEAD, DELETE
```

**4. Test connection:**
```bash
curl http://admin:password@astworkbench03:5984/member_management
```

## 🖥️ Running Your App

### Web (Recommended for Testing Sync)
```powershell
npm run web
```

**You'll see:**
- Sync status badge at top (green when synced)
- Console logs: "Connected to remote CouchDB"
- Real-time sync messages

### Testing Sync

**Test 1: Add Member**
1. Add a member in the app
2. Check CouchDB:
   ```bash
   curl http://admin:password@astworkbench03:5984/member_management/_all_docs
   ```
3. You should see the new document!

**Test 2: Multi-Device Sync**
1. Open app in two browser tabs
2. Add member in tab 1
3. Refresh tab 2 - member appears!

**Test 3: Direct CouchDB Edit**
1. Edit member directly in CouchDB Fauxton
2. App updates automatically (watch sync status)

## 📊 Sync Status Indicator

The new status badge shows:

| Status | Icon | Color | Meaning |
|--------|------|-------|---------|
| Synced | ✓ | Green | All data synced |
| Syncing | ⟳ | Blue | Sync in progress |
| Error | ✕ | Red | Sync failed |
| Disconnected | ○ | Gray | Not connected |

**Location**: Top of dashboard, just below header

## 🛠️ Configuration Options

### Change Server (in `src/config/config.js`)

```javascript
couchdb: {
  url: 'http://your-server:5984/your-database',
  username: 'your-username',
  password: 'your-password',
}
```

### Disable Auto-Sync

```javascript
app: {
  enableAutoSync: false,  // Set to false
}
```

### Adjust Sync Settings

```javascript
syncOptions: {
  live: true,           // false = one-time sync
  retry: true,          // false = don't retry on error
  heartbeat: 10000,     // Increase for slower networks
  timeout: 30000,       // Request timeout
}
```

## 🔍 Monitoring Sync

### Browser Console (F12)

Watch for these messages:
```
Database initialized successfully
Connected to remote CouchDB
Sync change: { direction: 'push', ... }
Sync paused: null (all caught up)
```

### CouchDB Server Logs

```bash
# On server
tail -f /var/log/couchdb/couchdb.log
```

### Fauxton Web Interface

Visit: `http://astworkbench03:5984/_utils/`
- View all databases
- Browse documents
- Monitor replication

## ⚠️ Troubleshooting

### "Cannot connect to server"

**Check:**
1. Is server reachable? `ping astworkbench03`
2. Is CouchDB running? `curl http://astworkbench03:5984/`
3. Is port 5984 open? Check firewall
4. Is CORS enabled? (for web app)

**Fix:**
```bash
# On CouchDB server
sudo systemctl status couchdb
sudo systemctl start couchdb
```

### "401 Unauthorized"

**Check:**
1. Username/password correct in config
2. User exists in CouchDB
3. User has database permissions

**Fix:**
```bash
# Test credentials
curl http://admin:password@astworkbench03:5984/_session
```

### CORS Errors (Web only)

**Browser console shows:** "No 'Access-Control-Allow-Origin' header"

**Fix:** Enable CORS in CouchDB config or use proxy

### Sync Status Shows "Error"

**Actions:**
1. Check browser console for error message
2. Click "Retry" button in app
3. Refresh page
4. Check server connectivity

## 🔒 Security Notes

⚠️ **Current Setup**: Basic auth with plain text password

### For Production:

1. **Use HTTPS:**
   ```javascript
   url: 'https://astworkbench03:6984/member_management'
   ```

2. **Environment Variables:**
   ```javascript
   username: process.env.REACT_APP_COUCHDB_USER,
   password: process.env.REACT_APP_COUCHDB_PASSWORD,
   ```

3. **Create Restricted User:**
   - Don't use admin credentials in app
   - Create user with limited permissions
   - See COUCHDB_SETUP.md for instructions

## 📱 Mobile App Notes

### iOS
Add to `Info.plist` to allow HTTP:
```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

### Android
Add to `AndroidManifest.xml`:
```xml
android:usesCleartextTraffic="true"
```

## 🎊 Ready to Test!

### Start Your App
```powershell
npm run web
```

### What to Look For:
1. ✅ Sync status badge appears at top
2. ✅ Green badge shows "✓ Synced"
3. ✅ Console shows "Connected to remote CouchDB"
4. ✅ Add a member - it syncs to server
5. ✅ Check Fauxton - document appears

## 📚 Documentation

- **COUCHDB_SETUP.md** - Complete setup guide
- **README.md** - App documentation
- **START_HERE.md** - Getting started guide

## 🎯 Next Steps

1. ✅ Verify CouchDB is running on `astworkbench03`
2. ✅ Create database if needed
3. ✅ Enable CORS for web access
4. ✅ Run `npm run web`
5. ✅ Watch sync status indicator
6. ✅ Add a test member
7. ✅ Verify sync in Fauxton

---

## 🎉 Summary

Your app now has:
- ✅ CouchDB remote sync configured
- ✅ Auto-connect on startup
- ✅ Visual sync status indicator
- ✅ Real-time bidirectional sync
- ✅ Offline support
- ✅ Conflict resolution
- ✅ Easy configuration management

**Start the app and watch your data sync in real-time! 🚀**

```powershell
npm run web
```
