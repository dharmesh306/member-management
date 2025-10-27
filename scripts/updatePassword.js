/**
 * Update user password
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
const NEW_PASSWORD = 'abc1234';

async function updatePassword() {
  console.log('🔐 Updating password for:', EMAIL);
  console.log('New password:', NEW_PASSWORD);
  console.log('═══════════════════════════════════════════\n');

  try {
    // Find user account
    const userResult = await db.find({
      selector: {
        type: 'user',
        email: EMAIL
      }
    });

    if (userResult.docs.length === 0) {
      console.log('❌ No user account found!');
      return;
    }

    const user = userResult.docs[0];
    console.log('✅ Found user:', user.firstName, user.lastName);
    console.log('   User ID:', user._id);
    console.log('   Old password hash:', user.passwordHash);

    // Generate new password hash
    const newPasswordHash = crypto.SHA256(NEW_PASSWORD).toString();
    console.log('   New password hash:', newPasswordHash);

    // Update user account
    user.passwordHash = newPasswordHash;
    user.updatedAt = new Date().toISOString();

    await db.put(user);

    console.log('\n✅ PASSWORD UPDATED SUCCESSFULLY!\n');
    console.log('═══════════════════════════════════════════');
    console.log('📧 Email:    ', EMAIL);
    console.log('🔑 Password: ', NEW_PASSWORD);
    console.log('🔐 isAdmin:  ', user.isAdmin);
    console.log('═══════════════════════════════════════════');
    console.log('\n💡 Next steps:');
    console.log('   1. Logout from current session');
    console.log('   2. Login with new password: ' + NEW_PASSWORD);
    console.log('   3. You should see admin features!');

    // Also update member account if it has a passwordHash
    const memberResult = await db.find({
      selector: {
        type: 'member',
        email: EMAIL
      }
    });

    if (memberResult.docs.length > 0) {
      const member = memberResult.docs[0];
      if (member.passwordHash) {
        console.log('\n🔄 Also updating member account password...');
        member.passwordHash = newPasswordHash;
        member.updatedAt = new Date().toISOString();
        await db.put(member);
        console.log('✅ Member account password updated too!');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

updatePassword()
  .then(() => {
    console.log('\n✅ Password update completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Update failed:', error.message);
    process.exit(1);
  });
