/**
 * Check password hashes for both user and member accounts
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

async function checkPasswords() {
  console.log('🔍 Checking passwords for:', EMAIL);
  console.log('═══════════════════════════════════════════\n');

  try {
    // Get user account
    const userResult = await db.find({
      selector: {
        type: 'user',
        email: EMAIL
      }
    });

    // Get member account
    const memberResult = await db.find({
      selector: {
        type: 'member',
        email: EMAIL
      }
    });

    if (userResult.docs.length > 0) {
      const user = userResult.docs[0];
      console.log('✅ USER ACCOUNT (type: "user")');
      console.log('   ID:', user._id);
      console.log('   Password Hash:', user.passwordHash);
      console.log('   isAdmin:', user.isAdmin);
    } else {
      console.log('❌ No user account found');
    }

    console.log('');

    if (memberResult.docs.length > 0) {
      const member = memberResult.docs[0];
      console.log('✅ MEMBER ACCOUNT (type: "member")');
      console.log('   ID:', member._id);
      console.log('   Password Hash:', member.passwordHash);
      console.log('   isAdmin:', member.isAdmin || false);
    } else {
      console.log('❌ No member account found');
    }

    console.log('\n═══════════════════════════════════════════');

    if (userResult.docs.length > 0 && memberResult.docs.length > 0) {
      const user = userResult.docs[0];
      const member = memberResult.docs[0];
      
      if (user.passwordHash === member.passwordHash) {
        console.log('✅ PASSWORDS MATCH - Both accounts have same password');
        console.log('\n💡 Login should work with same password for both!');
      } else {
        console.log('❌ PASSWORDS DO NOT MATCH!');
        console.log('\n⚠️  PROBLEM IDENTIFIED:');
        console.log('   User account and member account have DIFFERENT passwords');
        console.log('   When you login, it tries user account first');
        console.log('   If password doesn\'t match, falls back to member account');
        console.log('   That\'s why you\'re logging in as loginType: "member"!');
        console.log('\n💡 SOLUTION:');
        console.log('   Need to sync the passwords to be the same');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

checkPasswords()
  .then(() => {
    console.log('\n✅ Check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Check failed:', error.message);
    process.exit(1);
  });
