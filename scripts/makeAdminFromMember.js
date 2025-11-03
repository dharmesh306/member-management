/**
 * Make an existing member an admin
 */

const PouchDB = require('pouchdb');
const PouchDBFind = require('pouchdb-find');
const crypto = require('crypto-js');

PouchDB.plugin(PouchDBFind);

const config = {
  remoteDB: 'http://admin:password@localhost:5984/member_management',
};

const db = new PouchDB(config.remoteDB);

async function listMembers() {
  console.log('📋 Listing first 10 members...\n');
  
  try {
    const result = await db.find({
      selector: { type: 'member' },
      limit: 10,
    });

    if (result.docs.length === 0) {
      console.log('❌ No members found in database');
      return [];
    }

    result.docs.forEach((member, index) => {
      console.log(`${index + 1}. ${member.firstName} ${member.lastName}`);
      console.log(`   📧 Email: ${member.email}`);
      console.log(`   📱 Phone: ${member.mobile}`);
      console.log(`   🆔 ID: ${member._id}`);
      console.log('');
    });

    return result.docs;
  } catch (error) {
    console.error('❌ Error listing members:', error);
    throw error;
  }
}

async function makeAdmin(memberEmail) {
  console.log(`\n🔐 Making member admin: ${memberEmail}\n`);

  try {
    // Find the member
    const memberResult = await db.find({
      selector: {
        type: 'member',
        email: memberEmail,
      },
    });

    if (memberResult.docs.length === 0) {
      console.log('❌ Member not found with email:', memberEmail);
      return;
    }

    const member = memberResult.docs[0];
    console.log(`✓ Found member: ${member.firstName} ${member.lastName}`);

    // Check if user account already exists
    const userResult = await db.find({
      selector: {
        type: 'user',
        email: memberEmail,
      },
    });

    let user;
    if (userResult.docs.length > 0) {
      // Update existing user to admin
      user = userResult.docs[0];
      console.log('✓ User account exists, updating to admin...');
      
      user.isAdmin = true;
      user.role = 'admin';
      user.updatedAt = new Date().toISOString();
      
      await db.put(user);
      console.log('✅ User account updated to admin');
    } else {
      // Create new user account with admin privileges
      console.log('✓ Creating new admin user account...');
      
      const password = 'Admin123!'; // Default password
      const passwordHash = crypto.SHA256(password).toString();

      user = {
        _id: `user_${Date.now()}`,
        type: 'user',
        email: member.email,
        mobile: member.mobile,
        firstName: member.firstName,
        lastName: member.lastName,
        passwordHash,
        isMember: true,
        isAdmin: true,
        role: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.put(user);
      console.log('✅ New admin user account created');
    }

    // Update member document to mark as admin
    member.isAdmin = true;
    member.updatedAt = new Date().toISOString();
    await db.put(member);
    console.log('✅ Member document updated');

    console.log('\n═══════════════════════════════════════════');
    console.log('✅ ADMIN CREATED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════');
    console.log('👤 Name:     ', `${member.firstName} ${member.lastName}`);
    console.log('📧 Email:    ', member.email);
    console.log('📱 Phone:    ', member.mobile);
    console.log('🔑 Password: ', userResult.docs.length > 0 ? '(existing password)' : 'Admin123!');
    console.log('═══════════════════════════════════════════');
    
    if (userResult.docs.length === 0) {
      console.log('\n⚠️  Default password set to: Admin123!');
      console.log('⚠️  Please change the password after first login!');
    }

  } catch (error) {
    console.error('❌ Error making admin:', error);
    throw error;
  }
}

// Main execution
async function main() {
  console.log('🔧 Make Member an Admin\n');
  console.log('═══════════════════════════════════════════\n');

  // Get email from command line argument
  const email = process.argv[2];

  if (!email) {
    console.log('Usage: node makeAdminFromMember.js <email>');
    console.log('Example: node makeAdminFromMember.js charles763@hotmail.com\n');
    await listMembers();
    console.log('💡 Choose a member from above and run:');
    console.log('   node makeAdminFromMember.js <email>');
    process.exit(0);
  }

  await makeAdmin(email);
}

// Run the script
main()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  });
