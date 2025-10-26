# CouchDB Remote Sync Configuration

## 🔗 Current Configuration

Your app is configured to sync with a remote CouchDB server:

- **Server**: `astworkbench03:5984`
- **Database**: `member_management`
- **Username**: `admin`
- **Password**: `password`
- **Auto-sync**: ✅ Enabled

## 🚀 How It Works

The app will automatically:
1. Store data locally (IndexedDB on web, AsyncStorage on mobile)
2. Sync with the remote CouchDB server at `astworkbench03`
3. Keep data synchronized in real-time
4. Work offline and sync when connection is restored

## 📋 Prerequisites

### On CouchDB Server (astworkbench03)

1. **Ensure CouchDB is running:**
   ```bash
   curl http://astworkbench03:5984/
   ```
   Should return: `{"couchdb":"Welcome","version":"..."}`

2. **Create the database (if not exists):**
   ```bash
   curl -X PUT http://admin:password@astworkbench03:5984/member_management
   ```

3. **Enable CORS (for web access):**
   ```bash
   # Edit CouchDB config or use Fauxton
   [cors]
   origins = *
   credentials = true
   headers = accept, authorization, content-type, origin, referer
   methods = GET, PUT, POST, HEAD, DELETE
   ```

4. **Verify authentication:**
   ```bash
   curl http://admin:password@astworkbench03:5984/member_management
   ```

## 🔧 Configuration File

Settings are in `src/config/config.js`:

```javascript
const config = {
  couchdb: {
    url: 'http://astworkbench03:5984/member_management',
    username: 'admin',
    password: 'password',
    syncOptions: {
      live: true,           // Continuous sync
      retry: true,          // Retry on failure
      heartbeat: 10000,     // Heartbeat (ms)
      timeout: 30000,       // Timeout (ms)
    },
  },
  app: {
    enableAutoSync: true,   // Auto-connect on app start
  },
};
```

## 🎯 Testing the Connection

### From Browser Console (F12)

```javascript
// Check sync status
DatabaseService.syncHandler

// Manual sync
DatabaseService.connectToRemote(
  'http://astworkbench03:5984/member_management',
  'admin',
  'password'
);

// Check remote database
fetch('http://admin:password@astworkbench03:5984/member_management')
  .then(r => r.json())
  .then(console.log);
```

### From Terminal

```powershell
# Test CouchDB connection
curl http://admin:password@astworkbench03:5984/member_management

# Check all documents
curl http://admin:password@astworkbench03:5984/member_management/_all_docs

# Get specific document
curl http://admin:password@astworkbench03:5984/member_management/member_1234567890
```

## 🔄 Sync Behavior

### Automatic Sync Events

The app listens for:
- **change**: Data changed (local or remote)
- **paused**: Sync paused (caught up)
- **active**: Sync resumed
- **denied**: Permission denied
- **error**: Sync error

### Viewing Sync Logs

Open browser console (F12) to see:
```
Database initialized successfully
Connected to remote CouchDB
Sync change: { direction: 'push', ... }
Sync paused: null (all caught up)
```

## 🛠️ Troubleshooting

### Connection Issues

**Problem**: Cannot connect to CouchDB server

**Solutions**:
1. Verify server is accessible:
   ```powershell
   ping astworkbench03
   curl http://astworkbench03:5984/
   ```

2. Check firewall rules (port 5984 must be open)

3. Verify CouchDB is running on the server

4. Check CORS settings in CouchDB config

### Authentication Issues

**Problem**: 401 Unauthorized errors

**Solutions**:
1. Verify credentials in `src/config/config.js`
2. Check user exists in CouchDB:
   ```bash
   curl http://admin:password@astworkbench03:5984/_users/org.couchdb.user:admin
   ```

3. Ensure user has permissions on the database

### CORS Issues (Web Only)

**Problem**: CORS errors in browser console

