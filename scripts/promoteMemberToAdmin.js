/**
 * Promote a member to admin
 * This script will:
 * 1. Find the member account
 * 2. Create a corresponding user account (for admin login)
 * 3. Set isAdmin flags on both accounts
 */

const PouchDB = require('pouchdb');
const PouchDBFind = require('pouchdb-find');
const readline = require('readline');

PouchDB.plugin(PouchDBFind);

const config = {
  remoteDB: 'http://admin:password@astworkbench03:5984/member_management',
};

const db = new PouchDB(config.remoteDB);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function promoteMemberToAdmin() {
  console.log('═══════════════════════════════════════════');
  console.log('👑 PROMOTE MEMBER TO ADMIN');
  console.log('═══════════════════════════════════════════\n');

  try {
    // Get member email
    const email = await question('📧 Enter member email: ');
    
    if (!email) {
      console.log('❌ Email is required!');
      rl.close();
      return;
    }

    console.log('\n🔍 Searching for member...\n');

    // Find member account
    const memberResult = await db.find({
      selector: {
        type: 'member',
        email: email
      }
    });

    if (memberResult.docs.length === 0) {
      console.log('❌ Member not found with email:', email);
      rl.close();
      return;
    }

    const member = memberResult.docs[0];
    console.log('✅ Found member:');
    console.log(`   Name: ${member.firstName} ${member.lastName}`);
    console.log(`   Email: ${member.email}`);
    console.log(`   Mobile: ${member.mobile}`);
    console.log(`   Current Admin Status: ${member.isAdmin ? 'Yes' : 'No'}\n`);

    // Check if user account already exists
    const userResult = await db.find({
      selector: {
        type: 'user',
        email: email
      }
    });

    let userDoc;
    
    if (userResult.docs.length > 0) {
      // Update existing user account
      userDoc = userResult.docs[0];
      console.log('📝 User account already exists. Updating...\n');
      
      userDoc.isAdmin = true;
      userDoc.role = 'admin';
      userDoc.updatedAt = new Date().toISOString();
      
      await db.put(userDoc);
      console.log('✅ Updated user account to admin');
    } else {
      // Create new user account
      console.log('📝 Creating new user account for admin login...\n');
      
      if (!member.passwordHash) {
        console.log('❌ Error: Member account has no password!');
        console.log('💡 Please set a password for this member first.');
        rl.close();
        return;
      }

      userDoc = {
        _id: `user_${Date.now()}`,
        type: 'user',
        email: member.email,
        mobile: member.mobile,
        firstName: member.firstName,
        lastName: member.lastName,
        passwordHash: member.passwordHash, // Use same password
        isAdmin: true,
        role: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.put(userDoc);
      console.log('✅ Created user account for admin login');
    }

    // Update member account
    member.isAdmin = true;
    member.role = 'admin';
    member.updatedAt = new Date().toISOString();
    
    await db.put(member);
    console.log('✅ Updated member account to admin\n');

    console.log('═══════════════════════════════════════════');
    console.log('✅ PROMOTION SUCCESSFUL!');
    console.log('═══════════════════════════════════════════');
    console.log(`👤 ${member.firstName} ${member.lastName} is now an admin!\n`);
    console.log('🔐 Login credentials:');
    console.log(`   📧 Email: ${member.email}`);
    console.log(`   🔑 Password: (same as member password)\n`);
    console.log('💡 They can now:');
    console.log('   ✅ Access Admin Management panel');
    console.log('   ✅ Add new members');
    console.log('   ✅ Edit any member');
    console.log('   ✅ Delete members');
    console.log('   ✅ Approve registrations');
    console.log('   ✅ Promote other members to admin\n');

  } catch (error) {
    console.error('❌ Error promoting member:', error);
    throw error;
  } finally {
    rl.close();
  }
}

promoteMemberToAdmin()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  });
