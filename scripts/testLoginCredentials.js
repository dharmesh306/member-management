/**
 * Test login credentials and show session info
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
const PASSWORDS_TO_TRY = ['abc1234', 'Admin123!', 'Abc1234', 'ABC1234'];

async function testLogin() {
  console.log('🔐 Testing login for:', EMAIL, '\n');

  try {
    // Get user account
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
    console.log('✅ User account found:');
    console.log('   User ID:', user._id);
    console.log('   Name:', user.firstName, user.lastName);
    console.log('   isAdmin:', user.isAdmin);
    console.log('   Stored password hash:', user.passwordHash);
    console.log('\n🔑 Testing passwords...\n');

    let matchFound = false;
    for (const password of PASSWORDS_TO_TRY) {
      const hash = crypto.SHA256(password).toString();
      const matches = hash === user.passwordHash;
      
      console.log(`   Password: "${password}"`);
      console.log(`   Hash:     ${hash}`);
      console.log(`   Match:    ${matches ? '✅ YES' : '❌ NO'}`);
      console.log('');
      
      if (matches) {
        matchFound = true;
        console.log('═══════════════════════════════════════════');
        console.log('🎉 LOGIN CREDENTIALS FOUND!');
        console.log('═══════════════════════════════════════════');
        console.log('📧 Email:    ', EMAIL);
        console.log('🔑 Password: ', password);
        console.log('🔐 isAdmin:  ', user.isAdmin);
        console.log('═══════════════════════════════════════════');
        console.log('\n✅ Use these credentials to login as admin!');
        break;
      }
    }

    if (!matchFound) {
      console.log('❌ None of the tried passwords match!');
      console.log('\n💡 Possible solutions:');
      console.log('   1. Try the password you used during member registration');
      console.log('   2. Reset the password using the script');
      console.log('   3. Use the Forgot Password feature');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

testLogin()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  });
