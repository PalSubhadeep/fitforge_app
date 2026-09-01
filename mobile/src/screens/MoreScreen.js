import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { colors, spacing, radius } from '../theme';
import ResponsiveContainer from '../components/ResponsiveContainer';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CATEGORIES, getAllPreferences, setCategoryEnabled, requestPermissions } from '../utils/notifications';

const ITEMS = [
  { key: 'Goals', icon: '🎯', title: 'Goals', desc: 'Set targets with a deadline' },
  { key: 'Routine', icon: '📋', title: 'Daily Routine', desc: 'Set and check off your routine' },
  { key: 'Water', icon: '💧', title: 'Water Tracker', desc: 'Log bottles against your capacity' },
  { key: 'Weight', icon: '⚖️', title: 'Weight Tracker', desc: 'Log and follow your weight over time' },
  { key: 'Calories', icon: '🍽️', title: 'Calorie Calculator', desc: 'Estimate your daily calorie needs' },
  { key: 'Weekly', icon: '📈', title: 'Weekly Summary', desc: 'Last 7 days at a glance' },
  { key: 'Monthly', icon: '📅', title: 'Monthly Analysis', desc: 'Full month performance breakdown' },
  { key: 'Notifications', icon: '🔔', title: 'Notifications', desc: 'Fine-tune each reminder\u2019s time individually' }
];

export default function MoreScreen({ navigation }) {
  const [remindersOn, setRemindersOn] = useState(false);
  const [permission, setPermission] = useState('unknown');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const prefs = await getAllPreferences();
    // "On" mirrors the PWA's single switch: true if at least one reminder category is enabled.
    setRemindersOn(Object.values(prefs).some(Boolean));
    const perm = await Notifications.getPermissionsAsync();
    setPermission(perm.granted ? 'granted' : perm.canAskAgain ? 'default' : 'denied');
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function toggleReminders() {
    setBusy(true);
    try {
      const next = !remindersOn;
      if (next) {
        const granted = await requestPermissions();
        if (!granted) { setBusy(false); await load(); return; }
      }
      // Master toggle turns every category on/off together; individual timing
      // stays adjustable from the Notifications screen.
      await Promise.all(Object.keys(CATEGORIES).map((key) => setCategoryEnabled(key, next)));
      setRemindersOn(next);
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
      <ResponsiveContainer>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Reminders</Text>
          <Text style={styles.hint}>
            Daily reminders for your workout, water, routine, streak, and motivation — each fires at
            most once a day. Fine-tune individual times from the Notifications screen below.
          </Text>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Daily reminder</Text>
            <TouchableOpacity
              style={[styles.switch, remindersOn && styles.switchOn]}
              onPress={toggleReminders}
              disabled={busy}
            >
              <View style={[styles.knob, remindersOn && styles.knobOn]} />
            </TouchableOpacity>
          </View>
          <Text style={styles.permHint}>Notification permission: {permission}</Text>
        </View>

        <View style={{ gap: 10 }}>
          {ITEMS.map((item) => (
            <TouchableOpacity key={item.key} style={styles.item} onPress={() => navigation.navigate(item.key)}>
              <Text style={styles.icon}>{item.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.desc}>{item.desc}</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ResponsiveContainer>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: '800', marginBottom: 8 },
  hint: { color: colors.muted, fontSize: 12, marginBottom: 12, lineHeight: 17 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggleLabel: { color: colors.text, fontSize: 14, fontWeight: '600' },
  switch: { width: 46, height: 26, borderRadius: 20, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line, justifyContent: 'center' },
  switchOn: { backgroundColor: 'rgba(111,207,151,0.2)', borderColor: colors.green },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.muted, marginLeft: 2 },
  knobOn: { backgroundColor: colors.green, marginLeft: 22 },
  permHint: { color: colors.muted, fontSize: 11, marginTop: 10 },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: 16
  },
  icon: { fontSize: 22 },
  title: { color: colors.text, fontWeight: '700', fontSize: 15 },
  desc: { color: colors.muted, fontSize: 12, marginTop: 2 },
  arrow: { color: colors.muted, fontSize: 20 }
});
