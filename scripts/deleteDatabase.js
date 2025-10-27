const PouchDB = require('pouchdb');

// Configure database connection with admin credentials
const COUCHDB_URL = 'http://admin:password@astworkbench03:5984';
const DB_NAME = 'member_management';

async function deleteDatabase() {
  try {
    console.log('🗑️  Deleting entire database...\n');
    console.log(`⚠️  WARNING: This will completely DELETE the database: ${DB_NAME}`);
    console.log('⚠️  This operation cannot be undone!\n');

    // Connect to remote database
    const db = new PouchDB(`${COUCHDB_URL}/${DB_NAME}`);

    // Get database info first
    try {
      const info = await db.info();
      console.log('📊 Database Info:');
      console.log(`   Name: ${info.db_name}`);
      console.log(`   Documents: ${info.doc_count}`);
      console.log(`   Size: ${(info.sizes?.active || 0) / 1024} KB\n`);
    } catch (e) {
      console.log('⚠️  Could not get database info (database may not exist)\n');
    }

    // Delete the database
    console.log('🗑️  Destroying database...');
    await db.destroy();

    console.log('\n✅ SUCCESS!');
    console.log(`✅ Database "${DB_NAME}" has been completely deleted!`);
    console.log('\n💡 The database will be recreated automatically when you:');
    console.log('   - Register a new user');
    console.log('   - Start the application');
    console.log('   - Run initialization scripts');

  } catch (error) {
    console.error('\n❌ Error deleting database:', error.message);
    
    if (error.status === 404) {
      console.log('\n💡 Database does not exist or is already deleted');
    }
    
    process.exit(1);
  }
}

// Run the script
deleteDatabase();
