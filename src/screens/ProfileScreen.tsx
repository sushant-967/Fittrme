import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

export default function ProfileScreen() {
  const auth = useContext(AuthContext);
  const user = auth?.user;
  const navigation = useNavigation<any>();

  // Generate initials from username (first letter, capitalized)
  const getInitials = (name?: string): string => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  async function handleLogout() {
    Alert.alert('Logout', 'Sign out from this device?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          try {
            // remove tokens and user from storage
            await AsyncStorage.removeItem('fittrme_token');
            await AsyncStorage.removeItem('fittrme_user');

            // clear auth context if available
            if (auth && typeof auth.signOut === 'function') {
              await auth.signOut();
            }

            // reset navigation to the auth/login flow so a new token must be created
            navigation.reset({
              index: 0,
              routes: [{ name: 'Auth', params: { screen: 'Login' } }],
            });
          } catch (e) {
            // fallback: navigate to Login
            navigation.replace('Login');
          }
        },
      },
    ]);
  }

  const initials = getInitials(user?.username);

  return (
    <View style={styles.container}>
      {/* Header with Avatar and Username */}
      <View style={styles.headerSection}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatar}>{initials}</Text>
        </View>
        <Text style={styles.username}>{user?.username ?? 'Guest'}</Text>
      </View>

      {/* Profile Details Card */}
      <View style={styles.profileCard}>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Username</Text>
          <Text style={styles.value}>{user?.username ?? 'N/A'}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email ?? 'N/A'}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.label}>User ID</Text>
          <Text style={styles.value}>{user?.userId ?? 'N/A'}</Text>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 18,
    flex: 1,
    backgroundColor: '#0B1220',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 12,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#7EE7C8',
  },
  avatar: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
  },
  username: {
    color: '#E6EEF3',
    fontSize: 22,
    fontWeight: '800',
  },
  profileCard: {
    backgroundColor: '#071022',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#122033',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  label: {
    color: '#9FB3C8',
    fontSize: 13,
    fontWeight: '600',
  },
  value: {
    color: '#E6EEF3',
    fontSize: 15,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#122033',
  },
  logoutBtn: {
    marginTop: 'auto',
    marginBottom: 20,
    backgroundColor: '#EF4444',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
});