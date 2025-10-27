/**
 * Create USER account for dharmesh4@hotmail.com
 */

const PouchDB = require('pouchdb');
const PouchDBFind = require('pouchdb-find');

PouchDB.plugin(PouchDBFind);

const config = {
  remoteDB: 'http://admin:password@astworkbench03:5984/member_management',
};

const db = new PouchDB(config.remoteDB);

async function createUserAccount() {
  console.log('🔧 Creating USER account for dharmesh4@hotmail.com...\n');

  try {
    const email = 'dharmesh4@hotmail.com';

    // Get member account
    const memberResult = await db.find({
      selector: {
        type: 'member',
        email: email
      }
    });

    if (memberResult.docs.length === 0) {
      console.log('❌ Member account not found!');
      return;
    }

    const member = memberResult.docs[0];
    console.log(`✅ Found member: ${member.firstName} ${member.lastName}`);
    console.log(`   Status: ${member.status}`);
    console.log(`   isAdmin: ${member.isAdmin}\n`);

    // Check if user account already exists
    const userCheck = await db.find({
      selector: {
        type: 'user',
        email: email
      }
    });

    if (userCheck.docs.length > 0) {
      console.log('⚠️  USER account already exists!');
      return;
    }

    // Get password hash from member account
    let passwordHash = member.passwordHash;
    if (!passwordHash && member.auth && member.auth.password) {
      passwordHash = member.auth.password;
    }

    if (!passwordHash) {
      console.log('❌ No password found on member account!');
      return;
    }

    console.log('📝 Creating USER account...');
    console.log(`   Using same password hash from member account\n`);

    // Create user account
    const userDoc = {
      _id: `user_${Date.now()}`,
      type: 'user',
      email: member.email,
      mobile: member.mobile,
      firstName: member.firstName,
      lastName: member.lastName,
      passwordHash: passwordHash,
      isAdmin: true,
      role: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.put(userDoc);

    console.log('═══════════════════════════════════════════');
    console.log('✅ USER ACCOUNT CREATED!');
    console.log('═══════════════════════════════════════════');
    console.log(`👤 ${member.firstName} ${member.lastName} can now login as ADMIN!\n`);
    console.log('🔐 Login Credentials:');
    console.log(`   📧 Email: ${email}`);
    console.log(`   🔑 Password: (same as registration password)\n`);
    console.log('✨ After logging in, you will:');
    console.log('   ✅ See ⚙️ Admin button');
    console.log('   ✅ See ➕ Add New Member button');
    console.log('   ✅ See Edit/Delete on ALL member cards');
    console.log('   ✅ Have loginType: "user" (not "member")\n');
    console.log('💡 If already logged in:');
    console.log('   1. Logout');
    console.log('   2. Login again with same credentials');
    console.log('   3. Admin button should appear!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

createUserAccount()
  .then(() => {
    console.log('✅ Script complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error.message);
    process.exit(1);
  });
