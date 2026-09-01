import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, FlatList, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, radius } from '../theme';
import ResponsiveContainer from '../components/ResponsiveContainer';
import { SafeAreaView } from 'react-native-safe-area-context';
import KeyboardAvoider from '../components/KeyboardAvoider';
import Toast from '../components/Toast';
import { useAuth, apiErrorMessage } from '../context/AuthContext';
import api from '../api';

const ACTIVITY_TYPES = ['Gym', 'Running', 'Swimming', 'Yoga', 'Cycling', 'Sports', 'Other'];
const MAX_HOURS = 12;
function todayISO() { return new Date().toISOString().slice(0, 10); }

export default function ActivityScreen() {
  const { updatePoints } = useAuth();
  const [date, setDate] = useState(todayISO());
  const [type, setType] = useState(ACTIVITY_TYPES[0]);
  const [detail, setDetail] = useState('');
  const [duration, setDuration] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [list, setList] = useState([]);
  const [toastVisible, setToastVisible] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/api/activities');
      setList(data.activities);
    } catch (e) { /* silent on list refresh */ }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function handleSave() {
    setError('');
    if (!detail.trim()) { setError('Add a short detail for this workout.'); return; }
    const durNum = parseFloat(duration);
    if (!durNum || durNum <= 0) { setError('Enter a duration in hours.'); return; }
    if (durNum > MAX_HOURS) { setError(`Max ${MAX_HOURS} hours allowed per workout entry.`); return; }

    setSaving(true);
    try {
      const { data } = await api.post('/api/activities', { date, type, detail: detail.trim(), duration: durNum });
      updatePoints(data.points);
      setDetail(''); setDuration('');
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
        <Text style={styles.cardTitle}>Log a Workout</Text>

        <Text style={styles.label}>Date</Text>
        <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.muted} />

        <Text style={styles.label}>Type</Text>
        <View style={styles.pickerWrap}>
          <Picker selectedValue={type} onValueChange={setType} style={styles.picker} dropdownIconColor={colors.text}>
            {ACTIVITY_TYPES.map((t) => <Picker.Item key={t} label={t} value={t} color={Platform.OS === 'ios' ? colors.text : undefined} />)}
          </Picker>
        </View>

        <Text style={styles.label}>Details</Text>
        <TextInput style={styles.input} value={detail} onChangeText={setDetail}
          placeholder="e.g. chest & tricep, or 4 laps, or 5 km" placeholderTextColor={colors.muted} />

        <Text style={styles.label}>Duration (hours, max {MAX_HOURS})</Text>
        <TextInput style={styles.input} value={duration} onChangeText={setDuration}
          keyboardType="decimal-pad" placeholder="1" placeholderTextColor={colors.muted} />

        <TouchableOpacity style={styles.btn} onPress={handleSave} disabled={saving}>
          <Text style={styles.btnText}>{saving ? 'Saving…' : 'Save Workout'}</Text>
        </TouchableOpacity>
        {!!error && <Text style={styles.error}>{error}</Text>}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>History</Text>
        {list.length === 0 && <Text style={styles.empty}>No workouts logged yet.</Text>}
        <FlatList
          data={list}
          scrollEnabled={false}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={styles.entry}>
              <View style={{ flex: 1 }}>
                <Text style={styles.entryMain}>{item.type} — {item.detail}</Text>
                <Text style={styles.entrySub}>{item.date} · {item.duration} hr</Text>
              </View>
              <Text style={styles.ptsPos}>+{item.points}</Text>
            </View>
          )}
        />
      </View>
      </ResponsiveContainer>
</ScrollView>
<Toast message="Workout saved successfully" visible={toastVisible} onHidden={() => setToastVisible(false)} />
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
  pickerWrap: { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm },
  picker: { color: colors.text },
  btn: { backgroundColor: colors.gold, borderRadius: radius.sm, padding: 13, alignItems: 'center', marginTop: spacing.md },
  btnText: { color: '#1A1502', fontWeight: '800', fontSize: 13, textTransform: 'uppercase' },
  error: { color: colors.red, fontSize: 13, marginTop: 10 },
  empty: { color: colors.muted, fontSize: 13, textAlign: 'center', paddingVertical: 16 },
  entry: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line },
  entryMain: { color: colors.text, fontSize: 14, fontWeight: '600' },
  entrySub: { color: colors.muted, fontSize: 11, marginTop: 2 },
  ptsPos: { color: colors.green, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }
});
