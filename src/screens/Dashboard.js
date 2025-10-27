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
      // Don't set filteredMembers here - keep it empty until search
      if (searchQuery.trim()) {
        // If there's a search query, filter the data
        handleSearch(searchQuery, data);
      } else {
        // Keep filtered members empty when no search
        setFilteredMembers([]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load members');
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Optimized search with debouncing effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery, members);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, members]);

  const handleSearch = useCallback((query, memberList = members) => {
    if (!query.trim()) {
      // If no search query, show empty list
      setFilteredMembers([]);
      return;
    }

    const lowercaseQuery = query.toLowerCase();
    const filtered = memberList.filter(member => {
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
      {searchQuery ? (
        <Text style={styles.emptyText}>
          No members found matching your search
        </Text>
      ) : (
        <>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyText}>
            Start typing to search members
          </Text>
          <Text style={styles.emptySubtext}>
            Search by name, email, or mobile number
          </Text>
        </>
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
      {/* Unified Dashboard Header */}
      {currentUser && (
        <View style={styles.dashboardHeader}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Text style={styles.appTitle}>Member Management</Text>
              <View style={styles.userInfoRow}>
                <Text style={styles.userName}>
                  {currentUser.firstName} {currentUser.lastName}
                </Text>
                <View style={[
                  styles.roleBadge,
                  hasAdminPrivileges(currentUser) ? styles.roleBadgeAdmin : styles.roleBadgeUser
                ]}>
                  <Text style={styles.roleBadgeText}>{getUserRoleDisplay(currentUser)}</Text>
                </View>
              </View>
            </View>
            <View style={styles.headerActions}>
              {canApproveRegistrations(currentUser) && (
                <TouchableOpacity
                  style={[styles.headerButton, styles.adminManagementHeaderButton]}
                  onPress={onAdminManagement}
                >
                  <Text style={styles.headerButtonText}>⚙ Admin</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleRefresh}
                disabled={refreshing}
              >
                <Text style={styles.headerButtonText}>{refreshing ? '↻ Sync' : '🔄 Sync'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={onLogout}
              >
                <Text style={styles.headerButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search members by name, email, or mobile..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus={false}
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

      {/* Results Count - only show when searching */}
      {searchQuery && (
        <Text style={styles.resultsText}>
          Found {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''}
        </Text>
      )}

      {/* Action Buttons */}
      {canCreateMember(currentUser) && (
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.addMemberButton} onPress={onAddMember}>
            <Text style={styles.addMemberButtonText}>+ Add New Member</Text>
          </TouchableOpacity>
        </View>
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
  dashboardHeader: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 20 : 40,
    paddingBottom: 16,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
      },
    }),
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  userName: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeAdmin: {
    backgroundColor: 'rgba(231, 76, 60, 0.9)',
  },
  roleBadgeUser: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  roleBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  adminManagementHeaderButton: {
    backgroundColor: 'rgba(155, 89, 182, 0.3)',
    borderColor: 'rgba(255,255,255,0.4)',
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 13,
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
  searchContainer: {
    marginHorizontal: 16,
    marginTop: 16,
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
  resultsText: {
    marginHorizontal: 16,
    marginBottom: 8,
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  addMemberButton: {
    flex: 1,
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
    flex: 1,
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
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
    textAlign: 'center',
  },
});

export default Dashboard;
