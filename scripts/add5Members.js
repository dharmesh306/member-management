/**
 * Add 5 new member records
 */

const PouchDB = require('pouchdb');
const PouchDBFind = require('pouchdb-find');
const crypto = require('crypto-js');

PouchDB.plugin(PouchDBFind);

const config = {
  remoteDB: 'http://admin:password@astworkbench03:5984/member_management',
};

const db = new PouchDB(config.remoteDB);

const NEW_MEMBERS = [
  {
    firstName: 'Priya',
    lastName: 'Patel',
    email: 'priya.patel@example.com',
    mobile: '5552345678',
    password: 'Member123!',
    address: { street: '456 Tech Plaza', city: 'Austin', state: 'TX', zipCode: '78701', country: 'USA' },
    dateOfBirth: '1990-03-15',
    occupation: 'Software Developer',
  },
  {
    firstName: 'James',
    lastName: 'Chen',
    email: 'james.chen@example.com',
    mobile: '5553456789',
    password: 'Member123!',
    address: { street: '789 Innovation Dr', city: 'Dallas', state: 'TX', zipCode: '75201', country: 'USA' },
    dateOfBirth: '1985-07-22',
    occupation: 'Project Manager',
    spouse: { firstName: 'Lisa', lastName: 'Chen', email: 'lisa.chen@example.com', mobile: '5553456790' }
  },
  {
    firstName: 'Maria',
    lastName: 'Rodriguez',
    email: 'maria.rodriguez@example.com',
    mobile: '5554567890',
    password: 'Member123!',
    address: { street: '321 Commerce St', city: 'Houston', state: 'TX', zipCode: '77001', country: 'USA' },
    dateOfBirth: '1988-11-10',
    occupation: 'Business Analyst',
    children: [
      { firstName: 'Sofia', lastName: 'Rodriguez', dateOfBirth: '2015-05-20' }
    ]
  },
  {
    firstName: 'David',
    lastName: 'Kim',
    email: 'david.kim@example.com',
    mobile: '5555678901',
    password: 'Member123!',
    address: { street: '654 Market Ave', city: 'San Antonio', state: 'TX', zipCode: '78201', country: 'USA' },
    dateOfBirth: '1992-02-28',
    occupation: 'UX Designer',
  },
  {
    firstName: 'Sarah',
    lastName: 'Thompson',
    email: 'sarah.thompson@example.com',
    mobile: '5556789012',
    password: 'Member123!',
    address: { street: '987 Enterprise Blvd', city: 'Fort Worth', state: 'TX', zipCode: '76101', country: 'USA' },
    dateOfBirth: '1987-09-14',
    occupation: 'Marketing Director',
    spouse: { firstName: 'Tom', lastName: 'Thompson', email: 'tom.thompson@example.com', mobile: '5556789013' },
    children: [
      { firstName: 'Alex', lastName: 'Thompson', dateOfBirth: '2012-06-10' },
      { firstName: 'Emma', lastName: 'Thompson', dateOfBirth: '2014-08-15' }
    ]
  }
];

async function addMembers() {
  console.log('🔧 Adding 5 new members...');
  console.log('═══════════════════════════════════════════\n');

  try {
    const created = [];

    for (let i = 0; i < NEW_MEMBERS.length; i++) {
      const member = NEW_MEMBERS[i];
      const timestamp = Date.now() + i;
      const passwordHash = crypto.SHA256(member.password).toString();

      const memberDoc = {
        _id: `member_${timestamp}`,
        type: 'member',
        email: member.email,
        mobile: member.mobile,
        firstName: member.firstName,
        lastName: member.lastName,
        passwordHash,
        address: member.address,
        dateOfBirth: member.dateOfBirth,
        occupation: member.occupation,
        spouse: member.spouse,
        children: member.children,
        status: 'approved',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.put(memberDoc);

      created.push(member);
      console.log(`   ✅ ${member.firstName} ${member.lastName} (${member.email})`);
      
      // Small delay to ensure unique timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    console.log('\n═══════════════════════════════════════════');
    console.log('✅ MEMBERS ADDED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════');
    console.log(`👥 New Members: ${created.length}`);
    console.log('═══════════════════════════════════════════\n');

    console.log('📋 Summary:');
    created.forEach((member, index) => {
      console.log(`\n${index + 1}. ${member.firstName} ${member.lastName}`);
      console.log(`   📧 ${member.email}`);
      console.log(`   📱 ${member.mobile}`);
      console.log(`   📍 ${member.address.city}, ${member.address.state}`);
      console.log(`   💼 ${member.occupation}`);
      if (member.spouse) {
        console.log(`   💑 Spouse: ${member.spouse.firstName} ${member.spouse.lastName}`);
      }
      if (member.children) {
        console.log(`   👶 Children: ${member.children.length}`);
      }
    });

    console.log('\n═══════════════════════════════════════════');
    console.log('🔐 LOGIN CREDENTIALS:');
    console.log('═══════════════════════════════════════════');
    console.log('📧 Email: Use any member email above');
    console.log('🔑 Password: Member123! (all members)\n');
    console.log('💡 Total members in database: 6 (including Michael Johnson)');
    console.log('💡 Total admins: 1 (Michael Johnson)\n');

  } catch (error) {
    console.error('❌ Error adding members:', error);
    throw error;
  }
}

addMembers()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  });
