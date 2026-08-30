import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, radius } from '../theme';
import ResponsiveContainer from '../components/ResponsiveContainer';
import { CATEGORIES, getAllPreferences, setCategoryEnabled, requestPermissions } from '../utils/notifications';

const DESCRIPTIONS = {
  daily: 'A morning nudge to plan today\u2019s workout.',
  water: 'A reminder to drink water during the day.',
  routine: 'A reminder to check off today\u2019s routine before it ends.',
  streak: 'A reminder to keep your workout streak alive.',
  motivational: 'A positive, rule-based message reacting to your recent activity.'
};

export default function NotificationSettingsScreen() {
  const [prefs, setPrefs] = useState({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const p = await getAllPreferences();
    setPrefs(p);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function toggle(category) {
    const next = !prefs[category];
    if (next) {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert(
          'Notifications disabled',
          'FitForge needs notification permission to send reminders. You can enable it in your phone settings.'
        );
        return;
      }
    }
    setPrefs((p) => ({ ...p, [category]: next }));
    await setCategoryEnabled(category, next);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ResponsiveContainer>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notifications</Text>
          <Text style={styles.hint}>
            Each reminder fires at most once a day and never stacks — turning one off
            cancels it immediately, and turning it back on simply reschedules it.
          </Text>

          {Object.keys(CATEGORIES).map((key) => {
            const cfg = CATEGORIES[key];
            const on = !!prefs[key];
            const timeLabel = `${String(cfg.hour).padStart(2, '0')}:${String(cfg.minute).padStart(2, '0')}`;
            return (
              <View key={key} style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{cfg.label}</Text>
                  <Text style={styles.rowDesc}>{DESCRIPTIONS[key]} · {timeLabel}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.switch, on && styles.switchOn]}
                  onPress={() => toggle(key)}
                >
                  <View style={[styles.knob, on && styles.knobOn]} />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </ResponsiveContainer>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 40 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: spacing.md },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: '800', marginBottom: 8 },
  hint: { color: colors.muted, fontSize: 12, marginBottom: 14, lineHeight: 17 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.line, gap: 12 },
  rowTitle: { color: colors.text, fontWeight: '700', fontSize: 14 },
  rowDesc: { color: colors.muted, fontSize: 11, marginTop: 2 },
  switch: { width: 46, height: 26, borderRadius: 20, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line, justifyContent: 'center' },
  switchOn: { backgroundColor: 'rgba(111,207,151,0.2)', borderColor: colors.green },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.muted, marginLeft: 2 },
  knobOn: { backgroundColor: colors.green, marginLeft: 22 }
});
