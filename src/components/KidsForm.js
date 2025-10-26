import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';

const KidsForm = ({ title, kidsData, setKidsData }) => {
  const addKid = () => {
    setKidsData([
      ...kidsData,
      {
        id: Date.now(),
        firstName: '',
        lastName: '',
        age: '',
        gender: '',
      },
    ]);
  };

  const removeKid = (id) => {
    setKidsData(kidsData.filter((kid) => kid.id !== id));
  };

  const updateKid = (id, field, value) => {
    setKidsData(
      kidsData.map((kid) =>
        kid.id === id ? { ...kid, [field]: value } : kid
      )
    );
  };

  return (
    <View style={styles.formContainer}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <TouchableOpacity style={styles.addButton} onPress={addKid}>
          <Text style={styles.addButtonText}>+ Add Child</Text>
        </TouchableOpacity>
      </View>

      {kidsData.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No children added yet</Text>
          <Text style={styles.emptyStateSubtext}>Click "Add Child" to add a child</Text>
        </View>
      ) : (
        kidsData.map((kid, index) => (
          <View key={kid.id} style={styles.kidCard}>
            <View style={styles.kidHeader}>
              <Text style={styles.kidTitle}>Child {index + 1}</Text>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeKid(kid.id)}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>First Name *</Text>
                <TextInput
                  style={styles.input}
                  value={kid.firstName}
                  onChangeText={(value) => updateKid(kid.id, 'firstName', value)}
                  placeholder="Enter first name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Last Name *</Text>
                <TextInput
                  style={styles.input}
                  value={kid.lastName}
                  onChangeText={(value) => updateKid(kid.id, 'lastName', value)}
                  placeholder="Enter last name"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Age *</Text>
                <TextInput
                  style={styles.input}
                  value={kid.age}
                  onChangeText={(value) => updateKid(kid.id, 'age', value)}
                  placeholder="Enter age"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Gender</Text>
                <TextInput
                  style={styles.input}
                  value={kid.gender}
                  onChangeText={(value) => updateKid(kid.id, 'gender', value)}
                  placeholder="Enter gender"
                />
              </View>
            </View>
          </View>
        ))
      )}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
    paddingBottom: 10,
    flex: 1,
  },
  addButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 10,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
  },
  kidCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  kidHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  kidTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
  },
  removeButton: {
    backgroundColor: '#ff5252',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
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
    backgroundColor: '#fff',
  },
});

export default KidsForm;
