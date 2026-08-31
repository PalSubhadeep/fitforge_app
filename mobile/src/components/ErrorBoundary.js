import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, radius } from '../theme';

// Wraps the app so that if any screen throws during render, you see the actual
// error on-device (with a "Try again" button) instead of the screen silently
// going blank or bouncing back to another tab with no explanation.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Visible in `adb logcat` / Metro logs even on a release build, which
    // static analysis alone can't always catch ahead of time.
    console.error('ErrorBoundary caught:', error, info?.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>{String(this.state.error?.message || this.state.error)}</Text>
            <TouchableOpacity style={styles.btn} onPress={() => this.setState({ error: null })}>
              <Text style={styles.btnText}>Try again</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingTop: 60 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.red, borderRadius: radius.lg, padding: spacing.md },
  title: { color: colors.red, fontSize: 18, fontWeight: '800', marginBottom: 10 },
  message: { color: colors.text, fontSize: 13, lineHeight: 19 },
  btn: { backgroundColor: colors.gold, borderRadius: radius.sm, padding: 13, alignItems: 'center', marginTop: spacing.md },
  btnText: { color: '#1A1502', fontWeight: '800', fontSize: 13, textTransform: 'uppercase' }
});
