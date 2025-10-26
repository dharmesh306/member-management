# Test Data Documentation

## 🎉 Successfully Generated 100 Test Members!

Your database now contains realistic test data to help you test the member management system.

## 📊 What Was Generated

### Members
- **100 total members** with realistic names, emails, and phone numbers
- **69 members with spouses** (69%)
- **57 members with children** (57%)
- **123 total children** across all families

### User Accounts
- **20 user accounts** for testing authentication
- All accounts use the same password: `Test123!`

## 🔐 Test User Credentials

### Sample Login Accounts

You can log in with any of these accounts:

1. **elizabethjackson@gmail.com** / Password: `Test123!`
2. **laura.turner@gmail.com** / Password: `Test123!`
3. **angelabrooks@icloud.com** / Password: `Test123!`
4. **scott815@hotmail.com** / Password: `Test123!`
5. **donnarodriguez@gmail.com** / Password: `Test123!`

**Note**: The first 20 members in the database have user accounts. All use password: `Test123!`

## 🧪 Testing Features

### Test the Dashboard Search
The dashboard now has 100 members to search through:
- Search by first name: "James", "Mary", "John"
- Search by last name: "Smith", "Johnson", "Williams"
- Search by email: "@gmail.com", "@yahoo.com"
- Search by phone: "+1"

### Test Pagination & Performance
- Scroll through the member list
- Test the search debouncing (300ms delay)
- Verify sync status with CouchDB

### Test Member Details
- View members with spouses
- View members with children (1-4 kids each)
- Check address information
- Edit member information

### Test Authentication
1. **Login**: Use any of the 20 test accounts
2. **Search Members**: Find members in the dashboard
3. **Add Member**: Create a new member
4. **Edit Member**: Update existing member data
5. **Delete Member**: Remove a test member
6. **Logout**: Test session management

## 📋 Data Structure

Each generated member includes:

```javascript
{
  firstName: "John",
  lastName: "Smith",
  email: "john.smith@gmail.com",
  mobile: "+12125551234",
  address: {
    street: "1234 Main St",
    city: "New York",
    state: "NY",
    zipCode: "10001"
  },
  spouse: {  // 69% have spouse
    firstName: "Jane",
    lastName: "Smith",
    email: "jane.smith@gmail.com",
    mobile: "+12125555678"
  },
  children: [  // 57% have children
    {
      firstName: "Tommy",
      age: 8,
      birthDate: "2016-05-15"
    }
  ]
}
```

## 🎯 Test Scenarios

### 1. Search Performance Test
- **Goal**: Verify search works with 100 members
- **Steps**:
  1. Open http://localhost:3000
  2. Login with test account
  3. Type in search box
  4. Verify results update within 300ms

### 2. Data Integrity Test
- **Goal**: Ensure CouchDB sync works properly
- **Steps**:
  1. Open CouchDB Fauxton: http://astworkbench03:5984/_utils
  2. Navigate to `member_management` database
  3. Verify 100 members + 20 users = 120 documents
  4. Check sync status in dashboard

### 3. CRUD Operations Test
- **Goal**: Test all member operations
- **Steps**:
  1. **Create**: Add a new member (member #101)
  2. **Read**: Search for and view the member
  3. **Update**: Edit member details
  4. **Delete**: Remove the test member

### 4. Family Data Test
- **Goal**: Verify spouse and children display correctly
- **Steps**:
  1. Search for members with spouse (69 members)
  2. View spouse information
  3. Search for members with children (57 members)
  4. Verify children ages and birthdates

### 5. Multi-User Test
- **Goal**: Test concurrent access
- **Steps**:
  1. Open two browser windows
  2. Login with different test accounts
  3. Edit different members
  4. Verify sync updates in both windows

## 🔄 Regenerate Test Data

If you want to regenerate the test data:

```bash
# This will add another 100 members
npm run generate-test-data
```

**Warning**: This will ADD 100 more members, not replace existing ones.

### To Clear All Data
If you want to start fresh:

1. Open CouchDB Fauxton: http://astworkbench03:5984/_utils
2. Delete the `member_management` database
3. Recreate it
4. Run the script again: `npm run generate-test-data`

## 📈 Statistics by Category

### Geographic Distribution
- Members from 40+ different US cities
- All 50 US states represented
- Realistic addresses with street, city, state, zip

### Contact Information
- 100% have email addresses
- 100% have mobile phone numbers
- Multiple email providers (Gmail, Yahoo, Hotmail, Outlook, iCloud)
- US phone numbers with realistic area codes

### Family Composition
- **31 singles** (no spouse, no children)
- **12 couples** (spouse, no children)
- **57 families** (spouse and/or children)
- **Average 2.16 children** per family with kids

### Children Demographics
- Ages range from 1 to 18 years
- Realistic birthdates
- 1-4 children per family

## 🚀 Quick Start Testing

### 1. Login to the App
```
URL: http://localhost:3000
Email: elizabethjackson@gmail.com
Password: Test123!
```

### 2. View All Members
- You'll see 100 members in the dashboard
- Use the search box to filter

### 3. Test Search
Try these searches:
- "Smith" - Find all Smiths
- "New York" - Find members in New York
- "@gmail" - Find Gmail users
- "John" - Find all Johns

### 4. View Member Details
- Click any member to see full details
- Check if they have spouse
- Check if they have children
- View complete address

## 🎨 Data Realism

The test data includes:
- ✅ Real US first names (top 100)
- ✅ Real US last names (top 100)
- ✅ Valid email formats
- ✅ Realistic phone numbers
- ✅ Real US cities and states
- ✅ Valid ZIP codes
- ✅ Logical family structures
- ✅ Age-appropriate birthdates

## 🔍 Finding Specific Test Data

### Members with Spouse Only
Look for members where children array is empty but spouse exists

### Members with Children Only  
Look for single parents (no spouse, but has children)

### Large Families
Filter members with 3+ children

### Recent Additions
Sort by creation date to see the test data

## 💡 Tips

1. **Search is Fast**: The 300ms debounce ensures smooth searching even with 100 members
2. **Sync Works**: All data syncs to CouchDB automatically
3. **Realistic Testing**: Use diverse data to test edge cases
4. **Performance**: Dashboard handles 100+ members without lag
5. **Mobile Ready**: Test data works on Android/iOS too

## 📞 Support

If you encounter any issues with the test data:
1. Check the browser console for errors
2. Verify CouchDB connection
3. Check sync status indicator
4. Try regenerating the data

## ✅ Verification Checklist

After generation, verify:
- [ ] Can login with test accounts
- [ ] Dashboard shows 100 members
- [ ] Search filters members correctly
- [ ] Can view member details
- [ ] Spouse data displays (if present)
- [ ] Children data displays (if present)
- [ ] Sync status shows green
- [ ] Can add new members
- [ ] Can edit existing members
- [ ] Can delete members

---

**Enjoy testing with realistic data! 🎉**
