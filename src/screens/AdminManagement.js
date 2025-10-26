import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  TextInput,
  Modal,
} from 'react-native';
import DatabaseService from '../services/DatabaseService';
import { canApproveRegistrations, canApproveAdmins } from '../utils/authorization';

const AdminManagement = ({ currentUser, onBack }) => {
  const [activeTab, setActiveTab] = useState('registrations');
  const [pendingRegistrations, setPendingRegistrations] = useState([]);
  const [pendingAdminRequests, setPendingAdminRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [denialModalVisible, setDenialModalVisible] = useState(false);
  const [denialReason, setDenialReason] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [denialType, setDenialType] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [registrations, adminRequests] = await Promise.all([
        DatabaseService.getPendingRegistrations(),
        DatabaseService.getPendingAdminRequests(),
      ]);
      setPendingRegistrations(registrations);
      setPendingAdminRequests(adminRequests);
    } catch (error) {
      Alert.alert('Error', 'Failed to load pending items');
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const handleApproveRegistration = async (member) => {
    Alert.alert(
      'Approve Registration',
      `Approve registration for ${member.firstName} ${member.lastName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              await DatabaseService.approveMemberRegistration(
                member._id,
                currentUser._id
              );
              Alert.alert('Success', 'Registration approved successfully');
              await loadData();
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to approve registration');
              console.error(error);
            }
          },
        },
      ]
    );
  };

  const handleDenyRegistration = (member) => {
    setSelectedItem(member);
    setDenialType('registration');
    setDenialReason('');
    setDenialModalVisible(true);
  };

  const handleApproveAdmin = async (user) => {
    const name = user.firstName ? `${user.firstName} ${user.lastName}` : user.email;
    Alert.alert(
      'Approve Admin Request',
      `Grant admin privileges to ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              await DatabaseService.promoteToAdmin(user._id, currentUser._id);
              Alert.alert('Success', 'Admin privileges granted successfully');
              await loadData();
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to grant admin privileges');
              console.error(error);
            }
          },
        },
      ]
    );
  };

  const handleDenyAdmin = (user) => {
    setSelectedItem(user);
    setDenialType('admin');
    setDenialReason('');
    setDenialModalVisible(true);
  };

  const confirmDenial = async () => {
    if (!denialReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for denial');
      return;
    }

    try {
      if (denialType === 'registration') {
        await DatabaseService.denyMemberRegistration(
          selectedItem._id,
          currentUser._id,
          denialReason
        );
        Alert.alert('Success', 'Registration denied');
      } else {
        await DatabaseService.denyAdminRequest(
          selectedItem._id,
          currentUser._id,
          denialReason
        );
        Alert.alert('Success', 'Admin request denied');
      }
      setDenialModalVisible(false);
      await loadData();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to deny request');
      console.error(error);
    }
  };

  const renderRegistrationCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>
            {item.firstName} {item.lastName}
          </Text>
          <Text style={styles.memberEmail}>{item.email}</Text>
          <Text style={styles.memberMobile}>{item.mobile}</Text>
          <Text style={styles.registeredDate}>
            Registered: {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {item.address && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address:</Text>
          <Text style={styles.sectionText}>
            {item.address.street}, {item.address.city}, {item.address.state} {item.address.zipCode}
          </Text>
        </View>
      )}

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => handleApproveRegistration(item)}
        >
          <Text style={styles.actionButtonText}>✓ Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.denyButton]}
          onPress={() => handleDenyRegistration(item)}
        >
          <Text style={styles.actionButtonText}>✗ Deny</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAdminRequestCard = ({ item }) => {
    const name = item.firstName ? `${item.firstName} ${item.lastName}` : item.email;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>{name}</Text>
            <Text style={styles.memberEmail}>{item.email}</Text>
            {item.mobile && <Text style={styles.memberMobile}>{item.mobile}</Text>}
            <Text style={styles.registeredDate}>
              Requested: {new Date(item.adminRequestedAt).toLocaleDateString()}
            </Text>
            <View style={styles.currentStatusBadge}>
              <Text style={styles.currentStatusText}>
                Current: {item.type === 'member' ? 'Member' : 'User'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleApproveAdmin(item)}
          >
            <Text style={styles.actionButtonText}>✓ Grant Admin</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.denyButton]}
            onPress={() => handleDenyAdmin(item)}
          >
            <Text style={styles.actionButtonText}>✗ Deny</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {activeTab === 'registrations'
          ? 'No pending registrations'
          : 'No pending admin requests'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const canManageRegistrations = canApproveRegistrations(currentUser);
  const canManageAdmins = canApproveAdmins(currentUser);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Management</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {canManageRegistrations && (
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'registrations' && styles.activeTab,
            ]}
            onPress={() => setActiveTab('registrations')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'registrations' && styles.activeTabText,
              ]}
            >
              Registrations ({pendingRegistrations.length})
            </Text>
          </TouchableOpacity>
        )}
        {canManageAdmins && (
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'admin' && styles.activeTab,
            ]}
            onPress={() => setActiveTab('admin')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'admin' && styles.activeTabText,
              ]}
            >
              Admin Requests ({pendingAdminRequests.length})
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <FlatList
        data={
          activeTab === 'registrations'
            ? pendingRegistrations
            : pendingAdminRequests
        }
        renderItem={
          activeTab === 'registrations'
            ? renderRegistrationCard
            : renderAdminRequestCard
        }
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyList}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      {/* Denial Modal */}
      <Modal
        visible={denialModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDenialModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reason for Denial</Text>
            <Text style={styles.modalSubtitle}>
              Please provide a reason for denying this request:
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter reason..."
              placeholderTextColor="#999"
              value={denialReason}
              onChangeText={setDenialReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setDenialModalVisible(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={confirmDenial}
              >
                <Text style={styles.modalConfirmButtonText}>Confirm Denial</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498db',
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
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3498db',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#3498db',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
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
  cardHeader: {
    marginBottom: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  memberEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  memberMobile: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  registeredDate: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
  },
  currentStatusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#95a5a6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 8,
  },
  currentStatusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  section: {
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 4,
  },
  sectionText: {
    fontSize: 13,
    color: '#666',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#27ae60',
  },
  denyButton: {
    backgroundColor: '#e74c3c',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
      },
    }),
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 100,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#95a5a6',
  },
  modalConfirmButton: {
    backgroundColor: '#e74c3c',
  },
  modalCancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AdminManagement;
