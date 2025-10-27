const PouchDB = require('pouchdb');
const PouchDBFind = require('pouchdb-find');

// Initialize PouchDB with find plugin
PouchDB.plugin(PouchDBFind);

async function debugPendingRegistrations() {
  try {
    // Connect to remote CouchDB
    const config = {
      couchdb: {
        url: 'http://astworkbench03:5984',
        username: 'admin',
        password: 'password',
        dbName: 'member_management'
      }
    };

    const dbUrl = `${config.couchdb.url}/${config.couchdb.dbName}`;
    const db = new PouchDB(dbUrl, {
      auth: {
        username: config.couchdb.username,
        password: config.couchdb.password
      }
    });

    console.log('\n=== Checking CouchDB Database ===');
    console.log(`URL: ${dbUrl}\n`);

    // Get all documents
    const allDocs = await db.allDocs({
      include_docs: true,
      limit: 1000
    });

    console.log(`Total documents: ${allDocs.rows.length}\n`);

    // Filter members
    const members = allDocs.rows
      .map(row => row.doc)
      .filter(doc => doc._id && doc._id.startsWith('member_'));

    console.log(`Total members: ${members.length}\n`);

    // Group by status
    const byStatus = {
      pending: [],
      approved: [],
      denied: [],
      undefined: []
    };

    members.forEach(member => {
      const status = member.status || 'undefined';
      if (byStatus[status]) {
        byStatus[status].push(member);
      } else {
        byStatus[status] = [member];
      }
    });

    console.log('=== Members by Status ===');
    console.log(`Pending: ${byStatus.pending.length}`);
    console.log(`Approved: ${byStatus.approved.length}`);
    console.log(`Denied: ${byStatus.denied.length}`);
    console.log(`Undefined: ${byStatus.undefined.length}\n`);

    // Show pending members
    if (byStatus.pending.length > 0) {
      console.log('=== Pending Registrations ===');
      byStatus.pending.forEach((member, index) => {
        console.log(`\n${index + 1}. ${member.firstName} ${member.lastName}`);
        console.log(`   Email: ${member.email}`);
        console.log(`   Mobile: ${member.mobile}`);
        console.log(`   Status: ${member.status}`);
        console.log(`   Type: ${member.type || 'NOT SET'}`);
        console.log(`   Created: ${member.createdAt || 'NOT SET'}`);
        console.log(`   ID: ${member._id}`);
      });
    } else {
      console.log('❌ No pending registrations found\n');
    }

    // Show all members summary
    console.log('\n=== All Members Summary ===');
    members.slice(0, 10).forEach((member, index) => {
      console.log(`${index + 1}. ${member.firstName} ${member.lastName} - Status: ${member.status || 'undefined'} - Type: ${member.type || 'NOT SET'}`);
    });

    if (members.length > 10) {
      console.log(`... and ${members.length - 10} more`);
    }

    // Check indexes
    console.log('\n=== Checking Indexes ===');
    try {
      const indexes = await db.getIndexes();
      console.log('Indexes found:', indexes.indexes.length);
      indexes.indexes.forEach(index => {
        console.log(`  - ${index.name}: [${index.def.fields.map(f => Object.keys(f)[0]).join(', ')}]`);
      });
    } catch (error) {
      console.log('Could not fetch indexes:', error.message);
    }

    // Try the query that AdminManagement uses
    console.log('\n=== Testing Query ===');
    try {
      const result = await db.find({
        selector: {
          type: 'member',
          status: 'pending'
        }
      });
      console.log(`Query result: ${result.docs.length} pending registrations`);
      
      if (result.docs.length === 0 && byStatus.pending.length > 0) {
        console.log('\n⚠️  WARNING: Query returned 0 results but database has pending members!');
        console.log('This indicates an issue with:');
        console.log('  1. Missing "type" field on member documents');
        console.log('  2. Missing indexes');
        console.log('  3. Query selector not matching documents');
      }
    } catch (error) {
      console.log('Query failed:', error.message);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

debugPendingRegistrations();
