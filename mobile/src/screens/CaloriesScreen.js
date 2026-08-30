import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { colors, spacing, radius } from '../theme';
import KeyboardAvoider from '../components/KeyboardAvoider';
import ResponsiveContainer from '../components/ResponsiveContainer';

const ACTIVITY_LEVELS = [
  { label: 'Sedentary (little or no exercise)', value: '1.2' },
  { label: 'Light (1-3 days/week)', value: '1.375' },
  { label: 'Moderate (3-5 days/week)', value: '1.55' },
  { label: 'Active (6-7 days/week)', value: '1.725' },
  { label: 'Very active (hard training)', value: '1.9' }
];

export default function CaloriesScreen() {
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('male');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [activity, setActivity] = useState('1.55');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  function calculate() {
    setError('');
    const a = parseFloat(age), w = parseFloat(weight), h = parseFloat(height);
    if (!a || !w || !h) { setError('Fill in age, weight, and height.'); return; }
    const bmr = sex === 'male'
      ? (10 * w + 6.25 * h - 5 * a + 5)
      : (10 * w + 6.25 * h - 5 * a - 161);
    const tdee = bmr * parseFloat(activity);
    setResult({ bmr: Math.round(bmr), tdee: Math.round(tdee) });
  }

  return (
    <KeyboardAvoider style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <ResponsiveContainer>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Estimate Daily Calories</Text>

          <Text style={styles.label}>Age</Text>
          <TextInput style={styles.input} value={age} onChangeText={setAge}
            keyboardType="number-pad" placeholder="e.g. 24" placeholderTextColor={colors.muted} />

          <Text style={styles.label}>Sex</Text>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={sex} onValueChange={setSex} style={styles.picker}>
              <Picker.Item label="Male" value="male" color={Platform.OS === 'ios' ? colors.text : undefined} />
              <Picker.Item label="Female" value="female" color={Platform.OS === 'ios' ? colors.text : undefined} />
            </Picker>
          </View>

          <Text style={styles.label}>Weight (kg)</Text>
          <TextInput style={styles.input} value={weight} onChangeText={setWeight}
            keyboardType="decimal-pad" placeholder="e.g. 70" placeholderTextColor={colors.muted} />

          <Text style={styles.label}>Height (cm)</Text>
          <TextInput style={styles.input} value={height} onChangeText={setHeight}
            keyboardType="decimal-pad" placeholder="e.g. 175" placeholderTextColor={colors.muted} />

          <Text style={styles.label}>Activity level</Text>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={activity} onValueChange={setActivity} style={styles.picker}>
              {ACTIVITY_LEVELS.map((lvl) => (
                <Picker.Item key={lvl.value} label={lvl.label} value={lvl.value} color={Platform.OS === 'ios' ? colors.text : undefined} />
              ))}
            </Picker>
          </View>

          <TouchableOpacity style={styles.btn} onPress={calculate}>
            <Text style={styles.btnText}>Calculate</Text>
          </TouchableOpacity>
          {!!error && <Text style={styles.error}>{error}</Text>}

          {result && (
            <>
              <View style={styles.statRow}>
                <Stat label="BMR (kcal)" value={result.bmr} />
                <Stat label="Maintenance (kcal)" value={result.tdee} color={colors.gold} />
              </View>
              <View style={styles.statRow}>
                <Stat label="Weight Loss" value={result.tdee - 500} color={colors.red} />
                <Stat label="Weight Gain" value={result.tdee + 500} color={colors.green} />
              </View>
            </>
          )}
          <Text style={styles.hint}>Estimate only, based on the Mifflin-St Jeor formula. Not medical advice.</Text>
        </View>
      </ResponsiveContainer>
    </ScrollView>
    </KeyboardAvoider>
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
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: spacing.md },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: '800', marginBottom: 10 },
  label: { color: colors.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginTop: spacing.sm, marginBottom: 6 },
  input: { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, padding: 12, color: colors.text, fontSize: 15 },
  pickerWrap: { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm },
  picker: { color: colors.text },
  btn: { backgroundColor: colors.gold, borderRadius: radius.sm, padding: 13, alignItems: 'center', marginTop: spacing.md },
  btnText: { color: '#1A1502', fontWeight: '800', fontSize: 13, textTransform: 'uppercase' },
  error: { color: colors.red, fontSize: 13, marginTop: 10 },
  hint: { color: colors.muted, fontSize: 12, marginTop: 14 },
  statRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  statBox: { flex: 1, backgroundColor: colors.surface2, borderRadius: radius.sm, padding: 12, alignItems: 'center' },
  statValue: { color: colors.green, fontSize: 22, fontWeight: '800' },
  statLabel: { color: colors.muted, fontSize: 9, textTransform: 'uppercase', marginTop: 2, textAlign: 'center' }
});
