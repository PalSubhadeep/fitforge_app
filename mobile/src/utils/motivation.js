// Rule-based motivational messages. No AI, no randomness beyond a deterministic
// daily rotation for the fallback case. Every message is written to be positive —
// nothing here should ever read as a scold for a missed workout or a junk food day.

const FALLBACK_QUOTES = [
  'Small consistent efforts beat occasional big ones. Log something today.',
  'You do not have to be extreme, just consistent.',
  'Future you is built by what you do today.',
  'Discipline is choosing between what you want now and what you want most.',
  'A short workout logged beats a perfect workout skipped.',
  'Show up. That is most of the battle.'
];

function todayISO() { return new Date().toISOString().slice(0, 10); }
function fmtDate(d) { return d.toISOString().slice(0, 10); }
function dayOfYear(d) { const start = new Date(d.getFullYear(), 0, 0); return Math.floor((d - start) / 86400000); }

function hoursInRange(activities, startISO, endISO) {
  return activities
    .filter((a) => a.date >= startISO && a.date <= endISO)
    .reduce((sum, a) => sum + (parseFloat(a.duration) || 0), 0);
}

function daysSinceLastActivity(activities) {
  if (!activities.length) return null;
  const latest = activities.reduce((max, a) => (a.date > max ? a.date : max), activities[0].date);
  const diff = Math.round((new Date(todayISO() + 'T00:00:00') - new Date(latest + 'T00:00:00')) / 86400000);
  return diff;
}

/**
 * activities: [{date, type, detail, duration, ...}]
 * food: [{date, food, had: 'yes'|'no', ...}]
 * streaks: { streakCurrent, streakBest, cleanStreakCurrent, cleanStreakBest }
 */
export function getMotivationalMessage(activities = [], food = [], streaks = {}) {
  const { streakCurrent = 0 } = streaks;

  // Rule 1: long streak — celebrate big.
  if (streakCurrent >= 7) {
    return `🔥 ${streakCurrent}-day streak! You're on fire — keep it rolling.`;
  }

  // Rule 2: building momentum.
  if (streakCurrent >= 3) {
    return `Nice, ${streakCurrent} days in a row. Momentum is building — keep going.`;
  }

  // Rule 3: inactivity nudge (only if they've logged before — never guilt a brand-new user).
  const gap = daysSinceLastActivity(activities);
  if (gap !== null && gap >= 3) {
    return "It's been a few days since your last workout — even a short session today counts.";
  }

  // Rule 4 & 5: week-over-week trend.
  const today = new Date();
  const thisWeekStart = new Date(today); thisWeekStart.setDate(today.getDate() - 6);
  const lastWeekEnd = new Date(thisWeekStart); lastWeekEnd.setDate(thisWeekStart.getDate() - 1);
  const lastWeekStart = new Date(lastWeekEnd); lastWeekStart.setDate(lastWeekEnd.getDate() - 6);

  const thisWeekHours = hoursInRange(activities, fmtDate(thisWeekStart), todayISO());
  const lastWeekHours = hoursInRange(activities, fmtDate(lastWeekStart), fmtDate(lastWeekEnd));

  if (lastWeekHours > 0 && thisWeekHours > lastWeekHours * 1.1) {
    return "You're trending up this week compared to last — nice work.";
  }
  if (lastWeekHours > 0 && thisWeekHours < lastWeekHours * 0.7) {
    return "Your activity dipped a bit this week — no worries, tomorrow's a fresh start.";
  }

  // Rule 6: same-weekday-last-week callback, when there's a specific thing to reference.
  const lastWeekSameDay = new Date(); lastWeekSameDay.setDate(lastWeekSameDay.getDate() - 7);
  const lastWeekSameDayISO = fmtDate(lastWeekSameDay);
  const match = activities.find((a) => a.date === lastWeekSameDayISO);
  if (match) {
    const dayName = lastWeekSameDay.toLocaleDateString('default', { weekday: 'long' });
    return `Last ${dayName} you logged ${match.type} — ${match.detail} (${match.duration} hr). What about today?`;
  }

  // Fallback: deterministic rotation so it's stable for the whole day, not random per render.
  const idx = dayOfYear(new Date()) % FALLBACK_QUOTES.length;
  return FALLBACK_QUOTES[idx];
}

/** A shorter, streak-specific line for the streak reminder notification. */
export function getStreakReminderMessage(streaks = {}) {
  const { streakCurrent = 0 } = streaks;
  if (streakCurrent >= 3) {
    return `Keep your ${streakCurrent}-day streak alive — log a workout before the day ends.`;
  }
  return 'Log a workout today to start building your streak.';
}
