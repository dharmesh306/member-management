/**
 * Generate 100 test members with realistic data
 * Run this script to populate the database with test data
 */

const PouchDB = require('pouchdb');
const crypto = require('crypto-js');

// Import dotenv for environment variables
require('dotenv').config();

// Import configuration
const config = {
  remoteDB: 'http://admin:password@localhost:5984/member_management',
};

// Initialize database
const db = new PouchDB(config.remoteDB);

// Sample data for generating realistic members
const firstNames = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
  'William', 'Barbara', 'David', 'Elizabeth', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
  'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
  'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle',
  'Kenneth', 'Dorothy', 'Kevin', 'Carol', 'Brian', 'Amanda', 'George', 'Melissa',
  'Edward', 'Deborah', 'Ronald', 'Stephanie', 'Timothy', 'Rebecca', 'Jason', 'Sharon',
  'Jeffrey', 'Laura', 'Ryan', 'Cynthia', 'Jacob', 'Kathleen', 'Gary', 'Amy',
  'Nicholas', 'Shirley', 'Eric', 'Angela', 'Jonathan', 'Helen', 'Stephen', 'Anna',
  'Larry', 'Brenda', 'Justin', 'Pamela', 'Scott', 'Nicole', 'Brandon', 'Emma',
  'Benjamin', 'Samantha', 'Samuel', 'Katherine', 'Raymond', 'Christine', 'Gregory', 'Debra',
  'Alexander', 'Rachel', 'Patrick', 'Catherine', 'Frank', 'Carolyn', 'Jack', 'Janet',
  'Dennis', 'Ruth', 'Jerry', 'Maria', 'Tyler', 'Heather', 'Aaron', 'Diane'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
  'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
  'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young',
  'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
  'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker',
  'Cruz', 'Edwards', 'Collins', 'Reyes', 'Stewart', 'Morris', 'Morales', 'Murphy',
  'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper', 'Peterson', 'Bailey',
  'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson',
  'Watson', 'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza',
  'Ruiz', 'Hughes', 'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers',
  'Long', 'Ross', 'Foster', 'Jimenez', 'Powell', 'Jenkins', 'Perry', 'Russell'
];

const streets = [
  'Main St', 'Oak Ave', 'Maple Dr', 'Cedar Ln', 'Pine Rd', 'Elm St', 'Park Ave',
  'Washington St', 'Lake Dr', 'Hill Rd', 'Forest Ave', 'River Rd', 'Church St',
  'School St', 'Market St', 'Union St', 'Water St', 'Broadway', 'Spring St', 'College Ave'
];

const cities = [
  'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio',
  'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus',
  'Charlotte', 'San Francisco', 'Indianapolis', 'Seattle', 'Denver', 'Washington',
  'Boston', 'Nashville', 'Detroit', 'Portland', 'Las Vegas', 'Memphis', 'Louisville',
  'Baltimore', 'Milwaukee', 'Albuquerque', 'Tucson', 'Fresno', 'Sacramento', 'Kansas City',
  'Mesa', 'Atlanta', 'Omaha', 'Colorado Springs', 'Raleigh', 'Miami'
];

const states = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

// Helper functions
const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomBoolean = (probability = 0.5) => Math.random() < probability;

// Generate phone number
const generatePhone = () => {
  const areaCode = randomNumber(200, 999);
  const prefix = randomNumber(200, 999);
  const suffix = randomNumber(1000, 9999);
  return `+1${areaCode}${prefix}${suffix}`;
};

// Generate email
const generateEmail = (firstName, lastName) => {
  const providers = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
  const lowerFirst = firstName.toLowerCase();
  const lowerLast = lastName.toLowerCase();
  const formats = [
    `${lowerFirst}.${lowerLast}`,
    `${lowerFirst}${lowerLast}`,
    `${lowerFirst}_${lowerLast}`,
    `${lowerFirst}${randomNumber(1, 999)}`,
  ];
  return `${randomElement(formats)}@${randomElement(providers)}`;
};

// Generate address
const generateAddress = () => {
  return {
    street: `${randomNumber(100, 9999)} ${randomElement(streets)}`,
    city: randomElement(cities),
    state: randomElement(states),
    zipCode: String(randomNumber(10000, 99999)),
  };
};

// Generate children
const generateChildren = (count) => {
  const children = [];
  for (let i = 0; i < count; i++) {
    const firstName = randomElement(firstNames);
    const age = randomNumber(1, 18);
    const birthYear = new Date().getFullYear() - age;
    children.push({
      firstName,
      age,
      birthDate: `${birthYear}-${String(randomNumber(1, 12)).padStart(2, '0')}-${String(randomNumber(1, 28)).padStart(2, '0')}`,
    });
  }
  return children;
};

