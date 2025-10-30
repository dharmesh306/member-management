const PouchDB = require('pouchdb');

const config = {
  localDB: 'http://admin:password@localhost:5984/member_management'
};

async function testLocalConnection() {
  console.log('Testing connection to local CouchDB...');
  console.log('Server:', config.localDB);
  
  const db = new PouchDB(config.localDB);
  
  try {
    // First, try to create the database if it doesn't exist
    try {
      await db.info();
    } catch (e) {
      if (e.status === 404) {
        console.log('\nCreating database "member_management"...');
        await new PouchDB(config.localDB.replace('/member_management', '')).createDatabase('member_management');
      }
    }

    const info = await db.info();
    console.log('\n✅ Connection successful!');
    console.log('Database info:', JSON.stringify(info, null, 2));
  } catch (error) {
    console.error('\n❌ Connection failed!');
    console.error('Error details:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\nPossible issues:');
      console.log('1. CouchDB is not running');
      console.log('2. CouchDB is not installed');
      console.log('3. Wrong port number');
      console.log('\nSolutions:');
      console.log('1. Install CouchDB if not installed');
      console.log('2. Start CouchDB service');
      console.log('3. Check if CouchDB is running: http://localhost:5984/_utils');
    } else if (error.status === 401) {
      console.log('\nPossible issues:');
      console.log('1. Wrong admin credentials');
      console.log('2. CouchDB admin account not set up');
      console.log('\nDefault credentials are:');
      console.log('Username: admin');
      console.log('Password: admin');
    }
  }
}

testLocalConnection()
  .catch(console.error)
  .finally(() => process.exit());