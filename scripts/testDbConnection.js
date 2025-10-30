const PouchDB = require('pouchdb');

const config = {
  remoteDB: 'http://localhost:5984/member_management'
};

async function testConnection() {
  console.log('Testing connection to CouchDB...');
  const db = new PouchDB(config.remoteDB);
  
  try {
    const info = await db.info();
    console.log('✅ Connection successful!');
    console.log('Database info:', info);
  } catch (error) {
    console.error('❌ Connection failed!');
    console.error('Error details:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\nPossible issues:');
      console.log('1. CouchDB server is not running');
      console.log('2. Wrong server address or port');
      console.log('3. Firewall blocking connection');
    } else if (error.status === 401) {
      console.log('\nPossible issues:');
      console.log('1. Invalid admin credentials');
      console.log('2. Authentication required but not provided');
    } else if (error.status === 404) {
      console.log('\nPossible issues:');
      console.log('1. Database "member_management" does not exist');
      console.log('2. Wrong database name');
    }
  }
}

testConnection()
  .catch(console.error)
  .finally(() => process.exit());