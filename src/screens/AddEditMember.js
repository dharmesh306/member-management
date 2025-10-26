import React, { useState } from 'react';
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

const AddEditMember = ({ route, navigation }) => {
  const { member } = route?.params || {};
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (memberData) => {
    try {
      setLoading(true);

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
        // Update existing member
        await DatabaseService.updateMember(member._id, memberData);
        Alert.alert('Success', 'Member updated successfully', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        // Create new member
        await DatabaseService.createMember(memberData);
        Alert.alert('Success', 'Member created successfully', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
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
