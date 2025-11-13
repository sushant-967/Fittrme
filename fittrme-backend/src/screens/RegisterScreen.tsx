import React, { useContext, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Animated,
  Platform,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../context/AuthContext';

// use Render deployment URL for auth endpoints
const REGISTER_PATH = 'https://fittrme.onrender.com/fittrme-api/register';
const LOGIN_PATH = 'https://fittrme.onrender.com/fittrme-api/login';

export default function RegisterScreen({ navigation }: any) {
  const auth = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const glow = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1400, useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0, duration: 1400, useNativeDriver: false }),
      ])
    ).start();
  }, [glow]);

  async function handleRegister() {
    if (!username || !email || !password) {
      Alert.alert('Missing', 'Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(REGISTER_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `status ${res.status}`);
      }
      const body = await res.json();
      const token = body.accessToken ?? body.token;
      const user = body.user ?? null;
      if (token) {
        if (auth) {
          await auth.signIn(token, user);
        } else {
          await AsyncStorage.setItem('fittrme_token', token);
          if (user) await AsyncStorage.setItem('fittrme_user', JSON.stringify(user));
        }
        navigation.replace('Main');
        return;
      }
      Alert.alert('Account created', 'Your account was created. Please sign in.');
      navigation.replace('Login');
    } catch (e: any) {
      Alert.alert('Signup failed', e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  const glowBg = glow.interpolate({
    inputRange: [0, 1],
    outputRange: ['#071022', '#092834'],
  });

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <View style={styles.top}>
        <Animated.View style={[styles.logoWrap, { backgroundColor: glowBg }]}>
          <Text style={styles.logoEmoji}>✨</Text>
        </Animated.View>
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Join Fittrme — fast & secure</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Username</Text>
        <TextInput value={username} onChangeText={setUsername} style={styles.input} placeholder="username" placeholderTextColor="#5B6B78" />

        <Text style={[styles.label, { marginTop: 12 }]}>Email</Text>
        <TextInput value={email} onChangeText={setEmail} style={styles.input} placeholder="you@domain.com" placeholderTextColor="#5B6B78" keyboardType="email-address" autoCapitalize="none" />

        <Text style={[styles.label, { marginTop: 12 }]}>Password</Text>
        <TextInput value={password} onChangeText={setPassword} style={styles.input} placeholder="password" placeholderTextColor="#5B6B78" secureTextEntry />

        <TouchableOpacity style={[styles.primaryBtn, loading && { opacity: 0.8 }]} onPress={handleRegister}>
          <Text style={styles.primaryText}>{loading ? 'Creating...' : 'Create account'}</Text>
        </TouchableOpacity>

        <View style={{ marginTop: 12, alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>Already have an account? Sign in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1220', padding: 20, justifyContent: 'center' },
  top: { alignItems: 'center', marginBottom: 8 },
  logoWrap: {
    width: 78,
    height: 78,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#122033',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  logoEmoji: { fontSize: 34 },
  title: { fontSize: 22, color: '#E6EEF3', fontWeight: '800' },
  subtitle: { color: '#98A2B3', marginTop: 6 },
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
  primaryBtn: { backgroundColor: '#06B6D4', padding: 14, borderRadius: 12, marginTop: 16, alignItems: 'center' },
  primaryText: { color: '#071122', fontWeight: '800' },
  link: { color: '#7EE7C8', fontWeight: '700' },
});