const PouchDB = require('pouchdb');
const PouchDBFind = require('pouchdb-find');
const crypto = require('crypto');

PouchDB.plugin(PouchDBFind);

// Configure database connection with admin credentials
const COUCHDB_URL = 'http://admin:password@astworkbench03:5984';
const DB_NAME = 'member_management';

// Hash password using SHA256 (same as AuthService)
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function addPasswordToMember() {
  try {
    console.log('🔐 ADD PASSWORD TO MEMBER\n');

    // Connect to remote database
    const db = new PouchDB(`${COUCHDB_URL}/${DB_NAME}`);

    // Find Jennifer Johnson (the admin we just promoted)
    console.log('🔍 Searching for member...\n');
    
    const result = await db.find({
      selector: {
        type: 'member',
        email: 'jennifer.johnson10@hotmail.com'
      }
    });

    if (result.docs.length === 0) {
      console.log('❌ Member not found!');
      return;
    }

    const member = result.docs[0];

    console.log('✅ Found member:');
    console.log(`   Name: ${member.firstName} ${member.lastName}`);
    console.log(`   Email: ${member.email}`);
    console.log(`   Admin: ${member.isAdmin ? 'Yes' : 'No'}\n`);

    // Hash the password
    console.log('⚙️  Hashing password...');
    const password = 'abc123';
    const passwordHash = hashPassword(password);

    // Update member with password
    console.log('💾 Saving password to member account...');
    member.passwordHash = passwordHash;
    member.updatedAt = new Date().toISOString();

    await db.put(member);

    console.log('✅ SUCCESS!\n');
    console.log('═══════════════════════════════════════════');
    console.log('🔐 Password added to member account!');
    console.log('═══════════════════════════════════════════\n');
    console.log('📋 Login Credentials:');
    console.log(`   Email: ${member.email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role: ${member.isAdmin ? 'Admin' : 'Member'}\n`);
    console.log('💡 The member can now login to the application!');

  } catch (error) {
    console.error('❌ Error adding password:', error.message);
    process.exit(1);
  }
}

// Run the script
addPasswordToMember();
