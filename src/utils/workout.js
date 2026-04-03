import { TRAINING_FLOW } from "../constants/defaults.js";
import { T } from "../constants/theme.js";
import { getDaysSinceLocalDate } from "./format.js";
import { sortHistoryDescending } from "./history.js";

export function getDefaultStep(unit) {
  if (unit === "kg") return 1;
  if (unit === "sec") return 5;
  return 1;
}

export function getAdjustedWeight(weight, step, direction) {
  return Math.max(0, Math.round((weight + direction * step) * 100) / 100);
}

export function calculateRepMax(range) {
  if (range === "AMRAP") return 30;
  const upperBound = Number.parseInt(range.split("-").pop() ?? "0", 10);
  return Number.isNaN(upperBound) ? 20 : upperBound + 5;
}

export function getRestSeconds(range) {
  if (range === "AMRAP") return 90;
  const max = Number.parseInt(range.split("-").at(-1) ?? "0", 10);
  return !Number.isNaN(max) && max >= 15 ? 60 : 90;
}

export function normalizeWorkoutSession(session) {
  return {
    ...session,
    exercises: session.exercises.map((exercise) => ({
      ...exercise,
      step: exercise.step ?? getDefaultStep(exercise.unit),
      reps: exercise.reps ?? new Array(exercise.sets).fill(0),
      rpe: exercise.rpe ?? new Array(exercise.sets).fill(0),
    })),
  };
}

export function createWorkoutSession(program) {
  return normalizeWorkoutSession({
    ...program,
    startTime: Date.now(),
    exercises: program.exercises.map((exercise) => ({
      ...exercise,
      step: getDefaultStep(exercise.unit),
    })),
  });
}

export function hydrateHistoryEntry(entry, programs) {
  const program = programs.find((item) => item.id === entry.dayId);

  return {
    ...entry,
    tag: program?.tag ?? "HISTORY",
    exercises: entry.exercises.map((exercise) => {
      const matchedExercise = program?.exercises.find((item) => item.name === exercise.name);

      return {
        ...matchedExercise,
        ...exercise,
        sets: matchedExercise?.sets ?? exercise.reps.length,
        repRange: matchedExercise?.repRange ?? "8-12",
        note: matchedExercise?.note ?? "",
        step: exercise.step ?? getDefaultStep(exercise.unit),
        reps: exercise.reps ?? new Array(matchedExercise?.sets ?? 1).fill(0),
        rpe: exercise.rpe ?? new Array(matchedExercise?.sets ?? 1).fill(0),
      };
    }),
  };
}

export function getNextProgramId(history) {
  const latestCompletedSession = sortHistoryDescending(history).find((entry) => entry.dayId);
  if (!latestCompletedSession) return "upper-a";

  const lastIndex = TRAINING_FLOW.findIndex((item) => item.type === latestCompletedSession.dayId);
  if (lastIndex === -1) return "upper-a";

  for (let offset = 1; offset <= TRAINING_FLOW.length; offset += 1) {
    const nextItem = TRAINING_FLOW[(lastIndex + offset) % TRAINING_FLOW.length];
    if (nextItem.type !== "rest") return nextItem.type;
  }

  return "upper-a";
}

export function getRecoveryText(entry, currentDayTime) {
  if (!entry) return { label: "可安排", color: T.green };
  const daysAgo = getDaysSinceLocalDate(entry.date, currentDayTime);
  if (daysAgo <= 1) return { label: "剛做過", color: T.orange };
  if (daysAgo <= 2) return { label: "接近恢復", color: T.amber };
  return { label: "可安排", color: T.green };
}
