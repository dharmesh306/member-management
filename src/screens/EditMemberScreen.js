import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MemberForm from '../components/MemberForm';
import AddressForm from '../components/AddressForm';
import MembershipForm from '../components/MembershipForm';
import KidsForm from '../components/KidsForm';

const EditMemberScreen = ({ route, navigation }) => {
  const { member } = route.params;

  const [memberData, setMemberData] = useState(member.member || {});
  const [spouseData, setSpouseData] = useState(member.spouse || {});
  const [addressData, setAddressData] = useState(member.address || {});
  const [membershipData, setMembershipData] = useState(member.membership || {});
  const [kidsData, setKidsData] = useState(member.kids || []);

  const validateForm = () => {
    // Validate member
    if (!memberData.firstName.trim() || !memberData.lastName.trim() || !memberData.mobileNumber.trim()) {
      Alert.alert('Validation Error', 'Please fill in all required member fields (First Name, Last Name, Mobile Number)');
      return false;
    }

    // Validate spouse
    if (!spouseData.firstName.trim() || !spouseData.lastName.trim() || !spouseData.mobileNumber.trim()) {
      Alert.alert('Validation Error', 'Please fill in all required spouse fields (First Name, Last Name, Mobile Number)');
      return false;
    }

    // Validate address
    if (!addressData.street.trim() || !addressData.city.trim() || 
        !addressData.state.trim() || !addressData.zipCode.trim() || !addressData.country.trim()) {
      Alert.alert('Validation Error', 'Please fill in all required address fields');
      return false;
    }

    // Validate membership
    if (membershipData.lifetimeMembership === null) {
      Alert.alert('Validation Error', 'Please select membership type');
      return false;
    }

    // Validate kids if any
    for (let i = 0; i < kidsData.length; i++) {
      const kid = kidsData[i];
      if (!kid.firstName.trim() || !kid.lastName.trim() || !kid.age.trim()) {
        Alert.alert('Validation Error', `Please fill in all required fields for Child ${i + 1}`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // Create updated member object
      const updatedMember = {
        ...member,
        member: memberData,
        spouse: spouseData,
        address: addressData,
        membership: membershipData,
        kids: kidsData,
        updatedAt: new Date().toISOString(),
      };

      // Load existing members
      const storedMembers = await AsyncStorage.getItem('members');
      const members = storedMembers ? JSON.parse(storedMembers) : [];

      // Find and update the member
      const memberIndex = members.findIndex(m => m._id === member._id);
      if (memberIndex !== -1) {
        members[memberIndex] = updatedMember;
      }

      // Save back to storage
      await AsyncStorage.setItem('members', JSON.stringify(members));

      Alert.alert('Success', 'Member updated successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error updating member:', error);
      Alert.alert('Error', 'Failed to update member. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Member</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <MemberForm
            title="Member Information"
            formData={memberData}
            setFormData={setMemberData}
          />

          <MemberForm
            title="Spouse Information"
            formData={spouseData}
            setFormData={setSpouseData}
          />

          <AddressForm
            title="Address Information"
            formData={addressData}
            setFormData={setAddressData}
          />

          <MembershipForm
            title="Membership Details"
            formData={membershipData}
            setFormData={setMembershipData}
          />

          <KidsForm
            title="Children Information (Optional)"
            kidsData={kidsData}
            setKidsData={setKidsData}
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>Update Member</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 40,
    gap: 12,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  cancelButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default EditMemberScreen;
