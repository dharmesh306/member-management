const PouchDB = require('pouchdb');
const PouchDBFind = require('pouchdb-find');

// Initialize PouchDB with find plugin
PouchDB.plugin(PouchDBFind);

async function makeUserAdmin() {
  try {
    // Initialize database
    const db = new PouchDB('member_management', {
      auto_compaction: true,
    });

    console.log('Database initialized...');
    console.log('Searching for user: dharmesh4@hotmail.com');

    // Find the user by email
    const result = await db.find({
      selector: {
        $or: [
          { email: 'dharmesh4@hotmail.com' },
          { 'spouse.email': 'dharmesh4@hotmail.com' }
        ]
      }
    });

    if (result.docs.length === 0) {
      console.log('\n❌ User not found with email: dharmesh4@hotmail.com');
      console.log('Please make sure the user is registered first.');
      process.exit(1);
    }

    const user = result.docs[0];
    console.log('\n✓ User found:');
    console.log(`  Name: ${user.firstName} ${user.lastName}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Current Status: ${user.status || 'N/A'}`);
    console.log(`  Current Role: ${user.isAdmin ? 'Admin' : (user.isSuperAdmin ? 'Super Admin' : 'Member')}`);

    // Check if already admin
    if (user.isAdmin || user.isSuperAdmin) {
      console.log('\n✓ User already has admin privileges!');
      process.exit(0);
    }

    // Update user to admin
    user.isAdmin = true;
    user.status = 'approved'; // Ensure status is approved
    user.promotedToAdminAt = new Date().toISOString();
    user.promotedBy = 'system';
    user.adminRequested = false; // Clear any pending request
    user.updatedAt = new Date().toISOString();

    await db.put(user);

    console.log('\n✅ SUCCESS! Admin access granted to dharmesh4@hotmail.com');
    console.log('User can now:');
    console.log('  - View all member records');
    console.log('  - Create new members');
    console.log('  - Edit any member record');
    console.log('  - Delete member records');
    console.log('  - Approve new registrations');
    console.log('  - Access Admin Management page');
    console.log('\nPlease logout and login again to see the changes.');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

makeUserAdmin();
