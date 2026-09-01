import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, radius } from '../theme';
import { useAuth, apiErrorMessage } from '../context/AuthContext';
import ResponsiveContainer from '../components/ResponsiveContainer';
import { SafeAreaView } from 'react-native-safe-area-context';
import { computeStreaks, todayISO } from '../utils/streaks';
import { getMotivationalMessage, getStreakReminderMessage } from '../utils/motivation';
import { refreshDynamicNotificationContent } from '../utils/notifications';
import api from '../api';

function goalStatus(goal) {
  if (goal.done) return { label: 'Done', style: 'down' };
  const today = new Date(todayISO() + 'T00:00:00');
  const due = new Date(goal.deadline + 'T00:00:00');
  const diff = Math.round((due - today) / 86400000);
  if (diff < 0) return { label: `Overdue by ${Math.abs(diff)} day${Math.abs(diff) === 1 ? '' : 's'}`, style: 'up' };
  if (diff === 0) return { label: 'Due today', style: 'flat' };
  return { label: `${diff} day${diff === 1 ? '' : 's'} left`, style: 'flat' };
}

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [rank, setRank] = useState(null);
  const [todayCounts, setTodayCounts] = useState({ workouts: 0, food: 0 });
  const [streaks, setStreaks] = useState({ streakCurrent: 0, cleanStreakCurrent: 0 });
  const [motivation, setMotivation] = useState('');
  const [routine, setRoutine] = useState([]);
  const [goals, setGoals] = useState([]);
  const [capacity, setCapacity] = useState(null);
  const [bottles, setBottles] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [lbRes, actRes, foodRes, routineRes, goalsRes, waterRes] = await Promise.all([
        api.get('/api/leaderboard'),
        api.get('/api/activities'),
        api.get('/api/food'),
        api.get('/api/routine'),
        api.get('/api/goals'),
        api.get('/api/water')
      ]);
      const board = lbRes.data.leaderboard;
      const idx = board.findIndex((r) => r.username === user.username);
      setRank(idx === -1 ? board.length + 1 : idx + 1);

      const t = todayISO();
      setTodayCounts({
        workouts: actRes.data.activities.filter((a) => a.date === t).length,
        food: foodRes.data.food.filter((f) => f.date === t).length
      });
      const computedStreaks = computeStreaks(actRes.data.activities, foodRes.data.food);
      setStreaks(computedStreaks);

      const message = getMotivationalMessage(actRes.data.activities, foodRes.data.food, computedStreaks);
      setMotivation(message);

      setRoutine(routineRes.data.items);
      setGoals(goalsRes.data.goals);
      setCapacity(waterRes.data.capacity);
      const todayWater = waterRes.data.logs.find((w) => w.date === t);
      setBottles(todayWater ? todayWater.bottles : 0);

      // Keep the streak/motivational notifications' text current with the latest
      // data, without ever sending anything immediately or duplicating a schedule.
      refreshDynamicNotificationContent({
        streakBody: getStreakReminderMessage(computedStreaks),
        motivationalBody: message
      }).catch(() => {});
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function toggleRoutine(id) {
    setRoutine((prev) => prev.map((r) => (r.id === id ? { ...r, done: !r.done } : r)));
    try {
      await api.post(`/api/routine/${id}/toggle`, {});
    } catch (e) { /* silent — Routine screen will reconcile on next visit */ }
  }

  async function addBottle(delta) {
    if (!capacity) { navigation.navigate('Water'); return; }
    const prev = bottles;
    setBottles(Math.max(0, prev + delta));
    try {
      const { data } = await api.post('/api/water/log', { date: todayISO(), delta });
      setBottles(data.bottles);
    } catch (e) {
      setBottles(prev);
    }
  }

  const points = user?.points ?? 0;
  const routinePreview = routine.slice(0, 3);
  const upcomingGoals = [...goals]
    .filter((g) => !g.done)
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
    .slice(0, 3);
  const cap = parseFloat(capacity) || 0;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.gold} />}>
      <ResponsiveContainer>
        <View style={styles.topbar}>
          <View>
            <Text style={styles.h1}>FITFORGE</Text>
            <Text style={styles.sub}>{user?.username}</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutText}>Log out</Text>
          </TouchableOpacity>
        </View>

        {!!motivation && (
          <View style={styles.banner}>
            <Text style={styles.bannerTag}>Today</Text>
            <Text style={styles.bannerText}>{motivation}</Text>
          </View>
        )}

        <View style={styles.scoreboard}>
          <Text style={styles.scoreLabel}>Total Points</Text>
          <Text style={styles.scoreValue}>{points}</Text>
          <View style={styles.statRow}>
            <Stat label="Rank" value={`#${rank ?? '—'}`} />
            <Stat label="Today Workouts" value={todayCounts.workouts} />
            <Stat label="Today Food Logs" value={todayCounts.food} color={colors.red} />
          </View>
        </View>

        <View style={styles.streakRow}>
          <View style={styles.streakBox}>
            <Text style={styles.streakIcon}>🔥</Text>
            <Text style={styles.streakValue}>{streaks.streakCurrent}</Text>
            <Text style={styles.streakLabel}>Workout Streak</Text>
          </View>
          <View style={styles.streakBox}>
            <Text style={styles.streakIcon}>🌱</Text>
            <Text style={styles.streakValue}>{streaks.cleanStreakCurrent}</Text>
            <Text style={styles.streakLabel}>Clean Eating Streak</Text>
          </View>
        </View>

        {!!error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Daily Routine</Text>
          {routine.length === 0 && <Text style={styles.empty}>No daily routine set yet.</Text>}
          {routinePreview.map((r) => (
            <View key={r.id} style={styles.routineRow}>
              <TouchableOpacity style={[styles.chk, r.done && styles.chkDone]} onPress={() => toggleRoutine(r.id)}>
                {r.done && <Text style={styles.chkMark}>✓</Text>}
              </TouchableOpacity>
              <Text style={[styles.routineName, r.done && styles.routineNameDone]}>{r.name}</Text>
            </View>
          ))}
          <TouchableOpacity style={styles.btnOutlineSm} onPress={() => navigation.navigate('Routine')}>
            <Text style={styles.btnOutlineSmText}>{routine.length ? 'Manage Routine' : 'Set Up Routine'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Goals</Text>
          {upcomingGoals.length === 0 && <Text style={styles.empty}>No goals yet.</Text>}
          {upcomingGoals.map((g) => {
            const st = goalStatus(g);
            return (
              <View key={g.id} style={styles.goalRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.goalText}>{g.text}</Text>
                  <Text style={styles.goalSub}>Due {g.deadline}</Text>
                </View>
                <Text style={st.style === 'up' ? styles.deltaUp : st.style === 'down' ? styles.deltaDown : styles.deltaFlat}>
                  {st.label}
                </Text>
              </View>
            );
          })}
          <TouchableOpacity style={styles.btnOutlineSm} onPress={() => navigation.navigate('Goals')}>
            <Text style={styles.btnOutlineSmText}>{goals.length ? 'Manage Goals' : 'Set a Goal'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Water Intake</Text>
          {cap ? (
            <View style={styles.waterRow}>
              <TouchableOpacity style={styles.waterBtn} onPress={() => addBottle(-1)}><Text style={styles.waterBtnText}>-</Text></TouchableOpacity>
              <View style={styles.waterCount}>
                <Text style={styles.waterN}>{bottles}</Text>
                <Text style={styles.waterL}>bottles · {(bottles * cap).toFixed(2)} L today</Text>
              </View>
              <TouchableOpacity style={styles.waterBtn} onPress={() => addBottle(1)}><Text style={styles.waterBtnText}>+</Text></TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.empty}>Set your bottle size to start tracking.</Text>
              <TouchableOpacity style={styles.btnOutlineSm} onPress={() => navigation.navigate('Water')}>
                <Text style={styles.btnOutlineSmText}>Set Up Water Tracker</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Log</Text>
          <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Activity')}>
            <Text style={styles.btnText}>+ Log a Workout</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnOutline} onPress={() => navigation.navigate('Food')}>
            <Text style={styles.btnOutlineText}>+ Log Today's Food</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>More Tools</Text>
          <Text style={styles.hint}>Weekly &amp; monthly analysis, weight and calorie tools live under More in the bottom bar.</Text>
          <TouchableOpacity style={styles.btnOutlineSm} onPress={() => navigation.navigate('More')}>
            <Text style={styles.btnOutlineSmText}>Open More</Text>
          </TouchableOpacity>
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 40 },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  h1: { color: colors.gold, fontSize: 26, fontWeight: '800', letterSpacing: 1 },
  sub: { color: colors.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  logoutBtn: { borderWidth: 1, borderColor: colors.line, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  logoutText: { color: colors.muted, fontSize: 11, textTransform: 'uppercase' },
  banner: { backgroundColor: 'rgba(232,172,61,0.10)', borderWidth: 1, borderColor: colors.gold, borderRadius: radius.lg, padding: 14, marginBottom: spacing.md },
  bannerTag: { color: colors.gold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: '700' },
  bannerText: { color: colors.text, fontSize: 14, marginTop: 6, lineHeight: 19 },
  scoreboard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: 20, alignItems: 'center', marginBottom: spacing.md },
  scoreLabel: { color: colors.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 2 },
  scoreValue: { color: colors.gold, fontSize: 44, fontWeight: '800', marginVertical: 6 },
  statRow: { flexDirection: 'row', gap: 10, marginTop: 12, width: '100%', flexWrap: 'wrap' },
  statBox: { flex: 1, minWidth: 80, backgroundColor: colors.surface2, borderRadius: radius.sm, padding: 10, alignItems: 'center' },
  statValue: { color: colors.green, fontSize: 20, fontWeight: '800' },
  statLabel: { color: colors.muted, fontSize: 9, textTransform: 'uppercase', marginTop: 2, textAlign: 'center' },
  streakRow: { flexDirection: 'row', gap: 10, marginBottom: spacing.md },
  streakBox: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: 14, alignItems: 'center' },
  streakIcon: { fontSize: 20 },
  streakValue: { color: colors.gold, fontSize: 24, fontWeight: '800' },
  streakLabel: { color: colors.muted, fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center', marginTop: 2 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: '800', marginBottom: 10 },
  hint: { color: colors.muted, fontSize: 12, marginBottom: 10 },
  empty: { color: colors.muted, fontSize: 13, marginBottom: 8 },
  btn: { backgroundColor: colors.gold, borderRadius: radius.sm, padding: 13, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#1A1502', fontWeight: '800', fontSize: 13, textTransform: 'uppercase' },
  btnOutline: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, padding: 13, alignItems: 'center', marginTop: 10 },
  btnOutlineText: { color: colors.text, fontWeight: '700', fontSize: 13, textTransform: 'uppercase' },
  btnOutlineSm: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, paddingVertical: 8, paddingHorizontal: 14, alignItems: 'center', alignSelf: 'flex-start', marginTop: 6 },
  btnOutlineSmText: { color: colors.text, fontWeight: '700', fontSize: 12, textTransform: 'uppercase' },
  error: { color: colors.red, fontSize: 13, marginBottom: 10 },
  routineRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  chk: { width: 22, height: 22, borderRadius: 6, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  chkDone: { backgroundColor: colors.green, borderColor: colors.green },
  chkMark: { color: '#0D2016', fontSize: 13, fontWeight: '800' },
  routineName: { flex: 1, color: colors.text, fontSize: 14 },
  routineNameDone: { color: colors.muted, textDecorationLine: 'line-through' },
  goalRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.line },
  goalText: { color: colors.text, fontSize: 14, fontWeight: '600' },
  goalSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  deltaUp: { color: colors.red, fontWeight: '700', fontSize: 12 },
  deltaDown: { color: colors.green, fontWeight: '700', fontSize: 12 },
  deltaFlat: { color: colors.muted, fontWeight: '700', fontSize: 12 },
  waterRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  waterBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  waterBtnText: { color: colors.text, fontSize: 20 },
  waterCount: { flex: 1, alignItems: 'center' },
  waterN: { color: colors.blue, fontSize: 32, fontWeight: '800' },
  waterL: { color: colors.muted, fontSize: 11, textTransform: 'uppercase' }
});
