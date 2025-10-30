import DatabaseService from '../services/DatabaseService';
import CryptoJS from 'crypto-js';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.sessionKey = 'member_session';
  }

  // Hash password
  hashPassword(password) {
    return CryptoJS.SHA256(password).toString();
  }

  // Generate random token
  generateToken() {
    return CryptoJS.lib.WordArray.random(32).toString();
  }

  // Register new member with authentication
  async register(memberData, password) {
    try {
      console.log('\n=== NEW MEMBER REGISTRATION ===');
      console.log('Email:', memberData.email);
      console.log('Mobile:', memberData.mobile);
      console.log('Name:', memberData.firstName, memberData.lastName);
      
      // Check if email or mobile already exists using the new duplicate check
      const duplicateCheck = await DatabaseService.checkDuplicateMember(
        memberData.email,
        memberData.mobile
      );

      if (duplicateCheck.exists) {
        let errorMessage = 'A member already exists with ';
        const issues = [];
        
        if (duplicateCheck.emailExists) {
          issues.push(`email "${memberData.email}"`);
        }
        if (duplicateCheck.mobileExists) {
          issues.push(`mobile number "${memberData.mobile}"`);
        }
        
        errorMessage += issues.join(' and ');
        errorMessage += '. Please use different contact information.';
        
        throw new Error(errorMessage);
      }

      // Create member with hashed password
      const hashedPassword = this.hashPassword(password);
      
      // Generate verification code and token
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const verificationToken = this.generateToken(); // Using the same token generator as password reset
      
      const member = {
        ...memberData,
        status: 'pending', // New registrations require admin approval
        auth: {
          password: hashedPassword,
          createdAt: new Date().toISOString(),
          resetToken: null,
          resetTokenExpiry: null,
          lastLogin: null,
          verificationToken,
          verificationCode,
          verificationExpiry: new Date(Date.now() + 3600000).toISOString(), // 1 hour expiry
        },
      };
      
      // Log verification details in the same format as password reset
      console.log('\n=== REGISTRATION VERIFICATION EMAIL ===');
      console.log('To:', member.email);
      console.log('Subject: Verify Your Registration');
      console.log('\nDear ' + member.firstName + ',');
      console.log('\nYour verification code is:');
      console.log('   ' + verificationCode);
      console.log('\nThis code will expire in 1 hour.');
      console.log('\nVerification Link:');
      console.log(`http://localhost:3000/verify-registration?token=${verificationToken}`);
      console.log('═══════════════════════════════════════\n');

      if (member.mobile) {
        console.log('=== REGISTRATION VERIFICATION SMS ===');
        console.log('To:', member.mobile);
        console.log(`Message: Your registration verification code is: ${verificationCode}`);
        console.log('Code expires in 1 hour.');
        console.log('═══════════════════════════════════════\n');
      }

      const createdMember = await DatabaseService.createMember(member);
      
      // Remove password from response
      delete createdMember.auth.password;
      
      // Log registration summary
      console.log('\n=== REGISTRATION SUMMARY ===');
      console.log('Status: ✅ Registration Successful');
      console.log('Member ID:', createdMember._id);
      console.log('Name:', createdMember.firstName, createdMember.lastName);
      console.log('Email:', createdMember.email);
      console.log('Mobile:', createdMember.mobile || 'Not provided');
      console.log('Status: Pending Admin Approval');
      console.log('\n📝 Admin Instructions:');
      console.log('1. Login as admin');
      console.log('2. Go to Admin Management');
      console.log('3. Find this member in pending registrations');
      console.log('4. Use verification code to approve');
      console.log('═══════════════════════════════════════\n');
      
      return {
        success: true,
        member: createdMember,
        message: 'Registration successful! Your account is pending admin approval.',
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Login with email or mobile
  async login(identifier, password, isMember = true) {
    try {
      console.log('=== LOGIN ATTEMPT ===');
      console.log('Identifier:', identifier);
      console.log('isMember flag:', isMember);
      
      // First, check if this is a user account (like super admin)
      const db = DatabaseService.db;
      console.log('DatabaseService.db exists:', !!db);
      
      if (db) {
        try {
          console.log('Searching for user account...');
          const userResult = await db.find({
            selector: {
              type: 'user',
              $or: [
                { email: identifier },
                { mobile: identifier }
              ]
            },
            limit: 1
          });

          console.log('User search result:', userResult.docs.length, 'found');

          if (userResult.docs && userResult.docs.length > 0) {
            const user = userResult.docs[0];
            const hashedPassword = this.hashPassword(password);
            
            console.log('User found:', user.email);
            console.log('Password match:', hashedPassword === user.passwordHash);
            
            if (hashedPassword === user.passwordHash) {
              // Create session
              const session = {
                userId: user._id,
                email: user.email,
                isUser: true,
                timestamp: new Date().toISOString(),
              };

              // Store session
              if (typeof localStorage !== 'undefined') {
                localStorage.setItem(this.sessionKey, JSON.stringify(session));
              }

              this.currentUser = {
                _id: user._id,
                email: user.email,
                mobile: user.mobile,
                firstName: user.firstName,
                lastName: user.lastName,
                isAdmin: user.isAdmin,
                loginType: 'user',
              };

              console.log('=== USER LOGIN SUCCESSFUL ===');
              console.log('User object returned:', JSON.stringify(this.currentUser, null, 2));
              console.log('isAdmin:', this.currentUser.isAdmin);
              console.log('loginType:', this.currentUser.loginType);
              console.log('=============================');

              return {
                success: true,
                user: this.currentUser,
              };
            }
          }
        } catch (userError) {
          console.log('User lookup failed, trying member auth:', userError);
        }
      }

      // Fall back to member authentication
      const member = await this.findMemberByEmailOrMobile(identifier, identifier);

      if (!member) {
        throw new Error('Invalid credentials');
      }

      // Check if account is pending approval
      if (member.status === 'pending') {
        throw new Error(
          'Account Pending Approval\n\n' +
          'Your registration is currently under review by our admin team.\n\n' +
          '• Approval typically takes up to 24 hours\n' +
          '• You will receive an email or SMS notification once approved\n' +
          '• Please check back later or wait for the notification\n\n' +
          'Thank you for your patience!'
        );
      }

      // Check if account was denied
      if (member.status === 'denied') {
        throw new Error('Your account registration was denied. Please contact support for more information.');
      }

      // Check if logging in as member or spouse
      const authData = isMember ? member.auth : member.spouse?.auth;

      // Support both password structures: auth.password (new) and passwordHash (legacy/test data)
      let storedPasswordHash = null;
      if (authData && authData.password) {
        storedPasswordHash = authData.password;
      } else if (member.passwordHash) {
        storedPasswordHash = member.passwordHash;
      }

      if (!storedPasswordHash) {
        throw new Error('Invalid credentials');
      }

      // Verify password
      const hashedPassword = this.hashPassword(password);
      if (hashedPassword !== storedPasswordHash) {
        throw new Error('Invalid credentials');
      }

      // Update last login
      if (isMember) {
        if (member.auth) {
          member.auth.lastLogin = new Date().toISOString();
        } else {
          // For legacy data without auth structure, add it
          member.lastLogin = new Date().toISOString();
        }
      } else {
        if (member.spouse && member.spouse.auth) {
          member.spouse.auth.lastLogin = new Date().toISOString();
        }
      }
      await DatabaseService.updateMember(member._id, member);

      // Create session
      const session = {
        memberId: member._id,
        isMember,
        timestamp: new Date().toISOString(),
      };

      // Store session
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.sessionKey, JSON.stringify(session));
      }

      this.currentUser = {
        ...member,
        loginType: isMember ? 'member' : 'spouse',
      };

      // Remove password from response
      if (this.currentUser.auth) delete this.currentUser.auth.password;
      if (this.currentUser.spouse?.auth) delete this.currentUser.spouse.auth.password;

      return {
        success: true,
        user: this.currentUser,
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Find member by email or mobile
  async findMemberByEmailOrMobile(email, mobile) {
    try {
      const members = await DatabaseService.getAllMembers();
      
      return members.find(member => 
        member.email === email || 
        member.mobile === mobile ||
        member.spouse?.email === email ||
        member.spouse?.mobile === mobile
      );
    } catch (error) {
      console.error('Find member error:', error);
      return null;
    }
  }

  // Request password reset
  async requestPasswordReset(identifier, resetMethod = 'email') {
    try {
      const member = await this.findMemberByEmailOrMobile(identifier, identifier);

      if (!member) {
        throw new Error('No account found with this email or mobile');
      }

      // Generate reset token
      const resetToken = this.generateToken();
      const resetTokenExpiry = new Date(Date.now() + 3600000).toISOString(); // 1 hour

      // Determine if resetting member or spouse password
      const isMemberReset = member.email === identifier || member.mobile === identifier;
      
      if (isMemberReset) {
        member.auth = member.auth || {};
        member.auth.resetToken = resetToken;
        member.auth.resetTokenExpiry = resetTokenExpiry;
      } else {
        member.spouse.auth = member.spouse.auth || {};
        member.spouse.auth.resetToken = resetToken;
        member.spouse.auth.resetTokenExpiry = resetTokenExpiry;
      }

      await DatabaseService.updateMember(member._id, member);

      // In production, send email or SMS here
      // For now, log the code for testing
      const verificationCode = resetToken.substring(0, 6);
      const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;
      
      if (resetMethod === 'email') {
        const email = isMemberReset ? member.email : member.spouse.email;
        console.log('=== PASSWORD RESET EMAIL ===');
        console.log(`To: ${email}`);
        console.log(`Verification Code: ${verificationCode}`);
        console.log(`Reset link: ${resetLink}`);
        console.log('===========================');
        // TODO: Implement email sending service
        // Example: await EmailService.sendPasswordReset(email, verificationCode);
      } else {
        const mobile = isMemberReset ? member.mobile : member.spouse.mobile;
        console.log('=== PASSWORD RESET SMS ===');
        console.log(`To: ${mobile}`);
        console.log(`Message: Your password reset code is: ${verificationCode}`);
        console.log(`Code expires in 1 hour.`);
        console.log('===========================');
        // TODO: Implement SMS sending service
        // Example: await SMSService.send(mobile, `Your reset code is: ${verificationCode}`);
      }

      return {
        success: true,
        message: `Verification code sent via ${resetMethod}`,
        // Remove these in production
        resetToken,
        verificationCode,
      };
    } catch (error) {
      console.error('Password reset request error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Reset password with token
  async resetPassword(token, newPassword) {
    try {
      const members = await DatabaseService.getAllMembers();
      
      let targetMember = null;
      let isMemberReset = true;

      // Find member with matching reset token
      for (const member of members) {
        if (member.auth?.resetToken === token) {
          targetMember = member;
          isMemberReset = true;
          break;
        }
        if (member.spouse?.auth?.resetToken === token) {
          targetMember = member;
          isMemberReset = false;
          break;
        }
      }

      if (!targetMember) {
        throw new Error('Invalid or expired reset token');
      }

      // Check token expiry
      const authData = isMemberReset ? targetMember.auth : targetMember.spouse.auth;
      const expiryDate = new Date(authData.resetTokenExpiry);
      
      if (expiryDate < new Date()) {
        throw new Error('Reset token has expired');
      }

      // Update password
      const hashedPassword = this.hashPassword(newPassword);
      
      if (isMemberReset) {
        targetMember.auth.password = hashedPassword;
        targetMember.auth.resetToken = null;
        targetMember.auth.resetTokenExpiry = null;
      } else {
        targetMember.spouse.auth.password = hashedPassword;
        targetMember.spouse.auth.resetToken = null;
        targetMember.spouse.auth.resetTokenExpiry = null;
      }

      await DatabaseService.updateMember(targetMember._id, targetMember);

      return {
        success: true,
        message: 'Password reset successfully',
      };
    } catch (error) {
      console.error('Password reset error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Check if user is logged in
  isLoggedIn() {
    if (typeof localStorage === 'undefined') return false;
    
    const session = localStorage.getItem(this.sessionKey);
    return !!session;
  }

  // Get current session
  async getCurrentSession() {
    if (typeof localStorage === 'undefined') return null;
    
    const sessionData = localStorage.getItem(this.sessionKey);
    if (!sessionData) return null;

    try {
      const session = JSON.parse(sessionData);
      
      // Check if this is a user session (like super admin)
      if (session.isUser && session.userId) {
        const db = DatabaseService.db;
        if (db) {
          try {
            const user = await db.get(session.userId);
            if (user && user.type === 'user') {
              this.currentUser = {
                _id: user._id,
                email: user.email,
                mobile: user.mobile,
                firstName: user.firstName,
                lastName: user.lastName,
                isAdmin: user.isAdmin,
                loginType: 'user',
              };
              return this.currentUser;
            }
          } catch (userError) {
            console.error('User session error:', userError);
          }
        }
      }
      
      // Handle member session
      if (session.memberId) {
        const member = await DatabaseService.getMember(session.memberId);
        
        if (!member) {
          this.logout();
          return null;
        }

        this.currentUser = {
          ...member,
          loginType: session.isMember ? 'member' : 'spouse',
        };

        // Remove passwords
        if (this.currentUser.auth) delete this.currentUser.auth.password;
        if (this.currentUser.spouse?.auth) delete this.currentUser.spouse.auth.password;

        return this.currentUser;
      }
      
      // Invalid session
      this.logout();
      return null;
    } catch (error) {
      console.error('Session error:', error);
      this.logout();
      return null;
    }
  }

  // Logout
  logout() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.sessionKey);
    }
    this.currentUser = null;
  }

  // Verify registration code
  async verifyRegistrationCode(memberId, code) {
    try {
      const member = await DatabaseService.getMember(memberId);
      
      if (!member) {
        throw new Error('Member not found');
      }

      if (!member.auth?.verificationCode) {
        throw new Error('No verification code found');
      }

      if (member.auth.verificationCode !== code) {
        throw new Error('Invalid verification code');
      }

      // Check if code has expired
      const expiryDate = new Date(member.auth.verificationExpiry);
      if (expiryDate < new Date()) {
        throw new Error('Verification code has expired');
      }

      // Clear verification data
      member.auth.verificationCode = null;
      member.auth.verificationToken = null;
      member.auth.verificationExpiry = null;
      member.auth.verified = true;
      member.auth.verifiedAt = new Date().toISOString();

      await DatabaseService.updateMember(member._id, member);

      return {
        success: true,
        message: 'Registration verified successfully'
      };
    } catch (error) {
      console.error('Verification error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Resend verification code
  async resendVerificationCode(memberId) {
    try {
      const member = await DatabaseService.getMember(memberId);
      
      if (!member) {
        throw new Error('Member not found');
      }

      // Generate new verification code and token
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const verificationToken = this.generateToken();
      
      // Update member with new verification data
      member.auth.verificationCode = verificationCode;
      member.auth.verificationToken = verificationToken;
      member.auth.verificationExpiry = new Date(Date.now() + 3600000).toISOString(); // 1 hour expiry

      await DatabaseService.updateMember(member._id, member);

      // Log verification details for testing
      console.log('\n=== RESEND VERIFICATION EMAIL ===');
      console.log('To:', member.email);
      console.log('Subject: Your New Verification Code');
      console.log('\nDear ' + member.firstName + ',');
      console.log('\nYour new verification code is:');
      console.log('   ' + verificationCode);
      console.log('\nThis code will expire in 1 hour.');
      console.log('\nVerification Link:');
      console.log(`http://localhost:3000/verify-registration?token=${verificationToken}`);
      console.log('═══════════════════════════════════════\n');

      if (member.mobile) {
        console.log('=== RESEND VERIFICATION SMS ===');
        console.log('To:', member.mobile);
        console.log(`Message: Your new verification code is: ${verificationCode}`);
        console.log('Code expires in 1 hour.');
        console.log('═══════════════════════════════════════\n');
      }

      return {
        success: true,
        message: 'Verification code sent successfully',
        verificationCode, // Remove in production
        verificationToken // Remove in production
      };
    } catch (error) {
      console.error('Resend verification error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Verify existing member by email or mobile
  async verifyExistingMember(identifier) {
    try {
      // Find member by email or mobile
      const member = await this.findMemberByEmailOrMobile(identifier, identifier);
      
      if (!member) {
        throw new Error('No account found with this email or mobile number');
      }

      // Check if member is approved
      if (member.status !== 'approved') {
        throw new Error('This account is not yet approved or has been denied');
      }

      // Generate verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const verificationToken = this.generateToken();
      
      // Add verification data
      member.auth = member.auth || {};
      member.auth.managementVerificationCode = verificationCode;
      member.auth.managementVerificationToken = verificationToken;
      member.auth.managementVerificationExpiry = new Date(Date.now() + 3600000).toISOString(); // 1 hour

      await DatabaseService.updateMember(member._id, member);

      // Send verification code
      if (identifier.includes('@')) {
        console.log('\n=== MANAGEMENT VERIFICATION EMAIL ===');
        console.log('To:', identifier);
        console.log('Subject: Verify Account Management');
        console.log('\nDear ' + member.firstName + ',');
        console.log('\nYour verification code is:');
        console.log('   ' + verificationCode);
        console.log('\nThis code will expire in 1 hour.');
        console.log('═══════════════════════════════════════\n');
      } else {
        console.log('\n=== MANAGEMENT VERIFICATION SMS ===');
        console.log('To:', identifier);
        console.log(`Message: Your account management verification code is: ${verificationCode}`);
        console.log('Code expires in 1 hour.');
        console.log('═══════════════════════════════════════\n');
      }

      return {
        success: true,
        memberId: member._id,
        message: 'Verification code sent successfully'
      };
    } catch (error) {
      console.error('Verify existing member error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Verify management code for existing member
  async verifyManagementCode(memberId, code) {
    try {
      const member = await DatabaseService.getMember(memberId);
      
      if (!member) {
        throw new Error('Member not found');
      }

      if (!member.auth?.managementVerificationCode) {
        throw new Error('No verification code found');
      }

      if (member.auth.managementVerificationCode !== code) {
        throw new Error('Invalid verification code');
      }

      // Check if code has expired
      const expiryDate = new Date(member.auth.managementVerificationExpiry);
      if (expiryDate < new Date()) {
        throw new Error('Verification code has expired');
      }

      // Clear verification data
      member.auth.managementVerificationCode = null;
      member.auth.managementVerificationToken = null;
      member.auth.managementVerificationExpiry = null;
      member.auth.canManageRecords = true;
      member.auth.managementVerifiedAt = new Date().toISOString();

      await DatabaseService.updateMember(member._id, member);

      return {
        success: true,
        message: 'Account verified for management access'
      };
    } catch (error) {
      console.error('Management verification error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Resend management verification code
  async resendManagementCode(memberId) {
    try {
      const member = await DatabaseService.getMember(memberId);
      
      if (!member) {
        throw new Error('Member not found');
      }

      // Generate new verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const verificationToken = this.generateToken();
      
      // Update verification data
      member.auth.managementVerificationCode = verificationCode;
      member.auth.managementVerificationToken = verificationToken;
      member.auth.managementVerificationExpiry = new Date(Date.now() + 3600000).toISOString();

      await DatabaseService.updateMember(member._id, member);

      // Send verification code
      if (member.email) {
        console.log('\n=== RESEND MANAGEMENT VERIFICATION EMAIL ===');
        console.log('To:', member.email);
        console.log('Subject: Your New Management Verification Code');
        console.log('\nDear ' + member.firstName + ',');
        console.log('\nYour new verification code is:');
        console.log('   ' + verificationCode);
        console.log('\nThis code will expire in 1 hour.');
        console.log('═══════════════════════════════════════\n');
      }

      if (member.mobile) {
        console.log('\n=== RESEND MANAGEMENT VERIFICATION SMS ===');
        console.log('To:', member.mobile);
        console.log(`Message: Your new management verification code is: ${verificationCode}`);
        console.log('Code expires in 1 hour.');
        console.log('═══════════════════════════════════════\n');
      }

      return {
        success: true,
        message: 'New verification code sent successfully'
      };
    } catch (error) {
      console.error('Resend management code error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Change password
  async changePassword(userId, oldPassword, newPassword, loginType = 'member') {
    try {
      const hashedOldPassword = this.hashPassword(oldPassword);
      const hashedNewPassword = this.hashPassword(newPassword);
      
      // Check if this is a user account (like super admin)
      if (loginType === 'user') {
        const db = DatabaseService.db;
        if (db) {
          try {
            const user = await db.get(userId);
            
            if (user.type !== 'user') {
              throw new Error('Invalid user account');
            }
            
            // Verify old password
            if (user.passwordHash !== hashedOldPassword) {
              throw new Error('Current password is incorrect');
            }
            
            // Update password
            user.passwordHash = hashedNewPassword;
            user.updatedAt = new Date().toISOString();
            
            await db.put(user);
            
            return {
              success: true,
              message: 'Password changed successfully',
            };
          } catch (userError) {
            throw userError;
          }
        }
      }
      
      // Handle member account password change
      const member = await DatabaseService.getMember(userId);
      
      if (!member) {
        throw new Error('Member not found');
      }

      // Check if changing member or spouse password
      if (loginType === 'spouse' && member.spouse?.auth) {
        // Verify old password for spouse
        if (member.spouse.auth.password !== hashedOldPassword) {
          throw new Error('Current password is incorrect');
        }
        
        // Update spouse password
        member.spouse.auth.password = hashedNewPassword;
        member.spouse.auth.updatedAt = new Date().toISOString();
      } else if (member.auth) {
        // Verify old password for member
        if (member.auth.password !== hashedOldPassword) {
          throw new Error('Current password is incorrect');
        }
        
        // Update member password
        member.auth.password = hashedNewPassword;
        member.auth.updatedAt = new Date().toISOString();
      } else {
        throw new Error('No authentication data found');
      }
      
      await DatabaseService.updateMember(userId, member);

      return {
        success: true,
        message: 'Password changed successfully',
      };
    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export default new AuthService();
