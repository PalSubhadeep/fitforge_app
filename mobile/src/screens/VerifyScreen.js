import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, spacing, radius } from '../theme';
import ResponsiveContainer from '../components/ResponsiveContainer';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth, apiErrorMessage } from '../context/AuthContext';

export default function VerifyScreen({ route }) {
  const { email } = route.params;
  const { verify, resendCode } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleVerify() {
    setError(''); setInfo('');
    if (code.trim().length !== 6) { setError('Enter the 6-digit code from your email.'); return; }
    setLoading(true);
    try {
      await verify(email, code.trim());
      // On success, AuthContext sets `user`, and the root navigator automatically
      // switches to the main app — no manual navigation needed here.
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError(''); setInfo('');
    setResending(true);
    try {
      await resendCode(email);
      setInfo('A new code has been sent.');
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setResending(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ResponsiveContainer>
        <View style={styles.card}>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.desc}>We sent a 6-digit code to{'\n'}<Text style={styles.email}>{email}</Text></Text>

          <Text style={styles.label}>Verification code</Text>
          <TextInput
            style={styles.codeInput}
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="000000"
            placeholderTextColor={colors.muted}
          />

          <TouchableOpacity style={styles.btn} onPress={handleVerify} disabled={loading}>
            {loading ? <ActivityIndicator color="#1A1502" /> : <Text style={styles.btnText}>Verify & Create Account</Text>}
          </TouchableOpacity>

          {!!error && <Text style={styles.error}>{error}</Text>}
          {!!info && <Text style={styles.ok}>{info}</Text>}

          <TouchableOpacity onPress={handleResend} disabled={resending} style={{ marginTop: 16 }}>
            <Text style={styles.resend}>{resending ? 'Sending…' : "Didn't get a code? Resend"}</Text>
          </TouchableOpacity>
        </View>
      </ResponsiveContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', padding: spacing.lg },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: spacing.lg },
  title: { color: colors.text, fontSize: 24, fontWeight: '800', marginBottom: 8 },
  desc: { color: colors.muted, fontSize: 13, marginBottom: 20, lineHeight: 20 },
  email: { color: colors.text, fontWeight: '700' },
  label: { color: colors.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  codeInput: {
    backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm,
    padding: 14, color: colors.gold, fontSize: 28, letterSpacing: 10, textAlign: 'center'
  },
  btn: { backgroundColor: colors.gold, borderRadius: radius.sm, padding: 14, alignItems: 'center', marginTop: spacing.md },
  btnText: { color: '#1A1502', fontWeight: '800', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 },
  error: { color: colors.red, fontSize: 13, marginTop: 10 },
  ok: { color: colors.green, fontSize: 13, marginTop: 10 },
  resend: { color: colors.gold, textAlign: 'center', fontSize: 13 }
});
