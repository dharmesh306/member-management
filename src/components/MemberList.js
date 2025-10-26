import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';

const MemberList = ({ members, onEdit, onDelete, onView, isAdmin, currentUserId }) => {
  const [selectedMember, setSelectedMember] = useState(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);

  const handleView = (member) => {
    setSelectedMember(member);
    setViewModalVisible(true);
    if (onView) onView(member);
  };

  const handleDelete = (id, member) => {
    Alert.alert(
      'Delete Member',
      `Are you sure you want to delete ${member.member.firstName} ${member.member.lastName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete(id);
            setViewModalVisible(false);
          },
        },
      ]
    );
  };

  const renderMemberCard = ({ item }) => {
    const canEdit = isAdmin || item._id === currentUserId;
    
    return (
      <View style={styles.memberCard}>
        <TouchableOpacity
          style={styles.cardContent}
          onPress={() => handleView(item)}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <View style={styles.nameSection}>
              <Text style={styles.memberName}>
                👤 {item.member.firstName} {item.member.lastName}
              </Text>
              {item.member.familyAtak && (
                <Text style={styles.familyInfo}>🏛️ {item.member.familyAtak}</Text>
              )}
            </View>
            <View style={styles.badgeContainer}>
              {item.membership.lifetimeMembership ? (
                <View style={styles.lifetimeBadge}>
                  <Text style={styles.badgeText}>⭐ Lifetime</Text>
                </View>
              ) : (
                <View style={styles.regularBadge}>
                  <Text style={styles.badgeText}>Regular</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>📱 Mobile:</Text>
              <Text style={styles.infoValue}>{item.member.mobileNumber}</Text>
            </View>
            {item.member.email && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>✉️ Email:</Text>
                <Text style={styles.infoValue}>{item.member.email}</Text>
              </View>
            )}
            {item.member.gaam && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>🏘️ Village:</Text>
                <Text style={styles.infoValue}>{item.member.gaam}</Text>
              </View>
            )}
          </View>

          <View style={styles.addressSection}>
            <Text style={styles.addressLabel}>🏠 Address:</Text>
            <Text style={styles.addressText}>
              {item.address.street}, {item.address.city}, {item.address.state} {item.address.zipCode}
            </Text>
          </View>

          <View style={styles.metaInfo}>
            {item.kids && item.kids.length > 0 && (
              <View style={styles.kidsBadge}>
                <Text style={styles.badgeText}>
                  👶 {item.kids.length} {item.kids.length === 1 ? 'Child' : 'Children'}
                </Text>
              </View>
            )}
            {!isAdmin && item._id === currentUserId && (
              <View style={styles.yourRecordBadge}>
                <Text style={styles.badgeText}>✓ Your Record</Text>
              </View>
            )}
          </View>

          <View style={styles.viewIndicator}>
            <Text style={styles.viewIndicatorText}>Tap to view details →</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderDetailSection = (label, data) => (
    <View style={styles.detailSection}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.detailCard}>
        {Object.entries(data).map(([key, value]) => (
          value && (
            <Text key={key} style={styles.detailText}>
              <Text style={styles.detailLabel}>
                {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}:
              </Text>{' '}
              {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
            </Text>
          )
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={members}
        renderItem={renderMemberCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No members found</Text>
          </View>
        }
      />

      <Modal
        visible={viewModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setViewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Member Details</Text>
              <TouchableOpacity
                style={styles.closeIconButton}
                onPress={() => setViewModalVisible(false)}
              >
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedMember && (
              <ScrollView style={styles.detailsContainer}>
                {renderDetailSection('Member Information', selectedMember.member)}
                {renderDetailSection('Address', selectedMember.address)}
                {renderDetailSection('Membership', selectedMember.membership)}
                {selectedMember.kids && selectedMember.kids.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionLabel}>Children</Text>
                    {selectedMember.kids.map((kid, index) => (
                      <View key={kid.id || index} style={styles.detailCard}>
                        <Text style={styles.detailText}>
                          <Text style={styles.detailLabel}>Name:</Text>{' '}
                          {kid.firstName} {kid.lastName}
                        </Text>
                        <Text style={styles.detailText}>
                          <Text style={styles.detailLabel}>Age:</Text> {kid.age}
                        </Text>
                        {kid.gender && (
                          <Text style={styles.detailText}>
                            <Text style={styles.detailLabel}>Gender:</Text> {kid.gender}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>
            )}

            <View style={styles.modalActions}>
              {(isAdmin || selectedMember?._id === currentUserId) && (
                <>
                  <TouchableOpacity
                    style={styles.modalEditButton}
                    onPress={() => {
                      setViewModalVisible(false);
                      onEdit(selectedMember);
                    }}
                  >
                    <Text style={styles.modalButtonText}>Edit</Text>
                  </TouchableOpacity>
                  {isAdmin && (
                    <TouchableOpacity
                      style={styles.modalDeleteButton}
                      onPress={() => handleDelete(selectedMember._id, selectedMember)}
                    >
                      <Text style={styles.modalButtonText}>Delete</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setViewModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 10,
  },
  memberCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  nameSection: {
    flex: 1,
  },
  memberName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  familyInfo: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  infoSection: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    width: 100,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  addressSection: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  addressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  metaInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  lifetimeBadge: {
    backgroundColor: '#4CAF50',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  regularBadge: {
    backgroundColor: '#2196F3',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  kidsBadge: {
    backgroundColor: '#FF9800',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  yourRecordBadge: {
    backgroundColor: '#9C27B0',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  viewIndicator: {
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  viewIndicatorText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 0,
    width: '100%',
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
    backgroundColor: '#f8f9fa',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  closeIconButton: {
    padding: 4,
  },
  closeIcon: {
    fontSize: 24,
    color: '#666',
    fontWeight: '600',
  },
  detailsContainer: {
    padding: 20,
    maxHeight: '70%',
  },
  detailSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2196F3',
    marginBottom: 8,
  },
  detailCard: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
    lineHeight: 20,
  },
  detailLabel: {
    fontWeight: '600',
    color: '#666',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
  },
  modalEditButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  modalDeleteButton: {
    flex: 1,
    backgroundColor: '#F44336',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#F44336',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  modalCloseButton: {
    flex: 1,
    backgroundColor: '#95a5a6',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default MemberList;
