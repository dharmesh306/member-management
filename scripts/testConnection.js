/**
 * Test CouchDB Connection
 */

const PouchDB = require('pouchdb');
const PouchDBFind = require('pouchdb-find');

PouchDB.plugin(PouchDBFind);

const testConnection = async () => {
  console.log('🔍 Testing CouchDB Connection...\n');
  
  const tests = [
    {
      name: 'Direct URL (with auth)',
      url: 'http://admin:password@astworkbench03:5984/member_management'
    },
    {
      name: 'HTTP URL (localhost fallback)',
      url: 'http://admin:password@localhost:5984/member_management'
    },
    {
      name: 'Server root',
      url: 'http://admin:password@astworkbench03:5984'
    }
  ];

  for (const test of tests) {
    console.log(`Testing: ${test.name}`);
    console.log(`URL: ${test.url.replace(/admin:password@/, 'admin:***@')}`);
    
    try {
      const db = new PouchDB(test.url, {
        skip_setup: false,
        ajax: {
          timeout: 10000,
        }
      });
      
      const info = await db.info();
      console.log('✅ SUCCESS!');
      console.log('   Database:', info.db_name);
      console.log('   Docs:', info.doc_count);
      console.log('   Update Seq:', info.update_seq);
      console.log('');
      
      // Try to fetch a document
      try {
        const result = await db.find({
          selector: { type: 'member' },
          limit: 1
        });
        console.log('✅ Query successful, found', result.docs.length, 'document(s)\n');
      } catch (queryErr) {
        console.log('⚠️  Database exists but query failed:', queryErr.message, '\n');
      }
      
      return true;
    } catch (error) {
      console.log('❌ FAILED');
      console.log('   Error:', error.message);
      if (error.status) {
        console.log('   Status:', error.status);
      }
      if (error.reason) {
        console.log('   Reason:', error.reason);
      }
      console.log('');
    }
  }
  
  console.log('\n═══════════════════════════════════════════');
  console.log('All connection tests failed!');
  console.log('═══════════════════════════════════════════');
  console.log('\n🔧 Troubleshooting steps:');
  console.log('1. Verify CouchDB is running on astworkbench03');
  console.log('2. Check firewall settings');
  console.log('3. Verify credentials (admin/password)');
  console.log('4. Test from browser: http://astworkbench03:5984/_utils');
  console.log('5. Check CORS settings in CouchDB');
  
  return false;
};

testConnection()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n❌ Unexpected error:', error);
    process.exit(1);
  });
