import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';

const Statistics = ({ members, onBack }) => {
  // Calculate statistics
  const statistics = useMemo(() => {
    const stats = {
      totalMembers: members.length,
      membersCount: 0,
      spousesCount: 0,
      kidsCount: 0,
      adminsCount: 0,
      byState: {},
      byCountry: {},
      byCity: {},
      avgAge: 0,
      maleCount: 0,
      femaleCount: 0,
    };

    let totalAge = 0;
    let ageCount = 0;

    members.forEach(member => {
      // Count members
      stats.membersCount++;
      
      // Count admins
      if (member.isAdmin) {
        stats.adminsCount++;
      }

      // Count spouses
      if (member.spouse) {
        stats.spousesCount++;
      }

      // Count children
      if (member.children && Array.isArray(member.children)) {
        stats.kidsCount += member.children.length;
      }

      // Calculate age if dateOfBirth exists
      if (member.dateOfBirth) {
        const birthDate = new Date(member.dateOfBirth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        totalAge += age;
        ageCount++;
      }

      // Group by location
      if (member.address) {
        const state = member.address.state || 'Unknown';
        const country = member.address.country || 'Unknown';
        const city = member.address.city || 'Unknown';

        stats.byState[state] = (stats.byState[state] || 0) + 1;
        stats.byCountry[country] = (stats.byCountry[country] || 0) + 1;
        stats.byCity[city] = (stats.byCity[city] || 0) + 1;
      }

      // Count gender (if available)
      if (member.gender) {
        if (member.gender.toLowerCase() === 'male' || member.gender.toLowerCase() === 'm') {
          stats.maleCount++;
        } else if (member.gender.toLowerCase() === 'female' || member.gender.toLowerCase() === 'f') {
          stats.femaleCount++;
        }
      }
    });

    // Calculate average age
    if (ageCount > 0) {
      stats.avgAge = Math.round(totalAge / ageCount);
    }

    // Convert to arrays and sort
    stats.byStateArray = Object.entries(stats.byState)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10

    stats.byCountryArray = Object.entries(stats.byCountry)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    stats.byCityArray = Object.entries(stats.byCity)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10

    return stats;
  }, [members]);

  const totalPeople = statistics.totalMembers + statistics.spousesCount + statistics.kidsCount;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📊 Member Statistics</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Summary Cards Grid */}
        <View style={styles.cardsGrid}>
          <View style={[styles.card, styles.primaryCard]}>
            <Text style={styles.cardIcon}>👥</Text>
            <Text style={styles.cardValue}>{statistics.totalMembers}</Text>
            <Text style={styles.cardLabel}>Total Members</Text>
          </View>

          <View style={[styles.card, styles.successCard]}>
            <Text style={styles.cardIcon}>👤</Text>
            <Text style={styles.cardValue}>{statistics.membersCount}</Text>
            <Text style={styles.cardLabel}>Primary Members</Text>
          </View>

          <View style={[styles.card, styles.infoCard]}>
            <Text style={styles.cardIcon}>💑</Text>
            <Text style={styles.cardValue}>{statistics.spousesCount}</Text>
            <Text style={styles.cardLabel}>Spouses</Text>
          </View>

          <View style={[styles.card, styles.warningCard]}>
            <Text style={styles.cardIcon}>👶</Text>
            <Text style={styles.cardValue}>{statistics.kidsCount}</Text>
            <Text style={styles.cardLabel}>Children</Text>
          </View>

          <View style={[styles.card, styles.purpleCard]}>
            <Text style={styles.cardIcon}>👑</Text>
            <Text style={styles.cardValue}>{statistics.adminsCount}</Text>
            <Text style={styles.cardLabel}>Administrators</Text>
          </View>

          <View style={[styles.card, styles.tealCard]}>
            <Text style={styles.cardIcon}>🌐</Text>
            <Text style={styles.cardValue}>{totalPeople}</Text>
            <Text style={styles.cardLabel}>Total People</Text>
          </View>
        </View>

        {/* Average Age Card */}
        {statistics.avgAge > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionIcon}>🎂</Text>
            <Text style={styles.sectionTitle}>Average Age</Text>
            <Text style={styles.sectionValue}>{statistics.avgAge} years</Text>
          </View>
        )}

        {/* By State */}
        {statistics.byStateArray.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderIcon}>📍</Text>
              <Text style={styles.sectionHeaderTitle}>Members by State (Top 10)</Text>
            </View>
            <View style={styles.sectionContent}>
              {statistics.byStateArray.map((item, index) => (
                <View key={index} style={styles.statsRow}>
                  <View style={styles.statsRowHeader}>
                    <Text style={styles.statsRank}>#{index + 1}</Text>
                    <Text style={styles.statsLabel}>{item.name}</Text>
                    <Text style={styles.statsCount}>{item.count}</Text>
                  </View>
                  <View style={styles.statsBarContainer}>
                    <View 
                      style={[
                        styles.statsBar, 
                        { width: `${(item.count / statistics.totalMembers) * 100}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.statsPercentage}>
                    {Math.round((item.count / statistics.totalMembers) * 100)}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* By City */}
        {statistics.byCityArray.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderIcon}>🏙️</Text>
              <Text style={styles.sectionHeaderTitle}>Members by City (Top 10)</Text>
            </View>
            <View style={styles.sectionContent}>
              {statistics.byCityArray.map((item, index) => (
                <View key={index} style={styles.statsRow}>
                  <View style={styles.statsRowHeader}>
                    <Text style={styles.statsRank}>#{index + 1}</Text>
                    <Text style={styles.statsLabel}>{item.name}</Text>
                    <Text style={styles.statsCount}>{item.count}</Text>
                  </View>
                  <View style={styles.statsBarContainer}>
                    <View 
                      style={[
                        styles.statsBar, 
                        styles.statsBarCity,
                        { width: `${(item.count / statistics.totalMembers) * 100}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.statsPercentage}>
                    {Math.round((item.count / statistics.totalMembers) * 100)}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* By Country */}
        {statistics.byCountryArray.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderIcon}>🌍</Text>
              <Text style={styles.sectionHeaderTitle}>Members by Country</Text>
            </View>
            <View style={styles.sectionContent}>
              {statistics.byCountryArray.map((item, index) => (
                <View key={index} style={styles.statsRow}>
                  <View style={styles.statsRowHeader}>
                    <Text style={styles.statsRank}>#{index + 1}</Text>
                    <Text style={styles.statsLabel}>{item.name}</Text>
                    <Text style={styles.statsCount}>{item.count}</Text>
                  </View>
                  <View style={styles.statsBarContainer}>
                    <View 
                      style={[
                        styles.statsBar, 
                        styles.statsBarCountry,
                        { width: `${(item.count / statistics.totalMembers) * 100}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.statsPercentage}>
                    {Math.round((item.count / statistics.totalMembers) * 100)}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Padding at bottom */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
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
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
    marginBottom: 8,
  },
  card: {
    width: 'calc(33.333% - 16px)',
    minWidth: 160,
    margin: 8,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 5,
      },
    }),
  },
  primaryCard: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  successCard: {
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  },
  infoCard: {
    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  },
  warningCard: {
    background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  },
  purpleCard: {
    background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  },
  tealCard: {
    background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
  },
  cardIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  cardValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    fontWeight: '500',
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 5,
      },
    }),
  },
  sectionIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#7f8c8d',
    marginBottom: 8,
    fontWeight: '500',
  },
  sectionValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 5,
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#f0f0f0',
  },
  sectionHeaderIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  sectionContent: {
    gap: 12,
  },
  statsRow: {
    marginBottom: 16,
  },
  statsRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statsRank: {
    width: 40,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3498db',
  },
  statsLabel: {
    flex: 1,
    fontSize: 15,
    color: '#2c3e50',
    fontWeight: '500',
  },
  statsCount: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#7f8c8d',
    marginRight: 12,
  },
  statsBarContainer: {
    height: 8,
    backgroundColor: '#ecf0f1',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  statsBar: {
    height: '100%',
    backgroundColor: '#3498db',
    borderRadius: 4,
  },
  statsBarCity: {
    backgroundColor: '#e74c3c',
  },
  statsBarCountry: {
    backgroundColor: '#27ae60',
  },
  statsPercentage: {
    fontSize: 12,
    color: '#95a5a6',
    textAlign: 'right',
  },
});

export default Statistics;
