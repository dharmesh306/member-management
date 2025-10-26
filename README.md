# Member Management App

A cross-platform member management application built with React Native for Web, Android, and iOS, using CouchDB/PouchDB as the backend database.

## Features

- ✅ **Cross-Platform**: Runs on Web, Android, and iOS
- ✅ **Member Management**: Add, edit, and delete members
- ✅ **Comprehensive Member Data**:
  - Personal information (first name, last name, email, mobile)
  - Spouse information with the same fields
  - Shared address section for member and spouse
  - Multiple children with their details
- ✅ **Interactive Dashboard**: Search and filter members in real-time
- ✅ **CouchDB Integration**: Local-first with optional sync to remote CouchDB
- ✅ **Responsive Design**: Beautiful UI that works on all screen sizes
- ✅ **Performance Optimized**: Debounced search, virtualized lists, and efficient rendering

## Prerequisites

- Node.js >= 16
- npm or yarn
- For Android: Android Studio and Android SDK
- For iOS: Xcode (macOS only)

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **For Web:**
   ```bash
   npm run web
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

3. **For Android:**
   ```bash
   npm run android
   ```
   Make sure you have an Android emulator running or a device connected.

4. **For iOS (macOS only):**
   ```bash
   cd ios && pod install && cd ..
   npm run ios
   ```

## Project Structure

```
member-management/
├── src/
│   ├── components/
│   │   └── MemberForm.js         # Reusable form component
│   ├── screens/
│   │   ├── Dashboard.js          # Main dashboard with search
│   │   └── AddEditMember.js      # Add/Edit member screen
│   ├── services/
│   │   └── DatabaseService.js    # CouchDB/PouchDB service
│   ├── models/
│   │   └── MemberModel.js        # Data models and validation
│   └── App.js                    # Main app component
├── public/
│   └── index.html                # Web entry HTML
├── index.js                      # Mobile entry point
├── index.web.js                  # Web entry point
├── package.json
├── webpack.config.js             # Web build configuration
└── babel.config.js
```

## Database Configuration

### Local Database
The app uses PouchDB for local storage, which automatically uses:
- **IndexedDB** for web browsers
- **AsyncStorage** for React Native (Android/iOS)

### Remote CouchDB Sync (Optional)

To connect to a remote CouchDB server, modify `src/services/DatabaseService.js`:

```javascript
// After initializing the database
DatabaseService.connectToRemote(
  'http://your-couchdb-server:5984/member_management',
  'username',
  'password'
);
```

## Usage

### Adding a Member
1. Click "Add New Member" button
2. Fill in member information (required fields marked with *)
3. Optionally add spouse information
4. Fill in the shared address
5. Add children if needed
6. Click "Create Member"

### Searching Members
- Use the search bar to filter by name, email, or mobile number
- Search is debounced for performance (300ms delay)
- Results update in real-time

### Editing a Member
1. Click "Edit" button on any member card
2. Update the information
3. Click "Update Member"

### Deleting a Member
1. Click "Delete" button on any member card
2. Confirm the deletion

## Data Model

### Member Structure
```javascript
{
  firstName: string,
  lastName: string,
  email: string,
  mobile: string,
  spouse: {
    firstName: string,
    lastName: string,
    email: string,
    mobile: string
  },
  address: {
    street: string,
    city: string,
    state: string,
    zipCode: string,
    country: string
  },
  children: [
    {
      id: string,
      firstName: string,
      lastName: string,
      dateOfBirth: string,
      gender: string
    }
  ]
}
```

## Performance Optimizations

- **Debounced Search**: 300ms delay to reduce unnecessary re-renders
- **Virtualized Lists**: FlatList with optimized rendering settings
- **Memoization**: Callbacks and computed values are memoized
- **Indexed Database**: CouchDB indexes for fast queries
- **Efficient Updates**: Only re-render affected components

## Building for Production

### Web
```bash
npm run build:web
```
Output will be in `web-build/` directory.

### Android
```bash
cd android
./gradlew assembleRelease
```

### iOS
Open `ios/MemberManagement.xcworkspace` in Xcode and build.

## Troubleshooting

### Web Issues
- Clear browser cache if experiencing issues
- Check console for errors
- Ensure webpack dev server is running on port 3000

### Mobile Issues
- Run `npm start -- --reset-cache` to clear Metro cache
- For Android: Check that Android SDK is properly configured
- For iOS: Run `pod install` again if dependencies fail

### Database Issues
- Check browser console (web) or React Native debugger for errors
- Verify CouchDB connection if using remote sync
- Clear local database: `DatabaseService.destroyDatabase()`

## Technologies Used

- **React Native**: Cross-platform mobile framework
- **React Native Web**: Run React Native on web
- **PouchDB**: Client-side database with CouchDB sync
- **Webpack**: Web bundler
- **Babel**: JavaScript compiler

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
