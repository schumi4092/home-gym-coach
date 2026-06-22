import { calcAvgRpe, parseRepRange, formatExerciseLoad, isLocalDateWithinDays } from "./format.js";
import { getExerciseStep } from "./workout.js";

// Signals we try to read out of the free-text notes you write during a session.
// Patterns cover the Chinese + English phrasing that actually shows up in history.
const NOTE_PATTERNS = {
  fatigue: [
    /熬夜|沒睡|睡不|失眠/,
    /狀況不[佳好]|狀態不[好佳]|沒精神|沒力/,
    /好累|很累|疲勞|疲憊|累爆/,
    /生病|感冒|不舒服/,
    /小?降.{0,3}重|降一?點|減重|降強度/,
    /tired|sleepy|exhausted|fatigue|drained|sick|run[- ]?down/i,
  ],
  soreness: [
    /痠|酸|痛|拉傷|緊繃|發炎|卡卡|怪怪/,
    /sore|pain|tight|strain|ache|achy|clicky|tweak|niggle/i,
  ],
  breathing: [
    /喘|上氣不接下氣|喘不過|心跳很快/,
    /breath|winded|cardio|gass?ed|out of breath/i,
  ],
  missed: [
    /做不[完動起]|沒做完|力竭|撐不住|掉速|只做了?|差一?點|沒達標/,
    /fail|missed|couldn'?t|fell short/i,
  ],
};

export function classifyNote(text) {
  const t = (text || "").trim();
  const flags = { fatigue: false, soreness: false, breathing: false, missed: false };
  if (!t) return flags;
  for (const [key, patterns] of Object.entries(NOTE_PATTERNS)) {
    flags[key] = patterns.some((re) => re.test(t));
  }
  return flags;
}

