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
} from 'react-native';
import DatabaseService from '../services/DatabaseService';
import AuthService from '../services/AuthService';

const ManageOthers = ({ navigation, route }) => {
  const [loading, setLoading] = useState(true);
  const [managedMembers, setManagedMembers] = useState([]);
  const [error, setError] = useState('');

  // Fetch managed members on component mount
  useEffect(() => {
    loadManagedMembers();
  }, []);

  // Load managed members
  const loadManagedMembers = async () => {
    try {
      setLoading(true);
      const currentUser = await AuthService.getCurrentSession();
      
      if (!currentUser) {
        setError('Please login to view managed members');
        setLoading(false);
        return;
      }

      const allMembers = await DatabaseService.getAllMembers();
      const managed = allMembers.filter(member => 
        // Include members that are either managed by the current user
        // or approved by the current user and have management status
        member.managedBy === currentUser._id ||
        (member.approvedBy === currentUser._id && member.managementStatus === 'active')
      );

      // Sort members by most recently approved/managed first
      const sortedMembers = managed.sort((a, b) => {
        const dateA = new Date(a.managementApprovedAt || a.approvedAt || 0);
        const dateB = new Date(b.managementApprovedAt || b.approvedAt || 0);
        return dateB - dateA;
      });

      setManagedMembers(sortedMembers);
      setError('');
    } catch (err) {
      setError('Failed to load managed members');
      console.error('Load managed members error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit member
  const handleEditMember = (member) => {
    navigation.navigate('EditMember', { memberId: member._id });
  };

  // Render each member item
  const renderMemberItem = ({ item }) => (
    <View style={styles.memberCard}>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.firstName} {item.lastName}</Text>
        <Text style={styles.memberDetail}>Email: {item.email}</Text>
        {item.mobile && (
          <Text style={styles.memberDetail}>Mobile: {item.mobile}</Text>
        )}
        <Text style={styles.memberStatus}>
          Status: <Text style={styles.statusText}>{item.status}</Text>
        </Text>
        <Text style={styles.memberDetail}>
          {item.approvedBy ? 'Approved on: ' + new Date(item.approvedAt).toLocaleDateString() : ''}
        </Text>
        <Text style={styles.managementInfo}>
          {item.managedBy ? 'Managing since: ' + new Date(item.managementApprovedAt).toLocaleDateString() : ''}
        </Text>
      </View>
      
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => handleEditMember(item)}
      >
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#27ae60" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manage Others</Text>
        <Text style={styles.headerSubtitle}>
          Manage profiles for members you've added to your account
        </Text>
      </View>

      {managedMembers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            You haven't added any members to manage yet.
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.addButtonText}>+ Add New Member</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={managedMembers}
          renderItem={renderMemberItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={() => (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.addButtonText}>+ Add Another Member</Text>
            </TouchableOpacity>
          )}
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
    padding: 16,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 16,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  memberCard: {
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
  memberInfo: {
    marginBottom: 12,
  },
  memberName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  memberDetail: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  memberStatus: {
    fontSize: 14,
    marginTop: 4,
  },
  statusText: {
    color: '#27ae60',
    fontWeight: '600',
  },
  managementInfo: {
    fontSize: 14,
    color: '#3498db',
    marginTop: 4,
    fontStyle: 'italic',
  },
  editButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#27ae60',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ManageOthers;