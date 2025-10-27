import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import MemberForm from '../components/MemberForm';
import DatabaseService from '../services/DatabaseService';
import AuthService from '../services/AuthService';
import { canEditMember, canCreateMember } from '../utils/authorization';

const AddEditMember = ({ route, navigation }) => {
  const { member } = route?.params || {};
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = await AuthService.getCurrentSession();
      setCurrentUser(user);

      // Check permissions
      if (member?._id) {
        // Editing existing member - check edit permission
        if (!canEditMember(user, member._id)) {
          Alert.alert(
            'Permission Denied',
            'You do not have permission to edit this member record.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        }
      } else {
        // Creating new member - check create permission
        if (!canCreateMember(user)) {
          Alert.alert(
            'Permission Denied',
            'You do not have permission to create new member records. Only admins can add members.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
      Alert.alert('Error', 'Failed to verify permissions', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    }
  };

  const handleSubmit = async (memberData) => {
    try {
      setLoading(true);

      // Double-check permissions before saving
      if (member?._id) {
        // Allow if user is admin OR if user is editing their own profile
        const isAdmin = currentUser?.isAdmin === true;
        const isOwnProfile = currentUser?._id === member._id;
        
        if (!isAdmin && !isOwnProfile) {
          Alert.alert('Permission Denied', 'You do not have permission to edit this member.');
          setLoading(false);
          return;
        }
      } else {
        if (!canCreateMember(currentUser)) {
          Alert.alert('Permission Denied', 'You do not have permission to create members.');
          setLoading(false);
          return;
        }
      }

      // Check for duplicate email/mobile before saving
      const duplicateCheck = await DatabaseService.checkDuplicateMember(
        memberData.email,
        memberData.mobile,
        member?._id // Exclude current member if editing
      );

      if (duplicateCheck.exists) {
        let errorMessage = 'Member already exists with ';
        const issues = [];
        
        if (duplicateCheck.emailExists) {
          issues.push('this email');
        }
        if (duplicateCheck.mobileExists) {
          issues.push('this mobile number');
        }
        
        errorMessage += issues.join(' and ');
        errorMessage += '. Please use different contact information.';
        
        Alert.alert('Duplicate Member', errorMessage);
        setLoading(false);
        return;
      }

      if (member?._id) {
        // Update existing member - pass currentUser for permission check
        console.log('Updating member:', {
          memberId: member._id,
          currentUserId: currentUser?._id,
          isAdmin: currentUser?.isAdmin
        });
        
        await DatabaseService.updateMember(member._id, memberData, currentUser);
        
        console.log('Member updated successfully');
        
        // Platform-specific success handling
        if (Platform.OS === 'web') {
          window.confirm('Member updated successfully');
          navigation.goBack();
        } else {
          Alert.alert('Success', 'Member updated successfully', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        }
      } else {
        // Create new member
        await DatabaseService.createMember(memberData);
        
        // Platform-specific success handling
        if (Platform.OS === 'web') {
          window.confirm('Member created successfully');
          navigation.goBack();
        } else {
          Alert.alert('Success', 'Member created successfully', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        }
      }
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Error', `Failed to ${member?._id ? 'update' : 'create'} member: ${error.message}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {member?._id ? 'Edit Member' : 'Add New Member'}
        </Text>
      </View>
      <MemberForm
        initialData={member}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
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
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default AddEditMember;
