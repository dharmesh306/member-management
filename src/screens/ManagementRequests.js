import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import ManagementRequestService from '../services/ManagementRequestService';
import AuthService from '../services/AuthService';

const ManagementRequests = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const result = await ManagementRequestService.getPendingRequests();
      
      if (result.success) {
        setRequests(result.requests);
        setError('');
      } else {
        setError(result.error || 'Failed to load requests');
      }
    } catch (error) {
      setError(error.message || 'An error occurred');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRequest = async (memberId, requestId, approved) => {
    try {
      setProcessingId(requestId);
      const currentUser = await AuthService.getCurrentSession();
      
      if (!currentUser || !currentUser.isAdmin) {
        throw new Error('Admin access required');
      }

      const result = await ManagementRequestService.processRequest(
        memberId,
        requestId,
        approved,
        currentUser._id,
        adminNotes.trim()
      );

      if (result.success) {
        Alert.alert(
          'Success',
          `Request has been ${approved ? 'approved' : 'denied'} successfully.`
        );
        setAdminNotes('');
        await loadRequests(); // Refresh the list
      } else {
        Alert.alert('Error', result.error || 'Failed to process request');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'An error occurred');
      console.error(error);
    } finally {
      setProcessingId(null);
    }
  };

  const renderRequestItem = ({ item }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <Text style={styles.memberName}>{item.memberName}</Text>
        <Text style={styles.requestDate}>
          {new Date(item.requestDate).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.requestDetails}>
        <Text style={styles.detailLabel}>Member Contact:</Text>
        <Text style={styles.detailText}>{item.memberEmail}</Text>
        {item.memberMobile && (
          <Text style={styles.detailText}>{item.memberMobile}</Text>
        )}

        <Text style={styles.detailLabel}>Requested Manager:</Text>
        <Text style={styles.detailText}>{item.requestedManagerName}</Text>

        <Text style={styles.detailLabel}>Reason:</Text>
        <Text style={styles.reasonText}>{item.reason}</Text>

        <View style={styles.notesContainer}>
          <Text style={styles.detailLabel}>Admin Notes:</Text>
          <TextInput
            style={styles.notesInput}
            value={adminNotes}
            onChangeText={setAdminNotes}
            placeholder="Add notes about this decision (optional)"
            placeholderTextColor="#999"
            multiline
            numberOfLines={2}
            editable={!processingId}
          />
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.approveButton, processingId === item.requestId && styles.buttonDisabled]}
          onPress={() => handleProcessRequest(item.memberId, item.requestId, true)}
          disabled={processingId === item.requestId}
        >
          {processingId === item.requestId ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>✓ Approve</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.denyButton, processingId === item.requestId && styles.buttonDisabled]}
          onPress={() => handleProcessRequest(item.memberId, item.requestId, false)}
          disabled={processingId === item.requestId}
        >
          <Text style={styles.buttonText}>✗ Deny</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#27ae60" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Management Requests</Text>
        <Text style={styles.headerSubtitle}>
          Review and process management access requests
        </Text>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No pending management requests</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          renderItem={renderRequestItem}
          keyExtractor={item => item.requestId}
          contentContainerStyle={styles.listContent}
        />
      )}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    backgroundColor: '#fde8e8',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#e53e3e',
  },
  errorText: {
    color: '#c81e1e',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  listContent: {
    padding: 16,
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
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
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  memberName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  requestDate: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  requestDetails: {
    padding: 16,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginTop: 12,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 2,
  },
  reasonText: {
    fontSize: 14,
    color: '#2c3e50',
    marginTop: 4,
    lineHeight: 20,
  },
  notesContainer: {
    marginTop: 16,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    color: '#333',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#27ae60',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  denyButton: {
    flex: 1,
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginLeft: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ManagementRequests;