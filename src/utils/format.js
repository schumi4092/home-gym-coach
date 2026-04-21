import { T } from "../constants/theme.js";

export function calcAvgRpe(rpeArray) {
  const valid = (rpeArray || []).filter((v) => v > 0);
  return valid.length > 0
    ? Math.round((valid.reduce((sum, v) => sum + v, 0) / valid.length) * 10) / 10
    : 0;
}

export function formatSeconds(seconds) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function formatLocalDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function startOfLocalDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function parseLocalDate(value) {
  if (!value) return null;
  if (value instanceof Date) return startOfLocalDay(value);

  const [year, month, day] = String(value).split("-").map((part) => Number.parseInt(part, 10));
  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
}

export function isLocalDateWithinDays(value, days, now = new Date()) {
  if (days <= 0) return false;

  const date = parseLocalDate(value);
  if (!date) return false;

  const cutoff = startOfLocalDay(now);
  cutoff.setDate(cutoff.getDate() - (days - 1));
  return date >= cutoff;
}

export function startOfLocalWeek(now = new Date()) {
  const day = startOfLocalDay(now);
  const dow = day.getDay();
  const offset = (dow + 6) % 7;
  day.setDate(day.getDate() - offset);
  return day;
}

export function isInCurrentLocalWeek(value, now = new Date()) {
  const date = parseLocalDate(value);
  if (!date) return false;
  const start = startOfLocalWeek(now);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return date >= start && date < end;
}

export function getDaysSinceLocalDate(value, now = new Date()) {
  const date = parseLocalDate(value);
  if (!date) return null;

  const current = startOfLocalDay(now);
  return Math.max(0, Math.floor((current.getTime() - date.getTime()) / 86400000));
}

export function formatExerciseLoad(weight, unit) {
  return weight > 0 ? `${weight} ${unit}` : "BW";
}

export function parseRepRange(range) {
  if (!range || range.toUpperCase() === "AMRAP") {
    return { min: null, max: null, type: "amrap" };
  }
  const parts = range.split("-").map((part) => Number.parseInt(part, 10));
  return { min: parts[0] ?? null, max: parts[1] ?? parts[0] ?? null, type: "range" };
}

export function estimate1RM(weight, reps) {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

export function getRpeColor(value) {
  if (value >= 9.5) return T.red;
  if (value >= 8.5) return T.orange;
  if (value >= 7.5) return T.amber;
  return T.green;
}
