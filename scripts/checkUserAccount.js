/**
 * Check if user account exists and create admin user account
 */

const PouchDB = require('pouchdb');
const PouchDBFind = require('pouchdb-find');
const crypto = require('crypto-js');

PouchDB.plugin(PouchDBFind);

const config = {
  remoteDB: 'http://admin:password@astworkbench03:5984/member_management',
};

const db = new PouchDB(config.remoteDB);

const EMAIL = 'dharmesh4@hotmail.com';
const PASSWORD = 'Admin123!';

async function checkAndCreateUserAccount() {
  console.log('🔍 Checking accounts for:', EMAIL, '\n');

  try {
    // Check for existing user account (type: 'user')
    const userResult = await db.find({
      selector: {
        type: 'user',
        email: EMAIL
      }
    });

    if (userResult.docs.length > 0) {
      console.log('✅ User account found!');
      const user = userResult.docs[0];
      console.log('User ID:', user._id);
      console.log('isAdmin:', user.isAdmin);
      console.log('Email:', user.email);
      console.log('Mobile:', user.mobile);
      console.log('\n📝 This account should work for admin login.');
      return;
    }

    console.log('⚠️  No user account found (type: "user")');
    
    // Check for member account
    const memberResult = await db.find({
      selector: {
        type: 'member',
        email: EMAIL
      }
    });

    if (memberResult.docs.length > 0) {
      console.log('✅ Member account found!');
      const member = memberResult.docs[0];
      console.log('Member ID:', member._id);
      console.log('Name:', member.firstName, member.lastName);
      console.log('Email:', member.email);
      console.log('Mobile:', member.mobile);
      
      // Create corresponding user account
      console.log('\n🔧 Creating admin user account...');
      
      const passwordHash = crypto.SHA256(PASSWORD).toString();
      
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.put(userDoc);
      
      console.log('\n✅ Admin user account created successfully!\n');
      console.log('═══════════════════════════════════════════');
      console.log('📧 Email:    ', EMAIL);
      console.log('🔑 Password: ', PASSWORD);
      console.log('📱 Phone:    ', member.mobile);
      console.log('═══════════════════════════════════════════');
      console.log('\n🎉 You can now login as admin with these credentials!');
      console.log('🔐 Login Type: user (admin access)');
      
    } else {
      console.log('❌ No member account found either!');
      console.log('\n💡 Please register this email first as a member.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

checkAndCreateUserAccount()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  });
