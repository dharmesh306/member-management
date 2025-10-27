import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import MemberForm from '../components/MemberForm';
import AuthService from '../services/AuthService';

const Register = ({ navigation, onRegisterSuccess, onNavigateToLogin }) => {
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [memberData, setMemberData] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationType, setRegistrationType] = useState('separate'); // 'separate' or 'managed'
  
  // For managed accounts - existing account verification
  const [managerIdentifier, setManagerIdentifier] = useState(''); // email or mobile
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  // Send verification code
  const handleSendVerification = async () => {
    if (!managerIdentifier.trim()) {
      Alert.alert('Error', 'Please enter your email or mobile number');
      return;
    }

    try {
      setLoading(true);
      // Generate a simple 6-digit code (in production, this should be sent via SMS/Email)
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store code temporarily (in production, store on backend)
      // For now, we'll just show it in an alert
      Alert.alert(
        'Verification Code Sent',
        `Your verification code is: ${code}\n\n(In production, this would be sent to your email/mobile)`,
        [{ text: 'OK' }]
      );
      
      // Store the code for verification (in production, verify against backend)
      setVerificationSent(true);
      // Temporary storage - in production, backend handles this
      window.tempVerificationCode = code;
      
    } catch (error) {
      Alert.alert('Error', 'Failed to send verification code');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Verify the code
  const handleVerifyCode = () => {
    if (!verificationCode.trim()) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    // In production, verify against backend
    if (verificationCode === window.tempVerificationCode) {
      setIsVerified(true);
      Alert.alert('Success', '✅ Your account has been verified!');
    } else {
      Alert.alert('Error', 'Invalid verification code. Please try again.');
    }
  };

  // Reset verification when switching registration type
  const handleRegistrationTypeChange = (type) => {
    setRegistrationType(type);
    if (type === 'separate') {
      // Reset managed account fields
      setManagerIdentifier('');
      setVerificationCode('');
      setIsVerified(false);
      setVerificationSent(false);
    }
  };

  const handleMemberFormSubmit = async (data) => {
    // For managed accounts, password is not required (they won't have separate login)
    if (registrationType === 'separate') {
      // Validate password fields for separate login
      if (!password || password.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters');
        return;
      }

      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }
    }

    try {
      setLoading(true);
      
      // Add registration type to member data
      const memberDataWithType = {
        ...data,
        registrationType,
        isManagedAccount: registrationType === 'managed',
      };
      
      // Only pass password for separate login accounts
      const result = registrationType === 'separate' 
        ? await AuthService.register(memberDataWithType, password)
        : await AuthService.register(memberDataWithType, null);

      if (result.success) {
        // Clear form
        setPassword('');
        setConfirmPassword('');
        setLoading(false);
        
        // Show success message and navigate to login
        if (Platform.OS === 'web') {
          // For web, show alert and navigate immediately after user clicks OK
          const userConfirmed = window.confirm(
            'Registration Successful! 🎉\n\n' +
            'Your account has been created and is currently in pending status.\n\n' +
            '✓ Your registration will be reviewed by an admin\n' +
            '✓ Approval typically takes up to 24 hours\n' +
            '✓ You will receive an email or SMS notification when your account is approved\n\n' +
            'Once approved, you can login with your credentials.\n\n' +
            'Click OK to go to the login page.'
          );
          // Navigate regardless of confirmation
          onNavigateToLogin();
        } else {
          // For mobile, use Alert
          Alert.alert(
            'Registration Successful! 🎉',
            'Your account has been created and is currently in pending status.\n\n' +
            '✓ Your registration will be reviewed by an admin\n' +
            '✓ Approval typically takes up to 24 hours\n' +
            '✓ You will receive an email or SMS notification when your account is approved\n\n' +
            'Once approved, you can login with your credentials.',
            [
              { 
                text: 'Go to Login', 
                onPress: () => {
                  onNavigateToLogin();
                }
              }
            ],
            { cancelable: false }
          );
        }
      } else {
        Alert.alert('Error', result.error || 'Registration failed');
        setLoading(false);
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred during registration');
      console.error(error);
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onNavigateToLogin();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Register New Member</Text>
        <Text style={styles.headerSubtitle}>
          Fill in your information to create an account
        </Text>
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        {/* Registration Type Section */}
        <View style={styles.registrationTypeSection}>
          <Text style={styles.sectionTitle}>Registration Type</Text>
          <Text style={styles.sectionDescription}>
            Choose how this account will be set up
          </Text>
          
          <TouchableOpacity
            style={[
              styles.registrationTypeCard,
              registrationType === 'separate' && styles.registrationTypeCardActive
            ]}
            onPress={() => handleRegistrationTypeChange('separate')}
          >
            <View style={styles.radioButton}>
              {registrationType === 'separate' && <View style={styles.radioButtonInner} />}
            </View>
            <View style={styles.registrationTypeContent}>
              <Text style={styles.registrationTypeTitle}>🔐 Separate Login Account</Text>
              <Text style={styles.registrationTypeDescription}>
                Create a new account with its own login credentials. This member will manage their own profile.
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.registrationTypeCard,
              registrationType === 'managed' && styles.registrationTypeCardActive
            ]}
            onPress={() => handleRegistrationTypeChange('managed')}
          >
            <View style={styles.radioButton}>
              {registrationType === 'managed' && <View style={styles.radioButtonInner} />}
            </View>
            <View style={styles.registrationTypeContent}>
              <Text style={styles.registrationTypeTitle}>👨‍👩‍👧‍👦 Add to My Account</Text>
              <Text style={styles.registrationTypeDescription}>
                Add this member to your existing account. You will manage their profile for them (e.g., family members, dependents).
              </Text>
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Verification Section for Managed Accounts */}
        {registrationType === 'managed' && (
          <View style={styles.verificationSection}>
            <Text style={styles.sectionTitle}>Verify Your Account</Text>
            <Text style={styles.sectionDescription}>
              Enter your existing email or mobile number to verify your identity
            </Text>
            
            {!isVerified ? (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Your Email or Mobile Number *</Text>
                  <TextInput
                    style={styles.input}
                    value={managerIdentifier}
                    onChangeText={setManagerIdentifier}
                    placeholder="Enter your registered email or mobile"
                    placeholderTextColor="#999"
                    editable={!loading && !verificationSent}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                
                {!verificationSent ? (
                  <TouchableOpacity
                    style={[styles.verifyButton, loading && styles.verifyButtonDisabled]}
                    onPress={handleSendVerification}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.verifyButtonText}>📧 Send Verification Code</Text>
                    )}
                  </TouchableOpacity>
                ) : (
                  <>
                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Verification Code *</Text>
                      <TextInput
                        style={styles.input}
                        value={verificationCode}
                        onChangeText={setVerificationCode}
                        placeholder="Enter 6-digit code"
                        placeholderTextColor="#999"
                        keyboardType="number-pad"
                        maxLength={6}
                      />
                    </View>
                    
                    <View style={styles.verificationActions}>
                      <TouchableOpacity
                        style={styles.verifyButton}
                        onPress={handleVerifyCode}
                      >
                        <Text style={styles.verifyButtonText}>✓ Verify Code</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={styles.resendButton}
                        onPress={handleSendVerification}
                      >
                        <Text style={styles.resendButtonText}>Resend Code</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </>
            ) : (
              <View style={styles.verifiedBanner}>
                <Text style={styles.verifiedText}>✅ Account Verified</Text>
                <Text style={styles.verifiedSubtext}>
                  You can now add a member to your account
                </Text>
              </View>
            )}
          </View>
        )}
        
        {/* Only show form if: separate account OR verified managed account */}
        {(registrationType === 'separate' || isVerified) && (
          <MemberForm
            onSubmit={handleMemberFormSubmit}
            onCancel={handleCancel}
            renderExtraFields={() => (
            registrationType === 'separate' ? (
              <View style={styles.passwordSection}>
                <Text style={styles.sectionTitle}>Account Security</Text>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Password *</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Enter password (min. 6 characters)"
                      placeholderTextColor="#999"
                      secureTextEntry={!showPassword}
                      editable={!loading}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowPassword(!showPassword)}
                      disabled={loading}
                    >
                      <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Confirm Password *</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Confirm password"
                      placeholderTextColor="#999"
                      secureTextEntry={!showConfirmPassword}
                      editable={!loading}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={loading}
                    >
                      <Text style={styles.eyeIcon}>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.managedAccountInfo}>
                <Text style={styles.managedAccountTitle}>ℹ️ Managed Account</Text>
                <Text style={styles.managedAccountText}>
                  This member will be added to your account. They will not have separate login credentials.
                  You will be able to manage their profile from your dashboard.
                </Text>
              </View>
            )
          )}
          />
        )}
      </ScrollView>

      <View style={styles.loginLinkContainer}>
        <Text style={styles.loginText}>Already have an account? </Text>
        <TouchableOpacity onPress={onNavigateToLogin}>
          <Text style={styles.loginLink}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#27ae60',
    padding: 16,
    paddingTop: Platform.OS === 'web' ? 16 : 40,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
      },
    }),
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#ecf0f1',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  registrationTypeSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    marginBottom: 8,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
    }),
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  registrationTypeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#fafafa',
    marginBottom: 12,
  },
  registrationTypeCardActive: {
    borderColor: '#27ae60',
    backgroundColor: '#f0f9f4',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#27ae60',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#27ae60',
  },
  registrationTypeContent: {
    flex: 1,
  },
  registrationTypeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 6,
  },
  registrationTypeDescription: {
    fontSize: 13,
    color: '#7f8c8d',
    lineHeight: 18,
  },
  verificationSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
    }),
  },
  verifyButton: {
    backgroundColor: '#27ae60',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  verifyButtonDisabled: {
    backgroundColor: '#95a5a6',
    opacity: 0.6,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  resendButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  resendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  verifiedBanner: {
    backgroundColor: '#d4edda',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#27ae60',
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedBannerText: {
    fontSize: 16,
    color: '#155724',
    fontWeight: '600',
    marginLeft: 8,
  },
  passwordSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  managedAccountInfo: {
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#27ae60',
  },
  managedAccountTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#27ae60',
    marginBottom: 8,
  },
  managedAccountText: {
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  passwordContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 14,
    paddingRight: 50,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    padding: 8,
  },
  eyeIcon: {
    fontSize: 20,
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  loginText: {
    fontSize: 14,
    color: '#666',
  },
  loginLink: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '600',
  },
});

export default Register;
