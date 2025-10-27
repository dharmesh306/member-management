const PouchDB = require('pouchdb');

// Configure database connection with admin credentials
const COUCHDB_URL = 'http://admin:password@astworkbench03:5984';
const DB_NAME = 'member_management';

// Sample data arrays for generating realistic test data
const firstNames = [
  'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles',
  'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen',
  'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua',
  'Nancy', 'Betty', 'Margaret', 'Sandra', 'Ashley', 'Kimberly', 'Emily', 'Donna', 'Michelle', 'Carol',
  'Kevin', 'Brian', 'George', 'Edward', 'Ronald', 'Timothy', 'Jason', 'Jeffrey', 'Ryan', 'Jacob',
  'Dorothy', 'Lisa', 'Amanda', 'Melissa', 'Deborah', 'Stephanie', 'Rebecca', 'Sharon', 'Laura', 'Cynthia'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'
];

const states = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
  'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri',
  'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
  'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island',
  'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia',
  'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
];

const cities = {
  'California': ['Los Angeles', 'San Diego', 'San Jose', 'San Francisco', 'Fresno', 'Sacramento'],
  'Texas': ['Houston', 'San Antonio', 'Dallas', 'Austin', 'Fort Worth', 'El Paso'],
  'Florida': ['Jacksonville', 'Miami', 'Tampa', 'Orlando', 'St. Petersburg', 'Tallahassee'],
  'New York': ['New York City', 'Buffalo', 'Rochester', 'Syracuse', 'Albany', 'Yonkers'],
  'Illinois': ['Chicago', 'Aurora', 'Naperville', 'Joliet', 'Rockford', 'Springfield'],
  'Pennsylvania': ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie', 'Reading', 'Scranton'],
  'Ohio': ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron', 'Dayton'],
  'Georgia': ['Atlanta', 'Augusta', 'Columbus', 'Macon', 'Savannah', 'Athens'],
  'North Carolina': ['Charlotte', 'Raleigh', 'Greensboro', 'Durham', 'Winston-Salem', 'Fayetteville'],
  'Michigan': ['Detroit', 'Grand Rapids', 'Warren', 'Sterling Heights', 'Ann Arbor', 'Lansing']
};

const streetNames = [
  'Main St', 'Oak Ave', 'Maple Dr', 'Park Ln', 'Washington Blvd', 'Lake Rd', 'Hill St',
  'Forest Ave', 'Cedar Ln', 'Elm St', 'Pine St', 'River Rd', 'Church St', 'School St',
  'Spring St', 'Sunset Dr', 'Valley Rd', 'Meadow Ln', 'Garden Ave', 'Broadway'
];

function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePhoneNumber() {
  const areaCode = getRandomNumber(200, 999);
  const prefix = getRandomNumber(200, 999);
  const lineNumber = getRandomNumber(1000, 9999);
  return `${areaCode}-${prefix}-${lineNumber}`;
}

function generateEmail(firstName, lastName, index) {
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'email.com'];
  const cleanFirst = firstName.toLowerCase().replace(/[^a-z]/g, '');
  const cleanLast = lastName.toLowerCase().replace(/[^a-z]/g, '');
  return `${cleanFirst}.${cleanLast}${index}@${getRandomItem(domains)}`;
}

