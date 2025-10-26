import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

const MemberForm = ({ title, formData, setFormData }) => {
  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <View style={styles.formContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
      
      <View style={styles.row}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>First Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.firstName}
            onChangeText={(value) => updateField('firstName', value)}
            placeholder="Enter first name"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Last Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.lastName}
            onChangeText={(value) => updateField('lastName', value)}
            placeholder="Enter last name"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Father's Name</Text>
          <TextInput
            style={styles.input}
            value={formData.fatherName}
            onChangeText={(value) => updateField('fatherName', value)}
            placeholder="Enter father's name"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mother's Name</Text>
          <TextInput
            style={styles.input}
            value={formData.motherName}
            onChangeText={(value) => updateField('motherName', value)}
            placeholder="Enter mother's name"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Family Atak</Text>
          <TextInput
            style={styles.input}
            value={formData.familyAtak}
            onChangeText={(value) => updateField('familyAtak', value)}
            placeholder="Enter family atak"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Gaam (Village)</Text>
          <TextInput
            style={styles.input}
            value={formData.gaam}
            onChangeText={(value) => updateField('gaam', value)}
            placeholder="Enter gaam/village"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mobile Number *</Text>
          <TextInput
            style={styles.input}
            value={formData.mobileNumber}
            onChangeText={(value) => updateField('mobileNumber', value)}
            placeholder="Enter mobile number"
            keyboardType="phone-pad"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(value) => updateField('email', value)}
            placeholder="Enter email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
    color: '#1a1a1a',
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
    paddingBottom: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 15,
  },
  inputGroup: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#fafafa',
  },
});

export default MemberForm;
