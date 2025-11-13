import React, { useMemo, useState, useRef, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  Platform,
  KeyboardAvoidingView,
  Alert,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';

// type WeightRecord = { ... }
type WeightRecord = {
  id?: number;
  userId?: number;            // matches models.Weight.UserID -> json:"userId"
  currentWeight?: number;     // matches models.Weight.CurrentWeight -> json:"currentWeight"
  targetWeight?: number;      // matches models.Weight.TargetWeight -> json:"targetWeight"
  height?: number;            // matches models.Weight.Height -> json:"height"
  measured_at?: string;
  value_kg?: number;
  unit?: string;
};

export default function HomeScreen() {
  const auth = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const username = auth?.user?.username ?? undefined;

  const [currentWeight, setCurrentWeight] = useState<string>('75'); // kg
  const [targetWeight, setTargetWeight] = useState<string>('70'); // kg
  const [heightCm, setHeightCm] = useState<string>('175'); // cm
  const [steps, setSteps] = useState<number>(0);
  const [coins, setCoins] = useState<number>(120);
  const [showTips, setShowTips] = useState<boolean>(true);

  // new state for backend sync
  const [weights, setWeights] = useState<WeightRecord[]>([]);
  const [loadingWeights, setLoadingWeights] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<number | undefined>(undefined);

  const weightNum = parseFloat(currentWeight) || 0;
  const targetNum = parseFloat(targetWeight) || 0;
  const heightNum = parseFloat(heightCm) || 0;

  // use Render deployment host for API
  const API_BASE = 'https://fittrme.onrender.com';

  const isFocused = useIsFocused();
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (isFocused && mounted) {
        // reload token when screen becomes focused (no-op, but keeps cache warm)
        await AsyncStorage.getItem('fittrme_token').catch(() => null);
      }
      if (isFocused) loadWeights();
    })();
    return () => {
      mounted = false;
    };
  }, [isFocused]);

  // helper to normalize token (strip accidental quotes)
  function normalizeToken(t: string | null | undefined): string | null {
    if (!t) return null;
    return String(t).replace(/^"(.*)"$/, '$1');
  }

  // fetch recent weights from backend
  async function loadWeights() {
    try {
      setLoadingWeights(true);

      // prefer auth context token, fallback to AsyncStorage
      let token = normalizeToken(auth?.token ?? (await AsyncStorage.getItem('fittrme_token')));

      // debug: ensure we have token and user id
      console.warn('Home.loadWeights token present:', !!token, 'auth.userId:', auth?.user?.userId);

      if (!token) {
        // no token -> force user to login
        Alert.alert('Not authenticated', 'Please login to sync your data.');
        // navigate back to auth flow
        navigation.reset({ index: 0, routes: [{ name: 'Auth' as any, params: { screen: 'Login' } }] });
        return;
      }

      const headers: any = { 'Content-Type': 'application/json' };
      headers.Authorization = `Bearer ${token}`;

      // primary request: use Authorization header
      const res = await fetch(`${API_BASE}/fittrme-api/weight`, { method: 'GET', headers });

      // handle common failure cases
      if (res.status === 401) {
        const t = await res.text().catch(() => '');
        console.warn('loadWeights 401', t);
        Alert.alert('Session expired', 'Please login again.');
        // clear stored token and navigate to login
        await AsyncStorage.removeItem('fittrme_token');
        await AsyncStorage.removeItem('fittrme_user');
        if (auth && typeof auth.signOut === 'function') await auth.signOut();
        navigation.reset({ index: 0, routes: [{ name: 'Auth' as any, params: { screen: 'Login' } }] });
        return;
      }

      if (!res.ok) {
        // try to capture text for debug
        const t = await res.text().catch(() => '');
        console.warn('loadWeights failed', res.status, t);
        throw new Error(t || `server ${res.status}`);
      }

      const data = await res.json();
      console.warn('loadWeights response sample:', Array.isArray(data) ? data.slice(0, 3) : data);

      // If backend returns { userId, weight: { ... } } handle that shape first
      let records: WeightRecord[] = [];
      if (data && typeof data === 'object' && data.weight) {
        const w = data.weight;
        const rec: WeightRecord = {
          id: w.id ?? undefined,
          userId: w.userId ?? w.user_id ?? data.userId,
          currentWeight: w.currentWeight ?? w.current_weight ?? w.value_kg,
          targetWeight: w.targetWeight ?? w.target_weight,
          height: w.height ?? undefined,
          measured_at: w.measured_at ?? w.measuredAt ?? undefined,
          value_kg: w.value_kg ?? w.currentWeight ?? undefined,
        };
        records = [rec];
      } else if (Array.isArray(data)) {
        records = data.map(toRecord);
      } else if (data && typeof data === 'object') {
        if (Array.isArray(data.weights)) {
          records = data.weights.map(toRecord);
        } else if (Array.isArray(data.user)) {
          records = data.user.map(toRecord);
        } else if (Array.isArray(data.records)) {
          records = data.records.map(toRecord);
        } else {
          records = [toRecord(data)];
        }
      } else {
        records = [];
      }

      setWeights(records);
      const first = records[0];
      if (first) {
        setCurrentWeight(String(first.currentWeight ?? first.value_kg ?? currentWeight));
        if (first.targetWeight != null) setTargetWeight(String(first.targetWeight));
        if (first.height != null) setHeightCm(String(first.height));
      } else {
        console.warn('loadWeights: no records for this user');
      }
    } catch (e) {
      console.warn('loadWeights error', e);
      Alert.alert('Load failed', 'Could not load weights from server. Check console for details.');
    } finally {
      setLoadingWeights(false);
    }
  }

  // save weight to backend (POST /fittrme-api/weight)
  async function saveWeight() {
    const value = parseFloat(currentWeight);
    if (!value || value <= 0) {
      Alert.alert('Invalid', 'Enter a valid weight before saving.');
      return;
    }

    const payload: any = {
      currentWeight: value,
      targetWeight: parseFloat(targetWeight) || value,
      height: parseFloat(heightCm) || 0,
    };

    try {
      setSaving(true);
      let token = normalizeToken(auth?.token ?? (await AsyncStorage.getItem('fittrme_token')));
      if (!token) {
        Alert.alert('Not authenticated', 'Please login to save your data.');
        return;
      }
      const headers: any = { 'Content-Type': 'application/json' };
      headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/fittrme-api/weight`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.warn('saveWeight failed', res.status, text);
        throw new Error(text || `status ${res.status}`);
      }

      const body = await res.json();
      const savedRaw = body.user ?? body;
      const saved = (savedRaw && typeof savedRaw === 'object') ? {
        id: savedRaw.id ?? savedRaw.ID,
        userId: savedRaw.userId ?? savedRaw.UserID,
        currentWeight: savedRaw.currentWeight ?? savedRaw.CurrentWeight ?? savedRaw.value_kg,
        targetWeight: savedRaw.targetWeight ?? savedRaw.TargetWeight,
        height: savedRaw.height ?? savedRaw.Height,
        measured_at: savedRaw.measured_at ?? savedRaw.measuredAt,
      } : payload;

      setWeights((s) => [saved as WeightRecord, ...s]);
      setSelectedId((saved as any)?.id ?? (saved as any)?.userId);
      if ((saved as any)?.currentWeight != null) setCurrentWeight(String((saved as any).currentWeight));
      Alert.alert('Saved', 'Weight saved successfully.');
    } catch (err) {
      console.warn('saveWeight error', err);
      Alert.alert('Save failed', String(err));
    } finally {
      setSaving(false);
    }
  }

  const bmi = useMemo(() => {
    if (!heightNum || !weightNum) return 0;
    const m = heightNum / 100;
    return +(weightNum / (m * m)).toFixed(1);
  }, [heightNum, weightNum]);

  const progress = useMemo(() => {
    if (!weightNum || !targetNum) return 0;
    if (weightNum === targetNum) return 1;
    const range = Math.max(0.1, Math.abs(weightNum - targetNum) + Math.abs(weightNum - targetNum));
    const val = Math.min(1, Math.abs((weightNum - targetNum) / Math.max(1, weightNum + targetNum)));
    return val;
  }, [weightNum, targetNum]);

  const anim = useRef(new Animated.Value(progress)).current;
  useEffect(() => {
    Animated.spring(anim, {
      toValue: progress,
      useNativeDriver: false,
      stiffness: 90,
      damping: 12,
      mass: 0.7,
    }).start();
  }, [progress, anim]);

  // pulse animation for coins
  const coinScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(coinScale, { toValue: 1.06, duration: 700, useNativeDriver: true }),
        Animated.timing(coinScale, { toValue: 1.0, duration: 700, useNativeDriver: true }),
      ]),
    ).start();
  }, [coinScale]);

  function simulateWalk(add: number) {
    setSteps((s) => {
      const newSteps = s + add;
      const newCoins = Math.floor(newSteps / 100) - Math.floor(s / 100);
      if (newCoins > 0) setCoins((c) => c + newCoins);
      return newSteps;
    });
  }

  function resetSim() {
    Alert.alert('Reset', 'Reset simulated steps and coins?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          setSteps(0);
          setCoins(0);
        },
      },
    ]);
  }

  const weightLeft = useMemo(() => {
    return +(weightNum - targetNum).toFixed(1);
  }, [weightNum, targetNum]);

  function formatDate(ts?: string) {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return ts;
    }
  }

  const latestRecord = weights.length > 0 ? weights[0] : undefined;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Fittrme</Text>
            <Text style={styles.subtitle}>{username ? `Hi, ${username}` : 'Your daily health dashboard'}</Text>
          </View>

          <Animated.View style={[styles.coinWrap, { transform: [{ scale: coinScale }] }]}>
            <Text style={styles.coinEmoji}>🪙</Text>
            <Text style={styles.coinValue}>{coins}</Text>
          </Animated.View>
        </View>

        <View style={styles.row}>
          <View style={styles.cardLarge}>
            <Text style={styles.cardLabel}>Weight & Goal</Text>

            <View style={styles.inlineRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Current</Text>
                <TextInput
                  keyboardType="numeric"
                  value={currentWeight}
                  onChangeText={setCurrentWeight}
                  style={styles.input}
                  placeholder="75"
                  placeholderTextColor="#7B8794"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Target</Text>
                <TextInput
                  keyboardType="numeric"
                  value={targetWeight}
                  onChangeText={setTargetWeight}
                  style={styles.input}
                  placeholder="70"
                  placeholderTextColor="#7B8794"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Height</Text>
                <TextInput
                  keyboardType="numeric"
                  value={heightCm}
                  onChangeText={setHeightCm}
                  style={styles.input}
                  placeholder="175"
                  placeholderTextColor="#7B8794"
                />
              </View>
            </View>

            <View style={styles.progressRow}>
              <View style={styles.progressTrack}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['6%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
            </View>

            <Text style={styles.weightNote}>
              {weightLeft > 0
                ? `${Math.abs(weightLeft)} kg to lose — stay consistent!`
                : weightLeft === 0
                ? 'Target reached 🎉'
                : `${Math.abs(weightLeft)} kg below target — great job!`}
            </Text>

            {/* Save / sync controls */}
            <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity
                style={[styles.actionBtn, { flex: 1 }]}
                onPress={saveWeight}
                disabled={saving}
              >
                <Text style={styles.actionBtnText}>{saving ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.ghostBtn, { paddingVertical: 10, paddingHorizontal: 12 }]}
                onPress={loadWeights}
              >
                <Text style={[styles.actionBtnText, styles.ghostText]}>{loadingWeights ? 'Refreshing...' : 'Refresh'}</Text>
              </TouchableOpacity>
            </View>

            {latestRecord && (
              <Text style={{ color: '#9FB3C8', marginTop: 8 }}>
                Last saved: <Text style={{ color: '#7EE7C8', fontWeight: '800' }}>{latestRecord.currentWeight} kg</Text>{' '}
                • {formatDate(latestRecord.measured_at)}
              </Text>
            )}

            {/* weights list - tap to load value into input */}
            <View style={{ marginTop: 12 }}>
              <Text style={{ color: '#9FB3C8', fontWeight: '700', marginBottom: 8 }}>Recent records</Text>
              {weights.length === 0 && <Text style={{ color: '#98A2B3' }}>No records</Text>}
              {weights.map((w) => (
                <TouchableOpacity
                  key={String(w.id ?? Math.random())}
                  onPress={() => {
                    setCurrentWeight(String(w.value_kg));
                    setSelectedId(w.id);
                    Alert.alert('Loaded', 'Record loaded into input. Press Save to create a new entry.');
                  }}
                  style={[
                    styles.weightItem,
                    selectedId === w.id ? styles.weightItemSelected : undefined,
                  ]}
                >
                  <View>
                    <Text style={{ color: '#E6EEF3', fontWeight: '700' }}>{w.value_kg} kg</Text>
                    <Text style={{ color: '#98A2B3', fontSize: 12 }}>{formatDate(w.measured_at)}</Text>
                  </View>
                  <Text style={{ color: '#9FB3C8', fontWeight: '700' }}>{w.unit ?? 'kg'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.cardSmall}>
            <View style={styles.stepRow}>
              <Text style={styles.smallLabel}>Steps</Text>
              <Text style={styles.stepsCount}>{steps}</Text>
            </View>

            <View style={styles.btnCol}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => simulateWalk(120)}>
                <Text style={styles.actionBtnText}>+120 steps</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.ghostBtn]} onPress={() => simulateWalk(1000)}>
                <Text style={[styles.actionBtnText, styles.ghostText]}>+1000</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.minBtn} onPress={resetSim}>
                <Text style={styles.minBtnText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>BMI</Text>
            <Text style={styles.statValue}>{bmi}</Text>
            <Text style={styles.statNote}>
              {bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Healthy' : 'Overweight'}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Motivation</Text>
            <Text style={styles.statValue}>{weightLeft > 0 ? `${Math.abs(weightLeft)} kg left` : 'Keep going'}</Text>
            <Text style={styles.statNote}>Small daily wins add up.</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Streak</Text>
            <Text style={styles.statValue}>7</Text>
            <Text style={styles.statNote}>Days active</Text>
          </View>
        </View>

        {showTips && (
          <TouchableOpacity style={styles.tipCard} onPress={() => setShowTips(false)}>
            <Text style={styles.tipTitle}>Daily Tip</Text>
            <Text style={styles.tipText}>Walk 20 minutes after meals to boost calorie burn — tap to dismiss.</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18, backgroundColor: '#0B1220' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', color: '#E6EEF3' },
  subtitle: { fontSize: 13, color: '#98A2B3' },

  coinWrap: {
    backgroundColor: '#071022',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#142032',
  },
  coinEmoji: { fontSize: 18, marginRight: 8 },
  coinValue: { color: '#7EE7C8', fontWeight: '800', fontSize: 18 },

  row: { flexDirection: 'row', gap: 12 },
  cardLarge: {
    flex: 2,
    backgroundColor: '#071022',
    padding: 14,
    borderRadius: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#122033',
  },
  cardSmall: {
    flex: 1,
    backgroundColor: '#071022',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderWidth: 1,
    borderColor: '#122033',
  },

  cardLabel: { color: '#9FB3C8', fontWeight: '700', marginBottom: 8 },

  inlineRow: { flexDirection: 'row', justifyContent: 'space-between' },
  inputGroup: { flex: 1, marginRight: 8 },
  inputLabel: { color: '#7B8794', fontSize: 12, marginBottom: 6 },
  input: {
    backgroundColor: '#0F1A2A',
    color: '#E6EEF3',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    fontSize: 15,
  },

  progressRow: { marginTop: 12, flexDirection: 'row', alignItems: 'center' },
  progressTrack: {
    flex: 1,
    height: 12,
    backgroundColor: '#0F1A2A',
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#132031',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7C3AED',
  },
  progressText: { width: 48, textAlign: 'right', color: '#E6EEF3', fontWeight: '700' },

  weightNote: { color: '#98A2B3', marginTop: 10 },

  stepRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 8 },
  smallLabel: { color: '#9FB3C8' },
  stepsCount: { color: '#E6EEF3', fontWeight: '800', fontSize: 20 },

  btnCol: { width: '100%' },
  actionBtn: {
    backgroundColor: '#06B6D4',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  actionBtnText: { color: '#071122', fontWeight: '800' },
  ghostBtn: { backgroundColor: '#0F1724', borderWidth: 1, borderColor: '#18303F' },
  ghostText: { color: '#7C3AED' },
  minBtn: { alignItems: 'center', marginTop: 8 },
  minBtnText: { color: '#EF4444' },

  statsRow: { flexDirection: 'row', marginTop: 16, gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: '#071021',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#122033',
  },
  statLabel: { color: '#9FB3C8', fontSize: 12 },
  statValue: { color: '#E6EEF3', fontSize: 20, fontWeight: '800', marginTop: 6 },
  statNote: { color: '#98A2B3', fontSize: 12, marginTop: 6 },

  tipCard: {
    marginTop: 16,
    backgroundColor: '#071028',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#122033',
  },
  tipTitle: { color: '#E6EEF3', fontWeight: '800' },
  tipText: { color: '#9FB3C8', marginTop: 6 },

  /* new styles for weight list */
  weightItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#081426',
    borderWidth: 1,
    borderColor: '#122033',
    marginBottom: 8,
  },
  weightItemSelected: {
    borderColor: '#7EE7C8',
    backgroundColor: '#06212A',
  },
});