// Generate a member with spouse and children
const generateMember = (index) => {
  const memberFirstName = randomElement(firstNames);
  const memberLastName = randomElement(lastNames);
  const hasSpouse = randomBoolean(0.7); // 70% have spouse
  const hasChildren = randomBoolean(0.6); // 60% have children
  const childCount = hasChildren ? randomNumber(1, 4) : 0;

  const address = generateAddress();
  const timestamp = Date.now() + index;

  const password = 'Test123!'; // Default password for all test users
  const passwordHash = crypto.SHA256(password).toString();

  const member = {
    _id: `member_${timestamp}`,
    type: 'member',
    firstName: memberFirstName,
    lastName: memberLastName,
    email: generateEmail(memberFirstName, memberLastName),
    mobile: generatePhone(),
    address,
    auth: {
      password: passwordHash,
      createdAt: new Date().toISOString(),
      resetToken: null,
      resetTokenExpiry: null,
      lastLogin: null,
    },
    status: 'approved', // Set status to approved
    managedBy: null, // Will be set later for some members
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Add spouse
  if (hasSpouse) {
    const spouseFirstName = randomElement(firstNames);
    member.spouse = {
      firstName: spouseFirstName,
      lastName: memberLastName, // Spouse usually shares last name
      email: generateEmail(spouseFirstName, memberLastName),
      mobile: generatePhone(),
    };
  }

  // Add children
  if (hasChildren) {
    member.children = generateChildren(childCount);
  }

  return member;
};

// Generate user accounts for some members
const generateUserAccount = (member, index) => {
  const password = 'Test123!'; // Default password for all test users
  const passwordHash = crypto.SHA256(password).toString();
  
  return {
    _id: `user_${Date.now() + index + 100000}`,
    type: 'user',
    email: member.email,
    mobile: member.mobile,
    firstName: member.firstName,
    lastName: member.lastName,
    passwordHash,
    isMember: true,
    isAdmin: index === 0, // Make the first user an admin
    role: index === 0 ? 'admin' : 'user', // Set role for the first user
    createdAt: new Date().toISOString(),
  };
};

// Main function to generate and insert test data
async function generateTestData() {
  console.log('🚀 Starting test data generation...\n');

  try {
    // Generate 100 members
    const members = [];
    const users = [];

    for (let i = 0; i < 100; i++) {
      const member = generateMember(i);

      // For every fifth member (except the first 20), assign them to be managed by one of the first 20 members
      if (i >= 20 && i % 5 === 0) {
        const managerId = members[Math.floor(Math.random() * 20)]._id; // Random manager from first 20 members
        member.managedBy = managerId;
        member.managedSince = new Date().toISOString();
      }

      members.push(member);

      // Create user accounts for first 20 members (20% have accounts)
      if (i < 20) {
        const user = generateUserAccount(member, i);
        users.push(user);
      }

      // Progress indicator
      if ((i + 1) % 10 === 0) {
        console.log(`✓ Generated ${i + 1}/100 members...`);
      }
    }

    console.log('\n📤 Uploading members to database...');
    const memberResults = await db.bulkDocs(members);
    console.log(`✅ Successfully inserted ${memberResults.length} members`);

    console.log('\n📤 Uploading user accounts to database...');
    const userResults = await db.bulkDocs(users);
    console.log(`✅ Successfully inserted ${userResults.length} user accounts`);

    // Generate statistics
    const withSpouse = members.filter(m => m.spouse).length;
    const withChildren = members.filter(m => m.children && m.children.length > 0).length;
    const totalChildren = members.reduce((sum, m) => sum + (m.children ? m.children.length : 0), 0);

    console.log('\n📊 Test Data Statistics:');
    console.log('─────────────────────────────────────');
    console.log(`Total Members:        ${members.length}`);
    console.log(`Members with Spouse:  ${withSpouse} (${Math.round(withSpouse/members.length*100)}%)`);
    console.log(`Members with Children: ${withChildren} (${Math.round(withChildren/members.length*100)}%)`);
    console.log(`Total Children:       ${totalChildren}`);
    console.log(`User Accounts:        ${users.length}`);
    console.log(`Managed Members:      ${members.filter(m => m.managedBy).length}`);
    console.log('─────────────────────────────────────');

    console.log('\n🔐 Test User Credentials:');
    console.log('─────────────────────────────────────');
    console.log('Email/Mobile: Use any from the first 20 members');
    console.log('Password:     Test123!');
    console.log('─────────────────────────────────────');

    console.log('\n✨ Test data generation completed successfully!');
    console.log('🌐 Open http://localhost:3000 to view the data\n');

    // Sample users for easy testing
    console.log('📋 Sample test accounts:');
    users.slice(0, 5).forEach((user, i) => {
      console.log(`${i + 1}. ${user.email} / Password: Test123!`);
    });

  } catch (error) {
    console.error('❌ Error generating test data:', error);
    throw error;
  }
}

// Run the script
generateTestData()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
