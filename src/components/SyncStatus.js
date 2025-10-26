import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import DatabaseService from '../services/DatabaseService';

const SyncStatus = ({ onRefresh }) => {
  const [syncStatus, setSyncStatus] = useState('checking');
  const [lastSync, setLastSync] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    // Check if sync handler exists
    if (DatabaseService.syncHandler) {
      setSyncStatus('connected');
      
      // Listen to sync events
      DatabaseService.syncHandler
        .on('change', (info) => {
          console.log('Sync change:', info);
          setSyncStatus('syncing');
          setLastSync(new Date());
          setErrorMessage(null);
        })
        .on('paused', (err) => {
          if (err) {
            console.error('Sync paused with error:', err);
            setSyncStatus('error');
            setErrorMessage(err.message || 'Sync paused');
          } else {
            setSyncStatus('synced');
            setLastSync(new Date());
          }
        })
        .on('active', () => {
          console.log('Sync resumed');
          setSyncStatus('syncing');
          setErrorMessage(null);
        })
        .on('denied', (err) => {
          console.error('Sync denied:', err);
          setSyncStatus('error');
          setErrorMessage('Permission denied');
        })
        .on('error', (err) => {
          console.error('Sync error:', err);
          setSyncStatus('error');
          setErrorMessage(err.message || 'Sync error');
        });
    } else {
      setSyncStatus('disconnected');
    }

    // Cleanup
    return () => {
      if (DatabaseService.syncHandler) {
        DatabaseService.syncHandler.removeAllListeners();
      }
    };
  }, []);

  const handleRetry = () => {
    setSyncStatus('connecting');
    setErrorMessage(null);
    
    // Reconnect
    if (onRefresh) {
      onRefresh();
    } else {
      window.location.reload();
    }
  };

  const getStatusColor = () => {
    switch (syncStatus) {
      case 'synced':
        return '#27ae60';
      case 'syncing':
        return '#3498db';
      case 'error':
        return '#e74c3c';
      case 'disconnected':
        return '#95a5a6';
      default:
        return '#f39c12';
    }
  };

  const getStatusIcon = () => {
    switch (syncStatus) {
      case 'synced':
        return '✓';
      case 'syncing':
        return '⟳';
      case 'error':
        return '✕';
      case 'disconnected':
        return '○';
      default:
        return '...';
    }
  };

  const getStatusText = () => {
    switch (syncStatus) {
      case 'synced':
        return 'Synced';
      case 'syncing':
        return 'Syncing...';
      case 'error':
        return 'Sync Error';
      case 'disconnected':
        return 'Not Connected';
      case 'connecting':
        return 'Connecting...';
      default:
        return 'Checking...';
    }
  };

  const formatLastSync = () => {
    if (!lastSync) return '';
    
    const now = new Date();
    const diffMs = now - lastSync;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    
    if (diffSecs < 60) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else {
      return lastSync.toLocaleTimeString();
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
        <Text style={styles.statusIcon}>{getStatusIcon()}</Text>
        <View style={styles.statusTextContainer}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
          {lastSync && syncStatus === 'synced' && (
            <Text style={styles.lastSyncText}>{formatLastSync()}</Text>
          )}
          {errorMessage && (
            <Text style={styles.errorText} numberOfLines={1}>
              {errorMessage}
            </Text>
          )}
        </View>
      </View>
      
      {syncStatus === 'error' && (
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
      },
    }),
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flex: 1,
  },
  statusIcon: {
    fontSize: 16,
    color: '#fff',
    marginRight: 8,
    fontWeight: 'bold',
  },
  statusTextContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  lastSyncText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  errorText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  retryButton: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#3498db',
    borderRadius: 4,
  },
  retryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
});

export default SyncStatus;
