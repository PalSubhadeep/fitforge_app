import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, radius } from '../theme';
import KeyboardAvoider from '../components/KeyboardAvoider';
import ResponsiveContainer from '../components/ResponsiveContainer';
import api from '../api';

export default function RoutineScreen() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/api/routine');
      setItems(data.items);
    } catch (e) { /* silent */ }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function addItem() {
    if (!name.trim()) return;
    await api.post('/api/routine', { name: name.trim() });
    setName('');
    load();
  }
  async function toggleItem(id) {
    await api.post(`/api/routine/${id}/toggle`, {});
    load();
  }
  async function removeItem(id) {
    await api.delete(`/api/routine/${id}`);
    load();
  }

  return (
    <KeyboardAvoider style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <ResponsiveContainer>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today, checked off</Text>
        {items.length === 0 && <Text style={styles.empty}>No routine items yet — add your first one below.</Text>}
        <FlatList
          data={items}
          scrollEnabled={false}
          keyExtractor={(i) => String(i.id)}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <TouchableOpacity style={[styles.chk, item.done && styles.chkDone]} onPress={() => toggleItem(item.id)}>
                {item.done && <Text style={styles.chkMark}>✓</Text>}
              </TouchableOpacity>
              <Text style={[styles.name, item.done && styles.nameDone]}>{item.name}</Text>
              <TouchableOpacity onPress={() => removeItem(item.id)}><Text style={styles.remove}>×</Text></TouchableOpacity>
            </View>
          )}
        />
        <View style={styles.addRow}>
          <TextInput style={styles.input} value={name} onChangeText={setName}
            placeholder="e.g. Morning stretch, Gym session" placeholderTextColor={colors.muted} />
          <TouchableOpacity style={styles.addBtn} onPress={addItem}><Text style={styles.addBtnText}>Add</Text></TouchableOpacity>
        </View>
        <Text style={styles.hint}>Checkboxes reset per day — the list stays, you just tick what you did today.</Text>
      </View>
      </ResponsiveContainer>
</ScrollView>
</KeyboardAvoider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 40 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: spacing.md },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: '800', marginBottom: 10 },
  empty: { color: colors.muted, fontSize: 13, textAlign: 'center', paddingVertical: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line },
  chk: { width: 22, height: 22, borderRadius: 6, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  chkDone: { backgroundColor: colors.green, borderColor: colors.green },
  chkMark: { color: '#0D2016', fontSize: 13, fontWeight: '800' },
  name: { flex: 1, color: colors.text, fontSize: 14 },
  nameDone: { color: colors.muted, textDecorationLine: 'line-through' },
  remove: { color: colors.muted, fontSize: 18, paddingHorizontal: 6 },
  addRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  input: { flex: 1, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, padding: 11, color: colors.text },
  addBtn: { backgroundColor: colors.gold, borderRadius: radius.sm, paddingHorizontal: 18, justifyContent: 'center' },
  addBtnText: { color: '#1A1502', fontWeight: '800' },
  hint: { color: colors.muted, fontSize: 12, marginTop: 10 }
});
