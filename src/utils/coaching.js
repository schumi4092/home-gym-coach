import { calcAvgRpe, parseRepRange, formatExerciseLoad } from "./format.js";
import { getDefaultStep } from "./workout.js";

export function buildExerciseHistoryMap(history) {
  const map = {};

  for (const entry of history) {
    for (const exercise of entry.exercises) {
      const completedReps = exercise.reps.filter((rep) => rep > 0);
      if (completedReps.length === 0) continue;

      const exerciseSummary = {
        date: entry.date,
        weight: exercise.weight,
        unit: exercise.unit,
        reps: completedReps,
        maxRep: Math.max(...completedReps),
        totalReps: completedReps.reduce((sum, rep) => sum + rep, 0),
        avgRpe: calcAvgRpe(exercise.rpe),
      };

      if (!map[exercise.name]) {
        map[exercise.name] = { latest: exerciseSummary, best: exerciseSummary, recent: [exerciseSummary] };
        continue;
      }

      const current = map[exercise.name];
      current.recent = [exerciseSummary, ...current.recent].slice(0, 3);
      const bestScore = (current.best.weight || 0) * current.best.maxRep;
      const nextScore = (exerciseSummary.weight || 0) * exerciseSummary.maxRep;

      if (nextScore > bestScore || (nextScore === bestScore && exerciseSummary.totalReps > current.best.totalReps)) {
        current.best = exerciseSummary;
      }

      current.latest = current.latest ?? exerciseSummary;
    }
  }

  for (const entry of Object.values(map)) {
    entry.latest.recent = entry.recent;
  }

  return map;
}

export function createCoachingHint(exercise, latestHint, bestHint) {
  if (!latestHint) {
    return {
      headline: "先建立基準",
      detail: "今天先照目標範圍完成，做完後我就能根據你的表現給更準的建議。",
    };
  }

  const { min, max, type } = parseRepRange(exercise.repRange);
  const completedSets = latestHint.reps.length;
  const allSetsAtOrAboveMin = min ? latestHint.reps.every((rep) => rep >= min) : false;
  const allSetsAtMax = max ? latestHint.reps.every((rep) => rep >= max) : false;
  const avgRpe = latestHint.avgRpe ?? 0;
  const currentWeight = exercise.weight;
  const previousWeight = latestHint.weight;
  const weightDiff = Math.round((currentWeight - previousWeight) * 100) / 100;

  const suggestedIncrease = exercise.step ?? getDefaultStep(exercise.unit);
  const recentFatigue = latestHint.recent?.filter((item) => item.avgRpe >= 9).length ?? 0;

  if (recentFatigue >= 2) {
    return {
      headline: "強度偏高，注意疲勞",
      detail: `最近 ${recentFatigue} 次這個動作的平均 RPE 都在 9 以上。下次可考慮先維持重量，甚至減少 1 組或小降重量，讓恢復跟上。`,
    };
  }

  if (type === "amrap") {
    if (avgRpe >= 9 && latestHint.maxRep >= 6) {
      return {
        headline: "可以小幅加重",
        detail: `上次 AMRAP 做到 ${latestHint.reps.join("/")}，而且強度已經很高。下次可以加 ${suggestedIncrease}${exercise.unit}，或維持體重但把每組目標拉到 6 下以上。`,
      };
    }
    return {
      headline: "先把總次數撐高",
      detail: `上次做了 ${latestHint.reps.join("/")}。先專注把總次數往上推，等你能更穩定地做到 6 下以上，再考慮加重。`,
    };
  }

  if (allSetsAtMax && avgRpe > 0 && avgRpe <= 8.5) {
    return {
      headline: "表現很穩，可以加重",
      detail: `上次 ${formatExerciseLoad(previousWeight, latestHint.unit)} 已經把 ${completedSets} 組都做到區間上緣，平均 RPE ${avgRpe}。下次建議加 ${suggestedIncrease}${exercise.unit}。`,
    };
  }

  if (allSetsAtOrAboveMin && avgRpe >= 9.5) {
    return {
      headline: "先維持重量",
      detail: `你上次有達到基本目標，但平均 RPE ${avgRpe} 偏高。下次先維持 ${formatExerciseLoad(previousWeight, latestHint.unit)}，把動作穩定度和餘裕拉回來。`,
    };
  }

  if (!allSetsAtOrAboveMin && min) {
    return {
      headline: "先補齊下限 reps",
      detail: `上次做了 ${latestHint.reps.join("/")}，還沒全部進到 ${min}-${max} 的目標區。下次先維持 ${formatExerciseLoad(previousWeight, latestHint.unit)}，目標把每組都補到至少 ${min} 下。`,
    };
  }

  if (weightDiff > 0 && avgRpe >= 9) {
    return {
      headline: "新重量先適應",
      detail: `你現在比上次多了 ${weightDiff} ${exercise.unit}，而且上次平均 RPE ${avgRpe}。這次先把 reps 穩住，不急著再加。`,
    };
  }

  if (bestHint && bestHint.weight === latestHint.weight && bestHint.maxRep === latestHint.maxRep) {
    return {
      headline: "離突破很近",
      detail: `現在已經貼近你的最佳表現 ${formatExerciseLoad(bestHint.weight, bestHint.unit)} x ${bestHint.maxRep}。下次可以挑一組多做 1 下，或把全部組數做得更平均。`,
    };
  }

  return {
    headline: "維持節奏往上推",
    detail: `上次做了 ${latestHint.reps.join("/")}，平均 RPE ${avgRpe || "-"}。下次先維持 ${formatExerciseLoad(previousWeight, latestHint.unit)}，優先讓組數表現更整齊。`,
  };
}
