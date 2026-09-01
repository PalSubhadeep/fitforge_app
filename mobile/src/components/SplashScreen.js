import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, Animated, Easing } from 'react-native';
import { colors } from '../theme';

// Mirrors the web app's splash: a gold "FF" mark and the FITFORGE wordmark fade
// and scale in, then the whole screen fades out once the parent says it's safe to
// (booting finished AND the minimum display time has passed) — see App.js.
export default function SplashScreen({ hide, onHidden }) {
  const markScale = useRef(new Animated.Value(0.85)).current;
  const markOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(markOpacity, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.spring(markScale, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true })
      ]),
      Animated.timing(textOpacity, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true })
    ]).start();
  }, []);

  useEffect(() => {
    if (!hide) return;
    Animated.timing(screenOpacity, { toValue: 0, duration: 380, easing: Easing.in(Easing.cubic), useNativeDriver: true })
      .start(() => onHidden && onHidden());
  }, [hide]);

  return (
    <Animated.View style={[styles.screen, { opacity: screenOpacity }]} pointerEvents={hide ? 'none' : 'auto'}>
      <Animated.View style={[styles.mark, { opacity: markOpacity, transform: [{ scale: markScale }] }]}>
        <Text style={styles.markText}>FF</Text>
      </Animated.View>
      <Animated.View style={{ opacity: textOpacity }}>
        <Text style={styles.title}>FITFORGE</Text>
        <Text style={styles.tagline}>Train. Track. Compete.</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999
  },
  mark: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center',
    marginBottom: 18
  },
  markText: { color: '#1A1502', fontSize: 26, fontWeight: '800', letterSpacing: 1 },
  title: { color: colors.gold, fontSize: 28, fontWeight: '800', letterSpacing: 2, textAlign: 'center' },
  tagline: { color: colors.muted, fontSize: 13, textAlign: 'center', marginTop: 6, letterSpacing: 0.5 }
});