export function buildExerciseHistoryMap(history) {
  const map = {};

  for (const entry of history) {
    for (const exercise of entry.exercises) {
      const completed = exercise.reps
        .map((rep, i) => ({ rep, i }))
        .filter(({ rep, i }) => rep > 0 && !exercise.warmup?.[i]);
      if (completed.length === 0) continue;

      const completedReps = completed.map((c) => c.rep);
      // Resolve the actual weight per working set: a per-set override wins, else the base weight.
      const setWeights = completed.map((c) => {
        const w = exercise.setWeights?.[c.i];
        return Number.isFinite(w) ? w : exercise.weight;
      });
      const workingRpes = (exercise.rpe || []).filter((_, i) => !exercise.warmup?.[i]);
      const exerciseSummary = {
        date: entry.date,
        weight: exercise.weight,
        unit: exercise.unit,
        reps: completedReps,
        setWeights,
        topWeight: Math.max(...setWeights),
        variedWeights: new Set(setWeights).size > 1,
        maxRep: Math.max(...completedReps),
        totalReps: completedReps.reduce((sum, rep) => sum + rep, 0),
        avgRpe: calcAvgRpe(workingRpes),
        exerciseNote: (exercise.exerciseNote || "").trim(),
        sessionNote: (entry.sessionNote || "").trim(),
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

export function checkDeloadSuggestion(history) {
  const recentEntries = history.filter((entry) => isLocalDateWithinDays(entry.date, 21));
  if (recentEntries.length < 4) return null;

  const recentRpes = recentEntries.map((entry) =>
    calcAvgRpe(entry.exercises.flatMap((ex) => (ex.rpe || []).filter((_, i) => !ex.warmup?.[i]))),
  ).filter((rpe) => rpe > 0);

  if (recentRpes.length < 4) return null;

  const avgRpe = Math.round((recentRpes.reduce((s, v) => s + v, 0) / recentRpes.length) * 10) / 10;
  const highRpeCount = recentRpes.filter((rpe) => rpe >= 9).length;
  const highRpeRatio = highRpeCount / recentRpes.length;

  const repDecline = checkRepDecline(history);

  if (avgRpe >= 9 && highRpeRatio >= 0.6) {
    return {
      level: "warning",
      headline: "建議安排減量週",
      detail: `最近 ${recentRpes.length} 次訓練平均 RPE ${avgRpe}，其中 ${highRpeCount} 次 RPE ≥ 9。建議下週將重量降 10-15%、減少 1-2 組，讓身體恢復。`,
    };
  }

  if (avgRpe >= 8.5 && (highRpeRatio >= 0.5 || repDecline)) {
    return {
      level: "caution",
      headline: "疲勞累積中",
      detail: `近期平均 RPE ${avgRpe}${repDecline ? "，部分動作次數有下滑趨勢" : ""}。可以考慮稍微降低強度或多安排一天休息。`,
    };
  }

  return null;
}

function checkRepDecline(history) {
  if (history.length < 4) return false;

  const recent = history.slice(0, 2);
  const earlier = history.slice(2, 4);

  const avgReps = (entries) => {
    const allReps = entries.flatMap((e) => e.exercises.flatMap((ex) => ex.reps.filter((r, i) => r > 0 && !ex.warmup?.[i])));
    return allReps.length > 0 ? allReps.reduce((s, v) => s + v, 0) / allReps.length : 0;
  };

  const recentAvg = avgReps(recent);
  const earlierAvg = avgReps(earlier);

  return earlierAvg > 0 && recentAvg < earlierAvg * 0.85;
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

  const suggestedIncrease = getExerciseStep(exercise);
  const increaseText = formatIncreaseText(exercise, suggestedIncrease);
  const recentFatigue = latestHint.recent?.filter((item) => item.avgRpe >= 9).length ?? 0;

  // ── Note-aware signals ──────────────────────────────────────────────────────
  const lastNote = latestHint.exerciseNote || "";
  const lastConditionText = [latestHint.exerciseNote, latestHint.sessionNote].filter(Boolean).join("；");
  const lastFlags = classifyNote(lastConditionText);
  const liveFlags = classifyNote(exercise.exerciseNote || "");

  // Soreness / pain you logged last time comes before any progression talk.
  if (lastFlags.soreness) {
    return {
      headline: "先確認身體狀況",
      detail: `你上次記了：「${lastNote || latestHint.sessionNote}」。今天先做足熱身、確認沒有不適再決定加量；若是單側或關節的感覺，左右分開觀察，必要時這個動作先降一點重量。`,
    };
  }

  const base = (() => {
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
          detail: exercise.unit === "bw"
            ? `上次 AMRAP 做到 ${latestHint.reps.join("/")}，而且強度已經很高。下次可以維持體重、每組多拚 1 下；如果器材允許，也可以開始小幅負重。`
            : `上次 AMRAP 做到 ${latestHint.reps.join("/")}，而且強度已經很高。下次可以加 ${increaseText}，或先維持重量把每組目標拉到 6 下以上。`,
        };
      }
      return {
        headline: "先把總次數撐高",
        detail: `上次做了 ${latestHint.reps.join("/")}。先專注把總次數往上推，等你能更穩定地做到 6 下以上，再考慮加重。`,
      };
    }

    if (weightDiff > 0) {
      return {
        headline: "新重量先觀察",
        detail: `你現在比上次多了 ${weightDiff} ${exercise.unit}。這次先確認 reps 和動作品質能不能站穩，再決定下次要不要繼續加。`,
      };
    }

    if (weightDiff < 0 && exercise.unit !== "bw") {
      // You already flagged a rough day in today's note — treat the drop as intentional, not a mistake.
      if (liveFlags.fatigue) {
        return {
          headline: "狀態調整，沒問題",
          detail: `你今天記了狀態不在巔峰，小降重量是合理的選擇。把動作做穩、控制好離心就好；等狀態回來再回到 ${formatExerciseLoad(previousWeight, latestHint.unit)}。`,
        };
      }
      return {
        headline: "重量低於上次",
        detail: `你現在比上次少了 ${Math.abs(weightDiff)} ${exercise.unit}。如果這不是刻意降重，可以先檢查是不是課表起始重量還沒更新；狀態正常的話，下次可回到 ${formatExerciseLoad(previousWeight, latestHint.unit)}。`,
      };
    }

    // Last session's RPE was inflated by a documented off day — don't read it as a true ceiling.
    if (lastFlags.fatigue && avgRpe >= 9) {
      return {
        headline: "上次是辛苦的一天",
        detail: `上次你記了狀態不好，那天平均 RPE ${avgRpe} 偏高很正常，先別當成已經到頂。今天若恢復了就照原節奏推進；還是覺得累的話，先穩住 ${formatExerciseLoad(previousWeight, latestHint.unit)} 把品質顧好。`,
      };
    }

    if (allSetsAtMax && avgRpe > 0 && avgRpe <= 8.5) {
      return {
        headline: "表現很穩，可以加重",
        detail: exercise.unit === "bw"
          ? `上次已經把 ${completedSets} 組都做到區間上緣，平均 RPE ${avgRpe}。下次可以每組多做 1 下，或把動作節奏控制得更穩。`
          : `上次 ${formatExerciseLoad(previousWeight, latestHint.unit)} 已經把 ${completedSets} 組都做到區間上緣，平均 RPE ${avgRpe}。下次建議加 ${increaseText}。`,
      };
    }

    if (allSetsAtOrAboveMin && avgRpe >= 9.5) {
      return {
        headline: "先維持重量",
        detail: `你上次有達到基本目標，但平均 RPE ${avgRpe} 偏高。下次先維持 ${formatExerciseLoad(previousWeight, latestHint.unit)}，把動作穩定度和餘裕拉回來。`,
      };
    }

    if (!allSetsAtOrAboveMin && min) {
      // Missing reps + a "good run" feel ⇒ conditioning, not strength, was the limiter.
      if (lastFlags.breathing) {
        return {
          headline: "卡在喘，不是卡在力量",
          detail: `上次有幾組沒進到 ${min}-${max}，但你記到的是「喘」而不是推不動。下次組間多休息 30-60 秒，先把每組補到 ${min} 下；重量先別動。`,
        };
      }
      return {
        headline: "先補齊下限 reps",
        detail: `上次做了 ${latestHint.reps.join("/")}，還沒全部進到 ${min}-${max} 的目標區。下次先維持 ${formatExerciseLoad(previousWeight, latestHint.unit)}，目標把每組都補到至少 ${min} 下。`,
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
  })();

  return maybeEchoNote(base, lastNote);
}

// Surface your own note back to you, unless the chosen hint already quotes it.
function maybeEchoNote(hint, note) {
  const n = (note || "").trim();
  if (!n || hint.detail.includes(n)) return hint;
  return { ...hint, detail: `你上次記了：「${n}」。${hint.detail}` };
}

function formatIncreaseText(exercise, step) {
  if (exercise.unit === "sec") return `${step} 秒`;
  return `${step}${exercise.unit}`;
}
