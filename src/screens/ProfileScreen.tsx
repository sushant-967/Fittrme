import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

export default function ProfileScreen() {
  const auth = useContext(AuthContext);
  const user = auth?.user;
  const navigation = useNavigation<any>();

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarInitial}>U</Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.name}>User Name</Text>
          <Text style={styles.sub}>Pro Member</Text>
        </View>

        <View style={styles.coins}>
          <Text style={styles.coinsLabel}>FittrCoins</Text>
          <Text style={styles.coinsValue}>1,240</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statTitle}>Workouts</Text>
          <Text style={styles.statNum}>24</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statTitle}>Streak</Text>
          <Text style={styles.statNum}>7d</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statTitle}>Progress</Text>
          <Text style={styles.statNum}>64%</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryBtn}>
          <Text style={styles.primaryText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn}>
          <Text style={styles.secondaryText}>Settings</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Achievements</Text>
        <Text style={styles.cardText}>You earned the 10-workout badge 🎖️</Text>
      </View>

      <View style={styles.profileInfo}>
        {user ? (
          <>
            <Text style={styles.label}>Username</Text>
            <Text style={styles.value}>{user.username}</Text>

            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user.email}</Text>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.value}>No user data</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#071022', padding: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: '#081426',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#122033',
  },
  avatarInitial: { color: '#E6EEF3', fontSize: 28, fontWeight: '800' },

  info: { flex: 1, marginLeft: 12 },
  name: { color: '#E6EEF3', fontSize: 18, fontWeight: '800' },
  sub: { color: '#98A2B3', marginTop: 4 },

  coins: { alignItems: 'flex-end' },
  coinsLabel: { color: '#9FB3C8', fontSize: 12 },
  coinsValue: { color: '#7EE7C8', fontWeight: '800', fontSize: 18 },

  statsRow: { flexDirection: 'row', marginTop: 8, gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: '#081426',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#122033',
  },
  statTitle: { color: '#9FB3C8', fontSize: 12 },
  statNum: { color: '#E6EEF3', fontSize: 18, fontWeight: '800', marginTop: 6 },

  actions: { flexDirection: 'row', marginBottom: 16, gap: 10 },
  primaryBtn: {
    flex: 1,
    backgroundColor: '#06B6D4',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryText: { color: '#071122', fontWeight: '800' },
  secondaryBtn: {
    width: 120,
    backgroundColor: '#071428',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#122033',
  },
  secondaryText: { color: '#9FB3C8', fontWeight: '700' },

  card: {
    backgroundColor: '#071022',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#122033',
  },
  cardTitle: { color: '#E6EEF3', fontWeight: '800', marginBottom: 6 },
  cardText: { color: '#9FB3C8' },

  profileInfo: { marginTop: 24 },
  label: { color: '#9FB3C8', marginTop: 10 },
  value: { color: '#E6EEF3', fontWeight: '700', marginTop: 4 },
  logoutBtn: { marginTop: 20, backgroundColor: '#EF4444', padding: 12, borderRadius: 10, alignItems: 'center' },
  logoutText: { color: '#fff', fontWeight: '800' },
});