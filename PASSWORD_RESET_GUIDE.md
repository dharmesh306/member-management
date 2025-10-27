# Password Reset with Verification Code - Complete Guide

## Overview

The forgot password feature allows users to reset their password using a **verification code** sent via email or SMS. This is a secure, user-friendly 3-step process.

---

## How It Works

### **3-Step Process:**

#### 1️⃣ **Step 1: Request Reset**
- User enters their **email** or **mobile number**
- System automatically detects format:
  - Contains `@` → Email
  - No `@` → SMS/Mobile
- Generates a 32-character reset token
- Extracts first 6 characters as verification code
- Saves token to database with 1-hour expiration
- Sends code to user

#### 2️⃣ **Step 2: Verify Code**
- User receives 6-digit code
- Enters code in the app
- System validates code matches token
- If valid, proceeds to password reset
- Options to resend or change contact method

#### 3️⃣ **Step 3: Create New Password**
- User enters new password
- Confirms password (must match)
- Minimum 6 characters required
- Password is hashed and saved
- Reset token is deleted
- User is redirected to login

---

## User Interface

### **Screen 1: Enter Email/Phone**
```
┌─────────────────────────────────────┐
│        Forgot Password?             │
│                                     │
│  Enter your email or mobile number  │
│  to reset your password             │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Email or Mobile Number      │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │     Send Reset Code         │   │
│  └─────────────────────────────┘   │
│                                     │
│  ← Back to Login                   │
└─────────────────────────────────────┘
```

### **Screen 2: Enter Verification Code**
```
┌─────────────────────────────────────┐
│    Enter Verification Code          │
│                                     │
│  We've sent a 6-digit code to       │
│  your email                         │
│  user@example.com                   │
│                                     │
│  ┌───────────────────────────┐     │
│  │   💡 Your Verification Code│     │
│  │                             │     │
│  │       A B C 1 2 3           │     │
│  │                             │     │
│  │   Enter this code below     │     │
│  └───────────────────────────┘     │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Verification Code           │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │      Verify Code            │   │
│  └─────────────────────────────┘   │
│                                     │
│  ← Change Email   Resend Code →    │
└─────────────────────────────────────┘
```

### **Screen 3: Create New Password**
```
┌─────────────────────────────────────┐
│     Create New Password             │
│                                     │
│  Enter your new password below      │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ New Password                │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Confirm Password            │   │
│  └─────────────────────────────┘   │
│                                     │
│  ℹ Password must be at least       │
│    6 characters long                │
│                                     │
│  ┌─────────────────────────────┐   │
│  │    Reset Password           │   │
│  └─────────────────────────────┘   │
│                                     │
│  ← Back to Login                   │
└─────────────────────────────────────┘
```

---

## Technical Implementation

### **Files Modified:**

1. **`src/screens/ForgotPassword.js`**
   - 3-step UI flow
   - Verification code input
   - Password reset form
   - Error handling and validation

2. **`src/services/AuthService.js`**
   - `requestPasswordReset(identifier, resetMethod)`
   - `resetPassword(token, newPassword)`
   - Token generation and validation
   - Console logging for testing

### **Database Fields:**

```javascript
member.auth = {
  password: "hashed_password",
  resetToken: "ABC123XYZ789...",  // 32 characters
  resetTokenExpiry: "2025-10-27T15:30:00.000Z"  // 1 hour from now
}
```

### **Security Features:**

- ✅ Reset tokens expire after 1 hour
- ✅ Passwords are hashed before storage
- ✅ Tokens deleted after successful reset
- ✅ Minimum password length enforcement
- ✅ Password confirmation required
- ✅ Invalid token detection

---

## Testing Guide

### **Method 1: Using the App**

1. **Start the server:**
   ```powershell
   npm run web
   ```

2. **Navigate to forgot password:**
   - Go to http://localhost:3000
   - Click "Forgot Password?" link

3. **Enter credentials:**
   - Email: `dharmesh4@hotmail.com` (or any registered email)
   - Or Mobile: `+1234567890` (if registered)
   - Click "Send Reset Code"