function generateDateOfBirth() {
  const year = getRandomNumber(1950, 2005);
  const month = getRandomNumber(1, 12);
  const day = getRandomNumber(1, 28);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function generateAddress(state) {
  const stateCities = cities[state] || ['Springfield', 'Franklin', 'Clinton'];
  const city = getRandomItem(stateCities);
  const streetNumber = getRandomNumber(100, 9999);
  const street = getRandomItem(streetNames);
  const zipCode = getRandomNumber(10000, 99999);

  return {
    street: `${streetNumber} ${street}`,
    city: city,
    state: state,
    zipCode: String(zipCode),
    country: 'USA'
  };
}

function generateSpouse() {
  // 60% chance of having a spouse
  if (Math.random() > 0.6) return null;

  return {
    firstName: getRandomItem(firstNames),
    lastName: '',
    dateOfBirth: generateDateOfBirth(),
    mobile: generatePhoneNumber(),
    email: ''
  };
}

function generateChildren() {
  // Random number of children (0-4)
  const numChildren = Math.random() > 0.5 ? getRandomNumber(0, 4) : 0;
  if (numChildren === 0) return [];

  const children = [];
  for (let i = 0; i < numChildren; i++) {
    children.push({
      firstName: getRandomItem(firstNames),
      lastName: '',
      dateOfBirth: generateDateOfBirth(),
      gender: Math.random() > 0.5 ? 'Male' : 'Female'
    });
  }
  return children;
}

function generateMember(index) {
  const firstName = getRandomItem(firstNames);
  const lastName = getRandomItem(lastNames);
  const state = getRandomItem(states);
  const isAdmin = index === 1; // Make first member an admin
  const gender = Math.random() > 0.5 ? 'Male' : 'Female';

  return {
    _id: `member_${Date.now()}_${index}`,
    type: 'member',
    firstName: firstName,
    lastName: lastName,
    dateOfBirth: generateDateOfBirth(),
    gender: gender,
    mobile: generatePhoneNumber(),
    email: generateEmail(firstName, lastName, index),
    address: generateAddress(state),
    spouse: generateSpouse(),
    children: generateChildren(),
    notes: `Test member #${index} - Generated automatically`,
    isAdmin: isAdmin,
    status: 'approved',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

async function createDatabaseAndMembers() {
  try {
    console.log('🚀 Starting bulk member creation...\n');
    console.log(`📊 Target: 600 member records`);
    console.log(`🗄️  Database: ${DB_NAME}`);
    console.log(`🌐 Server: ${COUCHDB_URL.replace(/\/\/.*:.*@/, '//***:***@')}\n`);

    // Connect to remote database
    const db = new PouchDB(`${COUCHDB_URL}/${DB_NAME}`);

    // Check if database exists
    try {
      const info = await db.info();
      console.log('✅ Database already exists');
      console.log(`   Documents: ${info.doc_count}\n`);
    } catch (error) {
      console.log('📝 Database will be created automatically\n');
    }

    // Generate 600 members
    console.log('⚙️  Generating 600 member records...');
    const members = [];
    for (let i = 1; i <= 600; i++) {
      members.push(generateMember(i));
      if (i % 100 === 0) {
        console.log(`   Generated ${i} members...`);
      }
    }
    console.log('✅ All 600 members generated!\n');

    // Push to database in batches
    console.log('📤 Pushing members to remote database...');
    const batchSize = 100;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < members.length; i += batchSize) {
      const batch = members.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(members.length / batchSize);

      console.log(`   Batch ${batchNumber}/${totalBatches} (${batch.length} members)...`);

      try {
        const result = await db.bulkDocs(batch);
        const success = result.filter(r => r.ok).length;
        const errors = result.filter(r => !r.ok).length;
        successCount += success;
        errorCount += errors;

        if (errors > 0) {
          console.log(`      ⚠️  Errors in batch: ${errors}`);
        }
      } catch (error) {
        console.error(`      ❌ Batch failed:`, error.message);
        errorCount += batch.length;
      }
    }

    console.log('\n✅ BULK CREATION COMPLETE!\n');
    console.log('═══════════════════════════════════════════');
    console.log(`✅ Successfully created: ${successCount} members`);
    if (errorCount > 0) {
      console.log(`❌ Failed: ${errorCount} members`);
    }
    console.log('═══════════════════════════════════════════\n');

    // Get final database info
    const finalInfo = await db.info();
    console.log('📊 Database Summary:');
    console.log(`   Name: ${finalInfo.db_name}`);
    console.log(`   Total Documents: ${finalInfo.doc_count}`);
    console.log(`   Size: ${(finalInfo.sizes?.active || 0) / 1024 / 1024} MB`);

    console.log('\n💡 Special Notes:');
    console.log(`   - Member #1 is marked as an admin`);
    console.log(`   - All members have status: 'approved'`);
    console.log(`   - ~60% have spouses`);
    console.log(`   - ~50% have children (0-4)`);
    console.log(`   - Members distributed across all 50 US states`);
    console.log(`   - Realistic names, addresses, and phone numbers`);

    console.log('\n🎉 Script completed successfully!');

  } catch (error) {
    console.error('❌ Error creating members:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
createDatabaseAndMembers();
