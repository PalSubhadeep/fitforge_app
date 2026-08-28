import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, radius } from '../theme';
import ResponsiveContainer from '../components/ResponsiveContainer';
import { computeStreaks } from '../utils/streaks';
import api from '../api';

export default function MonthlyScreen() {
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [activities, setActivities] = useState([]);
  const [food, setFood] = useState([]);
  const [water, setWater] = useState([]);
  const [capacity, setCapacity] = useState(null);
  const [weight, setWeight] = useState([]);

  const load = useCallback(async () => {
    try {
      const [actRes, foodRes, waterRes, weightRes] = await Promise.all([
        api.get('/api/activities'), api.get('/api/food'), api.get('/api/water'), api.get('/api/weight')
      ]);
      setActivities(actRes.data.activities);
      setFood(foodRes.data.food);
      setWater(waterRes.data.logs);
      setCapacity(waterRes.data.capacity);
      setWeight(weightRes.data.weight);
    } catch (e) { /* silent */ }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function shiftMonth(dir) {
    let m = month + dir, y = year;
    if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
    setMonth(m); setYear(y);
  }

  const monthName = new Date(year, month, 1).toLocaleString('default', { month: 'long' });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cap = parseFloat(capacity) || 0;
  const inMonth = (dateStr) => { const d = new Date(dateStr + 'T00:00:00'); return d.getFullYear() === year && d.getMonth() === month; };

  const actsInMonth = activities.filter((a) => inMonth(a.date));
  const foodInMonth = food.filter((f) => inMonth(f.date));
  const waterInMonth = water.filter((w) => inMonth(w.date));
  const weightInMonth = weight.filter((w) => inMonth(w.date)).sort((a, b) => a.date.localeCompare(b.date));

  const totalHours = actsInMonth.reduce((s, a) => s + (parseFloat(a.duration) || 0), 0);
  const totalActPts = actsInMonth.reduce((s, a) => s + a.points, 0);
  const totalFoodPts = foodInMonth.reduce((s, f) => s + f.points, 0);
  const workoutDaySet = {}; actsInMonth.forEach((a) => { workoutDaySet[a.date] = 1; });
  const junkDaySet = {}, cleanDaySet = {};
  foodInMonth.forEach((f) => { if (f.had === 'yes') junkDaySet[f.date] = 1; else cleanDaySet[f.date] = 1; });
  const totalLiters = waterInMonth.reduce((s, w) => s + w.bottles * cap, 0);

  let weightChangeTxt = 'No data';
  if (weightInMonth.length >= 2) {
    const diff = weightInMonth[weightInMonth.length - 1].weight - weightInMonth[0].weight;
    weightChangeTxt = `${diff > 0 ? '+' : ''}${diff.toFixed(1)} kg`;
  } else if (weightInMonth.length === 1) {
    weightChangeTxt = `${weightInMonth[0].weight} kg logged`;
  }

  const workoutDayCount = Object.keys(workoutDaySet).length;
  const consistency = Math.round((workoutDayCount / daysInMonth) * 100);
  const { streakBest, cleanStreakBest } = computeStreaks(activities, food);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ResponsiveContainer>
        <View style={styles.card}>
          <View style={styles.calHead}>
            <TouchableOpacity style={styles.navBtn} onPress={() => shiftMonth(-1)}><Text style={styles.navBtnText}>←</Text></TouchableOpacity>
            <Text style={styles.monthTitle}>{monthName} {year}</Text>
            <TouchableOpacity style={styles.navBtn} onPress={() => shiftMonth(1)}><Text style={styles.navBtnText}>→</Text></TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Overview</Text>
          <View style={styles.statRow}>
            <Stat label="Workout Days" value={`${workoutDayCount}/${daysInMonth}`} />
            <Stat label="Hours Trained" value={totalHours.toFixed(1)} />
            <Stat label="Consistency" value={`${consistency}%`} color={colors.gold} />
          </View>
          <View style={styles.statRow}>
            <Stat label="Junk Days" value={Object.keys(junkDaySet).length} color={colors.red} />
            <Stat label="Clean Days" value={Object.keys(cleanDaySet).length} />
            <Stat label="Points Earned" value={totalActPts + totalFoodPts} color={colors.gold} />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Water &amp; Weight</Text>
          <View style={styles.statRow}>
            <Stat label="Water Total" value={cap ? `${totalLiters.toFixed(1)}L` : '—'} color={colors.blue} />
            <Stat label="Weight Change" value={weightChangeTxt} />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Streaks (All-Time)</Text>
          <View style={styles.statRow}>
            <Stat label="Best Workout Streak" value={streakBest} />
            <Stat label="Best Clean Streak" value={cleanStreakBest} />
          </View>
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
  calHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  navBtn: { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  navBtnText: { color: colors.text },
  monthTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  statRow: { flexDirection: 'row', gap: 10, marginTop: 4, marginBottom: 10, flexWrap: 'wrap' },
  statBox: { flex: 1, minWidth: 90, backgroundColor: colors.surface2, borderRadius: radius.sm, padding: 10, alignItems: 'center' },
  statValue: { color: colors.green, fontSize: 18, fontWeight: '800' },
  statLabel: { color: colors.muted, fontSize: 9, textTransform: 'uppercase', marginTop: 2, textAlign: 'center' }
});