4. **Check console:**
   - Open browser console (F12)
   - Look for the verification code:
   ```
   === PASSWORD RESET EMAIL ===
   To: dharmesh4@hotmail.com
   Verification Code: ABC123
   ===========================
   ```

5. **Enter code:**
   - Type the 6-digit code (e.g., `ABC123`)
   - Click "Verify Code"

6. **Reset password:**
   - Enter new password (min 6 chars)
   - Confirm password
   - Click "Reset Password"

7. **Login:**
   - You'll be redirected to login
   - Login with new password

### **Method 2: Using Test Script**

```powershell
node scripts/testPasswordReset.js
```

This will:
- Find a test member
- Generate verification code
- Show email/SMS simulation
- Demonstrate the complete flow

---

## Console Output Examples

### **Email Reset:**
```
=== PASSWORD RESET EMAIL ===
To: user@example.com
Verification Code: A1B2C3
Reset link: http://localhost:3000/reset-password?token=A1B2C3D4E5F6...
===========================
```

### **SMS Reset:**
```
=== PASSWORD RESET SMS ===
To: +1234567890
Message: Your password reset code is: A1B2C3
Code expires in 1 hour.
===========================
```

---

## Error Handling

### **Common Errors:**

| Error | Cause | Solution |
|-------|-------|----------|
| "No account found" | Email/mobile not registered | Check spelling or register |
| "Invalid verification code" | Wrong code entered | Check console for correct code |
| "Reset token has expired" | More than 1 hour passed | Request new code |
| "Passwords do not match" | Confirmation doesn't match | Re-enter passwords |
| "Password must be at least 6 characters" | Too short | Use longer password |

---

## Production Deployment

### **Email Integration:**

To send actual emails, integrate with a service like SendGrid, AWS SES, or Nodemailer:

```javascript
// Example with SendGrid
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: email,
  from: 'noreply@yourapp.com',
  subject: 'Password Reset Verification Code',
  text: `Your verification code is: ${verificationCode}`,
  html: `
    <h2>Password Reset</h2>
    <p>Your verification code is:</p>
    <h1 style="letter-spacing: 5px;">${verificationCode}</h1>
    <p>This code expires in 1 hour.</p>
  `,
};

await sgMail.send(msg);
```

### **SMS Integration:**

To send actual SMS, integrate with Twilio or similar:

```javascript
// Example with Twilio
const twilio = require('twilio');
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

await client.messages.create({
  body: `Your password reset code is: ${verificationCode}. Expires in 1 hour.`,
  from: process.env.TWILIO_PHONE_NUMBER,
  to: mobile
});
```

### **Security Enhancements:**

For production, consider:
- Rate limiting (max 3 attempts per hour)
- CAPTCHA verification
- IP address logging
- Two-factor authentication option
- Stronger password requirements
- bcrypt for password hashing

---

## Flow Diagram

```
User                    App                     Database
  |                      |                         |
  |-- Enter Email ------>|                         |
  |                      |-- Generate Token ------>|
  |                      |                         |
  |<--- Send Code -------|<-- Save Token ----------|
  |                      |                         |
  |-- Enter Code ------->|                         |
  |                      |-- Verify Code --------->|
  |                      |                         |
  |<--- Code Valid ------|<-- Token Matches -------|
  |                      |                         |
  |-- New Password ----->|                         |
  |                      |-- Hash & Update ------->|
  |                      |                         |
  |<--- Success ---------|<-- Delete Token --------|
  |                      |                         |
  |-- Login with New --->|                         |
  |                      |                         |
```

---

## Support

If you encounter issues:
1. Check browser console for error messages
2. Verify email/mobile is registered
3. Ensure verification code matches console output
4. Check token hasn't expired (< 1 hour)
5. Review database for auth.resetToken field

---

**Status:** ✅ Fully Implemented and Ready for Testing

**Last Updated:** October 27, 2025
