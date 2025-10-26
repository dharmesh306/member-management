# Quick Start Guide - Authentication System

## 🎉 Your authentication system is ready!

The member management app now has complete login, registration, and password recovery features.

## ✅ What's Been Implemented

### 1. Login System
- Login with email or mobile phone
- Separate login for members and spouses
- Password authentication with encryption
- Session management

### 2. Registration System
- Two-step registration process
- Member information collection
- Strong password requirements
- Automatic login after registration

### 3. Password Recovery
- Forgot password functionality
- Email or SMS reset options
- Token-based password reset
- Password strength indicator

### 4. Security Features
- SHA-256 password encryption
- Secure session management
- Token expiration (24 hours)
- Password validation

## 🚀 How to Test

### Step 1: Start the Application
The webpack dev server is already running at http://localhost:3000

If you need to restart it:
```bash
npm run web
```

### Step 2: Register a New User
1. Open http://localhost:3000
2. Click **"Create Account"** button
3. Fill in member information:
   - First Name: John
   - Last Name: Doe
   - Email: john@example.com
   - Mobile: +1234567890
4. Click **"Continue"**
5. Set password (must meet requirements):
   - At least 8 characters
   - One uppercase letter
   - One lowercase letter
   - One number
   - One special character
   - Example: `Password123!`
6. Confirm password
7. Click **"Create Account"**

You'll be automatically logged in and see the Dashboard!

### Step 3: Test Logout
1. In the Dashboard, you'll see: "Welcome, John Doe"
2. Click the **"Logout"** button
3. You'll be redirected back to the Login screen

### Step 4: Test Login
1. On the Login screen, enter your credentials:
   - Email or Mobile: john@example.com
   - Password: Password123!
2. Click **"Sign In"**
3. You'll be logged in and see the Dashboard

### Step 5: Test Forgot Password
1. Click **"Forgot Password?"** on Login screen
2. Enter your email: john@example.com
3. Choose reset method: **Email** or **SMS**
4. Click **"Send Reset Link"**
5. **IMPORTANT**: In development mode, the reset token will be displayed on screen
6. Copy the token (it will look like: `reset_1234567890_abc123`)
7. Click **"I have a reset code"**

### Step 6: Reset Password
1. Enter the reset token you copied
2. Enter new password: `NewPassword123!`
3. Confirm password
4. Click **"Reset Password"**
5. You'll see a success message
6. Click **"Back to Login"**

### Step 7: Login with New Password
1. Enter email: john@example.com
2. Enter new password: `NewPassword123!`
3. Click **"Sign In"**
4. Success! You're back in the Dashboard

## 🎨 User Interface Features

### Login Screen
- Clean, modern design
- Toggle between Member/Spouse login
- Input validation
- Links to Forgot Password and Registration

### Registration Screen
- Two-step process indicator
- Form validation
- Password strength requirements display
- Back navigation

### Forgot Password Screen
- Email/SMS toggle
- Token display (development mode)
- Success confirmation
- Navigation to Reset Password

### Reset Password Screen
- Token validation
- Password strength meter (Weak/Fair/Good/Strong)
- Real-time password validation
- Success confirmation

### Dashboard
- Welcome message with user name
- Logout button
- Member search and management
- Sync status indicator

## 📱 Mobile Testing

### Android
```bash
npm run android
```

### iOS
```bash
npm run ios
```

## 🔧 Troubleshooting

### Problem: Can't see login screen
**Solution**: Clear browser cache and localStorage
```javascript
// In browser console:
localStorage.clear();
location.reload();
```

### Problem: Reset token not working
**Solution**: Token expires after 24 hours. Request a new one.

### Problem: Password not accepted
**Solution**: Ensure password meets all requirements:
- ✓ Minimum 8 characters
- ✓ One uppercase letter (A-Z)
- ✓ One lowercase letter (a-z)
- ✓ One number (0-9)
- ✓ One special character (!@#$%^&*)

### Problem: CouchDB sync not working
**Solution**: Check CouchDB configuration in `src/config/config.js`
```javascript
remoteDB: 'http://admin:password@astworkbench03:5984/member_management'
```

### Problem: Login works but shows blank screen
**Solution**: Check browser console for errors. The Dashboard component may need props.

## 📊 Database Structure

### Users Collection
Each user is stored in CouchDB with this structure:
```json
{
  "_id": "user_1234567890",
  "type": "user",
  "email": "john@example.com",
  "mobile": "+1234567890",
  "firstName": "John",
  "lastName": "Doe",
  "passwordHash": "encrypted_password_hash",
  "isMember": true,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### Members Collection
Member data is separate from user authentication:
```json
{
  "_id": "member_1234567890",
  "type": "member",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "mobile": "+1234567890",
  "spouse": { /* ... */ },
  "address": { /* ... */ },
  "children": [ /* ... */ ]
}
```

## 🔐 Security Notes

### Development Mode
- Reset tokens are displayed in UI
- Email/SMS sending is simulated (console.log)
- No rate limiting

### Production Recommendations
1. Hide reset tokens (send via email/SMS only)
2. Implement actual email service (SendGrid, AWS SES)
3. Add SMS service (Twilio)
4. Enable rate limiting
5. Use HTTPS
6. Consider bcrypt instead of SHA-256
7. Add session timeout
8. Implement CORS properly

## 📚 Additional Documentation

- **Authentication System**: See `AUTHENTICATION.md`
- **CouchDB Setup**: See `COUCHDB_CONFIGURED.md`
- **Project Overview**: See `PROJECT_SUMMARY.md`
- **Installation Guide**: See `INSTALLATION.md`

## 🎯 Next Steps

1. ✅ **Test the authentication flow** (follow steps above)
2. 🔲 Add email service integration
3. 🔲 Add SMS service integration
4. 🔲 Implement session timeout
5. 🔲 Add user profile management
6. 🔲 Add member-spouse linking in registration
7. 🔲 Test on mobile devices (Android/iOS)

## 💡 Tips

- Use Chrome DevTools to inspect localStorage: Application → Local Storage
- Check Network tab for CouchDB sync requests
- Console logs show authentication flow details
- Test different password strengths to see validation

## 🎊 Success!

You now have a fully functional authentication system! Users can:
- ✓ Register new accounts
- ✓ Login securely
- ✓ Reset forgotten passwords
- ✓ Manage member data after login

**Happy Testing! 🚀**
