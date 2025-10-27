/**
 * Generate simple test data: 2 admins and 10 members
 */

const PouchDB = require('pouchdb');
const PouchDBFind = require('pouchdb-find');
const crypto = require('crypto-js');

PouchDB.plugin(PouchDBFind);

const config = {
  remoteDB: 'http://admin:password@astworkbench03:5984/member_management',
};

const db = new PouchDB(config.remoteDB);

// Test data
const ADMINS = [
  {
    email: 'admin1@example.com',
    password: 'Admin123!',
    firstName: 'John',
    lastName: 'Admin',
    mobile: '5551234567',
  },
  {
    email: 'admin2@example.com',
    password: 'Admin123!',
    firstName: 'Sarah',
    lastName: 'Smith',
    mobile: '5559876543',
  }
];

const MEMBERS = [
  {
    firstName: 'Michael',
    lastName: 'Johnson',
    email: 'michael.j@example.com',
    mobile: '5551111111',
    password: 'Member123!',
    address: { street: '123 Oak St', city: 'Austin', state: 'TX', zipCode: '78701', country: 'USA' },
    dateOfBirth: '1985-05-15',
    occupation: 'Software Engineer',
  },
  {
    firstName: 'Emily',
    lastName: 'Davis',
    email: 'emily.d@example.com',
    mobile: '5552222222',
    password: 'Member123!',
    address: { street: '456 Pine Ave', city: 'Dallas', state: 'TX', zipCode: '75201', country: 'USA' },
    dateOfBirth: '1990-08-22',
    occupation: 'Teacher',
  },
  {
    firstName: 'Robert',
    lastName: 'Wilson',
    email: 'robert.w@example.com',
    mobile: '5553333333',
    password: 'Member123!',
    address: { street: '789 Elm St', city: 'Houston', state: 'TX', zipCode: '77001', country: 'USA' },
    dateOfBirth: '1982-03-10',
    occupation: 'Manager',
    spouse: { firstName: 'Jennifer', lastName: 'Wilson', email: 'jennifer.w@example.com', mobile: '5553333334' }
  },
  {
    firstName: 'Jessica',
    lastName: 'Martinez',
    email: 'jessica.m@example.com',
    mobile: '5554444444',
    password: 'Member123!',
    address: { street: '321 Maple Dr', city: 'San Antonio', state: 'TX', zipCode: '78201', country: 'USA' },
    dateOfBirth: '1988-11-30',
    occupation: 'Nurse',
  },
  {
    firstName: 'David',
    lastName: 'Anderson',
    email: 'david.a@example.com',
    mobile: '5555555555',
    password: 'Member123!',
    address: { street: '654 Cedar Ln', city: 'Fort Worth', state: 'TX', zipCode: '76101', country: 'USA' },
    dateOfBirth: '1975-07-18',
    occupation: 'Accountant',
    children: [
      { firstName: 'Emma', lastName: 'Anderson', dateOfBirth: '2010-04-12' },
      { firstName: 'Liam', lastName: 'Anderson', dateOfBirth: '2012-09-25' }
    ]
  },
  {
    firstName: 'Ashley',
    lastName: 'Taylor',
    email: 'ashley.t@example.com',
    mobile: '5556666666',
    password: 'Member123!',
    address: { street: '987 Birch Rd', city: 'El Paso', state: 'TX', zipCode: '79901', country: 'USA' },
    dateOfBirth: '1992-02-14',
    occupation: 'Designer',
  },
  {
    firstName: 'Christopher',
    lastName: 'Thomas',
    email: 'chris.t@example.com',
    mobile: '5557777777',
    password: 'Member123!',
    address: { street: '147 Spruce St', city: 'Arlington', state: 'TX', zipCode: '76001', country: 'USA' },
    dateOfBirth: '1980-12-05',
    occupation: 'Engineer',
  },
  {
    firstName: 'Amanda',
    lastName: 'Jackson',
    email: 'amanda.j@example.com',
    mobile: '5558888888',
    password: 'Member123!',
    address: { street: '258 Willow Way', city: 'Plano', state: 'TX', zipCode: '75023', country: 'USA' },
    dateOfBirth: '1987-06-20',
    occupation: 'Marketing Manager',
    spouse: { firstName: 'Brian', lastName: 'Jackson', email: 'brian.j@example.com', mobile: '5558888889' }
  },
  {
    firstName: 'Matthew',
    lastName: 'White',
    email: 'matthew.w@example.com',
    mobile: '5559999999',
    password: 'Member123!',
    address: { street: '369 Poplar Pl', city: 'Irving', state: 'TX', zipCode: '75038', country: 'USA' },
    dateOfBirth: '1995-01-08',
    occupation: 'Sales Representative',
  },
  {
    firstName: 'Samantha',
    lastName: 'Harris',
    email: 'samantha.h@example.com',
    mobile: '5550000000',
    password: 'Member123!',
    address: { street: '741 Ash Ave', city: 'Garland', state: 'TX', zipCode: '75040', country: 'USA' },
    dateOfBirth: '1991-09-17',
    occupation: 'Data Analyst',
    children: [
      { firstName: 'Sophia', lastName: 'Harris', dateOfBirth: '2015-03-22' }
    ]
  }
];

