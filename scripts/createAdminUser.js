/**
 * Create Admin User Account
 */

const PouchDB = require('pouchdb');
const PouchDBFind = require('pouchdb-find');
const crypto = require('crypto-js');

PouchDB.plugin(PouchDBFind);

const config = {
  remoteDB: 'http://admin:password@astworkbench03:5984/member_management',
};

const db = new PouchDB(config.remoteDB);

// Admin Details
const ADMIN = {
  email: 'admin@example.com',
  mobile: '+1234567890',
  firstName: 'Admin',
  lastName: 'User',
  password: 'Admin123!',
};

async function createAdmin() {
  console.log('🔐 Creating Admin Account...\n');

  try {
    // Check if admin already exists
    const existingUsers = await db.find({
      selector: {
        type: 'user',
        $or: [
          { email: ADMIN.email },
          { mobile: ADMIN.mobile }
        ]
      }
    });

    if (existingUsers.docs.length > 0) {
      console.log('⚠️  Admin already exists!');
      console.log('📧 Email:', ADMIN.email);
      console.log('📱 Phone:', ADMIN.mobile);
      console.log('\n✅ No changes made.');
      return;
    }

    // Create password hash
    const passwordHash = crypto.SHA256(ADMIN.password).toString();

    // Create admin user document
    const adminUser = {
      _id: `user_admin_${Date.now()}`,
      type: 'user',
      email: ADMIN.email,
      mobile: ADMIN.mobile,
      firstName: ADMIN.firstName,
      lastName: ADMIN.lastName,
      passwordHash,
      isMember: true,
      isAdmin: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Create corresponding member document
    const adminMember = {
      _id: `member_admin_${Date.now()}`,
      type: 'member',
      firstName: ADMIN.firstName,
      lastName: ADMIN.lastName,
      email: ADMIN.email,
      mobile: ADMIN.mobile,
      address: {
        city: 'Admin City',
        state: 'Admin State',
        country: 'USA',
      },
      isAdmin: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save both documents
    await db.put(adminUser);
    await db.put(adminMember);

    console.log('✅ Admin account created successfully!\n');
    console.log('═══════════════════════════════════════════');
    console.log('📧 Email:    ', ADMIN.email);
    console.log('🔑 Password: ', ADMIN.password);
    console.log('📱 Phone:    ', ADMIN.mobile);
    console.log('═══════════════════════════════════════════');
    console.log('\n⚠️  Please change the password after first login!');
    console.log('🔐 User Type: Admin (full permissions)');
    console.log('\n✨ You can now login with these credentials.');

  } catch (error) {
    console.error('❌ Error creating admin:', error);
    throw error;
  }
}

// Run the script
createAdmin()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  });
