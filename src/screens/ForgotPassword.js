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
  const [step, setStep] = useState(1); // 1: request reset, 2: show success
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetToken, setResetToken] = useState('');

  const handleRequestReset = async () => {
    setError('');

    if (!identifier.trim()) {
      setError('Please enter your email or mobile number');
      return;
    }

    try {
      setLoading(true);
      // Automatically detect reset method based on identifier format
      const resetMethod = identifier.includes('@') ? 'email' : 'sms';
      const result = await AuthService.requestPasswordReset(
        identifier.trim(),
        resetMethod
      );

      if (result.success) {
        setResetToken(result.resetToken);
        setStep(2);
        Alert.alert(
          'Success',
          `Password reset instructions have been sent to your ${resetMethod === 'email' ? 'email' : 'phone'}`
        );
      } else {
        setError(result.error || 'Failed to send reset instructions');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (step === 2) {
    const resetMethod = identifier.includes('@') ? 'email' : 'sms';
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <View style={styles.successHeader}>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={styles.successTitle}>Check Your {resetMethod === 'email' ? 'Email' : 'Messages'}</Text>
          </View>

          <Text style={styles.successMessage}>
            We've sent password reset instructions to{' '}
            {resetMethod === 'email' ? 'your email address' : 'your mobile number'}.
          </Text>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              • The link will expire in 1 hour{'\n'}
              • Check your spam folder if you don't see it{'\n'}
              • For security, we can't confirm if this account exists
            </Text>
          </View>

          {/* Development only - show token */}
          {__DEV__ && resetToken && (
            <View style={styles.devBox}>
              <Text style={styles.devTitle}>Development Mode</Text>
              <Text style={styles.devText}>Reset Token: {resetToken}</Text>
              <TouchableOpacity
                style={styles.devButton}
                onPress={() => onNavigateToResetPassword(resetToken)}
              >
                <Text style={styles.devButtonText}>Use Token Now</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={styles.backButton}
            onPress={onNavigateToLogin}
          >
            <Text style={styles.backButtonText}>Back to Login</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resendLink}
            onPress={() => setStep(1)}
          >
            <Text style={styles.resendText}>Didn't receive it? Try again</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

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
