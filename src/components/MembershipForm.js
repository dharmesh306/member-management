import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const MembershipForm = ({ title, formData, setFormData }) => {
  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <View style={styles.formContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
      
      <View style={styles.membershipContent}>
        <Text style={styles.questionText}>Lifetime Membership *</Text>
        <Text style={styles.questionSubtext}>
          Select whether this is a lifetime membership
        </Text>
        
        <View style={styles.toggleButtons}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              formData.lifetimeMembership === true && styles.toggleButtonActive,
            ]}
            onPress={() => updateField('lifetimeMembership', true)}
          >
            <View style={styles.radioOuter}>
              {formData.lifetimeMembership === true && (
                <View style={styles.radioInner} />
              )}
            </View>
            <Text
              style={[
                styles.toggleButtonText,
                formData.lifetimeMembership === true && styles.toggleButtonTextActive,
              ]}
            >
              Yes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleButton,
              formData.lifetimeMembership === false && styles.toggleButtonActive,
            ]}
            onPress={() => updateField('lifetimeMembership', false)}
          >
            <View style={styles.radioOuter}>
              {formData.lifetimeMembership === false && (
                <View style={styles.radioInner} />
              )}
            </View>
            <Text
              style={[
                styles.toggleButtonText,
                formData.lifetimeMembership === false && styles.toggleButtonTextActive,
              ]}
            >
              No
            </Text>
          </TouchableOpacity>
        </View>

        {formData.lifetimeMembership !== null && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {formData.lifetimeMembership
                ? '✓ Lifetime Member'
                : '○ Regular Member'}
            </Text>
          </View>
        )}
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
  membershipContent: {
    paddingVertical: 10,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  questionSubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  toggleButtons: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    gap: 12,
  },
  toggleButtonActive: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196F3',
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2196F3',
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  toggleButtonTextActive: {
    color: '#2196F3',
  },
  statusBadge: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  statusText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
});

export default MembershipForm;
