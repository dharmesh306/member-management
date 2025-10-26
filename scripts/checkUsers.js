/**
 * Check user accounts in database
 */

const PouchDB = require('pouchdb');
const PouchDBFind = require('pouchdb-find');
const crypto = require('crypto-js');

PouchDB.plugin(PouchDBFind);

const config = {
  remoteDB: 'http://admin:password@astworkbench03:5984/member_management',
};

const db = new PouchDB(config.remoteDB);

async function checkUsers() {
  console.log('🔍 Checking user accounts in database...\n');

  try {
    // Get all user documents
    const result = await db.find({
      selector: {
        type: 'user'
      },
      limit: 1000
    });

    console.log(`📊 Found ${result.docs.length} user accounts\n`);

    // Check for super admin specifically
    const superAdmin = result.docs.find(doc => 
      doc.email === 'dharmesh4@hotmail.com' || 
      doc.mobile === '+13362540431'
    );

    if (superAdmin) {
      console.log('✅ Super Admin Found:');
      console.log('═══════════════════════════════════════');
      console.log('Email:', superAdmin.email);
      console.log('Mobile:', superAdmin.mobile);
      console.log('First Name:', superAdmin.firstName);
      console.log('Last Name:', superAdmin.lastName);
      console.log('Is Admin:', superAdmin.isAdmin);
      console.log('Is Super Admin:', superAdmin.isSuperAdmin);
      console.log('Cannot Be Deleted:', superAdmin.cannotBeDeleted);
      console.log('Created At:', superAdmin.createdAt);
      console.log('\n🔑 Password Hash Present:', !!superAdmin.passwordHash);
      console.log('Password Hash Length:', superAdmin.passwordHash?.length);
      
      // Test password hash
      const testPassword = 'Admin123!';
      const testHash = crypto.SHA256(testPassword).toString();
      console.log('\n🧪 Password Verification:');
      console.log('Test Hash Match:', superAdmin.passwordHash === testHash);
      
    } else {
      console.log('❌ Super Admin NOT FOUND in database!');
      console.log('\nSearching for any user with similar email...');
      
      const similarUsers = result.docs.filter(doc => 
        doc.email?.includes('dharmesh') || 
        doc.mobile?.includes('336254')
      );
      
      if (similarUsers.length > 0) {
        console.log(`Found ${similarUsers.length} similar user(s):`);
        similarUsers.forEach(user => {
          console.log(`  - ${user.email} (${user.mobile})`);
        });
      }
    }

    // Show first 5 users for reference
    console.log('\n📋 Sample User Accounts:');
    console.log('═══════════════════════════════════════');
    result.docs.slice(0, 5).forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} - ${user.firstName} ${user.lastName}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkUsers()
  .then(() => {
    console.log('\n✅ Check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  });
