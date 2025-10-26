# Quick Start Guide - Member Management System

## 🚀 Getting Started in 3 Steps

### Step 1: Install Dependencies

Open PowerShell in the project directory and run:

```powershell
npm install
```

Or use the setup script:

```powershell
.\setup.ps1
```

### Step 2: Start the Development Server

```powershell
npm start
```

This will open the Expo Developer Tools in your browser.

### Step 3: Run the App

**Option A: On Your Phone**
1. Install "Expo Go" app from your app store
2. Scan the QR code shown in the terminal or browser
3. The app will load on your device

**Option B: On Emulator**
- Press `a` to open on Android emulator
- Press `i` to open on iOS simulator (Mac only)

**Option C: On Web Browser**
- Press `w` to open in web browser

---

## 🔐 Login Credentials

### Admin Account
- **Username**: `admin`
- **Password**: `admin123`
- **Access**: Full CRUD operations

### User Account
- **Username**: `user`
- **Password**: `user123`
- **Access**: View-only

---

## 📱 App Overview

### 1. **Login Screen**
- Enter credentials
- Demo credentials provided on screen
- Secure authentication with role-based access

### 2. **Dashboard**
- Statistics cards showing:
  - Total Members
  - Lifetime Members
  - Regular Members
  - Members with Kids
- Member directory list
- Add Member button (admin only)

### 3. **Member List**
- View all members
- Tap on a card to see full details
- Edit/Delete options for admin users
- Beautiful card-based UI

### 4. **Add Member Form**
Sections include:
- **Member Information**: Name, contact, family details
- **Spouse Information**: Complete spouse details
- **Address**: Full residential address
- **Membership**: Lifetime or Regular status
- **Children**: Add multiple children (optional)

### 5. **Edit Member**
- Same form as Add Member
- Pre-filled with existing data
- Update and save changes

---

## 📋 Key Features

✅ **Role-Based Access Control**
- Admin: Full access
- User: View-only

✅ **Complete Member Profiles**
- Personal details
- Spouse information
- Address
- Membership status
- Children records

✅ **Intuitive UI**
- Modern card-based design
- Color-coded badges
- Easy navigation
- Responsive forms

✅ **Data Persistence**
- AsyncStorage for local data
- Survives app restarts
- Demo data included

✅ **Form Validation**
- Required field checking
- Proper error messages
- Data integrity

---

## 🎨 UI Components

### Forms
- **MemberForm.js**: Member/Spouse info
- **AddressForm.js**: Address details
- **MembershipForm.js**: Membership type
- **KidsForm.js**: Dynamic children list

### Screens
- **LoginScreen.js**: Authentication
- **DashboardScreen.js**: Main hub
- **AddMemberScreen.js**: Create records
- **EditMemberScreen.js**: Update records

---

## 🔧 Common Commands

```powershell
# Install dependencies
npm install

# Start development server
npm start

# Start with cache cleared
npm start -- --clear

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on web
npm run web
```

---

## 📂 Project Structure

```
member-management/
├── App.js                    # Main app & navigation
├── package.json              # Dependencies
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── MemberForm.js
│   │   ├── AddressForm.js
│   │   ├── MembershipForm.js
│   │   ├── KidsForm.js
│   │   └── MemberList.js
│   └── screens/             # App screens
│       ├── LoginScreen.js
│       ├── DashboardScreen.js
│       ├── AddMemberScreen.js
│       └── EditMemberScreen.js
└── README.md                 # Documentation
```

---

## 💡 Tips & Tricks

### Adding Test Data
The app comes with 2 demo members. You can add more by:
1. Login as admin
2. Click "Add Member"
3. Fill the form
4. Submit

### Resetting Data
To clear all data and start fresh:
1. In your device settings, clear app data
2. Or modify the demo data in `DashboardScreen.js`

### Customizing Colors
All colors are in the StyleSheet sections:
- Primary Green: `#4CAF50`
- Blue: `#2196F3`
- Orange: `#FF9800`
- Red/Delete: `#F44336`

### Form Fields
All fields marked with `*` are required.
Optional fields can be left empty.

---

## ❓ Troubleshooting

### Issue: "Dependencies failed to install"
**Solution**: 
```powershell
Remove-Item -Recurse -Force node_modules
npm install
```

### Issue: "Expo not starting"
**Solution**:
```powershell
npm start -- --clear
```

### Issue: "Can't connect to Metro"
**Solution**:
- Ensure phone and computer are on same WiFi
- Check firewall settings
- Try using tunnel mode: Press `t` in the terminal

### Issue: "Form not saving"
**Solution**:
- Check console for errors
- Ensure all required fields are filled
- Verify AsyncStorage permissions

---

## 🎯 Next Steps

Once you're comfortable with the app:

1. **Customize the fields** in form components
2. **Add more validation** rules
3. **Integrate with a backend** API
4. **Add search/filter** functionality
5. **Implement reports** and analytics
6. **Add photo upload** for members
7. **Export data** to CSV/Excel

---

## 📞 Need Help?

- Check the main README.md for detailed documentation
- Review the code comments in each file
- Search for errors in console logs
- Check Expo documentation: https://docs.expo.dev/

---

**Happy Coding! 🎉**
