/**
 * Check dharmesh4@hotmail.com admin status and fix if needed
 */

const PouchDB = require('pouchdb');
const PouchDBFind = require('pouchdb-find');

PouchDB.plugin(PouchDBFind);

const config = {
  remoteDB: 'http://admin:password@astworkbench03:5984/member_management',
};

const db = new PouchDB(config.remoteDB);

async function checkDharmeshStatus() {
  console.log('🔍 Checking dharmesh4@hotmail.com status...\n');

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
    console.log('👤 DHARMESH4@HOTMAIL.COM - STATUS');
    console.log('═══════════════════════════════════════════\n');

    if (memberResult.docs.length === 0) {
      console.log('❌ No member account found!\n');
      return;
    }

    const member = memberResult.docs[0];
    
    console.log('📋 MEMBER ACCOUNT:');
    console.log(`   Email: ${member.email}`);
    console.log(`   Name: ${member.firstName} ${member.lastName}`);
    console.log(`   Status: ${member.status || 'approved'}`);
    console.log(`   isAdmin: ${member.isAdmin ? 'true' : 'false'}`);
    console.log(`   Type: ${member.type}`);
    console.log('');

    if (userResult.docs.length > 0) {
      const user = userResult.docs[0];
      console.log('✅ USER ACCOUNT (admin login):');
      console.log(`   Email: ${user.email}`);
      console.log(`   isAdmin: ${user.isAdmin ? 'true' : 'false'}`);
      console.log(`   role: ${user.role || 'none'}`);
      console.log(`   loginType: user (for admin access)`);
      console.log('');
    } else {
      console.log('❌ NO USER ACCOUNT');
      console.log('   Cannot see admin button without USER account!\n');
    }

    console.log('═══════════════════════════════════════════');
    console.log('🔍 DIAGNOSIS');
    console.log('═══════════════════════════════════════════\n');

    if (member.status === 'pending') {
      console.log('⚠️  PROBLEM: Account is PENDING');
      console.log('   → Member needs admin approval first\n');
      console.log('💡 SOLUTION:');
      console.log('   1. Login as admin (michael.j@example.com)');
      console.log('   2. Go to Admin Management');
      console.log('   3. Approve Dharmesh Patel');
      console.log('   4. Then promote to admin\n');
      return;
    }

    if (userResult.docs.length === 0) {
      console.log('⚠️  PROBLEM: No USER account');
      console.log('   → Has MEMBER account but needs USER account for admin access\n');
      console.log('💡 SOLUTION:');
      console.log('   dharmesh4@hotmail.com has member.isAdmin = ' + (member.isAdmin ? 'true' : 'false'));
      console.log('   But loginType would be "member" not "user"\n');
      console.log('   Dashboard shows admin button ONLY when:');
      console.log('   - canApproveRegistrations() = true');
      console.log('   - AND loginType !== "member"');
      console.log('   - AND loginType !== "spouse"\n');
      console.log('   NEED TO CREATE USER ACCOUNT!\n');
      return;
    }

    const user = userResult.docs[0];
    
    if (!user.isAdmin) {
      console.log('⚠️  PROBLEM: User account exists but isAdmin = false\n');
      console.log('💡 SOLUTION: Need to set isAdmin = true on user account\n');
      return;
    }

    console.log('✅ Account looks correct!');
    console.log('   - Member status: ' + (member.status || 'approved'));
    console.log('   - User account exists: Yes');
    console.log('   - User.isAdmin: true');
    console.log('   - Should be able to see admin button\n');
    console.log('⚠️  If still can\'t see admin button:');
    console.log('   → Clear browser cache/localStorage');
    console.log('   → Logout and login again\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

checkDharmeshStatus()
  .then(() => {
    console.log('✅ Check complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error.message);
    process.exit(1);
  });
