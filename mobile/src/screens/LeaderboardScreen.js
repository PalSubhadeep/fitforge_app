import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, radius } from '../theme';
import ResponsiveContainer from '../components/ResponsiveContainer';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth, apiErrorMessage } from '../context/AuthContext';
import api from '../api';

export default function LeaderboardScreen() {
  const { user, leaderboardVersion } = useAuth();
  const [board, setBoard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const { data } = await api.get('/api/leaderboard');
      setBoard(data.leaderboard);
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => { load(); }, [leaderboardVersion, load]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ResponsiveContainer style={{ flex: 1 }}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Leaderboard</Text>
          {!!error && <Text style={styles.error}>{error}</Text>}
          {board.length === 0 && !loading && <Text style={styles.empty}>No players yet.</Text>}
          <FlatList
            data={board}
            keyExtractor={(item) => item.username}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.gold} />}
            renderItem={({ item, index }) => (
              <View style={styles.row}>
                <Text style={[styles.rank, index === 0 && { color: colors.gold }]}>{index + 1}</Text>
                <Text style={styles.name}>
                  {item.username}{item.username === user.username ? '  •  You' : ''}
                </Text>
                <Text style={styles.pts}>{item.points}</Text>
              </View>
            )}
          />
        </View>
      </ResponsiveContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
  card: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: spacing.md },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: '800', marginBottom: 10 },
  error: { color: colors.red, fontSize: 13, marginBottom: 10 },
  empty: { color: colors.muted, fontSize: 13, textAlign: 'center', paddingVertical: 16 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line, gap: 12 },
  rank: { color: colors.muted, fontSize: 18, fontWeight: '800', width: 24, textAlign: 'center' },
  name: { flex: 1, color: colors.text, fontWeight: '700', fontSize: 15 },
  pts: { color: colors.gold, fontWeight: '700' }
});
