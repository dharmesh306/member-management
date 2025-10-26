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
      const member = {
        ...memberData,
        status: 'pending', // New registrations require admin approval
        auth: {
          password: hashedPassword,
          createdAt: new Date().toISOString(),
          resetToken: null,
          resetTokenExpiry: null,
          lastLogin: null,
        },
      };

      const createdMember = await DatabaseService.createMember(member);
      
      // Remove password from response
      delete createdMember.auth.password;
      
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
      // First, check if this is a user account (like super admin)
      const db = DatabaseService.db;
      if (db) {
        try {
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

          if (userResult.docs && userResult.docs.length > 0) {
            const user = userResult.docs[0];
            const hashedPassword = this.hashPassword(password);
            
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
                isSuperAdmin: user.isSuperAdmin,
                loginType: 'user',
              };

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
        throw new Error('Your account is pending admin approval. Please wait for approval before logging in.');
      }

      // Check if account was denied
      if (member.status === 'denied') {
        throw new Error('Your account registration was denied. Please contact support for more information.');
      }

      // Check if logging in as member or spouse
      const authData = isMember ? member.auth : member.spouse?.auth;

      if (!authData || !authData.password) {
        throw new Error('Invalid credentials');
      }

      // Verify password
      const hashedPassword = this.hashPassword(password);
      if (hashedPassword !== authData.password) {
        throw new Error('Invalid credentials');
      }

      // Update last login
      if (isMember) {
        member.auth.lastLogin = new Date().toISOString();
      } else {
        member.spouse.auth.lastLogin = new Date().toISOString();
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
      // For now, return the token (in production, don't return this)
      const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;
      
      if (resetMethod === 'email') {
        const email = isMemberReset ? member.email : member.spouse.email;
        console.log(`Reset email would be sent to: ${email}`);
        console.log(`Reset link: ${resetLink}`);
        // TODO: Implement email sending service
      } else {
        const mobile = isMemberReset ? member.mobile : member.spouse.mobile;
        console.log(`Reset SMS would be sent to: ${mobile}`);
        console.log(`Reset code: ${resetToken.substring(0, 6)}`);
        // TODO: Implement SMS sending service
      }

      return {
        success: true,
        message: `Password reset instructions sent via ${resetMethod}`,
        // Remove these in production
        resetToken,
        resetLink,
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
                isSuperAdmin: user.isSuperAdmin,
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
