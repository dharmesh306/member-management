/**
 * Quick promote Maria Rodriguez to admin
 */

const PouchDB = require('pouchdb');
const PouchDBFind = require('pouchdb-find');

PouchDB.plugin(PouchDBFind);

const config = {
  remoteDB: 'http://admin:password@astworkbench03:5984/member_management',
};

const db = new PouchDB(config.remoteDB);

async function promoteMaria() {
  console.log('👑 Promoting Maria Rodriguez to admin...\n');

  try {
    const email = 'maria.rodriguez@example.com';

    // Find member account
    const memberResult = await db.find({
      selector: {
        type: 'member',
        email: email
      }
    });

    if (memberResult.docs.length === 0) {
      console.log('❌ Maria not found!');
      return;
    }

    const member = memberResult.docs[0];
    console.log(`✅ Found: ${member.firstName} ${member.lastName}`);

    // Check if user account exists
    const userResult = await db.find({
      selector: {
        type: 'user',
        email: email
      }
    });

    if (userResult.docs.length === 0) {
      // Create user account
      const userDoc = {
        _id: `user_${Date.now()}`,
        type: 'user',
        email: member.email,
        mobile: member.mobile,
        firstName: member.firstName,
        lastName: member.lastName,
        passwordHash: member.passwordHash,
        isAdmin: true,
        role: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.put(userDoc);
      console.log('✅ Created user account for admin login');
    } else {
      // Update existing user
      const userDoc = userResult.docs[0];
      userDoc.isAdmin = true;
      userDoc.role = 'admin';
      userDoc.updatedAt = new Date().toISOString();
      await db.put(userDoc);
      console.log('✅ Updated user account to admin');
    }

    // Update member account
    member.isAdmin = true;
    member.role = 'admin';
    member.updatedAt = new Date().toISOString();
    await db.put(member);
    console.log('✅ Updated member account to admin\n');

    console.log('═══════════════════════════════════════════');
    console.log('✅ Maria Rodriguez is now an ADMIN!');
    console.log('═══════════════════════════════════════════');
    console.log('🔐 Login: maria.rodriguez@example.com');
    console.log('🔑 Password: Member123!');
    console.log('\n✨ She can now see the ⚙️ Admin button!');
    console.log('═══════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

promoteMaria()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed:', error.message);
    process.exit(1);
  });
