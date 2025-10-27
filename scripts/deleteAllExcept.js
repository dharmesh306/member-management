/**
 * Delete all records except specified email
 */

const PouchDB = require('pouchdb');
const PouchDBFind = require('pouchdb-find');

PouchDB.plugin(PouchDBFind);

const config = {
  remoteDB: 'http://admin:password@astworkbench03:5984/member_management',
};

const db = new PouchDB(config.remoteDB);

// Email to keep
const KEEP_EMAIL = 'michael.j@example.com';

async function deleteAllExcept() {
  console.log('⚠️  ⚠️  ⚠️  SELECTIVE DELETION ⚠️  ⚠️  ⚠️\n');
  console.log(`✅ Keeping: ${KEEP_EMAIL}`);
  console.log('❌ Deleting: All other records\n');
  console.log('Starting deletion in 3 seconds...');
  console.log('Press Ctrl+C to cancel!\n');

  await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    // Get all documents
    const result = await db.allDocs({ include_docs: true });
    
    console.log('═══════════════════════════════════════════');
    console.log(`📊 Found ${result.rows.length} total documents\n`);

    // Separate records to keep and delete
    const toKeep = [];
    const toDelete = [];
    const stats = {};

    result.rows.forEach(row => {
      const doc = row.doc;
      
      // Skip design documents
      if (doc._id.startsWith('_design/')) {
        return;
      }

      // Track types
      if (!stats[doc.type]) {
        stats[doc.type] = 0;
      }
      stats[doc.type]++;

      // Check if this record should be kept
      if (doc.email === KEEP_EMAIL) {
        toKeep.push(doc);
      } else {
        toDelete.push(doc);
      }
    });

    console.log('📋 Records by type:');
    Object.entries(stats).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });
    console.log('');

    console.log(`✅ Records to keep: ${toKeep.length}`);
    toKeep.forEach(doc => {
      console.log(`   - ${doc.type}: ${doc.firstName} ${doc.lastName} (${doc.email})`);
    });
    console.log('');

    console.log(`🗑️  Deleting ${toDelete.length} records...\n`);

    // Mark documents for deletion
    const deleteDocs = toDelete.map(doc => ({
      ...doc,
      _deleted: true
    }));

    // Bulk delete
    if (deleteDocs.length > 0) {
      await db.bulkDocs(deleteDocs);
    }

    console.log('═══════════════════════════════════════════');
    console.log('✅ DELETION COMPLETE!');
    console.log('═══════════════════════════════════════════');
    console.log(`✅ Kept: ${toKeep.length} records (${KEEP_EMAIL})`);
    console.log(`✅ Deleted: ${deleteDocs.length} records`);
    console.log('═══════════════════════════════════════════\n');

    if (toKeep.length > 0) {
      console.log('💡 Remaining account:');
      toKeep.forEach(doc => {
        console.log(`   📧 Email: ${doc.email}`);
        console.log(`   👤 Name: ${doc.firstName} ${doc.lastName}`);
        console.log(`   🔑 Type: ${doc.type}`);
        console.log(`   👑 Admin: ${doc.isAdmin ? 'Yes' : 'No'}`);
        console.log('');
      });
      
      if (toKeep.some(doc => doc.type === 'user' && doc.isAdmin)) {
        console.log('🔐 Login credentials:');
        console.log(`   📧 Email: ${KEEP_EMAIL}`);
        console.log(`   🔑 Password: Member123!`);
        console.log('\n✅ You can login and have full admin access!\n');
      }
    }

  } catch (error) {
    console.error('❌ Error during deletion:', error);
    throw error;
  }
}

deleteAllExcept()
  .then(() => {
    console.log('✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });
