import React, { useState, useEffect } from 'react';
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

const ResetPassword = ({ route, onNavigateToLogin, token: propToken }) => {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Get token from props or route params
    const resetToken = propToken || route?.params?.token;
    if (resetToken) {
      setToken(resetToken);
    }
  }, [propToken, route]);

  const handleResetPassword = async () => {
    setError('');

    if (!token.trim()) {
      setError('Reset token is required');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      const result = await AuthService.resetPassword(token.trim(), newPassword);

      if (result.success) {
        setSuccess(true);
        Alert.alert(
          'Success',
          'Your password has been reset successfully. You can now login with your new password.',
          [{ text: 'OK', onPress: onNavigateToLogin }]
        );
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

  if (success) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <View style={styles.successHeader}>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={styles.successTitle}>Password Reset Complete</Text>
          </View>

          <Text style={styles.successMessage}>
            Your password has been successfully reset. You can now login with your new password.
          </Text>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={onNavigateToLogin}
          >
            <Text style={styles.loginButtonText}>Go to Login</Text>
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
          <Text style={styles.title}>Reset Password</Text>
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

        {/* Token Input (if not provided) */}
        {!token && (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Reset Token</Text>
            <TextInput
              style={styles.input}
              value={token}
              onChangeText={setToken}
              placeholder="Enter reset token from email/SMS"
              placeholderTextColor="#999"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>
        )}

        {/* Password Inputs */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>New Password (min. 6 characters)</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Enter new password"
            placeholderTextColor="#999"
            secureTextEntry
            editable={!loading}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirm New Password</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
            placeholderTextColor="#999"
            secureTextEntry
            editable={!loading}
          />
        </View>

        {/* Password strength indicator */}
        {newPassword.length > 0 && (
          <View style={styles.strengthContainer}>
            <Text style={styles.strengthLabel}>Password Strength:</Text>
            <View style={styles.strengthBar}>
              <View
                style={[
                  styles.strengthFill,
                  {
                    width: `${Math.min((newPassword.length / 12) * 100, 100)}%`,
                    backgroundColor:
                      newPassword.length < 6
                        ? '#e74c3c'
                        : newPassword.length < 8
                        ? '#f39c12'
                        : '#27ae60',
                  },
                ]}
              />
            </View>
            <Text style={styles.strengthText}>
              {newPassword.length < 6
                ? 'Weak'
                : newPassword.length < 8
                ? 'Medium'
                : 'Strong'}
            </Text>
          </View>
        )}

        {/* Submit Button */}
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
  strengthContainer: {
    marginBottom: 24,
  },
  strengthLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  strengthBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  strengthFill: {
    height: '100%',
    borderRadius: 4,
    transition: 'width 0.3s ease, background-color 0.3s ease',
  },
  strengthText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
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
  loginButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ResetPassword;
