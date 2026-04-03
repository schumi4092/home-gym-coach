import { calcAvgRpe, getDaysSinceLocalDate, isLocalDateWithinDays } from "./format.js";
import { getNextProgramId, getRecoveryText } from "./workout.js";

export function buildDashboardStats(history, programs, today = new Date()) {
  const nextProgramId = getNextProgramId(history);
  const nextProgram = programs.find((program) => program.id === nextProgramId) ?? programs[0] ?? null;
  const recentEntry = history[0] ?? null;

  let lastSameProgram = null;
  let upperRecovery = null;
  let lowerRecovery = null;
  let weeklySessions = 0;
  let weeklyMinutes = 0;
  let weeklySets = 0;
  let bestSet = null;

  for (const entry of history) {
    if (!lastSameProgram && entry.dayId === nextProgramId) {
      lastSameProgram = entry;
    }

    if (!upperRecovery && entry.dayId?.includes("upper")) {
      upperRecovery = entry;
    }

    if (!lowerRecovery && entry.dayId?.includes("lower")) {
      lowerRecovery = entry;
    }

    if (isLocalDateWithinDays(entry.date, 7, today)) {
      weeklySessions += 1;
      weeklyMinutes += entry.duration || 0;
      weeklySets += entry.exercises.reduce(
        (sum, exercise) => sum + exercise.reps.filter((rep) => rep > 0).length,
        0,
      );
    }

    for (const exercise of entry.exercises) {
      const maxRep = Math.max(0, ...exercise.reps);
      if (maxRep === 0) continue;

      const score = (exercise.weight || 0) * maxRep;

      if (!bestSet || score > bestSet.score) {
        bestSet = {
          day: entry.day,
          name: exercise.name,
          weight: exercise.weight,
          reps: maxRep,
          score,
          unit: exercise.unit,
        };
      }
    }
  }

  return {
    nextProgramId,
    nextProgram,
    recentEntry,
    lastSameProgram,
    weeklySessions,
    weeklyMinutes,
    weeklySets,
    recentAvgRpe: recentEntry ? calcAvgRpe(recentEntry.exercises.flatMap((exercise) => exercise.rpe || [])) : 0,
    lastSameProgramDate: lastSameProgram ? getDaysSinceLocalDate(lastSameProgram.date, today) : null,
    estimatedMinutes: Math.max(25, (nextProgram?.exercises.length ?? 0) * 7),
    bestSet,
    upperRecoveryState: getRecoveryText(upperRecovery, today),
    lowerRecoveryState: getRecoveryText(lowerRecovery, today),
  };
}
