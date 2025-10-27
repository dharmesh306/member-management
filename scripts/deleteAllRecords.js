/**
 * DELETE ALL RECORDS FROM DATABASE
 * WARNING: This will remove ALL data!
 */

const PouchDB = require('pouchdb');
const PouchDBFind = require('pouchdb-find');

PouchDB.plugin(PouchDBFind);

const config = {
  remoteDB: 'http://admin:password@astworkbench03:5984/member_management',
};

const db = new PouchDB(config.remoteDB);

async function deleteAllRecords() {
  console.log('⚠️  WARNING: This will DELETE ALL RECORDS from the database!');
  console.log('Database:', config.remoteDB);
  console.log('═══════════════════════════════════════════\n');

  try {
    // Get all documents
    const allDocs = await db.allDocs({ include_docs: true });
    console.log(`📊 Found ${allDocs.rows.length} total documents\n`);

    if (allDocs.rows.length === 0) {
      console.log('✅ Database is already empty');
      return;
    }

    // Count by type
    const counts = {};
    allDocs.rows.forEach(row => {
      if (!row.id.startsWith('_design')) {
        const type = row.doc.type || 'unknown';
        counts[type] = (counts[type] || 0) + 1;
      }
    });

    console.log('📋 Records by type:');
    Object.entries(counts).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });
    console.log('');

    // Filter out design documents
    const docsToDelete = allDocs.rows
      .filter(row => !row.id.startsWith('_design'))
      .map(row => ({
        _id: row.id,
        _rev: row.value.rev,
        _deleted: true
      }));

    console.log(`🗑️  Deleting ${docsToDelete.length} records...`);

    // Delete all documents
    const result = await db.bulkDocs(docsToDelete);
    
    // Count successes and failures
    const successes = result.filter(r => r.ok).length;
    const failures = result.filter(r => !r.ok).length;

    console.log('\n✅ DELETION COMPLETE!');
    console.log('═══════════════════════════════════════════');
    console.log(`✅ Deleted: ${successes} records`);
    if (failures > 0) {
      console.log(`❌ Failed: ${failures} records`);
    }
    console.log('═══════════════════════════════════════════');
    
    console.log('\n💡 Database is now empty!');
    console.log('   You can start fresh with new registrations');

  } catch (error) {
    console.error('❌ Error deleting records:', error);
    throw error;
  }
}

// Confirmation prompt
console.log('\n⚠️  ⚠️  ⚠️  DANGER ZONE ⚠️  ⚠️  ⚠️\n');
console.log('This script will DELETE ALL DATA from the database!');
console.log('This includes:');
console.log('  - All members');
console.log('  - All users');
console.log('  - All registrations');
console.log('  - All admin records');
console.log('\n❌ THIS CANNOT BE UNDONE! ❌\n');
console.log('Starting deletion in 3 seconds...');
console.log('Press Ctrl+C to cancel!\n');

setTimeout(() => {
  deleteAllRecords()
    .then(() => {
      console.log('\n✅ Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error.message);
      process.exit(1);
    });
}, 3000);
