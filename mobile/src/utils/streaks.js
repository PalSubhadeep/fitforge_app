function todayISO() { return new Date().toISOString().slice(0, 10); }
function fmtDate(d) { return d.toISOString().slice(0, 10); }

function currentStreak(datesSet) {
  let cursor = new Date(todayISO() + 'T00:00:00');
  if (!datesSet[fmtDate(cursor)]) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (datesSet[fmtDate(cursor)]) { streak++; cursor.setDate(cursor.getDate() - 1); }
  return streak;
}

function bestStreak(datesSet) {
  const days = Object.keys(datesSet).sort();
  let best = 0, run = 0, prev = null;
  days.forEach((dStr) => {
    const d = new Date(dStr + 'T00:00:00');
    if (prev) {
      const diff = Math.round((d - prev) / 86400000);
      run = diff === 1 ? run + 1 : 1;
    } else {
      run = 1;
    }
    if (run > best) best = run;
    prev = d;
  });
  return best;
}

// activities: [{date, ...}], food: [{date, had: 'yes'|'no', ...}]
export function computeStreaks(activities, food) {
  const actDates = {};
  activities.forEach((a) => { actDates[a.date] = true; });

  const cleanDates = {};
  food.forEach((f) => { if (f.had === 'no') cleanDates[f.date] = true; });

  const streakCurrent = currentStreak(actDates);
  const streakBest = Math.max(bestStreak(actDates), streakCurrent);
  const cleanStreakCurrent = currentStreak(cleanDates);
  const cleanStreakBest = Math.max(bestStreak(cleanDates), cleanStreakCurrent);

  return { streakCurrent, streakBest, cleanStreakCurrent, cleanStreakBest };
}

export { todayISO };
