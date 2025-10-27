/**
 * Check Michael's admin status
 */

const PouchDB = require('pouchdb');
const PouchDBFind = require('pouchdb-find');

PouchDB.plugin(PouchDBFind);

const config = {
  remoteDB: 'http://admin:password@astworkbench03:5984/member_management',
};

const db = new PouchDB(config.remoteDB);

async function checkMichael() {
  console.log('🔍 Checking Michael Johnson accounts...\n');

  try {
    const email = 'michael.j@example.com';

    // Check for user account
    const userResult = await db.find({
      selector: {
        type: 'user',
        email: email
      }
    });

    // Check for member account
    const memberResult = await db.find({
      selector: {
        type: 'member',
        email: email
      }
    });

    console.log('═══════════════════════════════════════════');
    console.log('👤 MICHAEL JOHNSON - ACCOUNT STATUS');
    console.log('═══════════════════════════════════════════\n');

    if (userResult.docs.length > 0) {
      const user = userResult.docs[0];
      console.log('✅ USER ACCOUNT (for admin login):');
      console.log(`   Email: ${user.email}`);
      console.log(`   Type: ${user.type}`);
      console.log(`   isAdmin: ${user.isAdmin}`);
      console.log(`   role: ${user.role || 'none'}`);
      console.log(`   Password Hash: ${user.passwordHash ? user.passwordHash.substring(0, 20) + '...' : 'NOT SET'}`);
      console.log('');
    } else {
      console.log('❌ NO USER ACCOUNT FOUND');
      console.log('   Cannot login with admin privileges!\n');
    }

    if (memberResult.docs.length > 0) {
      const member = memberResult.docs[0];
      console.log('✅ MEMBER ACCOUNT (directory listing):');
      console.log(`   Email: ${member.email}`);
      console.log(`   Type: ${member.type}`);
      console.log(`   isAdmin: ${member.isAdmin}`);
      console.log(`   status: ${member.status || 'approved'}`);
      
      if (member.passwordHash) {
        console.log(`   Password: passwordHash (${member.passwordHash.substring(0, 20)}...)`);
      } else if (member.auth && member.auth.password) {
        console.log(`   Password: auth.password (${member.auth.password.substring(0, 20)}...)`);
      } else {
        console.log(`   Password: NOT SET`);
      }
      console.log('');
    } else {
      console.log('❌ NO MEMBER ACCOUNT FOUND\n');
    }

    console.log('═══════════════════════════════════════════');
    console.log('🔐 LOGIN TEST');
    console.log('═══════════════════════════════════════════\n');

    if (userResult.docs.length > 0 && memberResult.docs.length > 0) {
      const user = userResult.docs[0];
      const member = memberResult.docs[0];
      
      // Check if passwords match
      const userPass = user.passwordHash;
      const memberPass = member.passwordHash || (member.auth && member.auth.password);
      
      if (userPass === memberPass) {
        console.log('✅ Passwords match between accounts');
        console.log('✅ Login should work with: Member123!\n');
        
        if (user.isAdmin) {
          console.log('✅ Michael CAN see admin button (isAdmin: true)\n');
        } else {
          console.log('❌ Michael CANNOT see admin button (isAdmin: false)\n');
          console.log('💡 Need to set isAdmin: true on user account\n');
        }
      } else {
        console.log('⚠️  Password mismatch between accounts!');
        console.log(`   User: ${userPass ? userPass.substring(0, 15) : 'none'}`);
        console.log(`   Member: ${memberPass ? memberPass.substring(0, 15) : 'none'}`);
        console.log('');
      }
    } else if (userResult.docs.length === 0 && memberResult.docs.length > 0) {
      console.log('⚠️  Michael only has MEMBER account');
      console.log('   Need to create USER account for admin access\n');
      console.log('💡 Run: echo michael.j@example.com | node scripts/promoteMemberToAdmin.js\n');
    }

    console.log('═══════════════════════════════════════════');
    console.log('🔑 CREDENTIALS');
    console.log('═══════════════════════════════════════════');
    console.log('Email: michael.j@example.com');
    console.log('Password: Member123!');
    console.log('═══════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

checkMichael()
  .then(() => {
    console.log('✅ Check complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error.message);
    process.exit(1);
  });
