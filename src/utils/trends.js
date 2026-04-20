import { calcAvgRpe, parseLocalDate, startOfLocalDay } from "./format.js";

function getWeekKey(dateStr) {
  const d = parseLocalDate(dateStr);
  if (!d) return null;
  const day = startOfLocalDay(d);
  const dayOfWeek = day.getDay() || 7;
  const monday = new Date(day);
  monday.setDate(monday.getDate() - (dayOfWeek - 1));
  const m = String(monday.getMonth() + 1).padStart(2, "0");
  const dd = String(monday.getDate()).padStart(2, "0");
  return `${monday.getFullYear()}-${m}-${dd}`;
}

function getMonthKey(dateStr) {
  const d = parseLocalDate(dateStr);
  if (!d) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function buildBuckets(history, keyFn) {
  const buckets = {};

  for (const entry of history) {
    const key = keyFn(entry.date);
    if (!key) continue;

    if (!buckets[key]) {
      buckets[key] = { sessions: 0, totalVolume: 0, totalMinutes: 0, totalSets: 0, rpes: [] };
    }

    const b = buckets[key];
    b.sessions += 1;
    b.totalMinutes += entry.duration || 0;

    for (const ex of entry.exercises) {
      const validReps = ex.reps.filter((r, i) => r > 0 && !ex.warmup?.[i]);
      b.totalSets += validReps.length;
      const reps = validReps.reduce((s, r) => s + r, 0);
      b.totalVolume += ex.weight > 0 ? ex.weight * reps : reps;

      const rpesValid = (ex.rpe || []).filter((r, i) => r > 0 && !ex.warmup?.[i]);
      b.rpes.push(...rpesValid);
    }
  }

  return Object.entries(buckets)
    .map(([key, b]) => ({
      label: key,
      sessions: b.sessions,
      volume: Math.round(b.totalVolume),
      minutes: b.totalMinutes,
      sets: b.totalSets,
      avgRpe: calcAvgRpe(b.rpes),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function buildWeeklyTrends(history) {
  return buildBuckets(history, getWeekKey);
}

export function buildMonthlyTrends(history) {
  return buildBuckets(history, getMonthKey);
}
