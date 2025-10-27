/**
 * Check if email has admin access
 */

const PouchDB = require('pouchdb');
const PouchDBFind = require('pouchdb-find');

PouchDB.plugin(PouchDBFind);

const config = {
  remoteDB: 'http://admin:password@astworkbench03:5984/member_management',
};

const db = new PouchDB(config.remoteDB);

const EMAIL = 'dharmesh4@hotmail.com';

async function checkAdminStatus() {
  console.log('🔍 Checking admin status for:', EMAIL, '\n');

  try {
    // Check for user account (type: 'user')
    const userResult = await db.find({
      selector: {
        type: 'user',
        email: EMAIL
      }
    });

    if (userResult.docs.length > 0) {
      const user = userResult.docs[0];
      console.log('✅ USER ACCOUNT FOUND (type: "user")');
      console.log('═══════════════════════════════════════════');
      console.log('User ID:', user._id);
      console.log('Name:', user.firstName, user.lastName);
      console.log('Email:', user.email);
      console.log('Mobile:', user.mobile);
      console.log('isAdmin:', user.isAdmin || false);
      console.log('Role:', user.role || 'none');
      console.log('═══════════════════════════════════════════');
      
      if (user.isAdmin === true) {
        console.log('\n🎉 YES - This user has ADMIN privileges!');
        console.log('✅ Can login with full admin access (loginType: "user")');
      } else {
        console.log('\n❌ NO - This user does NOT have admin privileges');
        console.log('⚠️  Can login but with regular user access only');
      }
    } else {
      console.log('❌ NO USER ACCOUNT FOUND (type: "user")');
      console.log('⚠️  Cannot login as admin - no user account exists\n');
      
      // Check for member account
      const memberResult = await db.find({
        selector: {
          type: 'member',
          email: EMAIL
        }
      });

      if (memberResult.docs.length > 0) {
        const member = memberResult.docs[0];
        console.log('ℹ️  MEMBER ACCOUNT FOUND (type: "member")');
        console.log('═══════════════════════════════════════════');
        console.log('Member ID:', member._id);
        console.log('Name:', member.firstName, member.lastName);
        console.log('Email:', member.email);
        console.log('Mobile:', member.mobile);
        console.log('isAdmin flag:', member.isAdmin || false);
        console.log('═══════════════════════════════════════════');
        console.log('\n💡 This email can only login as a MEMBER (loginType: "member")');
        console.log('   Members have limited access even if isAdmin flag is set');
        console.log('\n📝 To give admin access, you need to create a USER account');
      } else {
        console.log('\n❌ NO MEMBER ACCOUNT FOUND EITHER');
        console.log('💡 This email is not registered in the system');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

checkAdminStatus()
  .then(() => {
    console.log('\n✅ Check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  });
