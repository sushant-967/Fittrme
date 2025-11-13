import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';

const DATA = [
  { id: '1', title: 'Full Body Strength', duration: '45m', difficulty: 'Hard' },
  { id: '2', title: 'Cardio Blast', duration: '30m', difficulty: 'Medium' },
  { id: '3', title: 'Yoga & Mobility', duration: '25m', difficulty: 'Easy' },
  { id: '4', title: 'HIIT Express', duration: '20m', difficulty: 'Hard' },
  { id: '5', title: 'Core Builder', duration: '15m', difficulty: 'Medium' },
];

export default function WorkoutsScreen() {
  function renderItem({ item }: { item: typeof DATA[number] }) {
    return (
      <View style={styles.card}>
        <View style={styles.cardLeft}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.meta}>
            {item.duration} • <Text style={styles.difficulty}>{item.difficulty}</Text>
          </Text>
        </View>

        <View style={styles.cardRight}>
          <TouchableOpacity style={styles.startBtn}>
            <Text style={styles.startBtnText}>Start</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn}>
            <Text style={styles.saveText}>★</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Workouts</Text>
        <Text style={styles.headerSub}>Find sessions to move your goals forward</Text>
      </View>

      <FlatList
        contentContainerStyle={styles.list}
        data={DATA}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#071022', padding: 16 },
  header: { marginBottom: 12 },
  headerTitle: { color: '#E6EEF3', fontSize: 24, fontWeight: '800' },
  headerSub: { color: '#98A2B3', marginTop: 4 },

  list: { paddingBottom: 20 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#081426',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#122033',
  },
  cardLeft: { flex: 1 },
  title: { color: '#E6EEF3', fontSize: 16, fontWeight: '800' },
  meta: { color: '#9FB3C8', marginTop: 6 },
  difficulty: { color: '#7EE7C8', fontWeight: '800' },

  cardRight: { alignItems: 'flex-end', marginLeft: 12 },
  startBtn: {
    backgroundColor: '#06B6D4',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  startBtnText: { color: '#071122', fontWeight: '800' },
  saveBtn: {
    marginTop: 8,
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#071428',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#18303F',
  },
  saveText: { color: '#FFD36E', fontWeight: '800' },
});