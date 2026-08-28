import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, radius } from '../theme';
import ResponsiveContainer from '../components/ResponsiveContainer';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../api';

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function CalendarScreen() {
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [activities, setActivities] = useState([]);
  const [food, setFood] = useState([]);

  const load = useCallback(async () => {
    try {
      const [actRes, foodRes] = await Promise.all([api.get('/api/activities'), api.get('/api/food')]);
      setActivities(actRes.data.activities);
      setFood(foodRes.data.food);
    } catch (e) { /* silent */ }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function shiftMonth(dir) {
    let m = month + dir, y = year;
    if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
    setMonth(m); setYear(y);
  }

  const first = new Date(year, month, 1);
  const startDow = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = first.toLocaleString('default', { month: 'long' });

  const actDays = {}, junkYesDays = {}, junkNoDays = {};
  activities.forEach((a) => {
    const d = new Date(a.date + 'T00:00:00');
    if (d.getFullYear() === year && d.getMonth() === month) actDays[d.getDate()] = true;
  });
  food.forEach((f) => {
    const d = new Date(f.date + 'T00:00:00');
    if (d.getFullYear() === year && d.getMonth() === month) {
      if (f.had === 'yes') junkYesDays[d.getDate()] = true; else junkNoDays[d.getDate()] = true;
    }
  });

  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
      <ResponsiveContainer>
      <View style={styles.card}>
        <View style={styles.calHead}>
          <TouchableOpacity style={styles.navBtn} onPress={() => shiftMonth(-1)}><Text style={styles.navBtnText}>←</Text></TouchableOpacity>
          <Text style={styles.monthTitle}>{monthName} {year}</Text>
          <TouchableOpacity style={styles.navBtn} onPress={() => shiftMonth(1)}><Text style={styles.navBtnText}>→</Text></TouchableOpacity>
        </View>

        <View style={styles.grid}>
          {DOW.map((d, i) => <Text key={'dow' + i} style={styles.dow}>{d}</Text>)}
          {cells.map((day, i) => (
            <View key={i} style={[styles.cell, day === null && styles.cellEmpty]}>
              {day !== null && (
                <>
                  <Text style={styles.cellText}>{day}</Text>
                  <View style={styles.dots}>
                    {actDays[day] && <View style={[styles.dot, { backgroundColor: colors.green }]} />}
                    {junkYesDays[day] && <View style={[styles.dot, { backgroundColor: colors.red }]} />}
                  </View>
                </>
              )}
            </View>
          ))}
        </View>

        <View style={styles.legend}>
          <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: colors.green }]} /><Text style={styles.legendText}>Workout day</Text></View>
          <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: colors.red }]} /><Text style={styles.legendText}>Junk food day</Text></View>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.statRow}>
          <Stat label="Workout Days" value={Object.keys(actDays).length} color={colors.green} />
          <Stat label="Junk Food Days" value={Object.keys(junkYesDays).length} color={colors.red} />
          <Stat label="Clean Days" value={Object.keys(junkNoDays).length} />
        </View>
      </View>
      </ResponsiveContainer>
</ScrollView>
</SafeAreaView>
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

const CELL_SIZE = '13.8%';

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 40 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  calHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  navBtn: { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  navBtnText: { color: colors.text },
  monthTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  dow: { width: CELL_SIZE, textAlign: 'center', color: colors.muted, fontSize: 10, textTransform: 'uppercase', marginBottom: 6 },
  cell: { width: CELL_SIZE, aspectRatio: 1, borderRadius: 8, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  cellEmpty: { backgroundColor: 'transparent', borderWidth: 0 },
  cellText: { color: colors.text, fontSize: 12 },
  dots: { flexDirection: 'row', gap: 2, position: 'absolute', bottom: 4 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  legend: { flexDirection: 'row', gap: 16, marginTop: 12, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendText: { color: colors.muted, fontSize: 11 },
  statRow: { flexDirection: 'row', gap: 10 },
  statBox: { flex: 1, backgroundColor: colors.surface2, borderRadius: radius.sm, padding: 12, alignItems: 'center' },
  statValue: { color: colors.green, fontSize: 22, fontWeight: '800' },
  statLabel: { color: colors.muted, fontSize: 9, textTransform: 'uppercase', marginTop: 2, textAlign: 'center' }
});
