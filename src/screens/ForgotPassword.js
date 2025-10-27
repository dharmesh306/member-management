import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import AuthService from '../services/AuthService';

const ForgotPassword = ({ onNavigateToLogin, onNavigateToResetPassword }) => {
  const [step, setStep] = useState(1); // 1: enter email/phone, 2: enter code, 3: enter new password
  const [identifier, setIdentifier] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetMethod, setResetMethod] = useState('email');

  const handleRequestReset = async () => {
    setError('');

    if (!identifier.trim()) {
      setError('Please enter your email or mobile number');
      return;
    }

    try {
      setLoading(true);
      // Automatically detect reset method based on identifier format
      const method = identifier.includes('@') ? 'email' : 'sms';
      setResetMethod(method);
      
      const result = await AuthService.requestPasswordReset(
        identifier.trim(),
        method
      );

      if (result.success) {
        setResetToken(result.resetToken);
        setStep(2);
        
        if (Platform.OS === 'web') {
          window.alert(
            `Verification code sent to your ${method === 'email' ? 'email' : 'phone'}!`
          );
        } else {
          Alert.alert(
            'Success',
            `Verification code sent to your ${method === 'email' ? 'email' : 'phone'}`
          );
        }
      } else {
        setError(result.error || 'Failed to send verification code');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setError('');

    if (!verificationCode.trim()) {
      setError('Please enter the verification code');
      return;
    }

    // Verify the code matches the reset token (first 6 characters)
    if (verificationCode.trim() !== resetToken.substring(0, 6)) {
      setError('Invalid verification code. Please try again.');
      return;
    }

    // Code is valid, move to password reset step
    setStep(3);
  };

  const handleResetPassword = async () => {
    setError('');

    if (!newPassword.trim()) {
      setError('Please enter a new password');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      const result = await AuthService.resetPassword(resetToken, newPassword);

      if (result.success) {
        if (Platform.OS === 'web') {
          window.alert('Password reset successful! Please login with your new password.');
        } else {
          Alert.alert('Success', 'Password reset successful! Please login with your new password.');
        }
        onNavigateToLogin();
      } else {
        setError(result.error || 'Failed to reset password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Enter verification code
  if (step === 2) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Enter Verification Code</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-digit code to your {resetMethod === 'email' ? 'email' : 'phone'}
            </Text>
            <Text style={styles.identifierText}>{identifier}</Text>
          </View>

          {/* Error Message */}
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Development mode - show code */}
          {resetToken && (
            <View style={styles.devBox}>
              <Text style={styles.devTitle}>💡 Your Verification Code</Text>
              <Text style={styles.codeDisplay}>{resetToken.substring(0, 6)}</Text>
              <Text style={styles.devText}>Enter this code below to continue</Text>
            </View>
          )}

          {/* Verification Code Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Verification Code</Text>
            <TextInput
              style={styles.input}
              value={verificationCode}
              onChangeText={setVerificationCode}
              placeholder="Enter 6-digit code"
              placeholderTextColor="#999"
              keyboardType="number-pad"
              maxLength={6}
              editable={!loading}
            />
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleVerifyCode}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Verify Code</Text>
            )}
          </TouchableOpacity>

          {/* Back and Resend Links */}
          <View style={styles.linkContainer}>
            <TouchableOpacity onPress={() => setStep(1)}>
              <Text style={styles.linkText}>← Change Email/Phone</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleRequestReset}>
              <Text style={styles.linkText}>Resend Code →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  // Step 3: Reset password
  if (step === 3) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Create New Password</Text>
            <Text style={styles.subtitle}>
              Enter your new password below
            </Text>
          </View>

          {/* Error Message */}
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* New Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              placeholderTextColor="#999"
              secureTextEntry
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              placeholderTextColor="#999"
              secureTextEntry
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          {/* Password Requirements */}
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Password must be at least 6 characters long
            </Text>
          </View>

          {/* Reset Password Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleResetPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Reset Password</Text>
            )}
          </TouchableOpacity>

          {/* Back Link */}
          <TouchableOpacity
            style={styles.backLink}
            onPress={onNavigateToLogin}
          >
            <Text style={styles.linkText}>← Back to Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // Step 1: Enter email/phone
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>
            Enter your email or mobile number to reset your password
          </Text>
        </View>

        {/* Error Message */}
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Input Field */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email or Mobile Number</Text>
          <TextInput
            style={styles.input}
            value={identifier}
            onChangeText={setIdentifier}
            placeholder="Enter your email or mobile number"
            placeholderTextColor="#999"
            autoCapitalize="none"
            keyboardType="default"
            editable={!loading}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleRequestReset}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Send Reset Instructions</Text>
          )}
        </TouchableOpacity>

        {/* Back to Login Link */}
        <TouchableOpacity
          style={styles.backLinkContainer}
          onPress={onNavigateToLogin}
          disabled={loading}
        >
          <Text style={styles.backLinkText}>← Back to Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 5,
      },
    }),
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#fee',
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 24,
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
  submitButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#95a5a6',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backLinkContainer: {
    alignItems: 'center',
  },
  backLinkText: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: '600',
  },
  // Success screen styles
  successHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successIcon: {
    fontSize: 64,
    color: '#27ae60',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  successMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  infoBox: {
    backgroundColor: '#e8f4fd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 14,
    color: '#2980b9',
    lineHeight: 22,
  },
  identifierText: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  codeDisplay: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#856404',
    textAlign: 'center',
    letterSpacing: 8,
    marginVertical: 12,
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  linkText: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: '600',
  },
  backLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendLink: {
    alignItems: 'center',
  },
  resendText: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: '600',
  },
  // Development mode styles
  devBox: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  devTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  devText: {
    fontSize: 12,
    color: '#856404',
    marginBottom: 12,
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
  },
  devButton: {
    backgroundColor: '#ffc107',
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  devButtonText: {
    color: '#856404',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ForgotPassword;
