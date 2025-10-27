const PouchDB = require('pouchdb');
const PouchDBFind = require('pouchdb-find');
const CryptoJS = require('crypto-js');

// Initialize PouchDB with find plugin
PouchDB.plugin(PouchDBFind);

// Hash password
function hashPassword(password) {
  return CryptoJS.SHA256(password).toString();
}

async function createAdminUser() {
  try {
    // Initialize database
    const db = new PouchDB('member_management', {
      auto_compaction: true,
    });

    console.log('Database initialized...');
    console.log('Creating admin user: dharmesh4@hotmail.com\n');

    // Check if user already exists
    const existingResult = await db.find({
      selector: {
        email: 'dharmesh4@hotmail.com'
      }
    });

    if (existingResult.docs.length > 0) {
      console.log('❌ User already exists!');
      console.log('Run the makeUserAdmin.js script instead to grant admin access.');
      process.exit(1);
    }

    // Create admin user
    const password = 'admin123'; // Default password - CHANGE AFTER FIRST LOGIN
    const hashedPassword = hashPassword(password);

    const adminUser = {
      _id: `member_${Date.now()}`,
      type: 'member',
      firstName: 'Dharmesh',
      lastName: 'Prajapati',
      email: 'dharmesh4@hotmail.com',
      mobile: '+1234567890', // Update with actual mobile
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

    console.log('✅ SUCCESS! Admin user created:\n');
    console.log('  Name: Dharmesh Prajapati');
    console.log('  Email: dharmesh4@hotmail.com');
    console.log('  Password: admin123');
    console.log('  Role: Admin');
    console.log('  Status: Approved');
    console.log('\n🔐 IMPORTANT: Change the password after first login!');
    console.log('\nUser can now:');
    console.log('  - Login with: dharmesh4@hotmail.com / admin123');
    console.log('  - View all member records');
    console.log('  - Create new members');
    console.log('  - Edit any member record');
    console.log('  - Delete member records');
    console.log('  - Approve new registrations');
    console.log('  - Access Admin Management page');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createAdminUser();
