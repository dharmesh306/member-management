# Member Management App - Quick Start Guide

## 🚀 Quick Start

### Step 1: Install Dependencies
```powershell
npm install
```

### Step 2: Run the Application

#### For Web (Easiest to test):
```powershell
npm run web
```
Then open http://localhost:3000 in your browser.

#### For Android:
```powershell
npm run android
```
Make sure Android Studio is installed and an emulator is running.

#### For iOS (macOS only):
```powershell
cd ios
pod install
cd ..
npm run ios
```

## 📦 What's Included

✅ **Complete Member Management System**
- Add, edit, and delete members
- Search functionality with real-time filtering
- Beautiful dashboard with statistics

✅ **Comprehensive Member Data**
- Member personal info (name, email, mobile)
- Spouse information
- Shared address
- Multiple children support

✅ **CouchDB/PouchDB Integration**
- Local-first database
- Offline support
- Optional sync with remote CouchDB

✅ **Cross-Platform Support**
- Web (using webpack)
- Android
- iOS

## 🔧 Connecting to Remote CouchDB (Optional)

1. Install and run CouchDB on your server
2. Create a database named "member_management"
3. Update `src/services/DatabaseService.js`:

```javascript
// Add this after initDatabase() in your component
DatabaseService.connectToRemote(
  'http://localhost:5984/member_management',
  'admin',
  'password'
);
```

## 📱 Platform-Specific Setup

### Android Setup
1. Install Android Studio
2. Install Android SDK (API Level 31+)
3. Set up ANDROID_HOME environment variable
4. Create an emulator or connect a device

### iOS Setup (macOS only)
1. Install Xcode from App Store
2. Install Xcode Command Line Tools:
   ```bash
   xcode-select --install
   ```
3. Install CocoaPods:
   ```bash
   sudo gem install cocoapods
   ```

## 🎨 Features Demonstration

### Dashboard
- View all members in cards
- See statistics: Total members, members with spouse, members with children
- Real-time search across name, email, and mobile
- Pull to refresh

### Add/Edit Member
- Form validation
- Required fields marked with *
- Toggle spouse information section
- Add/remove multiple children
- Shared address for member and spouse

### Performance Features
- Debounced search (300ms)
- Virtualized list rendering
- Optimized re-renders
- IndexedDB/AsyncStorage for fast local storage

## 🐛 Troubleshooting

### "Metro bundler not starting"
```powershell
npm start -- --reset-cache
```

### "Build failed on Android"
```powershell
cd android
./gradlew clean
cd ..
npm run android
```

### "Web page not loading"
- Check if port 3000 is available
- Clear browser cache
- Try incognito/private mode

### "Database errors"
Clear the local database:
```javascript
// In browser console or app debugger
DatabaseService.destroyDatabase();
```

## 📝 Project Structure

```
src/
├── App.js                    # Main application component
├── components/
│   └── MemberForm.js        # Reusable form component
├── screens/
│   ├── Dashboard.js         # Main dashboard with search
│   └── AddEditMember.js     # Add/Edit member screen
├── services/
│   └── DatabaseService.js   # CouchDB/PouchDB service layer
└── models/
    └── MemberModel.js       # Data models and validation
```

## 🎯 Next Steps

1. **Test the Web Version**: Start with `npm run web` as it's easiest to test
2. **Add Sample Data**: Create a few members to see the dashboard in action
3. **Try the Search**: Use the search bar to filter members
4. **Customize**: Modify styles in the component files
5. **Connect CouchDB**: Set up remote sync for multi-device access

## 📚 Additional Resources

- [React Native Docs](https://reactnative.dev/)
- [PouchDB Guide](https://pouchdb.com/guides/)
- [CouchDB Documentation](https://docs.couchdb.org/)
- [React Native Web](https://necolas.github.io/react-native-web/)

## 💡 Tips

- Use Chrome DevTools for web debugging
- Use React Native Debugger for mobile debugging
- Test on web first, then mobile platforms
- Keep your data backed up if using production

Enjoy building with Member Management! 🎉
