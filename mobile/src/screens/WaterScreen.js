import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, radius } from '../theme';
import ResponsiveContainer from '../components/ResponsiveContainer';

import api, { apiErrorMessage } from '../api';

function todayISO() { return new Date().toISOString().slice(0, 10); }

export default function WaterScreen() {
  const [capacity, setCapacity] = useState(null);
  const [capInput, setCapInput] = useState('');
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/api/water');
      setCapacity(data.capacity);
      if (data.capacity) setCapInput(String(data.capacity));
      setLogs(data.logs);
    } catch (e) { /* silent */ }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function saveCapacity() {
    setError('');
    const num = parseFloat(capInput);
    if (!num || num <= 0) { setError('Enter a valid bottle size in liters.'); return; }
    try {
      await api.post('/api/water/capacity', { capacity: num });
      await load();
    } catch (e) { setError(apiErrorMessage(e)); }
  }

  async function addBottle(delta) {
    if (!capacity) return;
    await api.post('/api/water/log', { date: todayISO(), delta });
    load();
  }

  const today = logs.find((l) => l.date === todayISO());
  const bottles = today ? today.bottles : 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ResponsiveContainer>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Bottle Capacity</Text>
        <Text style={styles.label}>Your bottle size (liters)</Text>
        <TextInput style={styles.input} value={capInput} onChangeText={setCapInput}
          keyboardType="decimal-pad" placeholder="e.g. 1.0" placeholderTextColor={colors.muted} />
        <TouchableOpacity style={styles.btn} onPress={saveCapacity}><Text style={styles.btnText}>Save Capacity</Text></TouchableOpacity>
        {!!error && <Text style={styles.error}>{error}</Text>}
      </View>

      {!!capacity && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Today</Text>
          <View style={styles.waterRow}>
            <TouchableOpacity style={styles.waterBtn} onPress={() => addBottle(-1)}><Text style={styles.waterBtnText}>-</Text></TouchableOpacity>
            <View style={styles.waterCount}>
              <Text style={styles.waterN}>{bottles}</Text>
              <Text style={styles.waterL}>bottles · {(bottles * capacity).toFixed(2)} L</Text>
            </View>
            <TouchableOpacity style={styles.waterBtn} onPress={() => addBottle(1)}><Text style={styles.waterBtnText}>+</Text></TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>History</Text>
        {logs.length === 0 && <Text style={styles.empty}>No water logged yet.</Text>}
        <FlatList
          data={logs}
          scrollEnabled={false}
          keyExtractor={(l) => l.date}
          renderItem={({ item }) => (
            <View style={styles.entry}>
              <Text style={styles.entryMain}>{item.date}</Text>
              <Text style={styles.entrySub}>{item.bottles} bottles · {(item.bottles * (capacity || 0)).toFixed(2)} L</Text>
            </View>
          )}
        />
      </View>
      </ResponsiveContainer>
</ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 40 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: '800', marginBottom: 10 },
  label: { color: colors.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  input: { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, padding: 12, color: colors.text, fontSize: 15 },
  btn: { backgroundColor: colors.gold, borderRadius: radius.sm, padding: 13, alignItems: 'center', marginTop: spacing.md },
  btnText: { color: '#1A1502', fontWeight: '800', fontSize: 13, textTransform: 'uppercase' },
  error: { color: colors.red, fontSize: 13, marginTop: 10 },
  waterRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  waterBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  waterBtnText: { color: colors.text, fontSize: 20 },
  waterCount: { flex: 1, alignItems: 'center' },
  waterN: { color: colors.blue, fontSize: 32, fontWeight: '800' },
  waterL: { color: colors.muted, fontSize: 11, textTransform: 'uppercase' },
  empty: { color: colors.muted, fontSize: 13, textAlign: 'center', paddingVertical: 12 },
  entry: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line },
  entryMain: { color: colors.text, fontWeight: '600' },
  entrySub: { color: colors.muted, fontSize: 12, marginTop: 2 }
});
