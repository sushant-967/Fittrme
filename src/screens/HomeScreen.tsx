    import React, { useMemo, useState, useRef, useEffect } from 'react';
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

    type WeightRecord = {
      id?: number;
      user_id?: number;
      value_kg: number;
      unit?: string;
      measured_at?: string;
    };

    export default function HomeScreen() {
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

      // use port 5000 and provided endpoints
    const API_BASE = "http://192.168.1.112:5000";
      const USER_ID = 1; // change as needed / use auth later

      // fetch recent weights from backend
      async function loadWeights() {
        try {
          setLoadingWeights(true);
          const res = await fetch(`${API_BASE}/api/weight/${USER_ID}`);
          if (!res.ok) {
            throw new Error(`server ${res.status}`);
          }
          const data: WeightRecord[] = await res.json();
          setWeights(Array.isArray(data) ? data : []);
          // if we have a recent weight, update currentWeight to reflect it (optional)
          if (Array.isArray(data) && data.length > 0) {
            const latest = data[0];
            if (latest && typeof latest.value_kg === 'number') {
              setCurrentWeight(String(latest.value_kg));
            }
          }
        } catch (e) {
          console.warn('loadWeights error', e);
          Alert.alert('Load failed', 'Could not load weights from server.');
        } finally {
          setLoadingWeights(false);
        }
      }

      useEffect(() => {
        loadWeights();
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

      // save weight to backend (POST /api/weight/)
      async function saveWeight() {
        const value = parseFloat(currentWeight);
        if (!value || value <= 0) {
          Alert.alert('Invalid', 'Enter a valid weight before saving.');
          return;
        }

        const payload: WeightRecord = {
          user_id: USER_ID,
          value_kg: value,
          unit: 'kg',
          measured_at: new Date().toISOString(),
        };

        try {
          setSaving(true);
          const res = await fetch(`${API_BASE}/api/weight/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new Error(text || `status ${res.status}`);
          }
          const created: WeightRecord = await res.json();
          // prepend to local list and keep UI in sync
          setWeights((s) => [created || payload, ...s]);
          setSelectedId(created?.id);
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
                <Text style={styles.subtitle}>Your daily health dashboard</Text>
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
                    <Text style={styles.actionBtnText}>{saving ? 'Saving...' : 'Save weight'}</Text>
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
                    Last saved: <Text style={{ color: '#7EE7C8', fontWeight: '800' }}>{latestRecord.value_kg} kg</Text>{' '}
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