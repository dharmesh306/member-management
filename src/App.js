import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import Dashboard from './screens/Dashboard';
import AddEditMember from './screens/AddEditMember';
import AdminManagement from './screens/AdminManagement';
import Login from './screens/Login';
import Register from './screens/Register';
import ForgotPassword from './screens/ForgotPassword';
import ResetPassword from './screens/ResetPassword';
import ChangePassword from './screens/ChangePassword';
import AuthService from './services/AuthService';

const App = () => {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [selectedMember, setSelectedMember] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resetToken, setResetToken] = useState(null);

  // Check for existing session on app load
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const session = await AuthService.getCurrentSession();
      if (session) {
        setCurrentUser(session);
        setCurrentScreen('dashboard');
      } else {
        setCurrentScreen('login');
      }
    } catch (error) {
      console.error('Session check error:', error);
      setCurrentScreen('login');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setCurrentScreen('dashboard');
  };

  const handleLogout = () => {
    AuthService.logout();
    setCurrentUser(null);
    setCurrentScreen('login');
  };

  const handleAddMember = () => {
    setSelectedMember(null);
    setCurrentScreen('addEdit');
  };

  const handleEditMember = (member) => {
    setSelectedMember(member);
    setCurrentScreen('addEdit');
  };

  const handleBack = () => {
    setSelectedMember(null);
    setCurrentScreen('dashboard');
  };

  const handleAdminManagement = () => {
    setCurrentScreen('adminManagement');
  };

  const renderScreen = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    switch (currentScreen) {
      case 'login':
        return (
          <Login
            onLoginSuccess={handleLoginSuccess}
            onNavigateToRegister={() => setCurrentScreen('register')}
            onNavigateToForgotPassword={() => setCurrentScreen('forgotPassword')}
          />
        );
      
      case 'register':
        return (
          <Register
            onRegisterSuccess={() => setCurrentScreen('login')}
            onNavigateToLogin={() => setCurrentScreen('login')}
          />
        );
      
      case 'forgotPassword':
        return (
          <ForgotPassword
            onNavigateToLogin={() => setCurrentScreen('login')}
            onNavigateToResetPassword={(token) => {
              setResetToken(token);
              setCurrentScreen('resetPassword');
            }}
          />
        );
      
      case 'resetPassword':
        return (
          <ResetPassword
            token={resetToken}
            onNavigateToLogin={() => {
              setResetToken(null);
              setCurrentScreen('login');
            }}
          />
        );
      
      case 'changePassword':
        return (
          <ChangePassword
            currentUser={currentUser}
            onBack={() => setCurrentScreen('dashboard')}
          />
        );
      
      case 'dashboard':
        return (
          <Dashboard
            onAddMember={handleAddMember}
            onEditMember={handleEditMember}
            onLogout={handleLogout}
            onAdminManagement={handleAdminManagement}
            currentUser={currentUser}
          />
        );
      
      case 'adminManagement':
        return (
          <AdminManagement
            currentUser={currentUser}
            onBack={handleBack}
          />
        );
      
      case 'addEdit':
        return (
          <AddEditMember
            route={{ params: { member: selectedMember } }}
            navigation={{ goBack: handleBack }}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2980b9" />
      
      {/* App Header - only show on dashboard */}
      {currentScreen === 'dashboard' && (
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>Member Management</Text>
              <Text style={styles.headerSubtitle}>
                Welcome, {currentUser?.firstName || 'User'}
              </Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.changePasswordButton}
                onPress={() => setCurrentScreen('changePassword')}
              >
                <Text style={styles.changePasswordButtonText}>🔑 Change Password</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Screen Content */}
      {renderScreen()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#3498db',
    padding: 20,
    paddingTop: Platform.OS === 'web' ? 20 : 10,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
      },
    }),
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#ecf0f1',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  changePasswordButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  changePasswordButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default App;
