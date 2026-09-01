import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';
import { colors, radius } from '../theme';

export default function Toast({ message, visible, onHidden }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    if (!visible) return;
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true })
    ]).start();

    const t = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true })
        .start(() => onHidden && onHidden());
    }, 2200);
    return () => clearTimeout(t);
  }, [visible, message]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.toast, { opacity, transform: [{ translateY }] }]} pointerEvents="none">
      <Text style={styles.icon}>✓</Text>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute', left: 20, right: 20, bottom: 24,
    backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.green,
    borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', gap: 10, zIndex: 999,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    elevation: 6
  },
  icon: { color: colors.green, fontWeight: '800' },
  text: { color: colors.text, fontSize: 13, fontWeight: '600', flexShrink: 1 }
});
