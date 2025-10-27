// OAuth Authentication Service
// Handles Google, Facebook, and Outlook/Microsoft OAuth flows

class OAuthService {
  constructor() {
    // OAuth Configuration
    // Note: In production, these should be set via environment variables
    // For development, update these values directly or use a config file
    this.config = {
      google: {
        clientId: typeof process !== 'undefined' && process.env?.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
        redirectUri: 'http://localhost:3000/auth/google/callback',
        scope: 'profile email',
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
      },
      facebook: {
        appId: typeof process !== 'undefined' && process.env?.FACEBOOK_APP_ID || 'YOUR_FACEBOOK_APP_ID',
        redirectUri: 'http://localhost:3000/auth/facebook/callback',
        scope: 'email,public_profile',
        authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
        tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
      },
      microsoft: {
        clientId: typeof process !== 'undefined' && process.env?.MICROSOFT_CLIENT_ID || 'YOUR_MICROSOFT_CLIENT_ID',
        redirectUri: 'http://localhost:3000/auth/microsoft/callback',
        scope: 'openid profile email User.Read',
        authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      },
    };
  }

  // Generate random state for CSRF protection
  generateState() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  // Store state in session storage
  saveState(provider, state) {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem(`oauth_state_${provider}`, state);
    }
  }

  // Verify state from callback
  verifyState(provider, state) {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const savedState = window.sessionStorage.getItem(`oauth_state_${provider}`);
      window.sessionStorage.removeItem(`oauth_state_${provider}`);
      return savedState === state;
    }
    return false;
  }

  // Google OAuth Login
  loginWithGoogle() {
    const state = this.generateState();
    this.saveState('google', state);

    const params = new URLSearchParams({
      client_id: this.config.google.clientId,
      redirect_uri: this.config.google.redirectUri,
      response_type: 'code',
      scope: this.config.google.scope,
      state: state,
      access_type: 'offline',
      prompt: 'consent',
    });

    const authUrl = `${this.config.google.authUrl}?${params.toString()}`;
    
    console.log('🔐 Redirecting to Google OAuth...');
    if (typeof window !== 'undefined') {
      window.location.href = authUrl;
    }
  }

  // Facebook OAuth Login
  loginWithFacebook() {
    const state = this.generateState();
    this.saveState('facebook', state);

    const params = new URLSearchParams({
      client_id: this.config.facebook.appId,
      redirect_uri: this.config.facebook.redirectUri,
      response_type: 'code',
      scope: this.config.facebook.scope,
      state: state,
    });

    const authUrl = `${this.config.facebook.authUrl}?${params.toString()}`;
    
    console.log('🔐 Redirecting to Facebook OAuth...');
    if (typeof window !== 'undefined') {
      window.location.href = authUrl;
    }
  }

  // Microsoft/Outlook OAuth Login
  loginWithMicrosoft() {
    const state = this.generateState();
    this.saveState('microsoft', state);

    const params = new URLSearchParams({
      client_id: this.config.microsoft.clientId,
      redirect_uri: this.config.microsoft.redirectUri,
      response_type: 'code',
      scope: this.config.microsoft.scope,
      state: state,
      prompt: 'select_account',
    });

    const authUrl = `${this.config.microsoft.authUrl}?${params.toString()}`;
    
    console.log('🔐 Redirecting to Microsoft OAuth...');
    if (typeof window !== 'undefined') {
      window.location.href = authUrl;
    }
  }

  // Handle OAuth callback
  async handleCallback(provider, code, state) {
    try {
      console.log(`📥 Handling ${provider} OAuth callback...`);

      // Verify state to prevent CSRF attacks
      if (!this.verifyState(provider, state)) {
        throw new Error('Invalid state parameter - possible CSRF attack');
      }

      // Exchange authorization code for access token
      const tokenData = await this.exchangeCodeForToken(provider, code);
      
      // Get user profile from OAuth provider
      const profile = await this.getUserProfile(provider, tokenData.access_token);
      
      console.log(`✅ ${provider} authentication successful:`, profile);

      return {
        success: true,
        provider,
        profile,
        accessToken: tokenData.access_token,
      };
    } catch (error) {
      console.error(`❌ ${provider} OAuth error:`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Exchange authorization code for access token
  async exchangeCodeForToken(provider, code) {
    const config = this.config[provider];
    
    // Note: In production, this should be done on the backend to keep client_secret secure
    console.log(`⚠️  WARNING: Token exchange should be done on backend in production`);
    console.log(`📝 Provider: ${provider}, Code: ${code.substring(0, 10)}...`);

    // For development, simulate token exchange
    // In production, make a POST request to the tokenUrl with client_secret
    return {
      access_token: `${provider}_mock_token_${Date.now()}`,
      token_type: 'Bearer',
      expires_in: 3600,
    };
  }

  // Get user profile from OAuth provider
  async getUserProfile(provider, accessToken) {
    console.log(`📋 Fetching ${provider} user profile...`);

    // In production, make actual API calls to get user profile
    // For development, return mock data
    const mockProfiles = {
      google: {
        id: 'google_' + Date.now(),
        email: 'user@gmail.com',
        name: 'Google User',
        firstName: 'Google',
        lastName: 'User',
        picture: 'https://via.placeholder.com/150',
        provider: 'google',
      },
      facebook: {
        id: 'facebook_' + Date.now(),
        email: 'user@facebook.com',
        name: 'Facebook User',
        firstName: 'Facebook',
        lastName: 'User',
        picture: 'https://via.placeholder.com/150',
        provider: 'facebook',
      },
      microsoft: {
        id: 'microsoft_' + Date.now(),
        email: 'user@outlook.com',
        name: 'Microsoft User',
        firstName: 'Microsoft',
        lastName: 'User',
        picture: 'https://via.placeholder.com/150',
        provider: 'microsoft',
      },
    };

    return mockProfiles[provider] || null;
  }

  // Link OAuth account to existing member
  async linkOAuthAccount(memberId, provider, oauthProfile) {
    try {
      console.log(`🔗 Linking ${provider} account to member ${memberId}...`);
      
      // In production, store OAuth data in database
      const oauthData = {
        provider,
        providerId: oauthProfile.id,
        email: oauthProfile.email,
        name: oauthProfile.name,
        picture: oauthProfile.picture,
        linkedAt: new Date().toISOString(),
      };

      console.log('✅ OAuth account linked successfully');
      return { success: true, oauthData };
    } catch (error) {
      console.error('❌ Error linking OAuth account:', error);
      return { success: false, error: error.message };
    }
  }

  // Check if OAuth is configured
  isConfigured(provider) {
    const config = this.config[provider];
    if (!config) return false;

    const clientIdKey = provider === 'facebook' ? 'appId' : 'clientId';
    return config[clientIdKey] && !config[clientIdKey].includes('YOUR_');
  }
}

export default new OAuthService();
