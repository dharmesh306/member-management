import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { createEmptyChild, validateMember } from '../models/MemberModel';

const MemberForm = ({ initialData, onSubmit, onCancel }) => {
  const [member, setMember] = useState(initialData || {
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    spouse: {
      firstName: '',
      lastName: '',
      email: '',
      mobile: '',
    },
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    },
    children: [],
  });

  const [errors, setErrors] = useState({});
  const [showSpouse, setShowSpouse] = useState(
    initialData?.spouse?.firstName ? true : false
  );

  const handleInputChange = (field, value) => {
    setMember(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSpouseChange = (field, value) => {
    setMember(prev => ({
      ...prev,
      spouse: {
        ...prev.spouse,
        [field]: value,
      },
    }));
    // Clear error for this field
    if (errors.spouse?.[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        if (newErrors.spouse) {
          delete newErrors.spouse[field];
          if (Object.keys(newErrors.spouse).length === 0) {
            delete newErrors.spouse;
          }
        }
        return newErrors;
      });
    }
  };

  const handleAddressChange = (field, value) => {
    setMember(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value,
      },
    }));
    // Clear error for this field
    if (errors.address?.[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        if (newErrors.address) {
          delete newErrors.address[field];
          if (Object.keys(newErrors.address).length === 0) {
            delete newErrors.address;
          }
        }
        return newErrors;
      });
    }
  };

  const handleAddChild = () => {
    setMember(prev => ({
      ...prev,
      children: [...prev.children, createEmptyChild()],
    }));
  };

  const handleRemoveChild = (index) => {
    setMember(prev => ({
      ...prev,
      children: prev.children.filter((_, i) => i !== index),
    }));
  };

  const handleChildChange = (index, field, value) => {
    setMember(prev => ({
      ...prev,
      children: prev.children.map((child, i) =>
        i === index ? { ...child, [field]: value } : child
      ),
    }));
    // Clear error for this field
    if (errors.children?.[index]?.[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        if (newErrors.children?.[index]) {
          delete newErrors.children[index][field];
          if (Object.keys(newErrors.children[index]).length === 0) {
            newErrors.children[index] = null;
          }
        }
        return newErrors;
      });
    }
  };

  const handleSubmit = () => {
    const validation = validateMember(member);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      Alert.alert('Validation Error', 'Please fix the errors in the form');
      return;
    }

    onSubmit(member);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Member Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Member Information</Text>
        
        <View style={styles.row}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>First Name *</Text>
            <TextInput
              style={[styles.input, errors.firstName && styles.inputError]}
              value={member.firstName}
              onChangeText={(value) => handleInputChange('firstName', value)}
              placeholder="Enter first name"
              placeholderTextColor="#999"
            />
            {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Last Name *</Text>
            <TextInput
              style={[styles.input, errors.lastName && styles.inputError]}
              value={member.lastName}
              onChangeText={(value) => handleInputChange('lastName', value)}
              placeholder="Enter last name"
              placeholderTextColor="#999"
            />
            {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              value={member.email}
              onChangeText={(value) => handleInputChange('email', value)}
              placeholder="Enter email"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#999"
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Mobile *</Text>
            <TextInput
              style={[styles.input, errors.mobile && styles.inputError]}
              value={member.mobile}
              onChangeText={(value) => handleInputChange('mobile', value)}
              placeholder="Enter mobile number"
              keyboardType="phone-pad"
              placeholderTextColor="#999"
            />
            {errors.mobile && <Text style={styles.errorText}>{errors.mobile}</Text>}
          </View>
        </View>
      </View>

      {/* Spouse Information */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Spouse Information</Text>
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setShowSpouse(!showSpouse)}
          >
            <Text style={styles.toggleButtonText}>
              {showSpouse ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
        </View>

        {showSpouse && (
          <>
            <View style={styles.row}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>First Name</Text>
                <TextInput
                  style={[styles.input, errors.spouse?.firstName && styles.inputError]}
                  value={member.spouse.firstName}
                  onChangeText={(value) => handleSpouseChange('firstName', value)}
                  placeholder="Enter first name"
                  placeholderTextColor="#999"
                />
                {errors.spouse?.firstName && (
                  <Text style={styles.errorText}>{errors.spouse.firstName}</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  style={[styles.input, errors.spouse?.lastName && styles.inputError]}
                  value={member.spouse.lastName}
                  onChangeText={(value) => handleSpouseChange('lastName', value)}
                  placeholder="Enter last name"
                  placeholderTextColor="#999"
                />
                {errors.spouse?.lastName && (
                  <Text style={styles.errorText}>{errors.spouse.lastName}</Text>
                )}
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[styles.input, errors.spouse?.email && styles.inputError]}
                  value={member.spouse.email}
                  onChangeText={(value) => handleSpouseChange('email', value)}
                  placeholder="Enter email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#999"
                />
                {errors.spouse?.email && (
                  <Text style={styles.errorText}>{errors.spouse.email}</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Mobile</Text>
                <TextInput
                  style={[styles.input, errors.spouse?.mobile && styles.inputError]}
                  value={member.spouse.mobile}
                  onChangeText={(value) => handleSpouseChange('mobile', value)}
                  placeholder="Enter mobile number"
                  keyboardType="phone-pad"
                  placeholderTextColor="#999"
                />
                {errors.spouse?.mobile && (
                  <Text style={styles.errorText}>{errors.spouse.mobile}</Text>
                )}
              </View>
            </View>
          </>
        )}
      </View>

      {/* Address Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Address</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Street *</Text>
          <TextInput
            style={[styles.input, errors.address?.street && styles.inputError]}
            value={member.address.street}
            onChangeText={(value) => handleAddressChange('street', value)}
            placeholder="Enter street address"
            placeholderTextColor="#999"
          />
          {errors.address?.street && (
            <Text style={styles.errorText}>{errors.address.street}</Text>
          )}
        </View>

        <View style={styles.row}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>City *</Text>
            <TextInput
              style={[styles.input, errors.address?.city && styles.inputError]}
              value={member.address.city}
              onChangeText={(value) => handleAddressChange('city', value)}
              placeholder="Enter city"
              placeholderTextColor="#999"
            />
            {errors.address?.city && (
              <Text style={styles.errorText}>{errors.address.city}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>State *</Text>
            <TextInput
              style={[styles.input, errors.address?.state && styles.inputError]}
              value={member.address.state}
              onChangeText={(value) => handleAddressChange('state', value)}
              placeholder="Enter state"
              placeholderTextColor="#999"
            />
            {errors.address?.state && (
              <Text style={styles.errorText}>{errors.address.state}</Text>
            )}
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Zip Code *</Text>
            <TextInput
              style={[styles.input, errors.address?.zipCode && styles.inputError]}
              value={member.address.zipCode}
              onChangeText={(value) => handleAddressChange('zipCode', value)}
              placeholder="Enter zip code"
              placeholderTextColor="#999"
            />
            {errors.address?.zipCode && (
              <Text style={styles.errorText}>{errors.address.zipCode}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Country</Text>
            <TextInput
              style={styles.input}
              value={member.address.country}
              onChangeText={(value) => handleAddressChange('country', value)}
              placeholder="Enter country"
              placeholderTextColor="#999"
            />
          </View>
        </View>
      </View>

      {/* Children Information */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Children</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddChild}
          >
            <Text style={styles.addButtonText}>+ Add Child</Text>
          </TouchableOpacity>
        </View>

        {member.children.map((child, index) => (
          <View key={child.id} style={styles.childContainer}>
            <View style={styles.childHeader}>
              <Text style={styles.childTitle}>Child {index + 1}</Text>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveChild(index)}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.row}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>First Name</Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.children?.[index]?.firstName && styles.inputError,
                  ]}
                  value={child.firstName}
                  onChangeText={(value) => handleChildChange(index, 'firstName', value)}
                  placeholder="Enter first name"
                  placeholderTextColor="#999"
                />
                {errors.children?.[index]?.firstName && (
                  <Text style={styles.errorText}>
                    {errors.children[index].firstName}
                  </Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.children?.[index]?.lastName && styles.inputError,
                  ]}
                  value={child.lastName}
                  onChangeText={(value) => handleChildChange(index, 'lastName', value)}
                  placeholder="Enter last name"
                  placeholderTextColor="#999"
                />
                {errors.children?.[index]?.lastName && (
                  <Text style={styles.errorText}>
                    {errors.children[index].lastName}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Date of Birth</Text>
                <TextInput
                  style={styles.input}
                  value={child.dateOfBirth}
                  onChangeText={(value) => handleChildChange(index, 'dateOfBirth', value)}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Gender</Text>
                <TextInput
                  style={styles.input}
                  value={child.gender}
                  onChangeText={(value) => handleChildChange(index, 'gender', value)}
                  placeholder="Male/Female/Other"
                  placeholderTextColor="#999"
                />
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.submitButton]}
          onPress={handleSubmit}
        >
          <Text style={styles.submitButtonText}>
            {initialData?._id ? 'Update' : 'Create'} Member
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  row: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 12,
    marginBottom: 12,
  },
  inputContainer: {
    flex: 1,
    minWidth: Platform.OS === 'web' ? 200 : undefined,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    color: '#333',
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 4,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#3498db',
    borderRadius: 4,
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#27ae60',
    borderRadius: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  childContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  childHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  childTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
  },
  removeButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#e74c3c',
    borderRadius: 4,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 32,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#3498db',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MemberForm;
