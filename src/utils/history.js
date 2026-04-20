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
      sessionNote: typeof entry.sessionNote === "string" ? entry.sessionNote : "",
      exercises: Array.isArray(entry.exercises)
        ? entry.exercises.map((exercise) => {
            const reps = Array.isArray(exercise?.reps) ? exercise.reps : [];
            const warmup = Array.isArray(exercise?.warmup) && exercise.warmup.length === reps.length
              ? exercise.warmup
              : new Array(reps.length).fill(false);
            return {
              ...exercise,
              reps,
              rpe: Array.isArray(exercise?.rpe) ? exercise.rpe : [],
              warmup,
              exerciseNote: typeof exercise?.exerciseNote === "string" ? exercise.exerciseNote : "",
            };
          })
        : [],
    }));

  return sortHistoryDescending(normalized);
}
