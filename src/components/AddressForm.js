import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

const AddressForm = ({ title, formData, setFormData }) => {
  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <View style={styles.formContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
      
      <View style={styles.inputGroupFull}>
        <Text style={styles.label}>Street Address *</Text>
        <TextInput
          style={styles.input}
          value={formData.street}
          onChangeText={(value) => updateField('street', value)}
          placeholder="Enter street address"
        />
      </View>

      <View style={styles.row}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>City *</Text>
          <TextInput
            style={styles.input}
            value={formData.city}
            onChangeText={(value) => updateField('city', value)}
            placeholder="Enter city"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>State/Province *</Text>
          <TextInput
            style={styles.input}
            value={formData.state}
            onChangeText={(value) => updateField('state', value)}
            placeholder="Enter state/province"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>ZIP/Postal Code *</Text>
          <TextInput
            style={styles.input}
            value={formData.zipCode}
            onChangeText={(value) => updateField('zipCode', value)}
            placeholder="Enter ZIP/postal code"
            keyboardType="numeric"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Country *</Text>
          <TextInput
            style={styles.input}
            value={formData.country}
            onChangeText={(value) => updateField('country', value)}
            placeholder="Enter country"
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
  inputGroupFull: {
    marginBottom: 15,
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

export default AddressForm;
