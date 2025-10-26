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
} from 'react-native';
import MemberForm from '../components/MemberForm';
import AuthService from '../services/AuthService';

const Register = ({ navigation, onRegisterSuccess, onNavigateToLogin }) => {
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [memberData, setMemberData] = useState(null);

  const handleMemberFormSubmit = (data) => {
    setMemberData(data);
    setShowPasswordFields(true);
  };

  const handleRegister = async () => {
    if (!password || password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      const result = await AuthService.register(memberData, password);

      if (result.success) {
        Alert.alert(
          'Success',
          'Registration successful! You can now login.',
          [{ text: 'OK', onPress: onNavigateToLogin }]
        );
      } else {
        Alert.alert('Error', result.error || 'Registration failed');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred during registration');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (showPasswordFields) {
      setShowPasswordFields(false);
      setPassword('');
      setConfirmPassword('');
    } else {
      onNavigateToLogin();
    }
  };

  if (showPasswordFields) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Set Your Password</Text>
          <Text style={styles.headerSubtitle}>
            Create a secure password for your account
          </Text>
        </View>

        <View style={styles.passwordContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password (min. 6 characters)</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              placeholderTextColor="#999"
              secureTextEntry
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm password"
              placeholderTextColor="#999"
              secureTextEntry
              editable={!loading}
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Complete Registration</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Register New Member</Text>
        <Text style={styles.headerSubtitle}>
          Fill in your information to create an account
        </Text>
      </View>
      
      <MemberForm
        onSubmit={handleMemberFormSubmit}
        onCancel={handleCancel}
      />

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
  passwordContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 24,
    borderRadius: 12,
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
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#27ae60',
  },
  submitButtonDisabled: {
    backgroundColor: '#95a5a6',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
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
