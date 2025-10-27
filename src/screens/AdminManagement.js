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
  ScrollView,
} from 'react-native';
import DatabaseService from '../services/DatabaseService';
import { canApproveRegistrations, canApproveAdmins } from '../utils/authorization';

const AdminManagement = ({ currentUser, onBack }) => {
  const [activeTab, setActiveTab] = useState('registrations');
  const [pendingRegistrations, setPendingRegistrations] = useState([]);
  const [pendingAdminRequests, setPendingAdminRequests] = useState([]);
  const [allAdmins, setAllAdmins] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [denialModalVisible, setDenialModalVisible] = useState(false);
  const [denialReason, setDenialReason] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [denialType, setDenialType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMemberSearch, setShowMemberSearch] = useState(false);

  // Filter function based on search query
  const filterItems = (items) => {
    if (!searchQuery.trim()) return items;
    
    const query = searchQuery.toLowerCase();
    return items.filter(item => 
      (item.name && item.name.toLowerCase().includes(query)) ||
      (item.email && item.email.toLowerCase().includes(query)) ||
      (item.username && item.username.toLowerCase().includes(query)) ||
      (item.phone && item.phone.toLowerCase().includes(query)) ||
      (item.firstName && item.firstName.toLowerCase().includes(query)) ||
      (item.lastName && item.lastName.toLowerCase().includes(query)) ||
      (item.mobile && item.mobile.toLowerCase().includes(query))
    );
  };

  // Filter members for promotion (exclude existing admins)
  const filterMembersForPromotion = (members) => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    return members.filter(member => {
      const firstName = member.firstName?.toLowerCase() || '';
      const lastName = member.lastName?.toLowerCase() || '';
      const email = member.email?.toLowerCase() || '';
      const mobile = member.mobile?.toLowerCase() || '';
      const fullName = `${firstName} ${lastName}`;
      
      // Exclude members who are already admins
      const isAdmin = member.role === 'admin' || member.role === 'superadmin' || member.isAdmin || member.isSuperAdmin;
      
      return !isAdmin && (
        firstName.includes(query) ||
        lastName.includes(query) ||
        fullName.includes(query) ||
        email.includes(query) ||
        mobile.includes(query)
      );
    });
  };

  const filteredRegistrations = filterItems(pendingRegistrations);
  const filteredAdminRequests = filterItems(pendingAdminRequests);
  const filteredAdmins = filterItems(allAdmins);
  const filteredMembers = filterMembersForPromotion(allMembers);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [registrations, adminRequests, admins, members] = await Promise.all([
        DatabaseService.getPendingRegistrations(),
        DatabaseService.getPendingAdminRequests(),
        DatabaseService.getAllAdmins(),
        DatabaseService.getAllMembers(),
      ]);
      setPendingRegistrations(registrations);
      setPendingAdminRequests(adminRequests);
      setAllAdmins(admins);
      setAllMembers(members);
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
    console.log('Approve button clicked for:', member._id);
    console.log('Current user:', currentUser);
    
    // Use window.confirm for web, Alert for mobile
    const confirmed = Platform.OS === 'web' 
      ? window.confirm(`Approve registration for ${member.firstName} ${member.lastName}?`)
      : await new Promise((resolve) => {
          Alert.alert(
            'Approve Registration',
            `Approve registration for ${member.firstName} ${member.lastName}?`,
            [
              { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
              { text: 'Approve', onPress: () => resolve(true) }
            ]
          );
        });
    
    if (!confirmed) {
      console.log('Approval cancelled');
      return;
    }
    
    try {
      console.log('Approving member:', member._id, 'by user:', currentUser._id);
      await DatabaseService.approveMemberRegistration(
        member._id,
        currentUser._id
      );
      console.log('Approval successful');
      
      if (Platform.OS === 'web') {
        window.alert('Registration approved successfully');
      } else {
        Alert.alert('Success', 'Registration approved successfully');
      }
      
      console.log('Reloading data...');
      await loadData();
      console.log('Data reloaded');
    } catch (error) {
      console.error('Error approving registration:', error);
      
      if (Platform.OS === 'web') {
        window.alert(`Error: ${error.message || 'Failed to approve registration'}`);
      } else {
        Alert.alert('Error', error.message || 'Failed to approve registration');
      }
    }
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

  const handlePromoteMember = async (member) => {
    console.log('Promote button clicked for:', member._id);
    
    const confirmed = Platform.OS === 'web' 
      ? window.confirm(`Promote ${member.firstName} ${member.lastName} to admin?`)
      : await new Promise((resolve) => {
          Alert.alert(
            'Promote to Admin',
            `Grant admin privileges to ${member.firstName} ${member.lastName}?`,
            [
              { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
              { text: 'Promote', onPress: () => resolve(true) }
            ]
          );
        });
    
    if (!confirmed) {
      console.log('Promotion cancelled');
      return;
    }
    
    try {
      console.log('Promoting member to admin:', member._id, 'by user:', currentUser._id);
      await DatabaseService.promoteToAdmin(member._id, currentUser._id);
      console.log('Promotion successful');
      
      if (Platform.OS === 'web') {
        window.alert(`${member.firstName} ${member.lastName} is now an admin`);
      } else {
        Alert.alert('Success', `${member.firstName} ${member.lastName} is now an admin`);
      }
      
      console.log('Reloading data...');
      await loadData();
      setSearchQuery(''); // Clear search after promotion
      console.log('Data reloaded');
    } catch (error) {
      console.error('Error promoting to admin:', error);
      
      if (Platform.OS === 'web') {
        window.alert(`Error: ${error.message || 'Failed to grant admin privileges'}`);
      } else {
        Alert.alert('Error', error.message || 'Failed to grant admin privileges');
      }
    }
  };

  const handleDemoteAdmin = async (admin) => {
    console.log('Demote button clicked for:', admin._id);
    
    // Prevent demotion of super admins
    if (admin.isSuperAdmin || admin.role === 'superadmin') {
      if (Platform.OS === 'web') {
        window.alert('Cannot demote super admin');
      } else {
        Alert.alert('Error', 'Cannot demote super admin');
      }
      return;
    }

    // Prevent self-demotion
    if (admin._id === currentUser._id) {
      if (Platform.OS === 'web') {
        window.alert('You cannot demote yourself');
      } else {
        Alert.alert('Error', 'You cannot demote yourself');
      }
      return;
    }
    
    const name = admin.firstName ? `${admin.firstName} ${admin.lastName}` : admin.email;
    const confirmed = Platform.OS === 'web' 
      ? window.confirm(`Demote ${name} from admin?`)
      : await new Promise((resolve) => {
          Alert.alert(
            'Demote Admin',
            `Remove admin privileges from ${name}?`,
            [
              { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
              { text: 'Demote', onPress: () => resolve(true), style: 'destructive' }
            ]
          );
        });
    
    if (!confirmed) {
      console.log('Demotion cancelled');
      return;
    }
    
    try {
      console.log('Demoting admin:', admin._id, 'by user:', currentUser._id);
      await DatabaseService.demoteFromAdmin(admin._id, currentUser._id);
      console.log('Demotion successful');
      
      if (Platform.OS === 'web') {
        window.alert(`${name} has been demoted to regular member`);
      } else {
        Alert.alert('Success', `${name} has been demoted to regular member`);
      }
      
      console.log('Reloading data...');
      await loadData();
      console.log('Data reloaded');
    } catch (error) {
      console.error('Error demoting admin:', error);
      
      if (Platform.OS === 'web') {
        window.alert(`Error: ${error.message || 'Failed to remove admin privileges'}`);
      } else {
        Alert.alert('Error', error.message || 'Failed to remove admin privileges');
      }
    }
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

  const renderAdminCard = ({ item }) => {
    const name = item.firstName ? `${item.firstName} ${item.lastName}` : item.name || item.email;
    const role = item.isSuperAdmin || item.role === 'superadmin' ? 'Super Admin' : 'Admin';
    const roleStyle = (item.isSuperAdmin || item.role === 'superadmin') ? styles.superAdminBadge : styles.adminBadge;
    const isSuperAdmin = item.isSuperAdmin || item.role === 'superadmin';
    const canDemote = !isSuperAdmin && item._id !== currentUser._id; // Can't demote super admin or self
    
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.memberInfo}>
            <View style={styles.nameWithBadge}>
              <Text style={styles.memberName}>{name}</Text>
              <View style={roleStyle}>
                <Text style={styles.roleBadgeText}>{role}</Text>
              </View>
            </View>
            <Text style={styles.memberEmail}>{item.email}</Text>
            {item.mobile && <Text style={styles.memberMobile}>{item.mobile}</Text>}
            {item.username && <Text style={styles.memberMobile}>Username: {item.username}</Text>}
            {item.createdAt && (
              <Text style={styles.registeredDate}>
                Member Since: {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>

        {item.address && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Address:</Text>
            <Text style={styles.sectionText}>
              {item.address.street && `${item.address.street}, `}
              {item.address.city && `${item.address.city}, `}
              {item.address.state} {item.address.zipCode}
            </Text>
          </View>
        )}

        {canDemote && (
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.demoteButton]}
              onPress={() => handleDemoteAdmin(item)}
            >
              <Text style={styles.actionButtonText}>⬇ Demote Admin</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderMemberCard = ({ item }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>{item.firstName} {item.lastName}</Text>
            <Text style={styles.memberEmail}>{item.email}</Text>
            {item.mobile && <Text style={styles.memberMobile}>📱 {item.mobile}</Text>}
            {item.address && (
              <Text style={styles.sectionText}>
                📍 {item.address.city}, {item.address.state}
              </Text>
            )}
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                Status: {item.status || 'Active'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.promoteButton]}
            onPress={() => handlePromoteMember(item)}
          >
            <Text style={styles.actionButtonText}>⬆ Promote to Admin</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {activeTab === 'registrations'
          ? 'No pending requests'
          : activeTab === 'allAdmins' && showMemberSearch
          ? (searchQuery ? 'No members found matching your search' : 'Search for a member to promote to admin')
          : 'No admins found'}
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
  
  console.log('=== Admin Management Debug ===');
  console.log('Current User:', currentUser);
  console.log('User ID:', currentUser?._id);
  console.log('User Email:', currentUser?.email);
  console.log('User isAdmin:', currentUser?.isAdmin);
  console.log('User isSuperAdmin:', currentUser?.isSuperAdmin);
  console.log('User role:', currentUser?.role);
  console.log('Can Manage Registrations:', canManageRegistrations);
  console.log('Can Manage Admins:', canManageAdmins);
  console.log('================================');

  // If user doesn't have admin access, show message
  if (!canManageRegistrations && !canManageAdmins) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Admin Management</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            You don't have admin privileges.{'\n\n'}
            If you were recently made an admin, please log out and log back in.
          </Text>
        </View>
      </View>
    );
  }

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
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tabScrollContainer}
        contentContainerStyle={styles.tabContainer}
      >
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
              Pending Requests ({filteredRegistrations.length})
            </Text>
          </TouchableOpacity>
        )}
        {canManageAdmins && (
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'allAdmins' && styles.activeTab,
            ]}
            onPress={() => setActiveTab('allAdmins')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'allAdmins' && styles.activeTabText,
              ]}
            >
              All Admins ({allAdmins.length})
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        {activeTab === 'allAdmins' && (
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, !showMemberSearch && styles.activeToggleButton]}
              onPress={() => {
                setShowMemberSearch(false);
                setSearchQuery('');
              }}
            >
              <Text style={[styles.toggleButtonText, !showMemberSearch && styles.activeToggleButtonText]}>
                Search Admins
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, showMemberSearch && styles.activeToggleButton]}
              onPress={() => {
                setShowMemberSearch(true);
                setSearchQuery('');
              }}
            >
              <Text style={[styles.toggleButtonText, showMemberSearch && styles.activeToggleButtonText]}>
                Promote Member
              </Text>
            </TouchableOpacity>
          </View>
        )}
        <TextInput
          style={styles.searchInput}
          placeholder={
            activeTab === 'allAdmins' && showMemberSearch
              ? "Search members by name, email, or phone..."
              : "Search by name, email, username, or phone..."
          }
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery !== '' && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSearchQuery('')}
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <FlatList
        data={
          activeTab === 'registrations'
            ? filteredRegistrations
            : activeTab === 'allAdmins' && showMemberSearch
            ? filteredMembers
            : filteredAdmins
        }
        renderItem={
          activeTab === 'registrations'
            ? renderRegistrationCard
            : activeTab === 'allAdmins' && showMemberSearch
            ? renderMemberCard
            : renderAdminCard
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
  tabScrollContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabContainer: {
    flexDirection: 'row',
  },
  tab: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    minWidth: 120,
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
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#3498db',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 8,
  },
  statusText: {
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
  makeAdminButton: {
    backgroundColor: '#9b59b6',
  },
  promoteButton: {
    backgroundColor: '#3498db',
  },
  demoteButton: {
    backgroundColor: '#e67e22',
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
  searchContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeToggleButton: {
    backgroundColor: '#3498db',
  },
  toggleButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeToggleButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  clearButton: {
    marginLeft: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  nameWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  adminBadge: {
    backgroundColor: '#3498db',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  superAdminBadge: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  roleBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
});

export default AdminManagement;
