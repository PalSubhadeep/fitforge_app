const MAX_HOURS = 12;

function activityPoints(durationHrs) {
  const d = parseFloat(durationHrs) || 0;
  return Math.max(5, Math.round(d * 10));
}

function foodPoints(had) {
  return had === 'yes' ? -5 : 5;
}

module.exports = { activityPoints, foodPoints, MAX_HOURS };
