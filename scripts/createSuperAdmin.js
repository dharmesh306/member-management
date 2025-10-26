/**
 * Create Super Admin Account
 * This script creates a super admin user that cannot be deleted
 */

const PouchDB = require('pouchdb');
const PouchDBFind = require('pouchdb-find');
const crypto = require('crypto-js');

// Add find plugin
PouchDB.plugin(PouchDBFind);

// Import configuration
const config = {
  remoteDB: 'http://admin:password@astworkbench03:5984/member_management',
};

// Initialize database
const db = new PouchDB(config.remoteDB);

// Super Admin Details
const SUPER_ADMIN = {
  email: 'dharmesh4@hotmail.com',
  mobile: '+13362540431',
  firstName: 'Dharmesh',
  lastName: 'Admin',
  password: 'Admin123!', // Default password - should be changed after first login
};

async function createSuperAdmin() {
  console.log('🔐 Creating Super Admin Account...\n');

  try {
    // Check if super admin already exists
    const existingUsers = await db.find({
      selector: {
        type: 'user',
        $or: [
          { email: SUPER_ADMIN.email },
          { mobile: SUPER_ADMIN.mobile }
        ]
      }
    });

    if (existingUsers.docs.length > 0) {
      console.log('⚠️  Super admin already exists!');
      console.log('📧 Email:', SUPER_ADMIN.email);
      console.log('📱 Phone:', SUPER_ADMIN.mobile);
      console.log('\n✅ No changes made.');
      return;
    }

    // Create password hash
    const passwordHash = crypto.SHA256(SUPER_ADMIN.password).toString();

    // Create super admin user document
    const superAdminUser = {
      _id: `user_superadmin_${Date.now()}`,
      type: 'user',
      email: SUPER_ADMIN.email,
      mobile: SUPER_ADMIN.mobile,
      firstName: SUPER_ADMIN.firstName,
      lastName: SUPER_ADMIN.lastName,
      passwordHash,
      isMember: true,
      isAdmin: true,
      isSuperAdmin: true,
      cannotBeDeleted: true, // Special flag
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Create corresponding member document
    const superAdminMember = {
      _id: `member_superadmin_${Date.now()}`,
      type: 'member',
      firstName: SUPER_ADMIN.firstName,
      lastName: SUPER_ADMIN.lastName,
      email: SUPER_ADMIN.email,
      mobile: SUPER_ADMIN.mobile,
      address: {
        street: 'Admin Office',
        city: 'System',
        state: 'Admin',
        zipCode: '00000',
      },
      isAdmin: true,
      isSuperAdmin: true,
      cannotBeDeleted: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Insert both documents
    const results = await db.bulkDocs([superAdminUser, superAdminMember]);
    
    console.log('✅ Super Admin Created Successfully!\n');
    console.log('═══════════════════════════════════════');
    console.log('📧 Email:      ', SUPER_ADMIN.email);
    console.log('📱 Phone:      ', SUPER_ADMIN.mobile);
    console.log('🔑 Password:   ', SUPER_ADMIN.password);
    console.log('👤 Name:       ', `${SUPER_ADMIN.firstName} ${SUPER_ADMIN.lastName}`);
    console.log('🛡️  Status:     Super Administrator');
    console.log('🔒 Protected:  Cannot be deleted');
    console.log('═══════════════════════════════════════\n');

    console.log('⚠️  IMPORTANT NOTES:');
    console.log('1. Change the password after first login');
    console.log('2. This account has full system access');
    console.log('3. This account cannot be deleted by any user');
    console.log('4. Keep credentials secure\n');

    console.log('🚀 You can now login at: http://localhost:3000');
    console.log('   Email: dharmesh4@hotmail.com');
    console.log('   Password: Admin123!\n');

  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    throw error;
  }
}

// Run the script
createSuperAdmin()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
