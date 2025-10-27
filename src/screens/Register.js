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

  const handleMemberFormSubmit = async (data) => {
    // Validate password fields
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
      const result = await AuthService.register(data, password);

      if (result.success) {
        // Clear form
        setPassword('');
        setConfirmPassword('');
        
        // Show success message and navigate to login
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
                setLoading(false);
                onNavigateToLogin();
              }
            }
          ],
          { cancelable: false }
        );
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
        <MemberForm
          onSubmit={handleMemberFormSubmit}
          onCancel={handleCancel}
          renderExtraFields={() => (
            <View style={styles.passwordSection}>
              <Text style={styles.sectionTitle}>Account Security</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password *</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter password (min. 6 characters)"
                  placeholderTextColor="#999"
                  secureTextEntry
                  editable={!loading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password *</Text>
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
            </View>
          )}
        />
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
