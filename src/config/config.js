// CouchDB Configuration
// Update these settings to match your CouchDB server

const config = {
  couchdb: {
    // Remote CouchDB server URL
    url: 'http://astworkbench03:5984/member_management',
    
    // Authentication credentials
    username: 'admin',
    password: 'password',
    
    // Sync options
    syncOptions: {
      live: true,           // Continuous sync
      retry: true,          // Retry on failure
      heartbeat: 10000,     // Heartbeat interval (ms)
      timeout: 30000,       // Request timeout (ms)
    },
    
    // Local database name
    localDbName: 'member_management',
  },
  
  // App settings
  app: {
    searchDebounceMs: 300,      // Search debounce delay
    enableAutoSync: true,        // Enable automatic sync on init
  },
};

export default config;
