import { parseLocalDate } from "./format.js";

function getHistoryTime(entry) {
  return parseLocalDate(entry?.date)?.getTime() ?? 0;
}

export function sortHistoryDescending(history) {
  return [...history].sort((left, right) => getHistoryTime(right) - getHistoryTime(left));
}

export function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];

  const normalized = history
    .filter((entry) => entry && typeof entry === "object")
    .map((entry) => ({
      ...entry,
      exercises: Array.isArray(entry.exercises)
        ? entry.exercises.map((exercise) => ({
            ...exercise,
            reps: Array.isArray(exercise?.reps) ? exercise.reps : [],
            rpe: Array.isArray(exercise?.rpe) ? exercise.rpe : [],
          }))
        : [],
    }));

  return sortHistoryDescending(normalized);
}
