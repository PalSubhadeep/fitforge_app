import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, radius } from '../theme';
import ResponsiveContainer from '../components/ResponsiveContainer';
import api from '../api';

function last7Dates() {
  const out = [];
  for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); out.push(d.toISOString().slice(0, 10)); }
  return out;
}

export default function WeeklyScreen() {
  const [activities, setActivities] = useState([]);
  const [food, setFood] = useState([]);
  const [water, setWater] = useState([]);
  const [capacity, setCapacity] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [actRes, foodRes, waterRes] = await Promise.all([
        api.get('/api/activities'), api.get('/api/food'), api.get('/api/water')
      ]);
      setActivities(actRes.data.activities);
      setFood(foodRes.data.food);
      setWater(waterRes.data.logs);
      setCapacity(waterRes.data.capacity);
    } catch (e) { /* silent */ } finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const dates = last7Dates();
  const cap = parseFloat(capacity) || 0;
  let totalHours = 0, actPts = 0, foodPts = 0, workoutDays = 0, junkDays = 0, cleanDays = 0, totalLiters = 0;

  const rows = dates.map((date) => {
    const acts = activities.filter((a) => a.date === date);
    const hrs = acts.reduce((s, a) => s + (parseFloat(a.duration) || 0), 0);
    const pts = acts.reduce((s, a) => s + a.points, 0);
    totalHours += hrs; actPts += pts;
    if (acts.length) workoutDays++;

    const foodEntry = food.find((f) => f.date === date);
    let label = '—';
    if (foodEntry) {
      foodPts += foodEntry.points;
      if (foodEntry.had === 'yes') { junkDays++; label = 'Junk'; } else { cleanDays++; label = 'Clean'; }
    }
    const wEntry = water.find((w) => w.date === date);
    const liters = wEntry ? wEntry.bottles * cap : 0;
    totalLiters += liters;
    const dow = new Date(date + 'T00:00:00').toLocaleDateString('default', { weekday: 'short' });
    return { date, dow, hrs, label, liters };
  });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.gold} />}>
      <ResponsiveContainer>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Last 7 Days</Text>
          <View style={styles.statRow}>
            <Stat label="Hours Trained" value={totalHours.toFixed(1)} />
            <Stat label="Workout Days" value={workoutDays} />
            <Stat label="Points Earned" value={actPts + foodPts} color={colors.gold} />
          </View>
          <View style={styles.statRow}>
            <Stat label="Junk Days" value={junkDays} color={colors.red} />
            <Stat label="Clean Days" value={cleanDays} />
            <Stat label="Water" value={cap ? `${totalLiters.toFixed(1)}L` : '—'} color={colors.blue} />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Day by Day</Text>
          <View style={styles.tableHead}>
            <Text style={[styles.th, { flex: 1 }]}>Day</Text>
            <Text style={[styles.th, { flex: 1 }]}>Trained</Text>
            <Text style={[styles.th, { flex: 1 }]}>Food</Text>
            <Text style={[styles.th, { flex: 1 }]}>Water</Text>
          </View>
          {rows.map((r) => (
            <View key={r.date} style={styles.tableRow}>
              <Text style={[styles.td, { flex: 1 }]}>{r.dow}</Text>
              <Text style={[styles.td, { flex: 1 }]}>{r.hrs.toFixed(2)}h</Text>
              <Text style={[styles.td, { flex: 1 }]}>{r.label}</Text>
              <Text style={[styles.td, { flex: 1 }]}>{cap ? `${r.liters.toFixed(1)}L` : '—'}</Text>
            </View>
          ))}
        </View>
      </ResponsiveContainer>
    </ScrollView>
  );
}

function Stat({ label, value, color }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 40 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: '800', marginBottom: 10 },
  statRow: { flexDirection: 'row', gap: 10, marginTop: 4, marginBottom: 10, flexWrap: 'wrap' },
  statBox: { flex: 1, minWidth: 90, backgroundColor: colors.surface2, borderRadius: radius.sm, padding: 10, alignItems: 'center' },
  statValue: { color: colors.green, fontSize: 18, fontWeight: '800' },
  statLabel: { color: colors.muted, fontSize: 9, textTransform: 'uppercase', marginTop: 2, textAlign: 'center' },
  tableHead: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.line, paddingBottom: 6, marginBottom: 4 },
  th: { color: colors.muted, fontSize: 10, textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.line },
  td: { color: colors.text, fontSize: 12 }
});
