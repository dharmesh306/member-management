// Load environment variables if needed
const getEnvVar = (key, defaultValue = '') => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || defaultValue;
  }
  return defaultValue;
};

const config = {
  couchdb: {
    // Remote CouchDB server URL with database name
    url: `${getEnvVar('REACT_APP_COUCHDB_URL', 'http://localhost:5984')}/${getEnvVar('REACT_APP_COUCHDB_DATABASE', 'member_management')}`,
    
    // Authentication credentials
    username: getEnvVar('REACT_APP_COUCHDB_USERNAME', 'admin'),
    password: getEnvVar('REACT_APP_COUCHDB_PASSWORD', 'password'),
    
    // Sync options
    syncOptions: {
      live: true,           // Continuous sync
      retry: true,          // Retry on failure
      heartbeat: 10000,     // Heartbeat interval (ms)
      timeout: 30000,       // Request timeout (ms)
    },
    
    // Local database name
    localDbName: getEnvVar('COUCHDB_DATABASE', 'member_management'),
  },
  
  // App settings
  app: {
    searchDebounceMs: 300,      // Search debounce delay
    enableAutoSync: getEnvVar('REACT_APP_ENABLE_AUTO_SYNC', 'true') === 'true',
  },
};

export default config;
