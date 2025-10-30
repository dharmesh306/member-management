const PouchDB = require('pouchdb');
const PouchDBFind = require('pouchdb-find');

PouchDB.plugin(PouchDBFind);

const config = {
  remoteDB: 'http://admin:password@localhost:5984/member_management'
};

const db = new PouchDB(config.remoteDB);

async function makeUserAdmin() {
  try {
    console.log('🔍 Looking for user sarah569@outlook.com...');
    
    // Find the user account
    const result = await db.find({
      selector: {
        type: 'user',
        email: 'sarah569@outlook.com'
      }
    });

    if (result.docs.length === 0) {
      console.log('❌ User not found!');
      return;
    }

    const user = result.docs[0];
    console.log('✅ User found:', user._id);

    // Update user to be admin
    user.isAdmin = true;
    user.role = 'admin';
    user.promotedToAdminAt = new Date().toISOString();
    user.promotedBy = 'system';

    // Save changes
    const response = await db.put(user);
    console.log('✅ Successfully promoted to admin!');
    console.log('   New revision:', response.rev);

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

makeUserAdmin()
  .then(() => {
    console.log('✅ Done');
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed:', error);
    process.exit(1);
  });