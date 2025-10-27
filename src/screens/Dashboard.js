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
  Modal,
  ScrollView,
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
  const [showStatistics, setShowStatistics] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showMemberDetails, setShowMemberDetails] = useState(false);

  // Show member details modal
  const handleCardPress = (member) => {
    setSelectedMember(member);
    setShowMemberDetails(true);
  };

  // Close member details modal
  const closeMemberDetails = () => {
    setShowMemberDetails(false);
    setSelectedMember(null);
  };

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

  // Calculate statistics
  const statistics = useMemo(() => {
    const stats = {
      totalMembers: members.length,
      membersCount: members.length,
      spousesCount: 0,
      kidsCount: 0,
      byState: {},
      byCountry: {},
    };

    members.forEach(member => {
      // Count spouses
      if (member.spouse && member.spouse.firstName) {
        stats.spousesCount++;
      }

      // Count children
      if (member.children && Array.isArray(member.children)) {
        stats.kidsCount += member.children.length;
      }

      // Count by state
      if (member.address && member.address.state) {
        const state = member.address.state;
        stats.byState[state] = (stats.byState[state] || 0) + 1;
      }

      // Count by country
      if (member.address && member.address.country) {
        const country = member.address.country;
        stats.byCountry[country] = (stats.byCountry[country] || 0) + 1;
      } else if (member.address) {
        // Default to USA if no country specified
        stats.byCountry['USA'] = (stats.byCountry['USA'] || 0) + 1;
      }
    });

    // Sort states and countries by count
    stats.byStateArray = Object.entries(stats.byState)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));

    stats.byCountryArray = Object.entries(stats.byCountry)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));

    return stats;
  }, [members]);

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
      <TouchableOpacity 
        style={styles.card}
        onPress={() => handleCardPress(item)}
        activeOpacity={0.7}
      >
        {/* Card Header */}
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
            <Text style={styles.memberEmail}>📧 {item.email}</Text>
            <Text style={styles.memberMobile}>📱 {item.mobile}</Text>
            
            {/* Quick Preview */}
            <View style={styles.quickPreview}>
              {item.address?.city && item.address?.state && (
                <Text style={styles.quickPreviewText}>
                  📍 {item.address.city}, {item.address.state}
                </Text>
              )}
              {item.spouse?.firstName && (
                <Text style={styles.quickPreviewText}>
                  💑 Spouse: {item.spouse.firstName}
                </Text>
              )}
              {item.children && item.children.length > 0 && (
                <Text style={styles.quickPreviewText}>
                  👶 {item.children.length} {item.children.length === 1 ? 'Child' : 'Children'}
                </Text>
              )}
            </View>
          </View>
          
          <View style={styles.viewDetailsIcon}>
            <Text style={styles.viewDetailsText}>�️</Text>
            <Text style={styles.viewDetailsLabel}>View</Text>
          </View>
        </View>

        {/* Action Buttons */}
        {(canEdit || canDelete) && (
          <View style={styles.cardActionsRow}>
            {canEdit && (
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={(e) => {
                  e.stopPropagation();
                  onEditMember(item);
                }}
              >
                <Text style={styles.actionButtonText}>✏️ Edit</Text>
              </TouchableOpacity>
            )}
            {canDelete && (
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={(e) => {
                  e.stopPropagation();
                  handleDelete(item);
                }}
              >
                <Text style={styles.actionButtonText}>🗑️ Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </TouchableOpacity>
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
              {canApproveRegistrations(currentUser) && currentUser?.loginType !== 'member' && currentUser?.loginType !== 'spouse' && (
                <TouchableOpacity
                  style={[styles.headerButton, styles.adminManagementHeaderButton]}
                  onPress={onAdminManagement}
                >
                  <Text style={styles.headerButtonText}>⚙ Admin</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.headerButton, styles.statisticsHeaderButton]}
                onPress={() => setShowStatistics(true)}
              >
                <Text style={styles.headerButtonText}>📊 Statistics</Text>
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
      {canCreateMember(currentUser) && currentUser?.loginType !== 'member' && currentUser?.loginType !== 'spouse' && (
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

      {/* Member Details Modal */}
      <Modal
        visible={showMemberDetails}
        transparent={true}
        animationType="fade"
        onRequestClose={closeMemberDetails}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailsModalContent}>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {selectedMember && (
                <>
                  {/* Header */}
                  <View style={styles.detailsHeader}>
                    <View style={styles.avatarContainer}>
                      <Text style={styles.avatarText}>
                        {selectedMember.firstName[0]}{selectedMember.lastName[0]}
                      </Text>
                    </View>
                    <View style={styles.detailsHeaderText}>
                      <Text style={styles.detailsName}>
                        {selectedMember.firstName} {selectedMember.lastName}
                      </Text>
                      {selectedMember._id === currentUser?._id && (
                        <View style={styles.yourRecordBadgeLarge}>
                          <Text style={styles.yourRecordBadgeText}>✓ Your Record</Text>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.modalCloseButton}
                      onPress={closeMemberDetails}
                    >
                      <Text style={styles.modalCloseButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Contact Information */}
                  <View style={styles.detailsSection}>
                    <Text style={styles.detailsSectionTitle}>📱 Contact Information</Text>
                    <View style={styles.detailsGrid}>
                      <View style={styles.detailsRow}>
                        <Text style={styles.detailsLabel}>Email:</Text>
                        <Text style={styles.detailsValue}>{selectedMember.email}</Text>
                      </View>
                      <View style={styles.detailsRow}>
                        <Text style={styles.detailsLabel}>Mobile:</Text>
                        <Text style={styles.detailsValue}>{selectedMember.mobile}</Text>
                      </View>
                      {selectedMember.dateOfBirth && (
                        <View style={styles.detailsRow}>
                          <Text style={styles.detailsLabel}>Date of Birth:</Text>
                          <Text style={styles.detailsValue}>{selectedMember.dateOfBirth}</Text>
                        </View>
                      )}
                      {selectedMember.occupation && (
                        <View style={styles.detailsRow}>
                          <Text style={styles.detailsLabel}>Occupation:</Text>
                          <Text style={styles.detailsValue}>{selectedMember.occupation}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Address */}
                  {selectedMember.address && (
                    <View style={styles.detailsSection}>
                      <Text style={styles.detailsSectionTitle}>📍 Address</Text>
                      <View style={styles.detailsGrid}>
                        {selectedMember.address.street && (
                          <View style={styles.detailsRow}>
                            <Text style={styles.detailsLabel}>Street:</Text>
                            <Text style={styles.detailsValue}>{selectedMember.address.street}</Text>
                          </View>
                        )}
                        <View style={styles.detailsRow}>
                          <Text style={styles.detailsLabel}>City:</Text>
                          <Text style={styles.detailsValue}>{selectedMember.address.city}</Text>
                        </View>
                        <View style={styles.detailsRow}>
                          <Text style={styles.detailsLabel}>State:</Text>
                          <Text style={styles.detailsValue}>{selectedMember.address.state}</Text>
                        </View>
                        {selectedMember.address.zipCode && (
                          <View style={styles.detailsRow}>
                            <Text style={styles.detailsLabel}>Zip Code:</Text>
                            <Text style={styles.detailsValue}>{selectedMember.address.zipCode}</Text>
                          </View>
                        )}
                        <View style={styles.detailsRow}>
                          <Text style={styles.detailsLabel}>Country:</Text>
                          <Text style={styles.detailsValue}>{selectedMember.address.country || 'USA'}</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Spouse Information */}
                  {selectedMember.spouse?.firstName && (
                    <View style={styles.detailsSection}>
                      <Text style={styles.detailsSectionTitle}>💑 Spouse Information</Text>
                      
                      {/* Spouse Card */}
                      <View style={styles.spouseCard}>
                        <View style={styles.spouseAvatar}>
                          <Text style={styles.spouseAvatarText}>
                            {selectedMember.spouse.firstName[0]}{selectedMember.spouse.lastName?.[0] || ''}
                          </Text>
                        </View>
                        <View style={styles.spouseInfo}>
                          <Text style={styles.spouseName}>
                            {selectedMember.spouse.firstName} {selectedMember.spouse.lastName}
                          </Text>
                          <View style={styles.detailsGrid}>
                            {selectedMember.spouse.email && (
                              <View style={styles.spouseDetailRow}>
                                <Text style={styles.spouseIcon}>📧</Text>
                                <Text style={styles.spouseDetailText}>{selectedMember.spouse.email}</Text>
                              </View>
                            )}
                            {selectedMember.spouse.mobile && (
                              <View style={styles.spouseDetailRow}>
                                <Text style={styles.spouseIcon}>📱</Text>
                                <Text style={styles.spouseDetailText}>{selectedMember.spouse.mobile}</Text>
                              </View>
                            )}
                            {selectedMember.spouse.dateOfBirth && (
                              <View style={styles.spouseDetailRow}>
                                <Text style={styles.spouseIcon}>🎂</Text>
                                <Text style={styles.spouseDetailText}>{selectedMember.spouse.dateOfBirth}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Children */}
                  {selectedMember.children && selectedMember.children.length > 0 && (
                    <View style={styles.detailsSection}>
                      <Text style={styles.detailsSectionTitle}>
                        👶 Children ({selectedMember.children.length})
                      </Text>
                      {selectedMember.children.map((child, index) => (
                        <View key={child.id || index} style={styles.childCard}>
                          <View style={styles.childNumber}>
                            <Text style={styles.childNumberText}>{index + 1}</Text>
                          </View>
                          <View style={styles.childDetails}>
                            <Text style={styles.childName}>
                              {child.firstName} {child.lastName}
                            </Text>
                            {child.dateOfBirth && (
                              <Text style={styles.childInfo}>🎂 {child.dateOfBirth}</Text>
                            )}
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Notes */}
                  {selectedMember.notes && (
                    <View style={styles.detailsSection}>
                      <Text style={styles.detailsSectionTitle}>📝 Notes</Text>
                      <Text style={styles.notesText}>{selectedMember.notes}</Text>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Statistics Modal */}
      <Modal
        visible={showStatistics}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStatistics(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📊 Member Statistics</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowStatistics(false)}
              >
                <Text style={styles.modalCloseButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {/* Summary Cards */}
              <View style={styles.statsGrid}>
                <View style={[styles.statCard, styles.statCardPrimary]}>
                  <Text style={styles.statValue}>{statistics.totalMembers}</Text>
                  <Text style={styles.statLabel}>Total Members</Text>
                </View>

                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{statistics.membersCount}</Text>
                  <Text style={styles.statLabel}>Members</Text>
                </View>

                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{statistics.spousesCount}</Text>
                  <Text style={styles.statLabel}>Spouses</Text>
                </View>

                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{statistics.kidsCount}</Text>
                  <Text style={styles.statLabel}>Children</Text>
                </View>
              </View>

              {/* By State */}
              {statistics.byStateArray.length > 0 && (
                <View style={styles.statsSection}>
                  <Text style={styles.statsSectionTitle}>📍 Members by State</Text>
                  {statistics.byStateArray.map((item, index) => (
                    <View key={index} style={styles.statsRow}>
                      <Text style={styles.statsRowLabel}>{item.name}</Text>
                      <View style={styles.statsRowRight}>
                        <View style={styles.statsBarContainer}>
                          <View style={[styles.statsBar, { width: `${(item.count / statistics.totalMembers) * 100}%` }]} />
                        </View>
                        <Text style={styles.statsRowValue}>{item.count}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* By Country */}
              {statistics.byCountryArray.length > 0 && (
                <View style={styles.statsSection}>
                  <Text style={styles.statsSectionTitle}>🌍 Members by Country</Text>
                  {statistics.byCountryArray.map((item, index) => (
                    <View key={index} style={styles.statsRow}>
                      <Text style={styles.statsRowLabel}>{item.name}</Text>
                      <View style={styles.statsRowRight}>
                        <View style={styles.statsBarContainer}>
                          <View style={[styles.statsBar, { width: `${(item.count / statistics.totalMembers) * 100}%` }]} />
                        </View>
                        <Text style={styles.statsRowValue}>{item.count}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
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
    flexWrap: 'wrap',
  },
  userName: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
    marginRight: 12,
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
  },
  headerButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    marginLeft: 8,
  },
  adminManagementHeaderButton: {
    backgroundColor: 'rgba(155, 89, 182, 0.3)',
    borderColor: 'rgba(255,255,255,0.4)',
  },
  statisticsHeaderButton: {
    backgroundColor: 'rgba(52, 152, 219, 0.3)',
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
  statisticsButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    minWidth: 120,
  },
  statisticsButtonText: {
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  memberInfo: {
    flex: 1,
  },
  expandIconContainer: {
    paddingLeft: 12,
    justifyContent: 'center',
  },
  expandIcon: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: 'bold',
  },
  cardActionsRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  expandedContent: {
    paddingTop: 12,
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
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    minWidth: 70,
    alignItems: 'center',
    marginLeft: 8,
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
    marginTop: 12,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#555',
    marginBottom: 6,
  },
  sectionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
  sectionTextSmall: {
    fontSize: 13,
    color: '#888',
    marginBottom: 2,
    lineHeight: 18,
  },
  childItem: {
    marginBottom: 8,
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
  // Statistics Modal Styles
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
    maxWidth: 600,
    width: '100%',
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseButtonText: {
    fontSize: 24,
    color: '#657786',
    fontWeight: '600',
  },
  modalScroll: {
    flex: 1,
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    marginHorizontal: -6,
  },
  statCard: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: '#f7f9fa',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e8ed',
    margin: 6,
  },
  statCardPrimary: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
    borderWidth: 2,
  },
  statValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#657786',
    fontWeight: '500',
    textAlign: 'center',
  },
  statsSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#e1e8ed',
  },
  statsSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f7f9fa',
  },
  statsRowLabel: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
    flex: 1,
  },
  statsRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
  },
  statsBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#e1e8ed',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 12,
  },
  statsBar: {
    height: '100%',
    backgroundColor: '#3498db',
    borderRadius: 4,
  },
  statsRowValue: {
    fontSize: 14,
    color: '#657786',
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  // Member Details Modal Styles
  detailsModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    maxWidth: 700,
    width: '90%',
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#3498db',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  detailsHeaderText: {
    flex: 1,
  },
  detailsName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  yourRecordBadgeLarge: {
    backgroundColor: 'rgba(46, 204, 113, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  yourRecordBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  detailsSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailsSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 16,
  },
  detailsGrid: {
    gap: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  detailsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
    width: 120,
  },
  detailsValue: {
    fontSize: 14,
    color: '#2c3e50',
    flex: 1,
    fontWeight: '500',
  },
  childCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  childNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  childNumberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  childDetails: {
    flex: 1,
  },
  childName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  childInfo: {
    fontSize: 13,
    color: '#7f8c8d',
  },
  notesText: {
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 22,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  // Spouse Card Styles
  spouseCard: {
    flexDirection: 'row',
    backgroundColor: '#fff3e0',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ffe0b2',
    alignItems: 'center',
  },
  spouseAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ff9800',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  spouseAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  spouseInfo: {
    flex: 1,
  },
  spouseName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 8,
  },
  spouseDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  spouseIcon: {
    fontSize: 14,
    marginRight: 8,
    width: 20,
  },
  spouseDetailText: {
    fontSize: 14,
    color: '#555',
    flex: 1,
  },
  // Updated Card Styles
  quickPreview: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  quickPreviewText: {
    fontSize: 13,
    color: '#7f8c8d',
    marginTop: 4,
  },
  viewDetailsIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 16,
  },
  viewDetailsText: {
    fontSize: 24,
    marginBottom: 4,
  },
  viewDetailsLabel: {
    fontSize: 11,
    color: '#3498db',
    fontWeight: '600',
  },
});

export default Dashboard;
