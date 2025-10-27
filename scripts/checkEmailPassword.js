/**
 * Check password for dharmesh4@hotmail.com
 */

const PouchDB = require('pouchdb');
const PouchDBFind = require('pouchdb-find');

PouchDB.plugin(PouchDBFind);

const config = {
  remoteDB: 'http://admin:password@astworkbench03:5984/member_management',
};

const db = new PouchDB(config.remoteDB);

async function checkPassword() {
  console.log('🔍 Checking dharmesh4@hotmail.com...\n');

  try {
    const email = 'dharmesh4@hotmail.com';

    // Check for user account
    const userResult = await db.find({
      selector: {
        type: 'user',
        email: email
      }
    });

    // Check for member account
    const memberResult = await db.find({
      selector: {
        type: 'member',
        email: email
      }
    });

    console.log('═══════════════════════════════════════════');
    console.log('📊 ACCOUNT STATUS');
    console.log('═══════════════════════════════════════════\n');

    if (userResult.docs.length === 0 && memberResult.docs.length === 0) {
      console.log('❌ No accounts found for dharmesh4@hotmail.com');
      console.log('\n💡 This email does not exist in the database.');
      console.log('   You can register with this email or use test accounts:\n');
      console.log('   Admin: michael.j@example.com / Member123!');
      console.log('   Member: maria.rodriguez@example.com / Member123!\n');
      return;
    }

    if (userResult.docs.length > 0) {
      const user = userResult.docs[0];
      console.log('✅ USER ACCOUNT FOUND:');
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Type: ${user.type}`);
      console.log(`   Admin: ${user.isAdmin ? 'Yes' : 'No'}`);
      console.log(`   Role: ${user.role || 'member'}`);
      console.log(`   Password Hash: ${user.passwordHash ? user.passwordHash.substring(0, 20) + '...' : 'NOT SET'}`);
      console.log('');
    } else {
      console.log('❌ No USER account found (cannot login as admin)\n');
    }

    if (memberResult.docs.length > 0) {
      const member = memberResult.docs[0];
      console.log('✅ MEMBER ACCOUNT FOUND:');
      console.log(`   Email: ${member.email}`);
      console.log(`   Name: ${member.firstName} ${member.lastName}`);
      console.log(`   Type: ${member.type}`);
      console.log(`   Admin: ${member.isAdmin ? 'Yes' : 'No'}`);
      console.log(`   Status: ${member.status || 'pending'}`);
      console.log(`   Password Hash: ${member.passwordHash ? member.passwordHash.substring(0, 20) + '...' : 'NOT SET'}`);
      console.log('');
    } else {
      console.log('❌ No MEMBER account found\n');
    }

    console.log('═══════════════════════════════════════════');
    console.log('🔐 PASSWORD INFORMATION');
    console.log('═══════════════════════════════════════════\n');

    console.log('⚠️  For security reasons, passwords are stored as hashes.');
    console.log('   The actual password cannot be retrieved.\n');

    console.log('💡 WHAT YOU CAN DO:\n');
    
    if (userResult.docs.length === 0 && memberResult.docs.length > 0) {
      console.log('   1. The account exists but only has a MEMBER record');
      console.log('   2. If you need admin access, you must:');
      console.log('      - Have an admin promote this member to admin');
      console.log('      - Or use the promoteMemberToAdmin.js script\n');
    }

    console.log('   • If you forgot the password:');
    console.log('     - Use "Forgot Password" on the login page');
    console.log('     - Or contact an administrator to reset it\n');
    
    console.log('   • To reset the password manually:');
    console.log('     - Run: node scripts/updatePassword.js');
    console.log('     - Enter the email and new password\n');

    console.log('   • Current test account passwords:');
    console.log('     - michael.j@example.com → Member123!');
    console.log('     - All other test members → Member123!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

checkPassword()
  .then(() => {
    console.log('✅ Check complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error.message);
    process.exit(1);
  });
