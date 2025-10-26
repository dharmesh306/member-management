import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MemberList from '../components/MemberList';

const DashboardScreen = ({ navigation }) => {
  const [members, setMembers] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    lifetime: 0,
    regular: 0,
    withKids: 0,
  });

  useEffect(() => {
    checkUserRole();
    loadMembers();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [members]);

  const checkUserRole = async () => {
    try {
      const role = await AsyncStorage.getItem('userRole');
      const user = await AsyncStorage.getItem('username');
      const userId = await AsyncStorage.getItem('currentUserId');
      setIsAdmin(role === 'admin');
      setUsername(user || 'User');
      setCurrentUserId(userId);
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const loadMembers = async () => {
    try {
      // Simulate loading members from storage or API
      const storedMembers = await AsyncStorage.getItem('members');
      if (storedMembers) {
        setMembers(JSON.parse(storedMembers));
      } else {
        // Demo data
        const demoMembers = [
          {
            _id: '1',
            _rev: '1-abc',
            member: {
              firstName: 'John',
              lastName: 'Doe',
              fatherName: 'James Doe',
              motherName: 'Jane Doe',
              familyAtak: 'Doe Family',
              gaam: 'Springfield',
              mobileNumber: '555-0101',
              email: 'john.doe@example.com',
            },
            spouse: {
              firstName: 'Mary',
              lastName: 'Doe',
              fatherName: 'Michael Smith',
              motherName: 'Sarah Smith',
              familyAtak: 'Smith Family',
              gaam: 'Springfield',
              mobileNumber: '555-0102',
              email: 'mary.doe@example.com',
            },
            address: {
              street: '123 Main Street',
              city: 'Springfield',
              state: 'IL',
              zipCode: '62701',
              country: 'USA',
            },
            membership: {
              lifetimeMembership: true,
            },
            kids: [
              {
                id: 1,
                firstName: 'Alice',
                lastName: 'Doe',
                age: '8',
                gender: 'Female',
              },
              {
                id: 2,
                firstName: 'Bob',
                lastName: 'Doe',
                age: '5',
                gender: 'Male',
              },
            ],
          },
          {
            _id: '2',
            _rev: '1-def',
            member: {
              firstName: 'Robert',
              lastName: 'Smith',
              fatherName: 'Richard Smith',
              motherName: 'Rachel Smith',
              familyAtak: 'Smith Family',
              gaam: 'Oak Park',
              mobileNumber: '555-0201',
              email: 'robert.smith@example.com',
            },
            spouse: {
              firstName: 'Linda',
              lastName: 'Smith',
              fatherName: 'Larry Brown',
              motherName: 'Lucy Brown',
              familyAtak: 'Brown Family',
              gaam: 'Oak Park',
              mobileNumber: '555-0202',
              email: 'linda.smith@example.com',
            },
            address: {
              street: '456 Oak Avenue',
              city: 'Oak Park',
              state: 'IL',
              zipCode: '60302',
              country: 'USA',
            },
            membership: {
              lifetimeMembership: false,
            },
            kids: [],
          },
        ];
        setMembers(demoMembers);
        await AsyncStorage.setItem('members', JSON.stringify(demoMembers));
      }
    } catch (error) {
      console.error('Error loading members:', error);
      Alert.alert('Error', 'Failed to load members');
    }
  };

  const calculateStats = () => {
    const total = members.length;
    const lifetime = members.filter(m => m.membership.lifetimeMembership).length;
    const regular = total - lifetime;
    const withKids = members.filter(m => m.kids.length > 0).length;
    
    setStats({ total, lifetime, regular, withKids });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMembers();
    setRefreshing(false);
  };

  const handleAddMember = () => {
    navigation.navigate('AddMember');
  };

  const handleEditMember = (member) => {
    navigation.navigate('EditMember', { member });
  };

  const handleDeleteMember = async (id, rev) => {
    try {
      const updatedMembers = members.filter(m => m._id !== id);
      setMembers(updatedMembers);
      await AsyncStorage.setItem('members', JSON.stringify(updatedMembers));
      Alert.alert('Success', 'Member deleted successfully');
    } catch (error) {
      console.error('Error deleting member:', error);
      Alert.alert('Error', 'Failed to delete member');
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userRole');
            await AsyncStorage.removeItem('username');
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.username}>{username}</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.statsContainer}
        >
          <View style={[styles.statCard, styles.statCardPrimary]}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Members</Text>
          </View>
          <View style={[styles.statCard, styles.statCardSuccess]}>
            <Text style={styles.statNumber}>{stats.lifetime}</Text>
            <Text style={styles.statLabel}>Lifetime</Text>
          </View>
          <View style={[styles.statCard, styles.statCardInfo]}>
            <Text style={styles.statNumber}>{stats.regular}</Text>
            <Text style={styles.statLabel}>Regular</Text>
          </View>
          <View style={[styles.statCard, styles.statCardWarning]}>
            <Text style={styles.statNumber}>{stats.withKids}</Text>
            <Text style={styles.statLabel}>With Kids</Text>
          </View>
        </ScrollView>
      </View>

      {/* Members List */}
      <View style={styles.listContainer}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Members Directory</Text>
          {isAdmin && (
            <TouchableOpacity style={styles.addButton} onPress={handleAddMember}>
              <Text style={styles.addButtonText}>+ Add Member</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <MemberList
            members={members}
            onEdit={handleEditMember}
            onDelete={handleDeleteMember}
            onView={(member) => console.log('View member:', member)}
            isAdmin={isAdmin}
            currentUserId={currentUserId}
          />
        </ScrollView>
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
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  username: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a1a1a',
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: '#ff5252',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    paddingHorizontal: 20,
  },
  statCard: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statCardPrimary: {
    backgroundColor: '#4CAF50',
  },
  statCardSuccess: {
    backgroundColor: '#2196F3',
  },
  statCardInfo: {
    backgroundColor: '#FF9800',
  },
  statCardWarning: {
    backgroundColor: '#9C27B0',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  listContainer: {
    flex: 1,
    paddingTop: 20,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
});

export default DashboardScreen;
