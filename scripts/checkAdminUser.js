// Check admin user details
const PouchDB = require('pouchdb');
PouchDB.plugin(require('pouchdb-find'));

const db = new PouchDB('http://admin:password@astworkbench03:5984/member_management');

async function checkAdminUser() {
  console.log('\n=== Checking Admin User ===\n');

  try {
    // Find user by email
    const result = await db.find({
      selector: {
        email: 'dharmesh4@hotmail.com'
      }
    });

    if (result.docs.length === 0) {
      console.log('User not found with email: dharmesh4@hotmail.com');
      return;
    }

    const user = result.docs[0];
    console.log('User found:');
    console.log('  ID:', user._id);
    console.log('  Name:', user.firstName, user.lastName);
    console.log('  Email:', user.email);
    console.log('  Type:', user.type);
    console.log('  Role:', user.role);
    console.log('  Status:', user.status);
    console.log('  isAdmin:', user.isAdmin);
    console.log('  isSuperAdmin:', user.isSuperAdmin);
    console.log('  loginType:', user.loginType);
    console.log('\nFull user object:');
    console.log(JSON.stringify(user, null, 2));

    // Check if user has admin privileges
    const hasAdminAccess = user.role === 'admin' || 
                          user.role === 'superadmin' || 
                          user.isAdmin || 
                          user.isSuperAdmin;
    
    console.log('\n✓ Has Admin Access:', hasAdminAccess);

    if (!hasAdminAccess) {
      console.log('\n⚠ WARNING: User does not have admin privileges!');
      console.log('Updating user to have admin role...');
      
      user.role = 'admin';
      user.status = 'approved';
      user.updatedAt = new Date().toISOString();
      
      const response = await db.put(user);
      console.log('✓ User updated successfully!');
      console.log('  New role:', user.role);
      console.log('  Rev:', response.rev);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkAdminUser()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
