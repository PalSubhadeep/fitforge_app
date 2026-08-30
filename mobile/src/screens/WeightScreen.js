import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, radius } from '../theme';
import KeyboardAvoider from '../components/KeyboardAvoider';
import ResponsiveContainer from '../components/ResponsiveContainer';
import api, { apiErrorMessage } from '../api';

function todayISO() { return new Date().toISOString().slice(0, 10); }

export default function WeightScreen() {
  const [date, setDate] = useState(todayISO());
  const [weight, setWeight] = useState('');
  const [error, setError] = useState('');
  const [logs, setLogs] = useState([]);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/api/weight');
      setLogs(data.weight);
    } catch (e) { /* silent */ }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function save() {
    setError('');
    const num = parseFloat(weight);
    if (!date || !num || num <= 0) { setError('Enter a valid weight in kg.'); return; }
    try {
      await api.post('/api/weight', { date, weight: num });
      setWeight('');
      await load();
    } catch (e) { setError(apiErrorMessage(e)); }
  }

  const sortedAsc = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const sortedDesc = [...sortedAsc].reverse();

  return (
    <KeyboardAvoider style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <ResponsiveContainer>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Log Weight</Text>
        <Text style={styles.label}>Date</Text>
        <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.muted} />
        <Text style={styles.label}>Weight (kg)</Text>
        <TextInput style={styles.input} value={weight} onChangeText={setWeight}
          keyboardType="decimal-pad" placeholder="e.g. 70.5" placeholderTextColor={colors.muted} />
        <TouchableOpacity style={styles.btn} onPress={save}><Text style={styles.btnText}>Save Weight</Text></TouchableOpacity>
        {!!error && <Text style={styles.error}>{error}</Text>}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>History</Text>
        {logs.length === 0 && <Text style={styles.empty}>No weight logged yet.</Text>}
        <FlatList
          data={sortedDesc}
          scrollEnabled={false}
          keyExtractor={(l) => l.date}
          renderItem={({ item }) => {
            const idx = sortedAsc.findIndex((w) => w.date === item.date);
            const prev = sortedAsc[idx - 1];
            const diff = prev ? item.weight - prev.weight : null;
            return (
              <View style={styles.entry}>
                <View>
                  <Text style={styles.entryMain}>{item.weight} kg</Text>
                  <Text style={styles.entrySub}>{item.date}</Text>
                </View>
                {diff !== null && (
                  <Text style={diff > 0 ? styles.deltaUp : diff < 0 ? styles.deltaDown : styles.deltaFlat}>
                    {diff > 0 ? '+' : ''}{diff.toFixed(1)} kg
                  </Text>
                )}
              </View>
            );
          }}
        />
      </View>
      </ResponsiveContainer>
</ScrollView>
</KeyboardAvoider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 40 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: '800', marginBottom: 10 },
  label: { color: colors.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginTop: spacing.sm, marginBottom: 6 },
  input: { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, padding: 12, color: colors.text, fontSize: 15 },
  btn: { backgroundColor: colors.gold, borderRadius: radius.sm, padding: 13, alignItems: 'center', marginTop: spacing.md },
  btnText: { color: '#1A1502', fontWeight: '800', fontSize: 13, textTransform: 'uppercase' },
  error: { color: colors.red, fontSize: 13, marginTop: 10 },
  empty: { color: colors.muted, fontSize: 13, textAlign: 'center', paddingVertical: 12 },
  entry: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line },
  entryMain: { color: colors.text, fontWeight: '700' },
  entrySub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  deltaUp: { color: colors.red, fontWeight: '700' },
  deltaDown: { color: colors.green, fontWeight: '700' },
  deltaFlat: { color: colors.muted, fontWeight: '700' }
});
