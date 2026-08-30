import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Notifications only show while the app is backgrounded/closed by default; this
// handler controls what happens if one fires while the app is open in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false
  })
});

// One fixed identifier per category. Scheduling always cancels-then-recreates under
// the same identifier, so a category can never end up with duplicate notifications
// stacking up — this is the core anti-spam guarantee.
export const CATEGORIES = {
  daily: { id: 'fitforge-daily', hour: 8, minute: 0, title: 'FitForge', label: 'Daily fitness reminder', defaultBody: "Good morning! Time to plan today's workout." },
  water: { id: 'fitforge-water', hour: 13, minute: 0, title: 'FitForge', label: 'Water reminder', defaultBody: 'Stay hydrated — have you had water today?' },
  routine: { id: 'fitforge-routine', hour: 18, minute: 0, title: 'FitForge', label: 'Routine reminder', defaultBody: "Don't forget to check off today's routine." },
  streak: { id: 'fitforge-streak', hour: 20, minute: 30, title: 'FitForge', label: 'Streak reminder', defaultBody: 'Log a workout today to keep building your streak.' },
  motivational: { id: 'fitforge-motivational', hour: 21, minute: 0, title: 'FitForge', label: 'Motivational notification', defaultBody: 'You do not have to be extreme, just consistent.' }
};

const PREF_PREFIX = 'fitforge_notif_pref_';

export async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'FitForge reminders',
    importance: Notifications.AndroidImportance.DEFAULT
  });
}

export async function requestPermissions() {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return !!requested.granted;
}

export async function isCategoryEnabled(category) {
  const v = await AsyncStorage.getItem(PREF_PREFIX + category);
  return v === '1';
}

export async function getAllPreferences() {
  const entries = await Promise.all(
    Object.keys(CATEGORIES).map(async (key) => [key, await isCategoryEnabled(key)])
  );
  return Object.fromEntries(entries);
}

/** Cancel-then-recreate under the fixed identifier — never produces duplicates. */
export async function scheduleCategory(category, bodyOverride) {
  const cfg = CATEGORIES[category];
  if (!cfg) return;
  await Notifications.cancelScheduledNotificationAsync(cfg.id).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: cfg.id,
    content: { title: cfg.title, body: bodyOverride || cfg.defaultBody },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: cfg.hour,
      minute: cfg.minute
    }
  });
}

export async function cancelCategory(category) {
  const cfg = CATEGORIES[category];
  if (!cfg) return;
  await Notifications.cancelScheduledNotificationAsync(cfg.id).catch(() => {});
}

/** Turn a category on/off, persisting the choice and scheduling/canceling accordingly. */
export async function setCategoryEnabled(category, enabled, bodyOverride) {
  await AsyncStorage.setItem(PREF_PREFIX + category, enabled ? '1' : '0');
  if (enabled) {
    await ensureAndroidChannel();
    await scheduleCategory(category, bodyOverride);
  } else {
    await cancelCategory(category);
  }
}

/**
 * Call this whenever fresh activity/food data is available (e.g. Home screen load)
 * to keep the streak and motivational notifications' text current — without ever
 * sending an immediate notification or creating a duplicate. Only rewrites content
 * for categories the user has actually enabled.
 */
export async function refreshDynamicNotificationContent({ streakBody, motivationalBody }) {
  if (await isCategoryEnabled('streak')) await scheduleCategory('streak', streakBody);
  if (await isCategoryEnabled('motivational')) await scheduleCategory('motivational', motivationalBody);
}