**Solutions**:
1. Enable CORS in CouchDB (see Prerequisites above)
2. Or use a proxy server
3. Or access CouchDB admin interface at:
   `http://astworkbench03:5984/_utils/#/_config`

### Sync Not Working

**Problem**: Data not syncing between devices

**Solutions**:
1. Check browser console for errors
2. Verify network connectivity
3. Check CouchDB logs:
   ```bash
   tail -f /var/log/couchdb/couchdb.log
   ```

4. Manually trigger sync:
   ```javascript
   DatabaseService.disconnectSync();
   DatabaseService.connectToRemote(...);
   ```

## 🔒 Security Considerations

### For Production

⚠️ **Current setup uses basic auth with plain text password**

**Recommended for production:**

1. **Use environment variables:**
   ```javascript
   // Don't hardcode credentials
   username: process.env.COUCHDB_USER,
   password: process.env.COUCHDB_PASSWORD,
   ```

2. **Use HTTPS:**
   ```javascript
   url: 'https://astworkbench03:6984/member_management',
   ```

3. **Create restricted user:**
   ```bash
   # Create user with limited permissions
   curl -X PUT http://admin:password@astworkbench03:5984/_users/org.couchdb.user:memberapp \
        -H "Content-Type: application/json" \
        -d '{"name":"memberapp","password":"secure_password","roles":[],"type":"user"}'
   
   # Set database permissions
   curl -X PUT http://admin:password@astworkbench03:5984/member_management/_security \
        -H "Content-Type: application/json" \
        -d '{"admins":{"names":[],"roles":[]},"members":{"names":["memberapp"],"roles":[]}}'
   ```

4. **Use SSL certificates:**
   - Install SSL cert on CouchDB server
   - Update URL to use `https://`

## 📊 Monitoring Sync

### Add Sync Status Indicator

You can add this to your Dashboard component:

```javascript
const [syncStatus, setSyncStatus] = useState('disconnected');

useEffect(() => {
  if (DatabaseService.syncHandler) {
    DatabaseService.syncHandler
      .on('change', () => setSyncStatus('syncing'))
      .on('paused', () => setSyncStatus('synced'))
      .on('active', () => setSyncStatus('syncing'))
      .on('error', () => setSyncStatus('error'));
  }
}, []);

// Display status
<Text style={{ color: syncStatus === 'synced' ? 'green' : 'orange' }}>
  {syncStatus === 'synced' ? '✓ Synced' : '⟳ Syncing...'}
</Text>
```

## 🔄 Disable Auto-Sync

To disable automatic sync and connect manually:

**In `src/config/config.js`:**
```javascript
app: {
  enableAutoSync: false,  // Disable auto-sync
}
```

**Connect manually when needed:**
```javascript
// In your component
DatabaseService.connectToRemote(
  'http://astworkbench03:5984/member_management',
  'admin',
  'password'
);
```

## 📱 Mobile Considerations

### iOS App Transport Security

Add to `ios/MemberManagement/Info.plist`:
```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

### Android Network Security

Add to `android/app/src/main/AndroidManifest.xml`:
```xml
<application
    android:usesCleartextTraffic="true">
```

## 🎯 Benefits of Remote Sync

✅ **Multi-device sync**: Access data from any device
✅ **Backup**: Data is backed up on the server
✅ **Collaboration**: Multiple users can share data
✅ **Offline-first**: Works without connection, syncs when online
✅ **Conflict resolution**: Automatic conflict handling
✅ **Real-time updates**: Changes sync immediately

## 📚 Additional Resources

- [CouchDB Documentation](https://docs.couchdb.org/)
- [PouchDB Sync Guide](https://pouchdb.com/guides/replication.html)
- [CouchDB Security](https://docs.couchdb.org/en/stable/intro/security.html)
- [CORS Configuration](https://docs.couchdb.org/en/stable/config/http.html#cors)

---

**Your app is now configured to sync with CouchDB! 🎉**

Start the app and watch the console for sync messages:
```powershell
npm run web
```
