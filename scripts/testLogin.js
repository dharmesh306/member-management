/**
 * Test login authentication flow
 */

const PouchDB = require('pouchdb');
const PouchDBFind = require('pouchdb-find');
const crypto = require('crypto-js');

PouchDB.plugin(PouchDBFind);

const config = {
  remoteDB: 'http://admin:password@astworkbench03:5984/member_management',
};

const db = new PouchDB(config.remoteDB);

async function testLoginFlow() {
  console.log('🔍 Testing Login Authentication Flow...\n');

  const TEST_ACCOUNTS = [
    { email: 'dharmesh4@hotmail.com', password: 'Admin123!', type: 'Super Admin' },
    { email: 'elizabethjackson@gmail.com', password: 'Test123!', type: 'Test User' },
  ];

  for (const account of TEST_ACCOUNTS) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${account.type}`);
    console.log(`Email: ${account.email}`);
    console.log(`${'='.repeat(60)}\n`);

    try {
      // Step 1: Search for user account
      console.log('Step 1: Searching for user account...');
      const userResult = await db.find({
        selector: {
          type: 'user',
          $or: [
            { email: account.email },
            { mobile: account.email }
          ]
        },
        limit: 1
      });

      if (userResult.docs && userResult.docs.length > 0) {
        const user = userResult.docs[0];
        console.log('✅ User account found (type: user)');
        console.log('   Email:', user.email);
        console.log('   Mobile:', user.mobile);
        
        const hashedPassword = crypto.SHA256(account.password).toString();
        console.log('\nStep 2: Verifying password...');
        console.log('   Password hash length:', user.passwordHash?.length);
        console.log('   Test hash length:', hashedPassword.length);
        console.log('   Match:', user.passwordHash === hashedPassword ? '✅ YES' : '❌ NO');
        
        if (user.passwordHash === hashedPassword) {
          console.log('\n✅ LOGIN SUCCESSFUL (User Account)');
          console.log('   Would return:', {
            _id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            isAdmin: user.isAdmin,
            isSuperAdmin: user.isSuperAdmin
          });
        } else {
          console.log('\n❌ LOGIN FAILED: Password mismatch');
        }
        continue;
      } else {
        console.log('⚠️  No user account found, checking for member account...');
      }

      // Step 2: Search for member account
      console.log('\nStep 3: Searching for member account...');
      const memberResult = await db.find({
        selector: {
          type: 'member',
          $or: [
            { email: account.email },
            { mobile: account.email }
          ]
        },
        limit: 1
      });

      if (memberResult.docs && memberResult.docs.length > 0) {
        const member = memberResult.docs[0];
        console.log('✅ Member account found (type: member)');
        console.log('   Email:', member.email);
        console.log('   Mobile:', member.mobile);
        console.log('   Has auth:', !!member.auth);
        console.log('   Has auth.password:', !!member.auth?.password);
        
        if (member.auth?.password) {
          const hashedPassword = crypto.SHA256(account.password).toString();
          console.log('\nStep 4: Verifying password...');
          console.log('   Password hash length:', member.auth.password.length);
          console.log('   Test hash length:', hashedPassword.length);
          console.log('   Match:', member.auth.password === hashedPassword ? '✅ YES' : '❌ NO');
          
          if (member.auth.password === hashedPassword) {
            console.log('\n✅ LOGIN SUCCESSFUL (Member Account)');
            console.log('   Would return:', {
              _id: member._id,
              email: member.email,
              firstName: member.firstName,
              lastName: member.lastName
            });
          } else {
            console.log('\n❌ LOGIN FAILED: Password mismatch');
          }
        } else {
          console.log('\n❌ LOGIN FAILED: No authentication data in member document');
        }
      } else {
        console.log('❌ No member account found');
        console.log('\n❌ LOGIN FAILED: Account not found');
      }

    } catch (error) {
      console.error('❌ Error during test:', error.message);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('Test completed');
  console.log(`${'='.repeat(60)}\n`);
}

testLoginFlow()
  .then(() => {
    console.log('✅ All tests completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
