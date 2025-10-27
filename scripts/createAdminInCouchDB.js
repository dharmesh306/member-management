const PouchDB = require('pouchdb');
const PouchDBFind = require('pouchdb-find');
const CryptoJS = require('crypto-js');

// Initialize PouchDB with find plugin
PouchDB.plugin(PouchDBFind);

// CouchDB Configuration
const COUCHDB_URL = 'http://astworkbench03:5984/member_management';
const COUCHDB_USERNAME = 'admin';
const COUCHDB_PASSWORD = 'password';

// Hash password
function hashPassword(password) {
  return CryptoJS.SHA256(password).toString();
}

async function createAdminInCouchDB() {
  try {
    console.log('Connecting to CouchDB server...');
    console.log(`URL: ${COUCHDB_URL}\n`);

    // Connect to remote CouchDB
    const remoteUrl = COUCHDB_URL.replace('://', `://${COUCHDB_USERNAME}:${COUCHDB_PASSWORD}@`);
    const db = new PouchDB(remoteUrl);

    // Check connection
    try {
      await db.info();
      console.log('✓ Connected to CouchDB successfully\n');
    } catch (error) {
      console.error('❌ Cannot connect to CouchDB server!');
      console.error('Error:', error.message);
      console.error('\nPlease check:');
      console.error('1. CouchDB server is running');
      console.error('2. URL is correct: http://astworkbench03:5984');
      console.error('3. Credentials are correct');
      console.error('4. Network connectivity to the server');
      process.exit(1);
    }

    // Check if user already exists
    console.log('Checking if dharmesh4@hotmail.com already exists...');
    const existingResult = await db.find({
      selector: {
        email: 'dharmesh4@hotmail.com'
      }
    });

    if (existingResult.docs.length > 0) {
      const existingUser = existingResult.docs[0];
      console.log('\n✓ User already exists!');
      console.log(`  Name: ${existingUser.firstName} ${existingUser.lastName}`);
      console.log(`  Email: ${existingUser.email}`);
      console.log(`  Current Role: ${existingUser.isSuperAdmin ? 'Super Admin' : (existingUser.isAdmin ? 'Admin' : 'Member')}`);
      console.log(`  Status: ${existingUser.status || 'N/A'}`);

      if (existingUser.isAdmin || existingUser.isSuperAdmin) {
        console.log('\n✅ User already has admin privileges!');
        process.exit(0);
      }

      // Update existing user to admin
      console.log('\nGranting admin access...');
      existingUser.isAdmin = true;
      existingUser.status = 'approved';
      existingUser.promotedToAdminAt = new Date().toISOString();
      existingUser.promotedBy = 'system';
      existingUser.adminRequested = false;
      existingUser.updatedAt = new Date().toISOString();

      await db.put(existingUser);

      console.log('\n✅ SUCCESS! Admin access granted to dharmesh4@hotmail.com');
      console.log('Please logout and login again to see the changes.');
      process.exit(0);
    }

    // Create new admin user
    console.log('User not found. Creating new admin user...\n');

    const password = 'admin123'; // Default password - CHANGE AFTER FIRST LOGIN
    const hashedPassword = hashPassword(password);

    const adminUser = {
      _id: `member_${Date.now()}`,
      type: 'member',
      firstName: 'Dharmesh',
      lastName: 'Prajapati',
      email: 'dharmesh4@hotmail.com',
      mobile: '+1234567890', // Update with actual mobile if needed
      status: 'approved',
      isAdmin: true,
      isSuperAdmin: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      promotedToAdminAt: new Date().toISOString(),
      promotedBy: 'system',
      auth: {
        password: hashedPassword,
        createdAt: new Date().toISOString(),
        resetToken: null,
        resetTokenExpiry: null,
        lastLogin: null,
      },
      spouse: {
        firstName: '',
        lastName: '',
        email: '',
        mobile: '',
      },
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
      },
      children: [],
    };

    await db.put(adminUser);

    console.log('✅ SUCCESS! Admin user created in CouchDB:\n');
    console.log('  Name: Dharmesh Prajapati');
    console.log('  Email: dharmesh4@hotmail.com');
    console.log('  Password: admin123');
    console.log('  Role: Admin');
    console.log('  Status: Approved');
    console.log('\n🔐 IMPORTANT: Change the password after first login!');
    console.log('\nYou can now login with:');
    console.log('  Email: dharmesh4@hotmail.com');
    console.log('  Password: admin123');
    console.log('\nAdmin capabilities:');
    console.log('  - View all member records');
    console.log('  - Create new members');
    console.log('  - Edit any member record');
    console.log('  - Delete member records');
    console.log('  - Approve new registrations');
    console.log('  - Access Admin Management page');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.status) {
      console.error('Status:', error.status);
    }
    if (error.reason) {
      console.error('Reason:', error.reason);
    }
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

createAdminInCouchDB();
