import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';

const EVENTS = [
  { id: '1', name: '5K Charity Run', date: 'Oct 25', location: 'City Park' },
  { id: '2', name: 'HIIT Workshop', date: 'Nov 2', location: 'Fit Hub' },
  { id: '3', name: 'Outdoor Yoga', date: 'Nov 9', location: 'Riverside' },
];

export default function EventsScreen() {
  function renderEvent({ item }: { item: typeof EVENTS[number] }) {
    return (
      <View style={styles.eventCard}>
        <View style={styles.eventLeft}>
          <View style={styles.dateBox}>
            <Text style={styles.dateText}>{item.date.split(' ')[0]}</Text>
            <Text style={styles.dateMonth}>{item.date.split(' ')[1]}</Text>
          </View>
        </View>

        <View style={styles.eventMiddle}>
          <Text style={styles.eventName}>{item.name}</Text>
          <Text style={styles.eventLoc}>{item.location}</Text>
        </View>

        <View style={styles.eventRight}>
          <TouchableOpacity style={styles.joinBtn}>
            <Text style={styles.joinText}>Join</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.infoBtn}>
            <Text style={styles.infoText}>Info</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Events</Text>
      <Text style={styles.subtitle}>Community runs, workshops and meetups</Text>

      <FlatList
        style={{ marginTop: 12 }}
        data={EVENTS}
        keyExtractor={(item) => item.id}
        renderItem={renderEvent}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        contentContainerStyle={{ paddingBottom: 30 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#071022', padding: 16 },
  title: { color: '#E6EEF3', fontSize: 22, fontWeight: '800' },
  subtitle: { color: '#98A2B3', marginTop: 4 },

  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#081426',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#122033',
  },
  eventLeft: { width: 64, alignItems: 'center', justifyContent: 'center' },
  dateBox: {
    backgroundColor: '#071428',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  dateText: { color: '#E6EEF3', fontWeight: '800', fontSize: 16 },
  dateMonth: { color: '#9FB3C8', fontSize: 11 },

  eventMiddle: { flex: 1, paddingLeft: 8 },
  eventName: { color: '#E6EEF3', fontSize: 16, fontWeight: '800' },
  eventLoc: { color: '#9FB3C8', marginTop: 6 },

  eventRight: { alignItems: 'flex-end' },
  joinBtn: {
    backgroundColor: '#7C3AED',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  joinText: { color: '#FEFEFF', fontWeight: '800' },
  infoBtn: {
    marginTop: 8,
  },
  infoText: { color: '#9FB3C8' },
});