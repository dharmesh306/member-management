// Test what the AdminManagement screen sees
const PouchDB = require('pouchdb');
PouchDB.plugin(require('pouchdb-find'));

const db = new PouchDB('http://admin:password@astworkbench03:5984/member_management');

async function testAdminManagementQueries() {
  console.log('\n=== Testing Admin Management Queries ===\n');

  try {
    // Test 1: getPendingRegistrations
    console.log('1. Testing getPendingRegistrations query...');
    const pendingRegsResult = await db.find({
      selector: {
        type: 'member',
        status: 'pending'
      },
      sort: [{ createdAt: 'desc' }]
    });
    console.log(`   Found: ${pendingRegsResult.docs.length} pending registrations`);
    pendingRegsResult.docs.forEach((doc, idx) => {
      console.log(`   ${idx + 1}. ${doc.firstName} ${doc.lastName} (${doc.email})`);
    });

    // Test 2: getPendingAdminRequests
    console.log('\n2. Testing getPendingAdminRequests query...');
    const adminRequestsResult = await db.find({
      selector: {
        type: 'member',
        adminRequested: true,
        status: { $in: ['approved', 'pending'] }
      }
    });
    console.log(`   Found: ${adminRequestsResult.docs.length} pending admin requests`);
    adminRequestsResult.docs.forEach((doc, idx) => {
      console.log(`   ${idx + 1}. ${doc.firstName} ${doc.lastName} - Status: ${doc.status}`);
    });

    // Test 3: getAllAdmins
    console.log('\n3. Testing getAllAdmins query...');
    const adminsResult = await db.find({
      selector: {
        type: 'member',
        $or: [
          { role: 'admin' },
          { role: 'superadmin' }
        ]
      }
    });
    console.log(`   Found: ${adminsResult.docs.length} admins`);
    adminsResult.docs.forEach((doc, idx) => {
      console.log(`   ${idx + 1}. ${doc.firstName} ${doc.lastName} - Role: ${doc.role}`);
    });

    console.log('\n=== All queries successful ===\n');

  } catch (error) {
    console.error('Error testing queries:', error);
  }
}

testAdminManagementQueries()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
