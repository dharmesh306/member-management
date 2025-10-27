const PouchDB = require('pouchdb');
const PouchDBFind = require('pouchdb-find');

// Initialize PouchDB with find plugin
PouchDB.plugin(PouchDBFind);

async function listAllUsers() {
  try {
    // Initialize database
    const db = new PouchDB('member_management', {
      auto_compaction: true,
    });

    console.log('Database initialized...');
    console.log('Fetching all members and users...\n');

    // Get all documents
    const allDocs = await db.allDocs({
      include_docs: true,
      startkey: 'member_',
      endkey: 'member_\ufff0',
    });

    console.log(`Found ${allDocs.rows.length} members:\n`);

    if (allDocs.rows.length === 0) {
      console.log('❌ No members found in database.');
      console.log('Please register a member first or check if the database is empty.');
      process.exit(0);
    }

    allDocs.rows.forEach((row, index) => {
      const doc = row.doc;
      console.log(`${index + 1}. ${doc.firstName} ${doc.lastName}`);
      console.log(`   Email: ${doc.email}`);
      console.log(`   Mobile: ${doc.mobile}`);
      console.log(`   Status: ${doc.status || 'N/A'}`);
      console.log(`   Role: ${doc.isSuperAdmin ? 'Super Admin' : (doc.isAdmin ? 'Admin' : 'Member')}`);
      console.log(`   ID: ${doc._id}`);
      if (doc.spouse && doc.spouse.email) {
        console.log(`   Spouse Email: ${doc.spouse.email}`);
      }
      console.log('');
    });

    // Also check for user type documents
    const userDocs = await db.find({
      selector: {
        type: 'user'
      }
    });

    if (userDocs.docs.length > 0) {
      console.log(`\nFound ${userDocs.docs.length} user accounts:\n`);
      userDocs.docs.forEach((doc, index) => {
        console.log(`${index + 1}. ${doc.firstName} ${doc.lastName}`);
        console.log(`   Email: ${doc.email}`);
        console.log(`   Role: ${doc.isSuperAdmin ? 'Super Admin' : (doc.isAdmin ? 'Admin' : 'User')}`);
        console.log(`   ID: ${doc._id}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

listAllUsers();