async function createTestData() {
  console.log('🔧 Creating test data...');
  console.log('═══════════════════════════════════════════\n');

  try {
    const created = {
      admins: [],
      members: []
    };

    // Create admins
    console.log('👤 Creating admin users...\n');
    for (const admin of ADMINS) {
      const timestamp = Date.now() + created.admins.length;
      const passwordHash = crypto.SHA256(admin.password).toString();

      // Create user account (for admin login)
      const userDoc = {
        _id: `user_${timestamp}`,
        type: 'user',
        email: admin.email,
        mobile: admin.mobile,
        firstName: admin.firstName,
        lastName: admin.lastName,
        passwordHash,
        isAdmin: true,
        role: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.put(userDoc);

      // Create member account (for directory listing)
      const memberDoc = {
        _id: `member_${timestamp}`,
        type: 'member',
        email: admin.email,
        mobile: admin.mobile,
        firstName: admin.firstName,
        lastName: admin.lastName,
        passwordHash,
        address: {
          city: 'Admin City',
          state: 'TX',
          country: 'USA'
        },
        isAdmin: true,
        status: 'approved',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.put(memberDoc);

      created.admins.push(admin);
      console.log(`   ✅ ${admin.firstName} ${admin.lastName} (${admin.email})`);
    }

    // Create members
    console.log('\n👥 Creating regular members...\n');
    for (const member of MEMBERS) {
      const timestamp = Date.now() + created.members.length + 100;
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

      created.members.push(member);
      console.log(`   ✅ ${member.firstName} ${member.lastName} (${member.email})`);
    }

    console.log('\n═══════════════════════════════════════════');
    console.log('✅ TEST DATA CREATED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════');
    console.log(`👤 Admins: ${created.admins.length}`);
    console.log(`👥 Members: ${created.members.length}`);
    console.log(`📊 Total: ${created.admins.length + created.members.length} records`);
    console.log('═══════════════════════════════════════════\n');

    console.log('🔐 ADMIN LOGIN CREDENTIALS:\n');
    created.admins.forEach(admin => {
      console.log(`   📧 Email: ${admin.email}`);
      console.log(`   🔑 Password: ${admin.password}`);
      console.log('');
    });

    console.log('🔑 MEMBER LOGIN CREDENTIALS:\n');
    console.log(`   📧 Email: Use any member email above`);
    console.log(`   🔑 Password: Member123! (all members)\n`);

    console.log('💡 Next steps:');
    console.log('   1. Refresh the web app (http://localhost:3000)');
    console.log('   2. Login with admin credentials above');
    console.log('   3. You should see ⚙️ Admin and ➕ Add Member buttons!');

  } catch (error) {
    console.error('❌ Error creating test data:', error);
    throw error;
  }
}

createTestData()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  });
