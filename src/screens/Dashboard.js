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
import Statistics from './Statistics';
import { canEditMember, canDeleteMember, canCreateMember, hasAdminPrivileges, getUserRoleDisplay, canApproveRegistrations } from '../utils/authorization';

const Dashboard = ({ onAddMember, onEditMember, onLogout, onAdminManagement, currentUser }) => {
  // Debug: Log current user and permissions
  console.log('Dashboard loaded with user:', {
    email: currentUser?.email,
    loginType: currentUser?.loginType,
    isAdmin: currentUser?.isAdmin,
    canApproveRegistrations: canApproveRegistrations(currentUser)
  });
  
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showMemberDetails, setShowMemberDetails] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showManageRecordSubmenu, setShowManageRecordSubmenu] = useState(false);

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
    console.log('Dashboard useEffect - initializing database and loading members');
    initializeDatabase();
  }, []);

  const initializeDatabase = async () => {
    try {
      console.log('Initializing database...');
      await DatabaseService.initDatabase();
      await loadMembers();
    } catch (error) {
      Alert.alert('Error', 'Failed to initialize database');
      console.error(error);
    }
  };

  const loadMembers = async () => {
    try {
      console.log('Loading members from database...');
      setLoading(true);
      // Use the new permission-aware method
      const data = await DatabaseService.getMembersForUser(currentUser);
      console.log(`Loaded ${data.length} members from database`);
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
    console.log('Handling delete request for member:', {
      memberId: member._id,
      memberName: `${member.firstName} ${member.lastName}`,
      currentUser: {
        id: currentUser?._id,
        isAdmin: currentUser?.isAdmin,
        role: currentUser?.role
      },
      memberDetails: {
        type: member.type,
        status: member.status,
        email: member.email
      }
    });

    // Check if currentUser exists
    if (!currentUser) {
      console.log('No current user found');
      Alert.alert('Authentication Required', 'Please log in to perform this action.');
      return;
    }

    // Check if user has permission to delete
    if (!canDeleteMember(currentUser, member._id)) {
      console.log('Delete permission denied:', {
        userId: currentUser._id,
        isAdmin: currentUser.isAdmin,
        userRole: currentUser.role
      });
      Alert.alert('Permission Denied', 'You do not have permission to delete members. Only admins can delete records.');
      return;
    }

    const confirmDelete = () => {
      return new Promise((resolve) => {
        Alert.alert(
          'Delete Member',
          `Are you sure you want to delete ${member.firstName} ${member.lastName}? This action cannot be undone.`,
          [
            { 
              text: 'Cancel', 
              style: 'cancel',
              onPress: () => {
                console.log('Delete cancelled by user');
                resolve(false);
              }
            },
            { 
              text: 'Delete', 
              style: 'destructive',
              onPress: () => {
                console.log('Delete confirmed by user');
                resolve(true);
              }
            },
          ]
        );
      });
    };

    try {
      const confirmed = await confirmDelete();
      if (confirmed) {
        console.log('Delete confirmed, proceeding with deletion:', {
          memberId: member._id,
          memberEmail: member.email
        });
        
        // Close member details modal if it's open
        if (showMemberDetails && selectedMember?._id === member._id) {
          console.log('Closing member details modal');
          setShowMemberDetails(false);
          setSelectedMember(null);
        }

        // Show loading state
        setLoading(true);

        try {
          // Attempt to delete the member
          const deleteResult = await DatabaseService.deleteMember(member._id, currentUser);
          console.log('Delete operation result:', deleteResult);

          // Wait a moment for sync to complete
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Refresh the members list
          await loadMembers();
          console.log('Member list refreshed');

          // Double check the member was actually deleted
          try {
            await DatabaseService.getMember(member._id);
            console.error('Member still exists after deletion');
            throw new Error('Failed to delete member - document still exists');
          } catch (checkError) {
            if (checkError.name === 'not_found') {
              console.log('Confirmed member was deleted successfully');
            } else {
              throw checkError;
            }
          }

          // Update filtered results if search is active
          if (searchQuery) {
            console.log('Updating search results');
            const updatedMembers = members.filter(m => m._id !== member._id);
            handleSearch(searchQuery, updatedMembers);
          }

          Alert.alert(
            'Success',
            `${member.firstName} ${member.lastName} has been deleted successfully`
          );
        } catch (deleteError) {
          console.error('Delete operation failed:', {
            error: deleteError,
            errorMessage: deleteError.message,
            errorStack: deleteError.stack
          });
          throw deleteError;
        }
      } else {
        console.log('Delete cancelled by user');
      }
    } catch (error) {
      console.error('Error during member deletion:', {
        error: error,
        errorMessage: error.message,
        errorStack: error.stack
      });
      
      Alert.alert(
        'Error',
        error.message || 'Failed to delete member. Please try again or contact support.'
      );
    } finally {
      setLoading(false);
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
            <Text style={styles.viewDetailsText}>👁️</Text>
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
        <>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyText}>
            No members found matching your search
          </Text>
          <Text style={styles.emptySubtext}>
            Try different keywords or clear your search
          </Text>
        </>
      ) : (
        <>
          <Text style={styles.emptyIcon}>👥</Text>
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
        <Text style={styles.loadingEmoji}>⏳</Text>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading members...</Text>
      </View>
    );
  }

  // If statistics screen is visible, render it instead of dashboard
  if (showStatistics) {
    return (
      <Statistics 
        members={members}
        onBack={() => setShowStatistics(false)}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Unified Dashboard Header */}
      {currentUser && (
        <View style={styles.dashboardHeader}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Text style={styles.appTitle}>👥 Member Management</Text>
              <View style={styles.userInfoRow}>
                <Text style={styles.userIcon}>👤</Text>
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
              {/* Hamburger Menu Button */}
              <TouchableOpacity
                style={styles.hamburgerButton}
                onPress={() => setShowMenu(!showMenu)}
              >
                <Text style={styles.hamburgerIcon}>☰</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Hamburger Menu Dropdown */}
          {showMenu && (
            <View style={styles.menuDropdown}>
              {/* Edit My Profile */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={async () => {
                  setShowMenu(false);
                  setShowManageRecordSubmenu(false);
                  
                  console.log('Edit My Profile - Current User:', {
                    _id: currentUser._id,
                    email: currentUser.email,
                    loginType: currentUser.loginType,
                    membersLoaded: members.length
                  });
                  
                  // For admin users logged in as 'user' type, they might not have a member record
                  if (currentUser.loginType === 'user') {
                    Alert.alert(
                      'Admin Account', 
                      'You are logged in as an admin user. Admin accounts do not have member profiles. Please create a member account if you want to have a member profile.'
                    );
                    return;
                  }
                  
                  // Try to find member record by _id first
                  let myRecord = members.find(m => m._id === currentUser._id);
                  
                  // If not found in already loaded members, fetch directly from database
                  if (!myRecord) {
                    try {
                      myRecord = await DatabaseService.getMember(currentUser._id);
                    } catch (error) {
                      console.error('Error fetching member record:', error);
                    }
                  }
                  
                  if (myRecord) {
                    console.log('Found member record:', myRecord._id);
                    onEditMember(myRecord);
                  } else {
                    Alert.alert(
                      'Profile Not Found', 
                      `Your profile record was not found. ID: ${currentUser._id}\nEmail: ${currentUser.email}\nPlease contact an administrator.`
                    );
                  }
                }}
              >
                <Text style={styles.menuItemIcon}>👤</Text>
                <Text style={styles.menuItemText}>Edit My Profile</Text>
              </TouchableOpacity>
              
              {/* Manage Others with Submenu */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowManageRecordSubmenu(!showManageRecordSubmenu);
                }}
              >
                <Text style={styles.menuItemIcon}>👥</Text>
                <Text style={styles.menuItemText}>Manage Others</Text>
                <Text style={styles.menuItemArrow}>{showManageRecordSubmenu ? '▼' : '▶'}</Text>
              </TouchableOpacity>
              
              {/* Managed Members Submenu */}
              {showManageRecordSubmenu && (
                <View style={styles.submenuContainer}>
                  {/* Add New Managed Member */}
                  <TouchableOpacity
                    style={styles.submenuItem}
                    onPress={() => {
                      setShowMenu(false);
                      setShowManageRecordSubmenu(false);
                      onAddMember(true); // Pass true to indicate this is a managed member
                    }}
                  >
                    <Text style={styles.submenuItemIcon}>➕</Text>
                    <Text style={styles.submenuItemText}>Add Family Member</Text>
                  </TouchableOpacity>

                  {/* View Managed Members */}
                  <TouchableOpacity
                    style={styles.submenuItem}
                    onPress={() => {
                      setShowMenu(false);
                      setShowManageRecordSubmenu(false);
                      setSearchQuery('managedBy:' + currentUser._id);
                    }}
                  >
                    <Text style={styles.submenuItemIcon}>👥</Text>
                    <Text style={styles.submenuItemText}>View Family Members</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {canApproveRegistrations(currentUser) && (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    setShowManageRecordSubmenu(false);
                    onAdminManagement();
                  }}
                >
                  <Text style={styles.menuItemIcon}>⚙️</Text>
                  <Text style={styles.menuItemText}>Admin Management</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowMenu(false);
                  setShowManageRecordSubmenu(false);
                  setShowStatistics(true);
                }}
              >
                <Text style={styles.menuItemIcon}>📊</Text>
                <Text style={styles.menuItemText}>Statistics</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.menuItem, styles.menuItemLogout]}
                onPress={() => {
                  setShowMenu(false);
                  setShowManageRecordSubmenu(false);
                  onLogout();
                }}
              >
                <Text style={styles.menuItemIcon}>🚪</Text>
                <Text style={styles.menuItemText}>Logout</Text>
              </TouchableOpacity>
            </View>
          )}
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
            <Text style={styles.addMemberButtonText}>➕ Add New Member</Text>
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

                  {/* Management Status */}
                  {(selectedMember.managedBy || selectedMember._id === currentUser._id) && (
                    <View style={styles.detailsSection}>
                      <Text style={styles.detailsSectionTitle}>
                        {selectedMember.managedBy ? '👥 Managed Member' : '🔑 Account Status'}
                      </Text>
                      <View style={styles.detailsGrid}>
                        {selectedMember.managedBy && (
                          <>
                            <View style={styles.detailsRow}>
                              <Text style={styles.detailsLabel}>Managed By:</Text>
                              <Text style={styles.detailsValue}>
                                {currentUser._id === selectedMember.managedBy ? 'You' : 'Another Member'}
                              </Text>
                            </View>
                            <View style={styles.detailsRow}>
                              <Text style={styles.detailsLabel}>Since:</Text>
                              <Text style={styles.detailsValue}>
                                {new Date(selectedMember.managedSince).toLocaleDateString()}
                              </Text>
                            </View>
                            <View style={styles.detailsRow}>
                              <Text style={styles.detailsLabel}>Login Access:</Text>
                              <Text style={styles.detailsValue}>
                                Managed through parent account
                              </Text>
                            </View>
                          </>
                        )}
                        {selectedMember._id === currentUser._id && (
                          <View style={styles.detailsRow}>
                            <Text style={styles.detailsLabel}>Account Type:</Text>
                            <Text style={styles.detailsValue}>
                              Primary Account (Has Login)
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}

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
    paddingBottom: 20,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(52, 152, 219, 0.3)',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      },
      default: {
        shadowColor: '#3498db',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  userIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  userName: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginRight: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  roleBadgeAdmin: {
    backgroundColor: 'rgba(231, 76, 60, 1)',
  },
  roleBadgeUser: {
    backgroundColor: 'rgba(46, 204, 113, 0.9)',
  },
  roleBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  adminManagementHeaderButton: {
    backgroundColor: 'rgba(155, 89, 182, 0.4)',
    borderColor: 'rgba(255,255,255,0.5)',
  },
  statisticsHeaderButton: {
    backgroundColor: 'rgba(52, 152, 219, 0.4)',
    borderColor: 'rgba(255,255,255,0.5)',
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
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
    fontWeight: '500',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  addMemberButton: {
    flex: 1,
    backgroundColor: '#27ae60',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#27ae60',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addMemberButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
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
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e8ecef',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        transition: 'all 0.3s ease',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#f0f4f8',
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
    paddingTop: 14,
    marginTop: 14,
    borderTopWidth: 2,
    borderTopColor: '#f0f4f8',
    gap: 10,
  },
  expandedContent: {
    paddingTop: 12,
  },
  memberNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  memberName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginRight: 10,
    letterSpacing: 0.3,
  },
  ownRecordBadge: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(39, 174, 96, 0.3)',
      },
      default: {
        shadowColor: '#27ae60',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
      },
    }),
  },
  ownRecordBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  memberEmail: {
    fontSize: 15,
    color: '#5a6c7d',
    marginBottom: 6,
    fontWeight: '500',
  },
  memberMobile: {
    fontSize: 15,
    color: '#5a6c7d',
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
  },
  actionButton: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
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
  editButton: {
    backgroundColor: '#3498db',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
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
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    color: '#555',
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: '700',
  },
  emptySubtext: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    fontWeight: '400',
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
  // Member Details Modal Styles
  detailsModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    maxWidth: 750,
    width: '92%',
    maxHeight: '90%',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 15,
      },
    }),
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 28,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    backgroundColor: '#667eea',
  },
  avatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  detailsHeaderText: {
    flex: 1,
  },
  detailsName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  yourRecordBadgeLarge: {
    backgroundColor: 'rgba(46, 204, 113, 1)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
      },
    }),
  },
  yourRecordBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  detailsSection: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e8ecef',
  },
  detailsSectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 18,
    letterSpacing: 0.5,
  },
  detailsGrid: {
    gap: 14,
  },
  detailsRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  detailsLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5a6c7d',
    width: 130,
  },
  detailsValue: {
    fontSize: 15,
    color: '#2c3e50',
    flex: 1,
    fontWeight: '500',
  },
  childCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#bbdefb',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(52, 152, 219, 0.1)',
      },
      default: {
        shadowColor: '#3498db',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  childNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 6px rgba(52, 152, 219, 0.3)',
      },
      default: {
        shadowColor: '#3498db',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
      },
    }),
  },
  childNumberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  childDetails: {
    flex: 1,
  },
  childName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 4,
  },
  childInfo: {
    fontSize: 14,
    color: '#5a6c7d',
  },
  notesText: {
    fontSize: 15,
    color: '#2c3e50',
    lineHeight: 24,
    backgroundColor: '#fff3e0',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  // Spouse Card Styles
  spouseCard: {
    flexDirection: 'row',
    backgroundColor: '#fce4ec',
    padding: 18,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#f8bbd0',
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(233, 30, 99, 0.15)',
      },
      default: {
        shadowColor: '#e91e63',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
      },
    }),
  },
  spouseAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e91e63',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 3,
    borderColor: '#f48fb1',
  },
  spouseAvatarText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  spouseInfo: {
    flex: 1,
  },
  spouseName: {
    fontSize: 19,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 10,
  },
  spouseDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  spouseIcon: {
    fontSize: 16,
    marginRight: 10,
    width: 22,
  },
  spouseDetailText: {
    fontSize: 15,
    color: '#4a5568',
    flex: 1,
    fontWeight: '500',
  },
  // Updated Card Styles
  quickPreview: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#e8ecef',
  },
  quickPreviewText: {
    fontSize: 14,
    color: '#5a6c7d',
    marginTop: 6,
    fontWeight: '500',
    lineHeight: 20,
  },
  viewDetailsIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 18,
    backgroundColor: '#e3f2fd',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#bbdefb',
    minWidth: 80,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(52, 152, 219, 0.15)',
      },
      default: {
        shadowColor: '#3498db',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  viewDetailsText: {
    fontSize: 28,
    marginBottom: 4,
  },
  viewDetailsLabel: {
    fontSize: 12,
    color: '#3498db',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Hamburger Menu Styles
  hamburgerButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  hamburgerIcon: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
  },
  menuDropdown: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 12,
    marginHorizontal: 16,
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
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemLogout: {
    borderBottomWidth: 0,
    borderTopWidth: 2,
    borderTopColor: '#f0f0f0',
  },
  menuItemIcon: {
    fontSize: 24,
    marginRight: 12,
    width: 32,
  },
  menuItemText: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '600',
    flex: 1,
  },
  menuItemArrow: {
    fontSize: 16,
    color: '#7f8c8d',
    marginLeft: 8,
  },
  submenuContainer: {
    backgroundColor: '#f8f9fa',
    borderLeftWidth: 3,
    borderLeftColor: '#3498db',
  },
  submenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingLeft: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  submenuItemIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 28,
  },
  submenuItemText: {
    fontSize: 15,
    color: '#495057',
    fontWeight: '500',
  },
});

export default Dashboard;
