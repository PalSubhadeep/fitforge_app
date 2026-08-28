import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, radius } from '../theme';
import ResponsiveContainer from '../components/ResponsiveContainer';
import api, { apiErrorMessage } from '../api';

function todayISO() { return new Date().toISOString().slice(0, 10); }

function goalStatus(goal) {
  if (goal.done) return { label: 'Done', style: 'down' };
  const today = new Date(todayISO() + 'T00:00:00');
  const due = new Date(goal.deadline + 'T00:00:00');
  const diff = Math.round((due - today) / 86400000);
  if (diff < 0) return { label: `Overdue by ${Math.abs(diff)} day${Math.abs(diff) === 1 ? '' : 's'}`, style: 'up' };
  if (diff === 0) return { label: 'Due today', style: 'flat' };
  return { label: `${diff} day${diff === 1 ? '' : 's'} left`, style: 'flat' };
}

export default function GoalsScreen() {
  const [goals, setGoals] = useState([]);
  const [text, setText] = useState('');
  const [deadline, setDeadline] = useState(todayISO());
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/api/goals');
      setGoals(data.goals);
    } catch (e) { /* silent */ }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function addGoal() {
    setError('');
    if (!text.trim()) { setError('Enter a goal.'); return; }
    if (!deadline.trim()) { setError('Enter a deadline date.'); return; }
    try {
      await api.post('/api/goals', { text: text.trim(), deadline: deadline.trim() });
      setText('');
      await load();
    } catch (e) { setError(apiErrorMessage(e)); }
  }
  async function toggleGoal(id) {
    await api.patch(`/api/goals/${id}/toggle`);
    load();
  }
  async function removeGoal(id) {
    await api.delete(`/api/goals/${id}`);
    load();
  }

  const sorted = [...goals].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return a.deadline.localeCompare(b.deadline);
  });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ResponsiveContainer>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your Goals</Text>
        {sorted.length === 0 && <Text style={styles.empty}>No goals yet — set your first target below.</Text>}
        <FlatList
          data={sorted}
          scrollEnabled={false}
          keyExtractor={(g) => String(g.id)}
          renderItem={({ item }) => {
            const st = goalStatus(item);
            return (
              <View style={styles.row}>
                <TouchableOpacity style={[styles.chk, item.done && styles.chkDone]} onPress={() => toggleGoal(item.id)}>
                  {item.done && <Text style={styles.chkMark}>✓</Text>}
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, item.done && styles.nameDone]}>{item.text}</Text>
                  <Text style={styles.sub}>
                    Deadline: {item.deadline} ·{' '}
                    <Text style={st.style === 'up' ? styles.up : st.style === 'down' ? styles.down : styles.flat}>{st.label}</Text>
                  </Text>
                </View>
                <TouchableOpacity onPress={() => removeGoal(item.id)}><Text style={styles.remove}>×</Text></TouchableOpacity>
              </View>
            );
          }}
        />

        <Text style={styles.label}>Goal</Text>
        <TextInput style={styles.input} value={text} onChangeText={setText}
          placeholder="e.g. Run 10km without stopping" placeholderTextColor={colors.muted} />
        <Text style={styles.label}>Deadline</Text>
        <TextInput style={styles.input} value={deadline} onChangeText={setDeadline}
          placeholder="YYYY-MM-DD" placeholderTextColor={colors.muted} />
        <TouchableOpacity style={styles.btn} onPress={addGoal}><Text style={styles.btnText}>Add Goal</Text></TouchableOpacity>
        {!!error && <Text style={styles.error}>{error}</Text>}
      </View>
      </ResponsiveContainer>
</ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 40 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: spacing.md },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: '800', marginBottom: 10 },
  empty: { color: colors.muted, fontSize: 13, textAlign: 'center', paddingVertical: 12 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line },
  chk: { width: 22, height: 22, borderRadius: 6, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  chkDone: { backgroundColor: colors.green, borderColor: colors.green },
  chkMark: { color: '#0D2016', fontSize: 13, fontWeight: '800' },
  name: { color: colors.text, fontSize: 14, fontWeight: '600' },
  nameDone: { color: colors.muted, textDecorationLine: 'line-through' },
  sub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  up: { color: colors.red, fontWeight: '700' },
  down: { color: colors.green, fontWeight: '700' },
  flat: { color: colors.muted, fontWeight: '700' },
  remove: { color: colors.muted, fontSize: 18, paddingHorizontal: 6 },
  label: { color: colors.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginTop: spacing.sm, marginBottom: 6 },
  input: { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, padding: 12, color: colors.text, fontSize: 15 },
  btn: { backgroundColor: colors.gold, borderRadius: radius.sm, padding: 13, alignItems: 'center', marginTop: spacing.md },
  btnText: { color: '#1A1502', fontWeight: '800', fontSize: 13, textTransform: 'uppercase' },
  error: { color: colors.red, fontSize: 13, marginTop: 10 }
});
