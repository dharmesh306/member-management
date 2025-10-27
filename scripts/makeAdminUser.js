/**
 * Create admin USER account for an existing member
 */

const PouchDB = require('pouchdb');
const PouchDBFind = require('pouchdb-find');
const crypto = require('crypto-js');

PouchDB.plugin(PouchDBFind);

const config = {
  remoteDB: 'http://admin:password@astworkbench03:5984/member_management',
};

const db = new PouchDB(config.remoteDB);

// Change this to the member email you want to make admin
const MEMBER_EMAIL = 'test1@test.com';
const DEFAULT_PASSWORD = 'Admin123!'; // They should change this after first login

async function createAdminUserFromMember() {
  console.log('🔍 Converting member to admin user...\n');
  console.log('Member Email:', MEMBER_EMAIL);
  console.log('═══════════════════════════════════════════\n');

  try {
    // Check if user account already exists
    const existingUser = await db.find({
      selector: {
        type: 'user',
        email: MEMBER_EMAIL
      }
    });

    if (existingUser.docs.length > 0) {
      console.log('✅ USER ACCOUNT ALREADY EXISTS!');
      const user = existingUser.docs[0];
      
      // Update to make sure they're admin
      if (!user.isAdmin) {
        console.log('⚠️  User exists but is not admin. Updating...');
        user.isAdmin = true;
        user.role = 'admin';
        user.updatedAt = new Date().toISOString();
        await db.put(user);
        console.log('✅ User updated to admin!');
      } else {
        console.log('✅ User is already an admin!');
      }
      
      console.log('\n═══════════════════════════════════════════');
      console.log('📧 Email:    ', user.email);
      console.log('👤 Name:     ', user.firstName, user.lastName);
      console.log('🔐 Admin:    ', user.isAdmin ? 'YES' : 'NO');
      console.log('═══════════════════════════════════════════');
      console.log('\n✅ This account can now login with admin privileges!');
      return;
    }

    // Find the member account
    const memberResult = await db.find({
      selector: {
        type: 'member',
        email: MEMBER_EMAIL
      }
    });

    if (memberResult.docs.length === 0) {
      console.log('❌ ERROR: No member found with email:', MEMBER_EMAIL);
      console.log('\n💡 Make sure the member is registered first!');
      return;
    }

    const member = memberResult.docs[0];
    console.log('✅ Found member account:');
    console.log('   Member ID:', member._id);
    console.log('   Name:', member.firstName, member.lastName);
    console.log('   Mobile:', member.mobile);
    
    // Get the existing password hash from member's user login if it exists
    let passwordHash;
    if (member.passwordHash) {
      console.log('   ✅ Using existing password from member account');
      passwordHash = member.passwordHash;
    } else {
      console.log('   ⚠️  No password found, using default password');
      passwordHash = crypto.SHA256(DEFAULT_PASSWORD).toString();
    }
    
    console.log('\n🔧 Creating admin USER account...\n');

    // Create admin user account
    const userDoc = {
      _id: `user_${Date.now()}`,
      type: 'user',
      email: member.email,
      mobile: member.mobile,
      firstName: member.firstName,
      lastName: member.lastName,
      passwordHash,
      isMember: true,
      isAdmin: true,
      role: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.put(userDoc);

    console.log('✅ ADMIN USER ACCOUNT CREATED!\n');
    console.log('═══════════════════════════════════════════');
    console.log('📧 Email:    ', member.email);
    if (member.passwordHash) {
      console.log('🔑 Password: ', '(same as member login password)');
    } else {
      console.log('🔑 Password: ', DEFAULT_PASSWORD);
    }
    console.log('📱 Phone:    ', member.mobile);
    console.log('👤 Name:     ', member.firstName, member.lastName);
    console.log('═══════════════════════════════════════════');
    console.log('\n🎉 SUCCESS! This account can now:');
    console.log('   ✅ Login as ADMIN (loginType: "user")');
    console.log('   ✅ See Admin Management button');
    console.log('   ✅ Add new members');
    console.log('   ✅ Edit all members');
    console.log('   ✅ Delete members');
    console.log('\n⚠️  IMPORTANT:');
    console.log('   - Logout and login again with the SAME credentials');
    if (member.passwordHash) {
      console.log('   - Use your existing member password');
    } else {
      console.log('   - Password is:', DEFAULT_PASSWORD);
      console.log('   - Change the password after first login!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

createAdminUserFromMember()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  });
