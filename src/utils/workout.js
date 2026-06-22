import { TRAINING_FLOW } from "../constants/defaults.js";
import { T } from "../constants/theme.js";
import { getDaysSinceLocalDate } from "./format.js";
import { sortHistoryDescending } from "./history.js";

export function getDefaultStep(unit, weight = 0) {
  if (unit === "kg") {
    const normalizedWeight = normalizeLoad(weight);
    const fractional = normalizedWeight % 1;
    if (fractional === 0.25 || fractional === 0.75) return 0.25;
    if (fractional === 0.5) return 0.5;
    return 1;
  }
  if (unit === "sec") return 5;
  return 1;
}

export const WEIGHT_STEP_OPTIONS = [5, 2.5, 1, 0.5, 0.25, 0.125];

export function normalizeLoad(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.round(numeric * 1000) / 1000);
}

export function getAdjustedWeight(weight, step, direction) {
  const safeWeight = Number.isFinite(Number(weight)) ? Number(weight) : 0;
  const safeStep = Number.isFinite(Number(step)) && Number(step) > 0 ? Number(step) : 1;
  return normalizeLoad(safeWeight + direction * safeStep);
}

export function getExerciseStep(exercise) {
  const storedStep = Number(exercise?.step);
  const inferredStep = getDefaultStep(exercise?.unit, exercise?.weight);

  if (!Number.isFinite(storedStep) || storedStep <= 0) return inferredStep;

  // Older live sessions stored every kg movement as step 1. If the load is
  // already fractional, prefer the smallest step that can reproduce it.
  if (exercise?.unit === "kg" && storedStep === 1 && inferredStep < storedStep) {
    return inferredStep;
  }

  return storedStep;
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
    sessionNote: session.sessionNote ?? "",
    exercises: session.exercises.map((exercise) => {
      const sets = exercise.sets ?? (exercise.reps?.length ?? 1);
      return {
        ...exercise,
        weight: normalizeLoad(exercise.weight),
        step: getExerciseStep(exercise),
        reps: exercise.reps ?? new Array(sets).fill(0),
        rpe: exercise.rpe ?? new Array(sets).fill(0),
        warmup: Array.isArray(exercise.warmup) && exercise.warmup.length === sets
          ? exercise.warmup
          : new Array(sets).fill(false),
        setWeights: Array.isArray(exercise.setWeights) && exercise.setWeights.length === sets
          ? exercise.setWeights
          : new Array(sets).fill(null),
        exerciseNote: exercise.exerciseNote ?? "",
      };
    }),
  };
}

export function getSetWeight(exercise, setIndex) {
  const override = exercise.setWeights?.[setIndex];
  return override == null ? exercise.weight : override;
}

export function createWorkoutSession(program, historyMap) {
  return normalizeWorkoutSession({
    ...program,
    startTime: Date.now(),
    sessionNote: "",
    exercises: program.exercises.map((exercise) => {
      const latest = historyMap?.[exercise.name]?.latest;
      const useLatest = latest && latest.unit === exercise.unit && Number.isFinite(latest.weight);
      const resolvedWeight = useLatest ? latest.weight : exercise.weight;
      return {
        ...exercise,
        weight: normalizeLoad(resolvedWeight),
        step: getExerciseStep({ ...exercise, weight: resolvedWeight }),
      };
    }),
  });
}

export function getWorkingIndices(exercise) {
  const warmup = exercise.warmup ?? [];
  const total = exercise.reps?.length ?? 0;
  const indices = [];
  for (let i = 0; i < total; i += 1) {
    if (!warmup[i]) indices.push(i);
  }
  return indices;
}

export function getWorkingReps(exercise) {
  return getWorkingIndices(exercise).map((i) => exercise.reps[i]).filter((r) => r > 0);
}

export function getWorkingRpes(exercise) {
  return getWorkingIndices(exercise).map((i) => exercise.rpe?.[i] ?? 0).filter((r) => r > 0);
}

export function hydrateHistoryEntry(entry, programs) {
  const program = programs.find((item) => item.id === entry.dayId);

  return {
    ...entry,
    tag: program?.tag ?? "HISTORY",
    sessionNote: entry.sessionNote ?? "",
    exercises: entry.exercises.map((exercise) => {
      const matchedExercise = program?.exercises.find((item) => item.name === exercise.name);
      const sets = matchedExercise?.sets ?? exercise.reps?.length ?? 1;

      return {
        ...matchedExercise,
        ...exercise,
        sets,
        repRange: matchedExercise?.repRange ?? "8-12",
        note: matchedExercise?.note ?? "",
        weight: normalizeLoad(exercise.weight),
        step: getExerciseStep(exercise),
        reps: exercise.reps ?? new Array(sets).fill(0),
        rpe: exercise.rpe ?? new Array(sets).fill(0),
        warmup: Array.isArray(exercise.warmup) && exercise.warmup.length === sets
          ? exercise.warmup
          : new Array(sets).fill(false),
        setWeights: Array.isArray(exercise.setWeights) && exercise.setWeights.length === sets
          ? exercise.setWeights
          : new Array(sets).fill(null),
        exerciseNote: exercise.exerciseNote ?? "",
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
