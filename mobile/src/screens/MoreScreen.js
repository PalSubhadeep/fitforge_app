import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, radius } from '../theme';
import ResponsiveContainer from '../components/ResponsiveContainer';
import { SafeAreaView } from 'react-native-safe-area-context';

const ITEMS = [
  { key: 'Goals', icon: '🎯', title: 'Goals', desc: 'Set targets with a deadline' },
  { key: 'Routine', icon: '📋', title: 'Daily Routine', desc: 'Set and check off your routine' },
  { key: 'Water', icon: '💧', title: 'Water Tracker', desc: 'Log bottles against your capacity' },
  { key: 'Weight', icon: '⚖️', title: 'Weight Tracker', desc: 'Log and follow your weight over time' },
  { key: 'Calories', icon: '🍽️', title: 'Calorie Calculator', desc: 'Estimate your daily calorie needs' },
  { key: 'Weekly', icon: '📈', title: 'Weekly Summary', desc: 'Last 7 days at a glance' },
  { key: 'Monthly', icon: '📅', title: 'Monthly Analysis', desc: 'Full month performance breakdown' }
];

export default function MoreScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
      <ResponsiveContainer style={{ gap: 10 }}>
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
      </ResponsiveContainer>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: 16, marginBottom: 10
  },
  icon: { fontSize: 22 },
  title: { color: colors.text, fontWeight: '700', fontSize: 15 },
  desc: { color: colors.muted, fontSize: 12, marginTop: 2 },
  arrow: { color: colors.muted, fontSize: 20 }
});
