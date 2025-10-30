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
import ManagementRequestService from '../services/ManagementRequestService';
import AuthService from '../services/AuthService';

const RequestManagement = ({ navigation, route }) => {
  const [loading, setLoading] = useState(false);
  const [managerIdentifier, setManagerIdentifier] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmitRequest = async () => {
    if (!managerIdentifier.trim()) {
      setError('Please enter the manager\'s email or mobile number');
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason for the request');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Get current user
      const currentUser = await AuthService.getCurrentSession();
      if (!currentUser) {
        throw new Error('Please login to continue');
      }

      // Find the requested manager
      const manager = await AuthService.findMemberByEmailOrMobile(
        managerIdentifier.trim(),
        managerIdentifier.trim()
      );

      if (!manager) {
        throw new Error('No member found with the provided email or mobile number');
      }

      // Create the management request
      const result = await ManagementRequestService.createRequest(
        currentUser._id,
        manager._id,
        reason.trim()
      );

      if (result.success) {
        Alert.alert(
          'Request Submitted',
          'Your management request has been submitted and is pending admin approval. ' +
          'You will be notified once the request is processed.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        setError(result.error || 'Failed to submit request');
      }
    } catch (error) {
      setError(error.message || 'An error occurred');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Request Management Access</Text>
        <Text style={styles.headerSubtitle}>
          Request another member to manage your profile
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.formContainer}>
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>ℹ️ Important Information</Text>
            <Text style={styles.infoText}>
              • The member you select will be able to manage your profile
              {'\n'}• They will see your personal information
              {'\n'}• This request requires admin approval
              {'\n'}• You can cancel this request anytime before approval
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Manager's Email or Mobile *</Text>
            <TextInput
              style={styles.input}
              value={managerIdentifier}
              onChangeText={(text) => {
                setManagerIdentifier(text);
                setError('');
              }}
              placeholder="Enter email or mobile number"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Reason for Request *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={reason}
              onChangeText={(text) => {
                setReason(text);
                setError('');
              }}
              placeholder="Explain why you want this member to manage your profile"
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmitRequest}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Request</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  content: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
  },
  errorContainer: {
    backgroundColor: '#fde8e8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#e53e3e',
  },
  errorText: {
    color: '#c81e1e',
    fontSize: 14,
  },
  infoBox: {
    backgroundColor: '#e8f4fd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c5282',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#2c5282',
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
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#27ae60',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: {
    backgroundColor: '#95a5a6',
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#e74c3c',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RequestManagement;