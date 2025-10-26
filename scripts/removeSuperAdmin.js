/**
 * Remove Super Admin Account
 * This script deletes the super admin account from the database
 */

const PouchDB = require('pouchdb');
const PouchDBFind = require('pouchdb-find');

PouchDB.plugin(PouchDBFind);

const config = {
  remoteDB: 'http://admin:password@astworkbench03:5984/member_management',
};

const db = new PouchDB(config.remoteDB);

async function removeSuperAdmin() {
  console.log('🗑️  Removing Super Admin Account...\n');

  const SUPER_ADMIN_EMAIL = 'dharmesh4@hotmail.com';
  const SUPER_ADMIN_MOBILE = '+13362540431';

  try {
    // Find all documents related to super admin
    const allDocs = await db.find({
      selector: {
        $or: [
          { email: SUPER_ADMIN_EMAIL },
          { mobile: SUPER_ADMIN_MOBILE },
          { isSuperAdmin: true },
          { cannotBeDeleted: true }
        ]
      },
      limit: 100
    });

    if (allDocs.docs.length === 0) {
      console.log('⚠️  No super admin documents found');
      return;
    }

    console.log(`Found ${allDocs.docs.length} document(s) to delete:\n`);

    const docsToDelete = [];
    
    for (const doc of allDocs.docs) {
      console.log(`📄 ${doc._id}`);
      console.log(`   Type: ${doc.type}`);
      console.log(`   Email: ${doc.email || 'N/A'}`);
      console.log(`   Mobile: ${doc.mobile || 'N/A'}`);
      console.log(`   Super Admin: ${doc.isSuperAdmin ? 'Yes' : 'No'}`);
      console.log(`   Cannot Be Deleted: ${doc.cannotBeDeleted ? 'Yes' : 'No'}`);
      console.log('');

      // Mark for deletion
      docsToDelete.push({
        ...doc,
        _deleted: true
      });
    }

    // Confirm deletion
    console.log(`\n⚠️  About to delete ${docsToDelete.length} document(s)\n`);

    // Delete all documents
    const results = await db.bulkDocs(docsToDelete);
    
    let successCount = 0;
    let errorCount = 0;

    for (const result of results) {
      if (result.ok) {
        successCount++;
      } else {
        errorCount++;
        console.log(`❌ Error deleting ${result.id}:`, result.error || result.message);
      }
    }

    console.log('\n═══════════════════════════════════════');
    console.log('✅ Deletion Summary');
    console.log('═══════════════════════════════════════');
    console.log(`Total documents: ${docsToDelete.length}`);
    console.log(`Successfully deleted: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log('═══════════════════════════════════════\n');

    if (successCount > 0) {
      console.log('✅ Super admin account has been removed');
      console.log('ℹ️  You can recreate it by running: npm run create-super-admin\n');
    }

  } catch (error) {
    console.error('❌ Error removing super admin:', error);
    throw error;
  }
}

removeSuperAdmin()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
