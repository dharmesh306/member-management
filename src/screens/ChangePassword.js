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

const ChangePassword = ({ onBack, currentUser }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // Password strength validation
  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      return 'Password must be at least 8 characters long';
    }
    if (!hasUpperCase) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!hasLowerCase) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!hasNumbers) {
      return 'Password must contain at least one number';
    }
    if (!hasSpecialChar) {
      return 'Password must contain at least one special character';
    }
    return null;
  };

  // Get password strength
  const getPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

    if (strength <= 2) return { label: 'Weak', color: '#e74c3c' };
    if (strength <= 4) return { label: 'Fair', color: '#f39c12' };
    if (strength <= 5) return { label: 'Good', color: '#3498db' };
    return { label: 'Strong', color: '#27ae60' };
  };

  const handleChangePassword = async () => {
    setError('');

    // Validation
    if (!currentPassword.trim()) {
      setError('Please enter your current password');
      return;
    }

    if (!newPassword.trim()) {
      setError('Please enter a new password');
      return;
    }

    if (!confirmPassword.trim()) {
      setError('Please confirm your new password');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword === currentPassword) {
      setError('New password must be different from current password');
      return;
    }

    // Validate password strength
    const validationError = validatePassword(newPassword);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      const result = await AuthService.changePassword(
        currentUser._id,
        currentPassword,
        newPassword,
        currentUser.loginType
      );

      if (result.success) {
        setShowSuccess(true);
        Alert.alert(
          'Success',
          'Your password has been changed successfully',
          [
            {
              text: 'OK',
              onPress: () => {
                // Clear form
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setShowSuccess(false);
              },
            },
          ]
        );
      } else {
        setError(result.error || 'Failed to change password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <View style={styles.successHeader}>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={styles.successTitle}>Password Changed!</Text>
          </View>

          <Text style={styles.successMessage}>
            Your password has been changed successfully. You can use your new password
            the next time you log in.
          </Text>

          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  const passwordStrength = newPassword ? getPasswordStrength(newPassword) : null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Change Password</Text>
          <Text style={styles.subtitle}>
            Update your password to keep your account secure
          </Text>
        </View>

        {/* Error Message */}
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Current Password */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Current Password</Text>
          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Enter your current password"
            placeholderTextColor="#999"
            secureTextEntry
            editable={!loading}
          />
        </View>

        {/* New Password */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>New Password</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Enter your new password"
            placeholderTextColor="#999"
            secureTextEntry
            editable={!loading}
          />
          {passwordStrength && (
            <View style={styles.strengthContainer}>
              <View
                style={[
                  styles.strengthBar,
                  { backgroundColor: passwordStrength.color },
                ]}
              />
              <Text
                style={[styles.strengthText, { color: passwordStrength.color }]}
              >
                {passwordStrength.label}
              </Text>
            </View>
          )}
        </View>

        {/* Confirm Password */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirm New Password</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm your new password"
            placeholderTextColor="#999"
            secureTextEntry
            editable={!loading}
          />
        </View>

        {/* Password Requirements */}
        <View style={styles.requirementsContainer}>
          <Text style={styles.requirementsTitle}>Password Requirements:</Text>
          <Text style={styles.requirementText}>• At least 8 characters</Text>
          <Text style={styles.requirementText}>• One uppercase letter (A-Z)</Text>
          <Text style={styles.requirementText}>• One lowercase letter (a-z)</Text>
          <Text style={styles.requirementText}>• One number (0-9)</Text>
          <Text style={styles.requirementText}>
            • One special character (!@#$%^&*)
          </Text>
        </View>

        {/* Change Password Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleChangePassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Change Password</Text>
          )}
        </TouchableOpacity>

        {/* Cancel Button */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onBack}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
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
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  strengthBar: {
    height: 4,
    flex: 1,
    borderRadius: 2,
    marginRight: 8,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  requirementsContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  requirementsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  submitButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#95a5a6',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#ecf0f1',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#555',
    fontSize: 16,
    fontWeight: '600',
  },
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
  backButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ChangePassword;
