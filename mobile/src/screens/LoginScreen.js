import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, spacing, radius } from '../theme';
import ResponsiveContainer from '../components/ResponsiveContainer';
import KeyboardAvoider from '../components/KeyboardAvoider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth, apiErrorMessage } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError('');
    if (!username.trim() || !password) { setError('Enter your username and password.'); return; }
    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <KeyboardAvoider>
        <ResponsiveContainer>
          <View style={styles.brand}>
            <View style={styles.mark}><Text style={styles.markText}>FF</Text></View>
            <Text style={styles.title}>FITFORGE</Text>
            <Text style={styles.tagline}>Train. Track. Compete.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Username</Text>
            <TextInput style={styles.input} value={username} onChangeText={setUsername}
              autoCapitalize="none" placeholder="your username" placeholderTextColor={colors.muted} />

            <Text style={styles.label}>Password</Text>
            <TextInput style={styles.input} value={password} onChangeText={setPassword}
              secureTextEntry placeholder="********" placeholderTextColor={colors.muted} />

            <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
              {loading ? <ActivityIndicator color="#1A1502" /> : <Text style={styles.btnText}>Log In</Text>}
            </TouchableOpacity>

            {!!error && <Text style={styles.error}>{error}</Text>}
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text style={styles.switchText}>New here? Create an account</Text>
          </TouchableOpacity>
        </ResponsiveContainer>
      </KeyboardAvoider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', padding: spacing.lg },
  brand: { alignItems: 'center', marginBottom: 28 },
  mark: {
    width: 64, height: 64, borderRadius: 16, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.gold, alignItems: 'center', justifyContent: 'center', marginBottom: 12
  },
  markText: { color: colors.gold, fontSize: 26, fontWeight: '800' },
  title: { color: colors.text, fontSize: 32, fontWeight: '800', letterSpacing: 2 },
  tagline: { color: colors.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, marginTop: 4 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: spacing.md },
  label: { color: colors.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginTop: spacing.sm, marginBottom: 6 },
  input: {
    backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm,
    padding: 12, color: colors.text, fontSize: 15
  },
  btn: { backgroundColor: colors.gold, borderRadius: radius.sm, padding: 14, alignItems: 'center', marginTop: spacing.md },
  btnText: { color: '#1A1502', fontWeight: '800', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 },
  error: { color: colors.red, fontSize: 13, marginTop: 10 },
  switchText: { color: colors.gold, textAlign: 'center', marginTop: 20, fontSize: 13 }
});
