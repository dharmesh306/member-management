/**
 * Check all registrations and pending members
 */

const PouchDB = require('pouchdb');
const PouchDBFind = require('pouchdb-find');

PouchDB.plugin(PouchDBFind);

const config = {
  remoteDB: 'http://admin:password@astworkbench03:5984/member_management',
};

const db = new PouchDB(config.remoteDB);

async function checkRegistrations() {
  console.log('🔍 Checking all members in database...\n');

  try {
    // Get all members
    const result = await db.find({
      selector: {
        type: 'member'
      }
    });

    console.log('═══════════════════════════════════════════');
    console.log(`📊 FOUND ${result.docs.length} MEMBERS`);
    console.log('═══════════════════════════════════════════\n');

    if (result.docs.length === 0) {
      console.log('❌ No members found in database\n');
      return;
    }

    result.docs.forEach((member, index) => {
      console.log(`${index + 1}. ${member.firstName} ${member.lastName}`);
      console.log(`   Email: ${member.email}`);
      console.log(`   Status: ${member.status || 'approved'}`);
      console.log(`   Admin: ${member.isAdmin ? 'Yes' : 'No'}`);
      console.log(`   Created: ${member.createdAt}`);
      
      // Check password structure
      if (member.passwordHash) {
        console.log(`   Password: passwordHash (${member.passwordHash.substring(0, 15)}...)`);
      } else if (member.auth && member.auth.password) {
        console.log(`   Password: auth.password (${member.auth.password.substring(0, 15)}...)`);
      } else {
        console.log(`   Password: ⚠️  NOT SET`);
      }
      console.log('');
    });

    // Check for pending registrations
    const pending = result.docs.filter(m => m.status === 'pending');
    if (pending.length > 0) {
      console.log('═══════════════════════════════════════════');
      console.log(`⏳ PENDING REGISTRATIONS: ${pending.length}`);
      console.log('═══════════════════════════════════════════\n');
      pending.forEach(member => {
        console.log(`   📧 ${member.email} - ${member.firstName} ${member.lastName}`);
      });
      console.log('');
    }

    // Check for approved members
    const approved = result.docs.filter(m => !m.status || m.status === 'approved');
    if (approved.length > 0) {
      console.log('═══════════════════════════════════════════');
      console.log(`✅ APPROVED MEMBERS: ${approved.length}`);
      console.log('═══════════════════════════════════════════\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

checkRegistrations()
  .then(() => {
    console.log('✅ Check complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error.message);
    process.exit(1);
  });
