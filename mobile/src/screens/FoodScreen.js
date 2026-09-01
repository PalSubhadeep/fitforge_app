import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, FlatList, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, radius } from '../theme';
import ResponsiveContainer from '../components/ResponsiveContainer';
import { SafeAreaView } from 'react-native-safe-area-context';
import KeyboardAvoider from '../components/KeyboardAvoider';
import Toast from '../components/Toast';
import { useAuth, apiErrorMessage } from '../context/AuthContext';
import api from '../api';

function todayISO() { return new Date().toISOString().slice(0, 10); }

export default function FoodScreen() {
  const { updatePoints } = useAuth();
  const [date, setDate] = useState(todayISO());
  const [had, setHad] = useState(null); // 'yes' | 'no'
  const [food, setFood] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [list, setList] = useState([]);
  const [toastVisible, setToastVisible] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/api/food');
      setList(data.food);
    } catch (e) { /* silent */ }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function handleSave() {
    setError('');
    if (!had) { setError('Select Yes or No.'); return; }
    if (!food.trim()) { setError('Enter the food name.'); return; }

    setSaving(true);
    try {
      const { data } = await api.post('/api/food', { date, food: food.trim(), had });
      updatePoints(data.points);
      setFood(''); setHad(null);
      await load();
      setToastVisible(true);
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <KeyboardAvoider>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <ResponsiveContainer>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Log Today's Food</Text>

        <Text style={styles.label}>Date</Text>
        <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.muted} />

        <Text style={styles.label}>Was it junk food?</Text>
        <View style={styles.ynRow}>
          <TouchableOpacity
            style={[styles.ynBtn, had === 'yes' && styles.ynYesActive]}
            onPress={() => setHad('yes')}>
            <Text style={[styles.ynText, had === 'yes' && { color: colors.red }]}>Yes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.ynBtn, had === 'no' && styles.ynNoActive]}
            onPress={() => setHad('no')}>
            <Text style={[styles.ynText, had === 'no' && { color: colors.green }]}>No</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Food name</Text>
        <TextInput style={styles.input} value={food} onChangeText={setFood}
          placeholder="e.g. pizza, chips, salad" placeholderTextColor={colors.muted} />

        <TouchableOpacity style={styles.btn} onPress={handleSave} disabled={saving}>
          <Text style={styles.btnText}>{saving ? 'Saving…' : 'Save Entry'}</Text>
        </TouchableOpacity>
        {!!error && <Text style={styles.error}>{error}</Text>}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>History</Text>
        {list.length === 0 && <Text style={styles.empty}>No entries yet.</Text>}
        <FlatList
          data={list}
          scrollEnabled={false}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={styles.entry}>
              <View style={{ flex: 1 }}>
                <Text style={styles.entryMain}>{item.food}</Text>
                <Text style={styles.entrySub}>{item.date} · {item.had === 'yes' ? 'Had junk food' : 'Stayed clean'}</Text>
              </View>
              <Text style={item.points > 0 ? styles.ptsPos : styles.ptsNeg}>{item.points > 0 ? '+' : ''}{item.points}</Text>
            </View>
          )}
        />
      </View>
      </ResponsiveContainer>
</ScrollView>
<Toast message="Food entry saved successfully" visible={toastVisible} onHidden={() => setToastVisible(false)} />
</KeyboardAvoider>
</SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 40 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: '800', marginBottom: 10 },
  label: { color: colors.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginTop: spacing.sm, marginBottom: 6 },
  input: { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, padding: 12, color: colors.text, fontSize: 15 },
  ynRow: { flexDirection: 'row', gap: 10 },
  ynBtn: { flex: 1, padding: 12, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface2, alignItems: 'center' },
  ynYesActive: { backgroundColor: 'rgba(232,100,61,0.18)', borderColor: colors.red },
  ynNoActive: { backgroundColor: 'rgba(111,207,151,0.18)', borderColor: colors.green },
  ynText: { color: colors.text, fontWeight: '700', textTransform: 'uppercase', fontSize: 13 },
  btn: { backgroundColor: colors.gold, borderRadius: radius.sm, padding: 13, alignItems: 'center', marginTop: spacing.md },
  btnText: { color: '#1A1502', fontWeight: '800', fontSize: 13, textTransform: 'uppercase' },
  error: { color: colors.red, fontSize: 13, marginTop: 10 },
  empty: { color: colors.muted, fontSize: 13, textAlign: 'center', paddingVertical: 16 },
  entry: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line },
  entryMain: { color: colors.text, fontSize: 14, fontWeight: '600' },
  entrySub: { color: colors.muted, fontSize: 11, marginTop: 2 },
  ptsPos: { color: colors.green, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  ptsNeg: { color: colors.red, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }
});
