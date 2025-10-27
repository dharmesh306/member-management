const PouchDB = require('pouchdb');
const PouchDBFind = require('pouchdb-find');

PouchDB.plugin(PouchDBFind);

// Configure database connection with admin credentials
const COUCHDB_URL = 'http://admin:password@astworkbench03:5984';
const DB_NAME = 'member_management';

async function promoteToAdmin() {
  try {
    console.log('👑 PROMOTE MEMBER TO ADMIN\n');

    // Connect to remote database
    const db = new PouchDB(`${COUCHDB_URL}/${DB_NAME}`);

    // Get the first member (which should be member #1 from our 600 members)
    console.log('🔍 Searching for first member...\n');
    
    const result = await db.allDocs({ 
      include_docs: true,
      limit: 10
    });

    // Find a member document
    let member = null;
    for (const row of result.rows) {
      if (row.doc.type === 'member' && !row.doc.isAdmin) {
        member = row.doc;
        break;
      }
    }

    if (!member) {
      console.log('❌ No non-admin member found!');
      console.log('💡 All members might already be admins, or no members exist.\n');
      
      // Show first few members
      console.log('📋 First few documents:');
      result.rows.slice(0, 5).forEach((row, i) => {
        console.log(`   ${i + 1}. Type: ${row.doc.type}, Admin: ${row.doc.isAdmin}`);
        if (row.doc.firstName) {
          console.log(`      Name: ${row.doc.firstName} ${row.doc.lastName}`);
        }
      });
      return;
    }

    console.log('✅ Found member:');
    console.log(`   Name: ${member.firstName} ${member.lastName}`);
    console.log(`   Email: ${member.email}`);
    console.log(`   Mobile: ${member.mobile || 'N/A'}`);
    console.log(`   Current Status: ${member.isAdmin ? 'Admin' : 'Regular Member'}\n`);

    // Promote to admin
    console.log('⚙️  Promoting to admin...');
    member.isAdmin = true;
    member.updatedAt = new Date().toISOString();

    const updateResult = await db.put(member);
    
    if (updateResult.ok) {
      console.log('✅ SUCCESS!\n');
      console.log('═══════════════════════════════════════════');
      console.log(`👑 ${member.firstName} ${member.lastName} is now an ADMIN!`);
      console.log('═══════════════════════════════════════════\n');
      console.log('💡 Admin Privileges Granted:');
      console.log('   ✓ Can approve/reject member registrations');
      console.log('   ✓ Can promote other members to admin');
      console.log('   ✓ Can create, edit, and delete all members');
      console.log('   ✓ Can access Admin Management panel');
      console.log('   ✓ Full system access\n');
    } else {
      console.log('❌ Failed to update member');
    }

  } catch (error) {
    console.error('❌ Error promoting member:', error.message);
    process.exit(1);
  }
}

// Run the script
promoteToAdmin();
