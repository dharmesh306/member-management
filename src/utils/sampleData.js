// Sample data generator for testing
// Run this in browser console or add as a utility function

export const generateSampleMembers = () => {
  return [
    {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      mobile: '+1-555-0101',
      spouse: {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        mobile: '+1-555-0102',
      },
      address: {
        street: '123 Main Street',
        city: 'Springfield',
        state: 'Illinois',
        zipCode: '62701',
        country: 'USA',
      },
      children: [
        {
          id: '1',
          firstName: 'Emily',
          lastName: 'Doe',
          dateOfBirth: '2015-05-15',
          gender: 'Female',
        },
        {
          id: '2',
          firstName: 'Michael',
          lastName: 'Doe',
          dateOfBirth: '2018-08-22',
          gender: 'Male',
        },
      ],
    },
    {
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.j@example.com',
      mobile: '+1-555-0201',
      spouse: {
        firstName: 'David',
        lastName: 'Johnson',
        email: 'david.j@example.com',
        mobile: '+1-555-0202',
      },
      address: {
        street: '456 Oak Avenue',
        city: 'Portland',
        state: 'Oregon',
        zipCode: '97201',
        country: 'USA',
      },
      children: [
        {
          id: '3',
          firstName: 'Sophia',
          lastName: 'Johnson',
          dateOfBirth: '2016-03-10',
          gender: 'Female',
        },
      ],
    },
    {
      firstName: 'Robert',
      lastName: 'Smith',
      email: 'robert.smith@example.com',
      mobile: '+1-555-0301',
      spouse: {
        firstName: 'Maria',
        lastName: 'Smith',
        email: 'maria.smith@example.com',
        mobile: '+1-555-0302',
      },
      address: {
        street: '789 Pine Road',
        city: 'Austin',
        state: 'Texas',
        zipCode: '73301',
        country: 'USA',
      },
      children: [],
    },
    {
      firstName: 'Lisa',
      lastName: 'Williams',
      email: 'lisa.w@example.com',
      mobile: '+1-555-0401',
      spouse: {
        firstName: '',
        lastName: '',
        email: '',
        mobile: '',
      },
      address: {
        street: '321 Maple Drive',
        city: 'Seattle',
        state: 'Washington',
        zipCode: '98101',
        country: 'USA',
      },
      children: [],
    },
    {
      firstName: 'James',
      lastName: 'Brown',
      email: 'james.brown@example.com',
      mobile: '+1-555-0501',
      spouse: {
        firstName: 'Patricia',
        lastName: 'Brown',
        email: 'patricia.b@example.com',
        mobile: '+1-555-0502',
      },
      address: {
        street: '654 Cedar Lane',
        city: 'Denver',
        state: 'Colorado',
        zipCode: '80201',
        country: 'USA',
      },
      children: [
        {
          id: '4',
          firstName: 'Oliver',
          lastName: 'Brown',
          dateOfBirth: '2014-11-08',
          gender: 'Male',
        },
        {
          id: '5',
          firstName: 'Emma',
          lastName: 'Brown',
          dateOfBirth: '2017-02-14',
          gender: 'Female',
        },
        {
          id: '6',
          firstName: 'Noah',
          lastName: 'Brown',
          dateOfBirth: '2019-06-20',
          gender: 'Male',
        },
      ],
    },
  ];
};

// Function to populate database with sample data
export const populateSampleData = async (DatabaseService) => {
  const sampleMembers = generateSampleMembers();
  
  try {
    for (const member of sampleMembers) {
      await DatabaseService.createMember(member);
    }
    console.log(`Successfully added ${sampleMembers.length} sample members`);
    return true;
  } catch (error) {
    console.error('Error populating sample data:', error);
    return false;
  }
};

// How to use:
// 1. Import in your component or App.js:
//    import { populateSampleData } from './utils/sampleData';
//
// 2. Call the function after database initialization:
//    await populateSampleData(DatabaseService);
//
// 3. Or use in browser console:
//    populateSampleData(DatabaseService)
