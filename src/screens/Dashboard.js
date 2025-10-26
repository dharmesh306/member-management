import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import DatabaseService from '../services/DatabaseService';
import SyncStatus from '../components/SyncStatus';
import { canEditMember, canDeleteMember, canCreateMember, hasAdminPrivileges, getUserRoleDisplay, canApproveRegistrations } from '../utils/authorization';

const Dashboard = ({ onAddMember, onEditMember, onLogout, onAdminManagement, currentUser }) => {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    withSpouse: 0,
    withChildren: 0,
  });

  // Initialize database and load members
  useEffect(() => {
    initializeDatabase();
  }, []);

  const initializeDatabase = async () => {
    try {
      await DatabaseService.initDatabase();
      await loadMembers();
    } catch (error) {
      Alert.alert('Error', 'Failed to initialize database');
      console.error(error);
    }
  };

  const loadMembers = async () => {
    try {
      setLoading(true);
      // Use the new permission-aware method
      const data = await DatabaseService.getMembersForUser(currentUser);
      setMembers(data);
      setFilteredMembers(data);
      calculateStats(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load members');
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (data) => {
    const total = data.length;
    const withSpouse = data.filter(m => m.spouse?.firstName).length;
    const withChildren = data.filter(m => m.children?.length > 0).length;
    setStats({ total, withSpouse, withChildren });
  };

  // Optimized search with debouncing effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, members]);

  const handleSearch = useCallback((query) => {
    if (!query.trim()) {
      setFilteredMembers(members);
      return;
    }

    const lowercaseQuery = query.toLowerCase();
    const filtered = members.filter(member => {
      const firstName = member.firstName?.toLowerCase() || '';
      const lastName = member.lastName?.toLowerCase() || '';
      const email = member.email?.toLowerCase() || '';
      const mobile = member.mobile?.toLowerCase() || '';
      const fullName = `${firstName} ${lastName}`;
      
      return (
        firstName.includes(lowercaseQuery) ||
        lastName.includes(lowercaseQuery) ||
        fullName.includes(lowercaseQuery) ||
        email.includes(lowercaseQuery) ||
        mobile.includes(lowercaseQuery)
      );
    });

    setFilteredMembers(filtered);
  }, [members]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMembers();
  };

  const handleDelete = async (member) => {
    // Check if user has permission to delete
    if (!canDeleteMember(currentUser, member._id)) {
      Alert.alert('Permission Denied', 'You do not have permission to delete members. Only admins can delete records.');
      return;
    }

    const confirmDelete = () => {
      return new Promise((resolve) => {
        Alert.alert(
          'Delete Member',
          `Are you sure you want to delete ${member.firstName} ${member.lastName}?`,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
          ]
        );
      });
    };

    const confirmed = await confirmDelete();
    if (confirmed) {
      try {
        await DatabaseService.deleteMember(member._id, currentUser);
        await loadMembers();
        Alert.alert('Success', 'Member deleted successfully');
      } catch (error) {
        Alert.alert('Error', error.message || 'Failed to delete member');
        console.error(error);
      }
    }
  };

  const renderMemberCard = ({ item }) => {
    const canEdit = canEditMember(currentUser, item._id);
    const canDelete = canDeleteMember(currentUser, item._id);
    const isOwnRecord = currentUser && currentUser._id === item._id;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.memberInfo}>
            <View style={styles.memberNameContainer}>
              <Text style={styles.memberName}>
                {item.firstName} {item.lastName}
              </Text>
              {isOwnRecord && !hasAdminPrivileges(currentUser) && (
                <View style={styles.ownRecordBadge}>
                  <Text style={styles.ownRecordBadgeText}>Your Record</Text>
                </View>
              )}
            </View>
            <Text style={styles.memberEmail}>{item.email}</Text>
            <Text style={styles.memberMobile}>{item.mobile}</Text>
          </View>
          <View style={styles.cardActions}>
            {canEdit && (
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={() => onEditMember(item)}
              >
                <Text style={styles.actionButtonText}>Edit</Text>
              </TouchableOpacity>
            )}
            {canDelete && (
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDelete(item)}
              >
                <Text style={styles.actionButtonText}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Address */}
        {item.address && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Address:</Text>
            <Text style={styles.sectionText}>
              {item.address.street}, {item.address.city}, {item.address.state} {item.address.zipCode}
            </Text>
          </View>
        )}

        {/* Spouse Info */}
        {item.spouse?.firstName && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Spouse:</Text>
            <Text style={styles.sectionText}>
              {item.spouse.firstName} {item.spouse.lastName}
            </Text>
            {item.spouse.email && (
              <Text style={styles.sectionTextSmall}>{item.spouse.email}</Text>
            )}
          </View>
        )}

        {/* Children */}
        {item.children && item.children.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Children ({item.children.length}):
            </Text>
            {item.children.map((child, index) => (
              <Text key={child.id || index} style={styles.sectionText}>
                • {child.firstName} {child.lastName}
                {child.dateOfBirth && ` (${child.dateOfBirth})`}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {searchQuery ? 'No members found matching your search' : 'No members yet'}
      </Text>
      {!searchQuery && (
        <TouchableOpacity style={styles.emptyButton} onPress={onAddMember}>
          <Text style={styles.emptyButtonText}>Add Your First Member</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading members...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* User Role Header */}
      {currentUser && (
        <View style={styles.userRoleHeader}>
          <View style={styles.userRoleInfo}>
            <Text style={styles.userRoleLabel}>Logged in as:</Text>
            <Text style={styles.userRoleName}>
              {currentUser.firstName} {currentUser.lastName}
            </Text>
            <View style={[
              styles.roleBadge,
              hasAdminPrivileges(currentUser) ? styles.roleBadgeAdmin : styles.roleBadgeUser
            ]}>
              <Text style={styles.roleBadgeText}>{getUserRoleDisplay(currentUser)}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Sync Status */}
      <SyncStatus onRefresh={handleRefresh} />

      {/* Stats Dashboard */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Members</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.withSpouse}</Text>
          <Text style={styles.statLabel}>With Spouse</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.withChildren}</Text>
          <Text style={styles.statLabel}>With Children</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, or mobile..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSearchQuery('')}
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Add Member Button - Only for admins */}
      {canCreateMember(currentUser) && (
        <TouchableOpacity style={styles.addMemberButton} onPress={onAddMember}>
          <Text style={styles.addMemberButtonText}>+ Add New Member</Text>
        </TouchableOpacity>
      )}

      {/* Admin Management Button - Only for admins */}
      {canApproveRegistrations(currentUser) && (
        <TouchableOpacity style={styles.adminManagementButton} onPress={onAdminManagement}>
          <Text style={styles.adminManagementButtonText}>⚙ Admin Management</Text>
        </TouchableOpacity>
      )}

      {/* Results Count */}
      {searchQuery && (
        <Text style={styles.resultsText}>
          Found {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''}
        </Text>
      )}

      {/* Members List */}
      <FlatList
        data={filteredMembers}
        renderItem={renderMemberCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyList}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={Platform.OS === 'android'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  userRoleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  userRoleInfo: {
    flex: 1,
  },
  userRoleLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  userRoleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeAdmin: {
    backgroundColor: '#e74c3c',
  },
  roleBadgeUser: {
    backgroundColor: '#3498db',
  },
  roleBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  logoutButton: {
    backgroundColor: '#95a5a6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
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
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  searchContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
    position: 'relative',
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    paddingRight: 40,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#ddd',
    color: '#333',
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 18,
    color: '#999',
  },
  addMemberButton: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#27ae60',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  addMemberButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  adminManagementButton: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#9b59b6',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  adminManagementButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsText: {
    marginHorizontal: 16,
    marginBottom: 8,
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
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
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    justifyContent: 'space-between',
    alignItems: Platform.OS === 'web' ? 'flex-start' : 'stretch',
    marginBottom: 12,
  },
  memberInfo: {
    flex: 1,
    marginBottom: Platform.OS === 'web' ? 0 : 12,
  },
  memberNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  memberName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  ownRecordBadge: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  ownRecordBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  memberEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  memberMobile: {
    fontSize: 14,
    color: '#666',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    minWidth: 70,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#3498db',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginTop: 8,
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
    marginBottom: 2,
  },
  sectionTextSmall: {
    fontSize: 12,
    color: '#888',
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
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Dashboard;
