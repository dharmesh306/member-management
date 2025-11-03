/**
 * Check and Configure CORS for CouchDB
 */

const PouchDB = require('pouchdb');

async function checkAndConfigureCORS() {
  console.log('🔍 Checking CouchDB CORS Configuration...\n');
  
  try {
    // Connect to CouchDB server (not a specific database)
    const db = new PouchDB('http://admin:password@astworkbench03:5984/_node/_local/_config/httpd');
    
    console.log('📋 Current CORS settings:\n');
    
    // Check current CORS settings
    const corsDb = new PouchDB('http://admin:password@astworkbench03:5984/_node/_local/_config/cors');
    const info = await corsDb.allDocs({ include_docs: true });
    
    console.log('Current CORS configuration:');
    info.rows.forEach(row => {
      console.log(`  ${row.id} = ${row.doc ? JSON.stringify(row.doc) : 'N/A'}`);
    });
    
  } catch (error) {
    console.error('Error checking CORS:', error.message);
  }
  
  console.log('\n═══════════════════════════════════════════');
  console.log('To enable CORS, run these commands in CouchDB:\n');
  console.log('curl -X PUT http://admin:password@astworkbench03:5984/_node/_local/_config/httpd/enable_cors -d \'"true"\'');
  console.log('curl -X PUT http://admin:password@astworkbench03:5984/_node/_local/_config/cors/origins -d \'"*"\'');
  console.log('curl -X PUT http://admin:password@astworkbench03:5984/_node/_local/_config/cors/credentials -d \'"true"\'');
  console.log('curl -X PUT http://admin:password@astworkbench03:5984/_node/_local/_config/cors/methods -d \'"GET, PUT, POST, HEAD, DELETE"\'');
  console.log('curl -X PUT http://admin:password@astworkbench03:5984/_node/_local/_config/cors/headers -d \'"accept, authorization, content-type, origin, referer"\'');
  console.log('═══════════════════════════════════════════\n');
}

checkAndConfigureCORS()
  .then(() => {
    console.log('✅ CORS check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
