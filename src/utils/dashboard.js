import { calcAvgRpe, getDaysSinceLocalDate, isInCurrentLocalWeek } from "./format.js";
import { getNextProgramId, getRecoveryText } from "./workout.js";

export function buildDashboardStats(history, programs, today = new Date()) {
  const nextProgramId = getNextProgramId(history);
  const nextProgram = programs.find((program) => program.id === nextProgramId) ?? programs[0] ?? null;
  const recentEntry = history[0] ?? null;

  let lastSameProgram = null;
  const lastByProgram = {};
  let weeklySessions = 0;
  let weeklyMinutes = 0;
  let weeklySets = 0;
  let bestSet = null;

  for (const entry of history) {
    if (!lastSameProgram && entry.dayId === nextProgramId) {
      lastSameProgram = entry;
    }

    if (entry.dayId && !lastByProgram[entry.dayId]) {
      lastByProgram[entry.dayId] = entry;
    }

    if (isInCurrentLocalWeek(entry.date, today)) {
      weeklySessions += 1;
      weeklyMinutes += entry.duration || 0;
      weeklySets += entry.exercises.reduce(
        (sum, exercise) => sum + exercise.reps.filter((rep, i) => rep > 0 && !exercise.warmup?.[i]).length,
        0,
      );
    }

    for (const exercise of entry.exercises) {
      const workingReps = exercise.reps.filter((_, i) => !exercise.warmup?.[i]);
      const maxRep = Math.max(0, ...workingReps);
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
    recentAvgRpe: recentEntry ? calcAvgRpe(
      recentEntry.exercises.flatMap((exercise) => (exercise.rpe || []).filter((_, i) => !exercise.warmup?.[i])),
    ) : 0,
    lastSameProgramDate: lastSameProgram ? getDaysSinceLocalDate(lastSameProgram.date, today) : null,
    estimatedMinutes: Math.max(25, (nextProgram?.exercises.length ?? 0) * 7),
    bestSet,
    recoveryByProgram: programs.map((program) => ({
      id: program.id,
      label: program.day,
      tag: program.tag,
      state: getRecoveryText(lastByProgram[program.id], today),
    })),
  };
}
