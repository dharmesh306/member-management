import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { createEmptyChild, validateMember } from '../models/MemberModel';
import DatabaseService from '../services/DatabaseService';

// USA States
const USA_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
  'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri',
  'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
  'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island',
  'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia',
  'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
];

// Canadian Provinces and Territories
const CANADA_PROVINCES = [
  'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador',
  'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island',
  'Quebec', 'Saskatchewan', 'Yukon'
];

const MemberForm = ({ initialData, onSubmit, onCancel, renderExtraFields }) => {
  const [member, setMember] = useState(() => {
    const defaultMember = {
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
    };
    
    // If initialData exists, merge it with defaults while preserving _id, _rev, type, etc.
    if (initialData) {
      return {
        ...defaultMember,
        ...initialData,
        spouse: {
          ...defaultMember.spouse,
          ...(initialData.spouse || {}),
        },
        address: {
          ...defaultMember.address,
          ...(initialData.address || {}),
        },
        children: initialData.children || [],
      };
    }
    
    return defaultMember;
  });

  const [errors, setErrors] = useState({});
  const [showSpouse, setShowSpouse] = useState(
    initialData?.spouse?.firstName ? true : false
  );
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [checkingMobile, setCheckingMobile] = useState(false);
  const [checkingSpouseEmail, setCheckingSpouseEmail] = useState(false);
  const [checkingSpouseMobile, setCheckingSpouseMobile] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  // Debounce timer refs
  const emailTimeoutRef = React.useRef(null);
  const mobileTimeoutRef = React.useRef(null);
  const spouseEmailTimeoutRef = React.useRef(null);
  const spouseMobileTimeoutRef = React.useRef(null);

  // Check for duplicate email
  const checkEmailDuplicate = useCallback(async (email) => {
    if (!email || email.length < 3) return;
    
    try {
      setCheckingEmail(true);
      const result = await DatabaseService.checkDuplicateMember(
        email,
        null,
        initialData?._id
      );
      
      if (result.emailExists) {
        setErrors(prev => ({
          ...prev,
          email: '❌ This email is already registered'
        }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          if (newErrors.email === '❌ This email is already registered') {
            delete newErrors.email;
          }
          return newErrors;
        });
      }
    } catch (error) {
      console.error('Error checking email:', error);
    } finally {
      setCheckingEmail(false);
    }
  }, [initialData]);

  // Check for duplicate mobile
  const checkMobileDuplicate = useCallback(async (mobile) => {
    if (!mobile || mobile.length < 10) return;
    
    try {
      setCheckingMobile(true);
      const result = await DatabaseService.checkDuplicateMember(
        null,
        mobile,
        initialData?._id
      );
      
      if (result.mobileExists) {
        setErrors(prev => ({
          ...prev,
          mobile: '❌ This mobile number is already registered'
        }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          if (newErrors.mobile === '❌ This mobile number is already registered') {
            delete newErrors.mobile;
          }
          return newErrors;
        });
      }
    } catch (error) {
      console.error('Error checking mobile:', error);
    } finally {
      setCheckingMobile(false);
    }
  }, [initialData]);

  // Check for duplicate spouse email
  const checkSpouseEmailDuplicate = useCallback(async (email) => {
    if (!email || email.length < 3) return;
    
    try {
      setCheckingSpouseEmail(true);
      const result = await DatabaseService.checkDuplicateMember(
        email,
        null,
        initialData?._id
      );
      
      if (result.emailExists) {
        setErrors(prev => ({
          ...prev,
          spouse: {
            ...(prev.spouse || {}),
            email: '❌ This email is already registered'
          }
        }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          if (newErrors.spouse?.email === '❌ This email is already registered') {
            delete newErrors.spouse.email;
            if (Object.keys(newErrors.spouse).length === 0) {
              delete newErrors.spouse;
            }
          }
          return newErrors;
        });
      }
    } catch (error) {
      console.error('Error checking spouse email:', error);
    } finally {
      setCheckingSpouseEmail(false);
    }
  }, [initialData]);

  // Check for duplicate spouse mobile
  const checkSpouseMobileDuplicate = useCallback(async (mobile) => {
    if (!mobile || mobile.length < 10) return;
    
    try {
      setCheckingSpouseMobile(true);
      const result = await DatabaseService.checkDuplicateMember(
        null,
        mobile,
        initialData?._id
      );
      
      if (result.mobileExists) {
        setErrors(prev => ({
          ...prev,
          spouse: {
            ...(prev.spouse || {}),
            mobile: '❌ This mobile number is already registered'
          }
        }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          if (newErrors.spouse?.mobile === '❌ This mobile number is already registered') {
            delete newErrors.spouse.mobile;
            if (Object.keys(newErrors.spouse).length === 0) {
              delete newErrors.spouse;
            }
          }
          return newErrors;
        });
      }
    } catch (error) {
      console.error('Error checking spouse mobile:', error);
    } finally {
      setCheckingSpouseMobile(false);
    }
  }, [initialData]);

  const handleInputChange = (field, value) => {
    setMember(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear validation error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        if (!newErrors[field]?.startsWith('❌')) {
          delete newErrors[field];
        }
        return newErrors;
      });
    }

    // Debounced duplicate check for email
    if (field === 'email') {
      if (emailTimeoutRef.current) {
        clearTimeout(emailTimeoutRef.current);
      }
      emailTimeoutRef.current = setTimeout(() => {
        checkEmailDuplicate(value);
      }, 800);
    }

    // Debounced duplicate check for mobile
    if (field === 'mobile') {
      if (mobileTimeoutRef.current) {
        clearTimeout(mobileTimeoutRef.current);
      }
      mobileTimeoutRef.current = setTimeout(() => {
        checkMobileDuplicate(value);
      }, 800);
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
    
    // Clear validation error for this field
    if (errors.spouse?.[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        if (newErrors.spouse) {
          if (!newErrors.spouse[field]?.startsWith('❌')) {
            delete newErrors.spouse[field];
          }
          if (Object.keys(newErrors.spouse).length === 0) {
            delete newErrors.spouse;
          }
        }
        return newErrors;
      });
    }

    // Debounced duplicate check for spouse email
    if (field === 'email') {
      if (spouseEmailTimeoutRef.current) {
        clearTimeout(spouseEmailTimeoutRef.current);
      }
      spouseEmailTimeoutRef.current = setTimeout(() => {
        checkSpouseEmailDuplicate(value);
      }, 800);
    }

    // Debounced duplicate check for spouse mobile
    if (field === 'mobile') {
      if (spouseMobileTimeoutRef.current) {
        clearTimeout(spouseMobileTimeoutRef.current);
      }
      spouseMobileTimeoutRef.current = setTimeout(() => {
        checkSpouseMobileDuplicate(value);
      }, 800);
    }
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (emailTimeoutRef.current) clearTimeout(emailTimeoutRef.current);
      if (mobileTimeoutRef.current) clearTimeout(mobileTimeoutRef.current);
      if (spouseEmailTimeoutRef.current) clearTimeout(spouseEmailTimeoutRef.current);
      if (spouseMobileTimeoutRef.current) clearTimeout(spouseMobileTimeoutRef.current);
    };
  }, []);

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

    console.log('MemberForm submitting data:', {
      _id: member._id,
      _rev: member._rev,
      type: member.type,
      email: member.email,
      firstName: member.firstName,
      hasSpouse: !!member.spouse?.firstName,
      childrenCount: member.children?.length || 0
    });

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
            <View style={styles.inputWithIndicator}>
              <TextInput
                style={[styles.input, errors.email && styles.inputError, checkingEmail && styles.inputChecking]}
                value={member.email}
                onChangeText={(value) => handleInputChange('email', value)}
                placeholder="Enter email"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#999"
              />
              {checkingEmail && (
                <ActivityIndicator 
                  size="small" 
                  color="#3498db" 
                  style={styles.inputIndicator}
                />
              )}
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Mobile *</Text>
            <View style={styles.inputWithIndicator}>
              <TextInput
                style={[styles.input, errors.mobile && styles.inputError, checkingMobile && styles.inputChecking]}
                value={member.mobile}
                onChangeText={(value) => handleInputChange('mobile', value)}
                placeholder="Enter mobile number"
                keyboardType="phone-pad"
                placeholderTextColor="#999"
              />
              {checkingMobile && (
                <ActivityIndicator 
                  size="small" 
                  color="#3498db" 
                  style={styles.inputIndicator}
                />
              )}
            </View>
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
                <View style={styles.inputWithIndicator}>
                  <TextInput
                    style={[styles.input, errors.spouse?.email && styles.inputError, checkingSpouseEmail && styles.inputChecking]}
                    value={member.spouse.email}
                    onChangeText={(value) => handleSpouseChange('email', value)}
                    placeholder="Enter email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor="#999"
                  />
                  {checkingSpouseEmail && (
                    <ActivityIndicator 
                      size="small" 
                      color="#3498db" 
                      style={styles.inputIndicator}
                    />
                  )}
                </View>
                {errors.spouse?.email && (
                  <Text style={styles.errorText}>{errors.spouse.email}</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Mobile</Text>
                <View style={styles.inputWithIndicator}>
                  <TextInput
                    style={[styles.input, errors.spouse?.mobile && styles.inputError, checkingSpouseMobile && styles.inputChecking]}
                    value={member.spouse.mobile}
                    onChangeText={(value) => handleSpouseChange('mobile', value)}
                    placeholder="Enter mobile number"
                    keyboardType="phone-pad"
                    placeholderTextColor="#999"
                  />
                  {checkingSpouseMobile && (
                    <ActivityIndicator 
                      size="small" 
                      color="#3498db" 
                      style={styles.inputIndicator}
                    />
                  )}
                </View>
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
            <Text style={styles.label}>State/Province *</Text>
            {(member.address.country === 'USA' || member.address.country === 'Canada') ? (
              <TouchableOpacity
                style={[styles.input, styles.dropdownButton, errors.address?.state && styles.inputError]}
                onPress={() => setShowStateDropdown(true)}
              >
                <Text style={member.address.state ? styles.dropdownText : styles.dropdownPlaceholder}>
                  {member.address.state || `Select ${member.address.country === 'USA' ? 'state' : 'province'}`}
                </Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </TouchableOpacity>
            ) : (
              <TextInput
                style={[styles.input, errors.address?.state && styles.inputError]}
                value={member.address.state}
                onChangeText={(value) => handleAddressChange('state', value)}
                placeholder="Enter state/province"
                placeholderTextColor="#999"
              />
            )}
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
            <Text style={styles.label}>Country *</Text>
            <TouchableOpacity
              style={[styles.input, styles.dropdownButton]}
              onPress={() => setShowCountryDropdown(true)}
            >
              <Text style={member.address.country ? styles.dropdownText : styles.dropdownPlaceholder}>
                {member.address.country || 'Select country'}
              </Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>
            {errors.address?.country && (
              <Text style={styles.errorText}>{errors.address.country}</Text>
            )}
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

      {/* Extra Fields (e.g., Password fields for registration) */}
      {renderExtraFields && renderExtraFields()}

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

      {/* Country Dropdown Modal */}
      <Modal
        visible={showCountryDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCountryDropdown(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCountryDropdown(false)}
        >
          <View style={styles.dropdownModal}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>Select Country</Text>
              <TouchableOpacity onPress={() => setShowCountryDropdown(false)}>
                <Text style={styles.dropdownClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.dropdownList}>
              {['USA', 'Canada'].map((country) => (
                <TouchableOpacity
                  key={country}
                  style={[
                    styles.dropdownItem,
                    member.address.country === country && styles.dropdownItemSelected
                  ]}
                  onPress={() => {
                    handleAddressChange('country', country);
                    // Reset state when country changes
                    if (member.address.country !== country) {
                      handleAddressChange('state', '');
                    }
                    setShowCountryDropdown(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    member.address.country === country && styles.dropdownItemTextSelected
                  ]}>
                    {country}
                  </Text>
                  {member.address.country === country && (
                    <Text style={styles.dropdownCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* State/Province Dropdown Modal */}
      <Modal
        visible={showStateDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStateDropdown(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowStateDropdown(false)}
        >
          <View style={styles.dropdownModal}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>
                Select {member.address.country === 'USA' ? 'State' : 'Province'}
              </Text>
              <TouchableOpacity onPress={() => setShowStateDropdown(false)}>
                <Text style={styles.dropdownClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.dropdownList}>
              {(member.address.country === 'USA' ? USA_STATES : CANADA_PROVINCES).map((state) => (
                <TouchableOpacity
                  key={state}
                  style={[
                    styles.dropdownItem,
                    member.address.state === state && styles.dropdownItemSelected
                  ]}
                  onPress={() => {
                    handleAddressChange('state', state);
                    setShowStateDropdown(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    member.address.state === state && styles.dropdownItemTextSelected
                  ]}>
                    {state}
                  </Text>
                  {member.address.state === state && (
                    <Text style={styles.dropdownCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
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
  inputWithIndicator: {
    position: 'relative',
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
  inputChecking: {
    borderColor: '#3498db',
  },
  inputIndicator: {
    position: 'absolute',
    right: 12,
    top: Platform.OS === 'web' ? 12 : 10,
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
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 12,
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '85%',
    maxHeight: '70%',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
      },
    }),
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  dropdownClose: {
    fontSize: 24,
    color: '#666',
    padding: 4,
  },
  dropdownList: {
    maxHeight: 400,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemSelected: {
    backgroundColor: '#e3f2fd',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownItemTextSelected: {
    color: '#3498db',
    fontWeight: '600',
  },
  dropdownCheck: {
    fontSize: 20,
    color: '#3498db',
    fontWeight: 'bold',
  },
});

export default MemberForm;
