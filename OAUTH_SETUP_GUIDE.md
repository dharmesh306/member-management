# OAuth Authentication Setup Guide
## Google, Facebook, and Microsoft/Outlook Integration

This guide walks you through setting up OAuth authentication for your member management application.

---

## 📋 Table of Contents
1. [Overview](#overview)
2. [Google OAuth Setup](#google-oauth-setup)
3. [Facebook OAuth Setup](#facebook-oauth-setup)
4. [Microsoft/Outlook OAuth Setup](#microsoftoutlook-oauth-setup)
5. [Environment Configuration](#environment-configuration)
6. [Testing OAuth Flow](#testing-oauth-flow)
7. [Production Deployment](#production-deployment)

---

## Overview

OAuth authentication allows users to sign in using their existing accounts from:
- 🔵 **Google** - Gmail, Google Workspace accounts
- 📘 **Facebook** - Facebook accounts
- 🪟 **Microsoft/Outlook** - Outlook, Office 365, Microsoft accounts

### How It Works

```
User                    App                     OAuth Provider
  |                      |                            |
  |-- Click "Google" --->|                            |
  |                      |-- Redirect to Google ----->|
  |                      |                            |
  |<---------------- Google Login Page ----------------|
  |                      |                            |
  |-- Enter Credentials->|                            |
  |                      |                            |
  |<----------- Authorization Code -----------------|
  |                      |                            |
  |                      |<-- Exchange for Token -----|
  |                      |                            |
  |                      |<-- Get User Profile -------|
  |                      |                            |
  |<--- Login Success ---|                            |
```

---

## 🔵 Google OAuth Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: "Member Management"
4. Click "Create"

### Step 2: Enable Google+ API

1. In the left sidebar, go to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click on it and click "Enable"

### Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" user type
3. Fill in required fields:
   - **App name**: Member Management
   - **User support email**: your-email@example.com
   - **Developer contact**: your-email@example.com
4. Click "Save and Continue"
5. On Scopes screen, click "Add or Remove Scopes"
6. Select: `profile`, `email`
7. Click "Save and Continue"
8. Add test users (optional for development)
9. Click "Save and Continue"

### Step 4: Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. Select "Web application"
4. Fill in:
   - **Name**: Member Management Web Client
   - **Authorized JavaScript origins**:
     - `http://localhost:3000`
     - `https://yourdomain.com` (for production)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/auth/google/callback`
     - `https://yourdomain.com/auth/google/callback` (for production)
5. Click "Create"
6. **Copy the Client ID** - you'll need this

### Google Configuration Example

```env
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
```

---

## 📘 Facebook OAuth Setup

### Step 1: Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "My Apps" → "Create App"
3. Select "Consumer" as use case
4. Enter app name: "Member Management"
5. Enter contact email
6. Click "Create App"

### Step 2: Configure Facebook Login

1. In app dashboard, click "Add Product"
2. Find "Facebook Login" and click "Set Up"
3. Select "Web" platform
4. Enter site URL: `http://localhost:3000`
5. Click "Save" and "Continue"

### Step 3: Configure OAuth Settings

1. Go to "Facebook Login" → "Settings"
2. Add Valid OAuth Redirect URIs:
   - `http://localhost:3000/auth/facebook/callback`
   - `https://yourdomain.com/auth/facebook/callback` (for production)
3. Click "Save Changes"

### Step 4: Get App ID

1. Go to "Settings" → "Basic"
2. **Copy the App ID** - you'll need this
3. (Optional) Copy App Secret for backend

### Facebook Configuration Example

```env
FACEBOOK_APP_ID=1234567890123456
```

---

## 🪟 Microsoft/Outlook OAuth Setup

### Step 1: Register Azure Application

1. Go to [Azure Portal](https://portal.azure.com/)
2. Search for "Azure Active Directory"
3. Click "App registrations" → "New registration"
4. Fill in:
   - **Name**: Member Management
   - **Supported account types**: "Accounts in any organizational directory and personal Microsoft accounts"
   - **Redirect URI**: 
     - Platform: Web
     - URI: `http://localhost:3000/auth/microsoft/callback`
5. Click "Register"

### Step 2: Configure Authentication

1. In your app, go to "Authentication"
2. Under "Web" → "Redirect URIs", add:
   - `http://localhost:3000/auth/microsoft/callback`
   - `https://yourdomain.com/auth/microsoft/callback` (for production)
3. Under "Implicit grant and hybrid flows", enable:
   - ✅ Access tokens
   - ✅ ID tokens
4. Click "Save"

### Step 3: Get Application ID

1. Go to "Overview"
2. **Copy the Application (client) ID** - you'll need this

### Step 4: Configure API Permissions

1. Go to "API permissions"
2. Click "Add a permission"
3. Select "Microsoft Graph"
4. Select "Delegated permissions"
5. Add: `User.Read`, `profile`, `email`, `openid`
6. Click "Add permissions"

### Microsoft Configuration Example

```env
MICROSOFT_CLIENT_ID=12345678-1234-1234-1234-123456789abc
```

---

## ⚙️ Environment Configuration

### Create `.env` file

Create a `.env` file in your project root:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here

# Facebook OAuth
FACEBOOK_APP_ID=your_facebook_app_id_here

# Microsoft OAuth
MICROSOFT_CLIENT_ID=your_microsoft_client_id_here
```

### Update OAuthService Configuration

The `OAuthService.js` file will automatically read from environment variables. If you don't use `.env`, update directly in the config:

```javascript
this.config = {
  google: {
    clientId: 'your_actual_google_client_id',
    // ...
  },
  facebook: {
    appId: 'your_actual_facebook_app_id',
    // ...
  },
  microsoft: {
    clientId: 'your_actual_microsoft_client_id',
    // ...
  },
};
```

---

## 🧪 Testing OAuth Flow

### Test in Development

1. **Start the server:**
   ```bash
   npm run web
   ```

2. **Navigate to login:**
   - Go to http://localhost:3000
   - You should see three new buttons:
     - 🔵 Google
     - 📘 Facebook
     - 🪟 Outlook

3. **Test Google Login:**
   - Click "🔵 Google"
   - You'll be redirected to Google
   - Sign in with your Google account
   - Grant permissions
   - You'll be redirected back (currently shows callback URL)

4. **Check Console:**
   ```
   🔐 Redirecting to Google OAuth...
   ```

### Current Implementation Status

✅ **Completed:**
- OAuth service with Google, Facebook, Microsoft support
- Login UI with OAuth buttons
- State parameter for CSRF protection
- Redirect flow setup
- Profile fetching structure

⚠️ **Development Mode:**
- Currently returns mock data for testing
- Callback handler not yet integrated with app navigation
- Token exchange happens client-side (should be server-side in production)

---

## 🚀 Production Deployment

### Security Requirements

1. **Backend Token Exchange:**
   Move token exchange to backend server:

```javascript
// Backend endpoint: /api/oauth/callback
app.post('/api/oauth/callback', async (req, res) => {
  const { provider, code } = req.body;
  
  // Exchange code for token with client_secret
  const tokenResponse = await axios.post(tokenUrl, {
    code,
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    redirect_uri: process.env.REDIRECT_URI,
    grant_type: 'authorization_code',
  });
  
  // Get user profile
  const profile = await getUserProfile(tokenResponse.access_token);
  
  // Create or link account in database
  const user = await linkOrCreateAccount(profile);
  
  res.json({ success: true, user });
});
```

2. **Environment Variables:**
   - Never commit secrets to Git
   - Use environment variables for all credentials
   - Different values for dev/staging/production

3. **HTTPS Required:**
   - All OAuth providers require HTTPS in production
   - Update redirect URIs to use `https://`

4. **Domain Whitelist:**
   - Update all OAuth providers with production domain
   - Remove localhost URIs from production

### Database Integration

Store OAuth data in user documents:

```javascript
{
  _id: "member_123",
  email: "user@example.com",
  firstName: "John",
  lastName: "Doe",
  auth: {
    password: "hashed_password",  // Regular login
    oauth: {
      google: {
        id: "google_user_id",
        email: "user@gmail.com",
        linkedAt: "2025-10-27T..."
      },
      facebook: {
        id: "facebook_user_id",
        email: "user@facebook.com",
        linkedAt: "2025-10-27T..."
      },
      microsoft: {
        id: "microsoft_user_id",
        email: "user@outlook.com",
        linkedAt: "2025-10-27T..."
      }
    }
  }
}
```

---

## 🎨 UI Features

### Login Screen Updates

The login screen now includes:

- ✅ Divider with "OR CONTINUE WITH" text
- ✅ Three OAuth buttons with provider branding
- ✅ Emoji icons for visual recognition
- ✅ Responsive design
- ✅ Disabled state during loading
- ✅ Error handling

### Button Styling

```javascript
🔵 Google   - Blue border (#4285F4)
📘 Facebook - Blue border (#1877F2)
🪟 Outlook  - Blue border (#00A4EF)
```

---

## 📝 Next Steps

To complete the OAuth integration:

1. **Create OAuth Callback Handler:**
   - Add route handler for `/auth/:provider/callback`
   - Parse authorization code from URL
   - Call `OAuthService.handleCallback()`
   - Link OAuth profile to member account
   - Navigate to dashboard on success

2. **Update AuthService:**
   - Add `loginWithOAuth(provider, profile)` method
   - Check if email exists in database
   - Create new member if needed
   - Link OAuth data to existing member

3. **Add Account Linking:**
   - Allow users to link multiple OAuth providers
   - Show linked accounts in profile settings
   - Option to unlink providers

4. **Handle Edge Cases:**
   - Email already registered with different provider
   - OAuth profile missing email
   - User cancels OAuth flow
   - Token expiration

---

## 🆘 Troubleshooting

### "OAuth login is only available on web"
- OAuth buttons only work in web browser
- Mobile apps require different OAuth setup

### "Invalid state parameter"
- Browser cookies/sessionStorage might be disabled
- Clear browser cache and try again

### Redirect URI Mismatch
- Ensure redirect URI in code matches OAuth provider settings exactly
- Check for trailing slashes
- Verify http vs https

### Missing Permissions
- Check OAuth consent screen configuration
- Verify API permissions are granted
- Some APIs require app verification

---

## 📚 Additional Resources

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login)
- [Microsoft Identity Platform](https://docs.microsoft.com/en-us/azure/active-directory/develop/)

---

**Status:** ✅ OAuth UI and Service Layer Complete

**Last Updated:** October 27, 2025
