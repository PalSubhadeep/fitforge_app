import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, radius } from '../theme';
import { useAuth, apiErrorMessage } from '../context/AuthContext';
import ResponsiveContainer from '../components/ResponsiveContainer';
import { SafeAreaView } from 'react-native-safe-area-context';
import { computeStreaks, todayISO } from '../utils/streaks';
import api from '../api';

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [rank, setRank] = useState(null);
  const [todayCounts, setTodayCounts] = useState({ workouts: 0, food: 0 });
  const [streaks, setStreaks] = useState({ streakCurrent: 0, cleanStreakCurrent: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [lbRes, actRes, foodRes] = await Promise.all([
        api.get('/api/leaderboard'),
        api.get('/api/activities'),
        api.get('/api/food')
      ]);
      const board = lbRes.data.leaderboard;
      const idx = board.findIndex((r) => r.username === user.username);
      setRank(idx === -1 ? board.length + 1 : idx + 1);

      const t = todayISO();
      setTodayCounts({
        workouts: actRes.data.activities.filter((a) => a.date === t).length,
        food: foodRes.data.food.filter((f) => f.date === t).length
      });
      setStreaks(computeStreaks(actRes.data.activities, foodRes.data.food));
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const points = user?.points ?? 0;

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
          <Text style={styles.hint}>Goals, routine, water, weight, calories, and weekly/monthly analysis all live under More in the bottom bar.</Text>
          <TouchableOpacity style={styles.btnOutline} onPress={() => navigation.navigate('More')}>
            <Text style={styles.btnOutlineText}>Open More</Text>
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
  btn: { backgroundColor: colors.gold, borderRadius: radius.sm, padding: 13, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#1A1502', fontWeight: '800', fontSize: 13, textTransform: 'uppercase' },
  btnOutline: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, padding: 13, alignItems: 'center', marginTop: 10 },
  btnOutlineText: { color: colors.text, fontWeight: '700', fontSize: 13, textTransform: 'uppercase' },
  error: { color: colors.red, fontSize: 13, marginBottom: 10 }
});
