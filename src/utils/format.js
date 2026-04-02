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

export function getRpeColor(value) {
  if (value >= 9.5) return T.red;
  if (value >= 8.5) return T.orange;
  if (value >= 7.5) return T.amber;
  return T.green;
}
