# Authentication System Documentation

## Overview
The member management app now has a complete authentication system with login, registration, and password recovery features.

## Features

### 1. User Login
- **Login Options**: Users can log in using either email or mobile phone number
- **User Types**: Both members and spouses can log in with the same credentials
- **Screen**: `src/screens/Login.js`
- **Toggle**: Switch between "Member Login" and "Spouse Login" modes

### 2. User Registration
- **Two-Step Process**:
  1. Fill in member information (first name, last name, email, mobile)
  2. Set password with confirmation
- **Password Requirements**:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character
- **Screen**: `src/screens/Register.js`

### 3. Forgot Password
- **Reset Methods**: Users can choose to receive reset instructions via:
  - Email
  - SMS (mobile)
- **Token System**: Generates a secure reset token with 24-hour expiration
- **Development Mode**: Displays the reset token in the UI for testing
- **Screen**: `src/screens/ForgotPassword.js`

### 4. Reset Password
- **Token Validation**: Verifies the reset token before allowing password change
- **Password Strength Meter**: Visual indicator showing password strength
- **Password Requirements**: Same as registration
- **Screen**: `src/screens/ResetPassword.js`

## Technical Implementation

### Authentication Service
**File**: `src/services/AuthService.js`

Key methods:
- `register(memberData, password)` - Register new member
- `login(identifier, password, isMember)` - Login with email/mobile
- `requestPasswordReset(identifier, resetMethod)` - Request password reset
- `resetPassword(token, newPassword)` - Reset password with token
- `getCurrentSession()` - Get current logged-in user
- `logout()` - Clear session
- `changePassword(oldPassword, newPassword)` - Change password

### Security Features
- **Password Hashing**: Uses SHA-256 encryption (crypto-js library)
- **Session Management**: Uses localStorage for web, AsyncStorage for mobile
- **Token Expiration**: Reset tokens expire after 24 hours
- **Password Validation**: Strong password requirements enforced

### Database Structure
**Collection**: `users` (in CouchDB/PouchDB)

User document structure:
```json
{
  "_id": "user_timestamp",
  "type": "user",
  "email": "user@example.com",
  "mobile": "+1234567890",
  "firstName": "John",
  "lastName": "Doe",
  "passwordHash": "sha256_hash",
  "isMember": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "resetToken": "optional_reset_token",
  "resetTokenExpiry": "optional_expiry_date"
}
```

## User Flow

### New User Registration
1. User clicks "Create Account" on Login screen
2. Fills in member information (name, email, mobile)
3. Sets password with confirmation
4. Account created and user logged in automatically
5. Redirected to Dashboard

### Existing User Login
1. User enters email or mobile number
2. Toggles between Member/Spouse if needed
3. Enters password
4. Clicks "Sign In"
5. Redirected to Dashboard

### Password Recovery
1. User clicks "Forgot Password?" on Login screen
2. Enters email or mobile number
3. Selects reset method (Email or SMS)
4. Receives reset token
5. Enters token and new password on Reset Password screen
6. Redirected to Login screen

## Integration with Main App

The authentication system is integrated in `src/App.js`:

```javascript
const [currentScreen, setCurrentScreen] = useState('login');
const [currentUser, setCurrentUser] = useState(null);

// Session check on app load
useEffect(() => {
  checkSession();
}, []);

// Screen navigation handlers
const handleLogin = (user) => { /* ... */ };
const handleLogout = () => { /* ... */ };
const handleRegister = () => { /* ... */ };
```

## Testing

### Development Mode Features
- Reset token displayed in UI for easy testing
- Console logs for debugging authentication flow
- No actual email/SMS sending (TODO: integrate SendGrid/Twilio)

### Test Workflow
1. **Register**: Create a new account
2. **Login**: Log in with created credentials
3. **Logout**: Click logout button
4. **Forgot Password**: Request password reset
5. **Reset Password**: Use displayed token to reset password
6. **Login Again**: Verify new password works

## Future Enhancements

### TODO Items
1. **Email Integration**: Replace console.log with actual email sending (SendGrid, AWS SES, etc.)
2. **SMS Integration**: Add Twilio or similar service for SMS
3. **Two-Factor Authentication**: Add optional 2FA
4. **Social Login**: Google, Facebook, Apple sign-in
5. **Remember Me**: Optional persistent login
6. **Account Lockout**: Prevent brute force attacks
7. **Password History**: Prevent password reuse
8. **Email Verification**: Verify email on registration
9. **Activity Log**: Track login history

## Dependencies

```json
{
  "crypto-js": "^4.2.0",
  "pouchdb": "^8.0.1",
  "react-native": "0.72.6"
}
```

## Running the App

### Web
```bash
npm run web
```
Open http://localhost:3000

### Android
```bash
npm run android
```

### iOS
```bash
npm run ios
```

## Security Notes

⚠️ **Important Security Considerations**:

1. **Password Storage**: Currently using SHA-256. For production, consider using bcrypt or Argon2 with salt
2. **Token Security**: Reset tokens should be more complex in production
3. **HTTPS**: Always use HTTPS in production
4. **Rate Limiting**: Implement rate limiting for login/register endpoints
5. **Input Validation**: Validate all inputs on both client and server
6. **Session Timeout**: Implement automatic session timeout
7. **CORS**: Configure proper CORS headers for CouchDB

## Support

For issues or questions:
1. Check console logs for detailed error messages
2. Verify CouchDB connection (see COUCHDB_CONFIGURED.md)
3. Ensure all dependencies are installed: `npm install`
4. Clear browser cache/localStorage if session issues occur
