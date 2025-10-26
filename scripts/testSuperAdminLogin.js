/**
 * Test Super Admin Login
 * This script verifies the super admin can login successfully
 */

const PouchDB = require('pouchdb');
const PouchDBFind = require('pouchdb-find');
const crypto = require('crypto-js');

PouchDB.plugin(PouchDBFind);

const config = {
  remoteDB: 'http://admin:password@astworkbench03:5984/member_management',
};

const db = new PouchDB(config.remoteDB);

async function testLogin() {
  console.log('🧪 Testing Super Admin Login Flow...\n');

  const TEST_EMAIL = 'dharmesh4@hotmail.com';
  const TEST_PASSWORD = 'Admin123!';

  try {
    console.log('Step 1: Finding user account...');
    const userResult = await db.find({
      selector: {
        type: 'user',
        $or: [
          { email: TEST_EMAIL },
          { mobile: '+13362540431' }
        ]
      },
      limit: 1
    });

    if (userResult.docs.length === 0) {
      console.log('❌ FAILED: Super admin user not found!');
      return false;
    }

    console.log('✅ User found:', TEST_EMAIL);
    const user = userResult.docs[0];

    console.log('\nStep 2: Verifying password hash...');
    const hashedPassword = crypto.SHA256(TEST_PASSWORD).toString();
    
    if (hashedPassword !== user.passwordHash) {
      console.log('❌ FAILED: Password hash does not match!');
      console.log('Expected hash:', hashedPassword);
      console.log('Stored hash:', user.passwordHash);
      return false;
    }

    console.log('✅ Password hash matches!');

    console.log('\nStep 3: Checking user properties...');
    console.log('  - Is Admin:', user.isAdmin ? '✅' : '❌');
    console.log('  - Is Super Admin:', user.isSuperAdmin ? '✅' : '❌');
    console.log('  - Cannot Be Deleted:', user.cannotBeDeleted ? '✅' : '❌');

    console.log('\nStep 4: Simulating login response...');
    const loginResponse = {
      _id: user._id,
      email: user.email,
      mobile: user.mobile,
      firstName: user.firstName,
      lastName: user.lastName,
      isAdmin: user.isAdmin,
      isSuperAdmin: user.isSuperAdmin,
      loginType: 'user',
    };

    console.log('✅ Login response:', JSON.stringify(loginResponse, null, 2));

    console.log('\n═══════════════════════════════════════');
    console.log('✅ LOGIN TEST PASSED!');
    console.log('═══════════════════════════════════════');
    console.log('Email:', TEST_EMAIL);
    console.log('Password:', TEST_PASSWORD);
    console.log('Status: Ready to login');
    console.log('URL: http://localhost:3000');
    console.log('═══════════════════════════════════════\n');

    return true;

  } catch (error) {
    console.error('❌ TEST FAILED:', error);
    return false;
  }
}

testLogin()
  .then((success) => {
    if (success) {
      console.log('🎉 All tests passed! Super admin can login successfully.');
      process.exit(0);
    } else {
      console.log('❌ Tests failed. Please check the errors above.');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
