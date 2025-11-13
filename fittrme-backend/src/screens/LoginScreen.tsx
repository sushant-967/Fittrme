import React, { useContext, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../context/AuthContext';

// use Render deployment URL for auth endpoints
const LOGIN_PATH = 'https://fittrme.onrender.com/fittrme-api/login';

export default function LoginScreen({ navigation }: any) {
  const auth = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const logoScale = useRef(new Animated.Value(1)).current;

  async function handleLogin() {
    if (!username || !password) {
      Alert.alert('Missing', 'Please enter username and password');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(LOGIN_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `status ${res.status}`);
      }
      const body = await res.json();
      const token = body.accessToken ?? body.token;
      const user = body.user ?? null;
      if (!token) throw new Error('No accessToken returned');
      // persist and update global auth state
      if (auth) {
        await auth.signIn(token, user);
      } else {
        await AsyncStorage.setItem('fittrme_token', token);
        if (user) await AsyncStorage.setItem('fittrme_user', JSON.stringify(user));
      }
      // navigate to main app
      navigation.replace('Main');
    } catch (e: any) {
      Alert.alert('Login failed', e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.container}>
      <View style={styles.top}>
        <Animated.View style={[styles.iconWrap, { transform: [{ scale: logoScale }] }]}>
          <Text style={styles.icon}>🏃‍♂️</Text>
        </Animated.View>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.sub}>Sign in to continue to Fittrme</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Username</Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          style={styles.input}
          placeholder="username"
          placeholderTextColor="#5B6B78"
        />

        <Text style={[styles.label, { marginTop: 12 }]}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          placeholder="password"
          placeholderTextColor="#5B6B78"
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
          onPress={handleLogin}
        >
          <Text style={styles.primaryText}>{loading ? 'Signing in...' : 'Sign in'}</Text>
        </TouchableOpacity>

        <View style={styles.row}>
          <Text style={styles.small}>New here?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.link}>Create an account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1220', padding: 20, justifyContent: 'center' },
  top: { alignItems: 'center', marginBottom: 8 },
  iconWrap: {
    width: 94,
    height: 94,
    borderRadius: 28,
    backgroundColor: '#071022',
    borderColor: '#122033',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  icon: { fontSize: 44 },
  title: { fontSize: 24, color: '#E6EEF3', fontWeight: '800' },
  sub: { color: '#98A2B3', marginTop: 6 },
  card: {
    backgroundColor: '#071022',
    padding: 16,
    borderRadius: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#122033',
  },
  label: { color: '#9FB3C8', fontSize: 12, marginBottom: 6 },
  input: {
    backgroundColor: '#0F1A2A',
    color: '#E6EEF3',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    fontSize: 15,
  },
  primaryBtn: { backgroundColor: '#7C3AED', padding: 14, borderRadius: 12, marginTop: 16, alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '800' },
  row: { flexDirection: 'row', justifyContent: 'center', marginTop: 12, gap: 8 },
  small: { color: '#98A2B3' },
  link: { color: '#7EE7C8', fontWeight: '700' },
});