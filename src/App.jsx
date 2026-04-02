import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const fallbackStorage = {
  async get(key) {
    const value = localStorage.getItem(key);
    return value === null ? null : { value };
  },
  async set(key, value) {
    localStorage.setItem(key, value);
  },
  async delete(key) {
    localStorage.removeItem(key);
  },
};

const storage = window.storage ?? fallbackStorage;

const DEFAULT_PROGRAM = [
  {
    id: "upper-a",
    day: "上半身 A",
    subtitle: "胸肩推為主",
    tag: "PUSH",
    exercises: [
      { name: "啞鈴平板臥推", weight: 10, unit: "kg", sets: 4, repRange: "8-10", note: "選擇能完成 8-10 下、最後一組略感吃力的重量。" },
      { name: "上斜啞鈴臥推", weight: 8, unit: "kg", sets: 3, repRange: "8-10", note: "上斜角約 30-45 度，保持肩胛收緊。" },
      { name: "啞鈴肩推", weight: 8, unit: "kg", sets: 3, repRange: "8-10", note: "核心收緊，避免下背代償。" },
      { name: "啞鈴側平舉", weight: 5, unit: "kg", sets: 3, repRange: "12-15", note: "控制離心，不要聳肩。" },
      { name: "啞鈴前平舉", weight: 5, unit: "kg", sets: 3, repRange: "15-20", note: "手臂與地面平行即可，不需過高。" },
      { name: "單手過頭三頭伸展", weight: 5, unit: "kg", sets: 3, repRange: "12-15", note: "組間休息抓 90 秒。" },
    ],
  },
  {
    id: "lower-a",
    day: "下半身 A",
    subtitle: "股四頭為主",
    tag: "QUAD",
    exercises: [
      { name: "高腳杯深蹲", weight: 10, unit: "kg", sets: 4, repRange: "8-10", note: "蹲至大腿與地面平行，膝蓋跟著腳尖方向。" },
      { name: "保加利亞分腿蹲", weight: 8, unit: "kg", sets: 3, repRange: "8-12", note: "後腳放在椅上，重心放前腳。" },
      { name: "羅馬尼亞硬舉", weight: 10, unit: "kg", sets: 3, repRange: "8-12", note: "保持背部中立，感受腿後側拉伸。" },
      { name: "徒手弓箭步", weight: 0, unit: "bw", sets: 3, repRange: "20-25", note: "左右腳都算，目標每組 20-25 下。" },
      { name: "站姿提踵", weight: 5, unit: "kg", sets: 3, repRange: "15-20", note: "頂峰停 1 秒，感受小腿收縮。" },
    ],
  },
  {
    id: "upper-b",
    day: "上半身 B",
    subtitle: "背部拉為主",
    tag: "PULL",
    exercises: [
      { name: "引體向上", weight: 0, unit: "bw", sets: 4, repRange: "AMRAP", note: "做到力竭，若無法完成可改用彈力帶輔助。" },
      { name: "單臂啞鈴划船", weight: 10, unit: "kg", sets: 4, repRange: "8-12", note: "手肘拉向腰部，感受背部發力。" },
      { name: "上斜啞鈴臥推", weight: 8, unit: "kg", sets: 3, repRange: "10-12", note: "補胸量，不需要做到完全力竭。" },
      { name: "後三角飛鳥", weight: 4, unit: "kg", sets: 3, repRange: "15-20", note: "控制軌跡，手肘微彎。" },
      { name: "啞鈴彎舉", weight: 5, unit: "kg", sets: 3, repRange: "12-15", note: "手腕保持中立，避免甩動借力。" },
    ],
  },
  {
    id: "lower-b",
    day: "下半身 B",
    subtitle: "臀腿後側為主",
    tag: "POST",
    exercises: [
      { name: "羅馬尼亞硬舉", weight: 10, unit: "kg", sets: 4, repRange: "8-10", note: "動作穩定後再逐步加重。" },
      { name: "啞鈴臀推", weight: 10, unit: "kg", sets: 3, repRange: "10-12", note: "頂峰停頓，專注臀部發力。" },
      { name: "啞鈴相撲深蹲", weight: 12, unit: "kg", sets: 3, repRange: "12-15", note: "腳尖外開，膝蓋跟著腳尖方向。" },
      { name: "平板撐體", weight: 0, unit: "bw", sets: 3, repRange: "30-40", note: "每組維持 30-40 秒，腹部持續出力。" },
      { name: "登山者", weight: 0, unit: "bw", sets: 3, repRange: "12-15", note: "速度穩定，不要聳肩。" },
    ],
  },
];

const TRAINING_FLOW = [
  { label: "第 1 天", type: "upper-a", short: "上A" },
  { label: "第 2 天", type: "lower-a", short: "下A" },
  { label: "第 3 天", type: "rest", short: "休" },
  { label: "第 4 天", type: "upper-b", short: "上B" },
  { label: "第 5 天", type: "lower-b", short: "下B" },
  { label: "第 6 天", type: "rest", short: "休" },
  { label: "第 7 天", type: "rest", short: "休" },
];

const T = {
  bg: "#111110",
  bg2: "#1A1A18",
  bg3: "#222220",
  bg4: "#2C2C29",
  t1: "#F0EDE6",
  t2: "#A8A59C",
  t3: "#6B6962",
  border: "#2E2E2B",
  borderLight: "#3A3A36",
  accent: "#C8FF3E",
  green: "#4ADE80",
  amber: "#FBBF24",
  orange: "#FB923C",
  red: "#EF4444",
};

const RPE_OPTIONS = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10];
const STORAGE_KEYS = { history: "wk-hist-v5", live: "wk-live-v5", program: "wk-program-v1" };

const primaryMiniButtonStyle = {
  fontSize: 13,
  padding: "4px 14px",
  background: T.accent,
  color: T.bg,
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 600,
};

const secondaryMiniButtonStyle = {
  fontSize: 13,
  padding: "4px 14px",
  background: T.bg3,
  color: T.t2,
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};

function calcAvgRpe(rpeArray) {
  const valid = (rpeArray || []).filter((v) => v > 0);
  return valid.length > 0
    ? Math.round((valid.reduce((sum, v) => sum + v, 0) / valid.length) * 10) / 10
    : 0;
}

function formatSeconds(seconds) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function getRpeColor(value) {
  if (value >= 9.5) {
    return T.red;
  }
  if (value >= 8.5) {
    return T.orange;
  }
  if (value >= 7.5) {
    return T.amber;
  }
  return T.green;
}

function formatLocalDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createWorkoutSession(program) {
  return normalizeWorkoutSession({
    ...program,
    startTime: Date.now(),
    exercises: program.exercises.map((exercise) => ({
      ...exercise,
      step: getDefaultStep(exercise.unit),
    })),
  });
}

function calculateRepMax(range) {
  if (range === "AMRAP") {
    return 30;
  }

  const upperBound = Number.parseInt(range.split("-").pop() ?? "0", 10);
  return Number.isNaN(upperBound) ? 20 : upperBound + 5;
}

function getRestSeconds(range) {
  if (range === "AMRAP") return 90;
  const max = Number.parseInt(range.split("-").at(-1) ?? "0", 10);
  return !Number.isNaN(max) && max >= 15 ? 60 : 90;
}

function getDefaultStep(unit) {
  if (unit === "kg") {
    return 1;
  }
  if (unit === "sec") {
    return 5;
  }
  return 1;
}

function getAdjustedWeight(weight, step, direction) {
  return Math.max(0, Math.round((weight + direction * step) * 100) / 100);
}

function normalizeWorkoutSession(session) {
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

function hydrateHistoryEntry(entry, programs) {
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

function formatExerciseLoad(weight, unit) {
  return weight > 0 ? `${weight} ${unit}` : "BW";
}

function parseRepRange(range) {
  if (range === "AMRAP") {
    return { type: "amrap", min: null, max: null };
  }

  const [minText, maxText] = range.split("-");
  const min = Number.parseInt(minText ?? "", 10);
  const max = Number.parseInt(maxText ?? "", 10);

  return {
    type: Number.isNaN(min) || Number.isNaN(max) ? "unknown" : "range",
    min: Number.isNaN(min) ? null : min,
    max: Number.isNaN(max) ? null : max,
  };
}

function createCoachingHint(exercise, latestHint, bestHint) {
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

function buildExerciseHistoryMap(history) {
  const map = {};

  for (const entry of history) {
    for (const exercise of entry.exercises) {
      const completedReps = exercise.reps.filter((rep) => rep > 0);
      if (completedReps.length === 0) {
        continue;
      }

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

function getNextProgramId(history) {
  const completedSessions = history.filter((entry) => entry.dayId);
  if (completedSessions.length === 0) {
    return "upper-a";
  }

  const lastIndex = TRAINING_FLOW.findIndex((item) => item.type === completedSessions[0].dayId);
  if (lastIndex === -1) {
    return "upper-a";
  }

  for (let offset = 1; offset <= TRAINING_FLOW.length; offset += 1) {
    const nextItem = TRAINING_FLOW[(lastIndex + offset) % TRAINING_FLOW.length];
    if (nextItem.type !== "rest") {
      return nextItem.type;
    }
  }

  return "upper-a";
}

function getRecoveryText(entry, currentDayTime) {
  if (!entry) {
    return { label: "可安排", color: T.green };
  }
  const daysAgo = Math.floor((currentDayTime - new Date(entry.date).getTime()) / 86400000);
  if (daysAgo <= 1) {
    return { label: "剛做過", color: T.orange };
  }
  if (daysAgo <= 2) {
    return { label: "接近恢復", color: T.amber };
  }
  return { label: "可安排", color: T.green };
}

function exportToMarkdown(history, programs) {
  if (history.length === 0) return "目前沒有訓練紀錄。";

  const lines = [];
  const totalMinutes = history.reduce((sum, e) => sum + (e.duration || 0), 0);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const recentSessions = history.filter((e) => new Date(e.date) >= sevenDaysAgo).length;

  lines.push("# 訓練紀錄報告");
  lines.push(`> 匯出時間：${formatLocalDate()}`);
  lines.push("");
  lines.push("## 整體摘要");
  lines.push(`- 總訓練次數：${history.length} 次`);
  lines.push(`- 總訓練時間：${totalMinutes} 分鐘`);
  lines.push(`- 最近 7 天：${recentSessions} 次`);
  lines.push(`- 紀錄區間：${history.at(-1)?.date} ～ ${history[0]?.date}`);
  lines.push("");

  lines.push("## 各動作進度");
  const allNames = [...new Set(history.flatMap((e) => e.exercises.map((ex) => ex.name)))];
  for (const name of allNames) {
    const sessions = history
      .filter((e) => e.exercises.some((ex) => ex.name === name))
      .map((e) => {
        const ex = e.exercises.find((item) => item.name === name);
        const validReps = ex.reps.filter((r) => r > 0);
        return { date: e.date, weight: ex.weight, unit: ex.unit, reps: validReps, avgRpe: calcAvgRpe(ex.rpe) };
      })
      .reverse();
    if (sessions.length === 0) continue;
    lines.push(`### ${name}`);
    lines.push("| 日期 | 重量 | 次數 | 平均 RPE |");
    lines.push("|------|------|------|----------|");
    for (const s of sessions) {
      const load = s.weight > 0 ? `${s.weight} ${s.unit}` : "自體重";
      lines.push(`| ${s.date} | ${load} | ${s.reps.length > 0 ? s.reps.join("/") : "-"} | ${s.avgRpe > 0 ? s.avgRpe : "-"} |`);
    }
    lines.push("");
  }

  lines.push("## 最近訓練記錄（最新 10 筆）");
  for (const entry of history.slice(0, 10)) {
    lines.push(`### ${entry.date} — ${entry.day}（${entry.duration} 分鐘）`);
    for (const ex of entry.exercises) {
      const validReps = ex.reps.filter((r) => r > 0);
      if (validReps.length === 0) continue;
      const load = ex.weight > 0 ? `${ex.weight} ${ex.unit}` : "自體重";
      const rpeStr = calcAvgRpe(ex.rpe) > 0 ? `，RPE ${calcAvgRpe(ex.rpe)}` : "";
      lines.push(`- ${ex.name}：${load}，${validReps.join("/")} 下${rpeStr}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

async function persistLiveWorkout(session) {
  try {
    await storage.set(STORAGE_KEYS.live, JSON.stringify(session));
  } catch (error) {
    console.error("Failed to save live workout", error);
  }
}

async function clearLiveWorkout() {
  try {
    await storage.delete(STORAGE_KEYS.live);
  } catch (error) {
    console.error("Failed to clear live workout", error);
  }
}

function Timer({ sec = 90 }) {
  const [total, setTotal] = useState(sec);
  const [left, setLeft] = useState(null);
  const [running, setRunning] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, []);

  const start = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setLeft(total);
    setRunning(true);
    timerRef.current = setInterval(() => {
      setLeft((previous) => {
        if (previous === null || previous <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          setRunning(false);
          navigator.vibrate?.(300);
          return 0;
        }

        return previous - 1;
      });
    }, 1000);
  }, [total]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRunning(false);
    setLeft(null);
  }, []);

  const done = left === 0;
  const progress = left !== null ? left / total : 1;
  const radius = 16;
  const circumference = 2 * Math.PI * radius;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0 4px" }}>
      <div style={{ position: "relative", width: 40, height: 40, flexShrink: 0 }}>
        <svg width="40" height="40" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r={radius} fill="none" stroke={T.bg3} strokeWidth="2.5" />
          <circle
            cx="20"
            cy="20"
            r={radius}
            fill="none"
            stroke={done ? T.red : running ? T.accent : T.t3}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            transform="rotate(-90 20 20)"
            style={{ transition: "stroke-dashoffset 0.4s cubic-bezier(.4,0,.2,1)" }}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 600,
            fontVariantNumeric: "tabular-nums",
            color: done ? T.red : T.t1,
          }}
        >
          {left !== null ? formatSeconds(left) : formatSeconds(total)}
        </div>
      </div>

      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
        {!running && left === null && (
          <>
            {[60, 90, 120].map((seconds) => (
              <button
                key={seconds}
                onClick={() => setTotal(seconds)}
                style={{
                  fontSize: 13,
                  padding: "4px 10px",
                  borderRadius: 6,
                  cursor: "pointer",
                  border: "none",
                  background: total === seconds ? T.t1 : T.bg3,
                  color: total === seconds ? T.bg : T.t3,
                  fontWeight: total === seconds ? 600 : 400,
                  transition: "all 0.15s",
                }}
              >
                {seconds}s
              </button>
            ))}
            <button onClick={start} style={primaryMiniButtonStyle}>
              開始
            </button>
          </>
        )}

        {running && (
          <button onClick={stop} style={secondaryMiniButtonStyle}>
            停止
          </button>
        )}

        {done && (
          <>
            <span style={{ fontSize: 14, fontWeight: 600, color: T.red }}>休息結束</span>
            <button onClick={() => setLeft(null)} style={secondaryMiniButtonStyle}>
              OK
            </button>
          </>
        )}
      </div>
    </div>
  );
}
function SliderRep({ value, max, onChange }) {
  const trackRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const progress = max > 0 ? value / max : 0;

  const calculateValue = useCallback(
    (clientX) => {
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0) {
        return 0;
      }

      const ratio = Math.max(0, Math.min(clientX - rect.left, rect.width)) / rect.width;
      return Math.round(ratio * max);
    },
    [max],
  );

  const handleStart = useCallback(
    (event) => {
      event.preventDefault();
      setIsDragging(true);
      const initialX = "touches" in event ? event.touches[0].clientX : event.clientX;
      onChange(calculateValue(initialX));

      const handleMove = (moveEvent) => {
        const clientX = "touches" in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
        onChange(calculateValue(clientX));
      };

      const handleEnd = () => {
        setIsDragging(false);
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleEnd);
        window.removeEventListener("touchmove", handleMove);
        window.removeEventListener("touchend", handleEnd);
      };

      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleEnd);
      window.addEventListener("touchmove", handleMove, { passive: false });
      window.addEventListener("touchend", handleEnd);
    },
    [calculateValue, onChange],
  );

  return (
    <div
      ref={trackRef}
      onMouseDown={handleStart}
      onTouchStart={handleStart}
      style={{
        position: "relative",
        height: 36,
        borderRadius: 8,
        cursor: "pointer",
        background: T.bg3,
        overflow: "hidden",
        touchAction: "none",
        userSelect: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          borderRadius: 8,
          width: `${progress * 100}%`,
          background: value > 0 ? `${T.accent}30` : "transparent",
          transition: isDragging ? "none" : "width 0.15s",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          width: 4,
          borderRadius: 2,
          left: `calc(${progress * 100}% - 2px)`,
          background: value > 0 ? T.accent : T.t3,
          transition: isDragging ? "none" : "left 0.15s",
          opacity: value > 0 ? 1 : 0.5,
        }}
      />
      {value > 0 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            paddingLeft: 10,
            fontSize: 17,
            fontWeight: 700,
            color: T.accent,
            fontVariantNumeric: "tabular-nums",
            pointerEvents: "none",
          }}
        >
          {value}
        </div>
      ) : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            color: T.t3,
            pointerEvents: "none",
          }}
        >
          左右滑動記錄次數
        </div>
      )}
    </div>
  );
}

function SetRow({ index, rep, rpe, onRep, onRpe, range }) {
  const max = calculateRepMax(range);
  const filled = rep > 0;

  return (
    <div style={{ padding: "8px 0", borderBottom: `0.5px solid ${T.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <div style={{ width: 28, fontSize: 14, fontWeight: 600, color: filled ? T.accent : T.t3 }}>S{index + 1}</div>
        <div style={{ flex: 1 }}>
          <SliderRep value={rep} max={max} onChange={onRep} />
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 3, paddingLeft: 38 }}>
        <span style={{ fontSize: 12, color: T.t3, marginRight: 4 }}>RPE</span>
        {RPE_OPTIONS.map((value) => {
          const active = rpe === value;
          const color = getRpeColor(value);

          return (
            <button
              key={value}
              onClick={() => onRpe(active ? 0 : value)}
              style={{
                width: 38,
                height: 28,
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 6,
                cursor: "pointer",
                border: active ? "none" : `1px solid ${T.border}`,
                background: active ? color : "transparent",
                color: active ? T.bg : T.t3,
                transition: "all 0.12s",
                lineHeight: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {value}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ExerciseCard({ exercise, index, onRep, onWeight, onRpe, onStepChange, number, historyHint }) {
  const [open, setOpen] = useState(false);
  const allDone = exercise.reps.every((rep) => rep > 0);
  const avgRpe = calcAvgRpe(exercise.rpe);
  const latestHint = historyHint?.latest;
  const bestHint = historyHint?.best;
  const dynamicHint = latestHint
    ? `上次 ${formatExerciseLoad(latestHint.weight, latestHint.unit)}，做了 ${latestHint.reps.join("/")}。`
    : "這個動作還沒有歷史紀錄，今天先建立第一筆。";
  const bestHintText = bestHint
    ? `最佳 ${formatExerciseLoad(bestHint.weight, bestHint.unit)} x ${bestHint.maxRep}`
    : null;
  const coachingHint = createCoachingHint(exercise, latestHint, bestHint);

  return (
    <div
      style={{
        borderRadius: 12,
        marginBottom: 6,
        overflow: "hidden",
        transition: "all 0.2s",
        background: open ? T.bg2 : "transparent",
        border: `0.5px solid ${open ? T.borderLight : "transparent"}`,
      }}
    >
      <div
        onClick={() => setOpen((current) => !current)}
        style={{ padding: "16px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, userSelect: "none" }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 9,
            flexShrink: 0,
            background: allDone ? T.accent : T.bg3,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            fontWeight: 700,
            color: allDone ? T.bg : T.t3,
            transition: "all 0.3s",
          }}
        >
          {allDone ? (
            <svg width="14" height="14" viewBox="0 0 14 14">
              <path d="M2.5 7.5L5.5 10.5L11.5 3.5" fill="none" stroke={T.bg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            number
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 500, color: T.t1, lineHeight: 1.3 }}>{exercise.name}</div>
          <div style={{ fontSize: 14, color: T.t3, marginTop: 2, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ color: T.t2, fontWeight: 500 }}>{exercise.weight > 0 ? `${exercise.weight} ${exercise.unit}` : "自體重"}</span>
            <span style={{ opacity: 0.3 }}>|</span>
            <span>{exercise.sets} x {exercise.repRange}</span>
            {avgRpe > 0 && (
              <>
                <span style={{ opacity: 0.3 }}>|</span>
                <span style={{ color: getRpeColor(avgRpe), fontWeight: 500 }}>RPE {avgRpe}</span>
              </>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
          {exercise.reps.map((rep, repIndex) => (
            <div key={repIndex} style={{ width: 5, height: 5, borderRadius: 3, transition: "all 0.2s", background: rep > 0 ? T.accent : T.bg4 }} />
          ))}
        </div>
      </div>

      {open && (
        <div style={{ padding: "0 14px 14px" }}>
          <div
            style={{
              fontSize: 14,
              color: T.t1,
              padding: "10px 12px",
              lineHeight: 1.6,
              background: T.bg3,
              borderRadius: 8,
              marginBottom: 12,
              borderLeft: `2px solid ${T.accent}`,
            }}
          >
            <div style={{ color: T.t3, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 4 }}>LAST TIME</div>
            <div>{dynamicHint}</div>
            {(bestHintText || latestHint?.avgRpe > 0) && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                {bestHintText && <div style={{ color: T.accent, fontWeight: 600 }}>{bestHintText}</div>}
                {latestHint?.avgRpe > 0 && <div style={{ color: getRpeColor(latestHint.avgRpe) }}>平均 RPE {latestHint.avgRpe}</div>}
              </div>
            )}
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${T.border}` }}>
              <div style={{ color: T.t3, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 4 }}>NEXT TIP</div>
              <div style={{ color: T.accent, fontWeight: 700, marginBottom: 4 }}>{coachingHint.headline}</div>
              <div style={{ color: T.t2 }}>{coachingHint.detail}</div>
            </div>
          </div>

          {exercise.note && (
            <div
              style={{
                fontSize: 14,
                color: T.t2,
                padding: "10px 12px",
                lineHeight: 1.6,
                background: T.bg3,
                borderRadius: 8,
                marginBottom: 12,
                borderLeft: `2px solid ${T.accent}40`,
              }}
            >
              <div style={{ color: T.t3, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 4 }}>COACH NOTE</div>
              {exercise.note}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: T.t3, fontWeight: 500 }}>重量</span>
            <div style={{ display: "inline-flex", alignItems: "center", borderRadius: 8, overflow: "hidden", border: `0.5px solid ${T.border}` }}>
              <button
                onClick={() => onWeight(index, getAdjustedWeight(exercise.weight, exercise.step ?? getDefaultStep(exercise.unit), -1))}
                style={{ width: 32, height: 30, border: "none", background: T.bg3, color: T.t2, fontSize: 17, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                -
              </button>
              <div style={{ minWidth: 56, height: 30, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: T.t1, background: T.bg2, padding: "0 4px" }}>
                {exercise.weight > 0 ? `${exercise.weight} ${exercise.unit}` : "BW"}
              </div>
              <button
                onClick={() => onWeight(index, getAdjustedWeight(exercise.weight, exercise.step ?? getDefaultStep(exercise.unit), 1))}
                style={{ width: 32, height: 30, border: "none", background: T.bg3, color: T.t2, fontSize: 17, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                +
              </button>
            </div>
            {exercise.unit === "kg" && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 13, color: T.t3, fontWeight: 500 }}>步進</span>
                <select
                  value={String(exercise.step ?? 1)}
                  onChange={(event) => onStepChange(index, Number(event.target.value))}
                  style={{ height: 30, borderRadius: 8, border: `0.5px solid ${T.border}`, background: T.bg3, color: T.t1, padding: "0 8px", fontSize: 14 }}
                >
                  {[1, 0.5, 0.25, 0.125].map((step) => (
                    <option key={step} value={step}>
                      {step} kg
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: T.t3, fontWeight: 500 }}>次數 / 範圍</span>
            <span style={{ fontSize: 12, color: T.t3, fontWeight: 500 }}>RPE</span>
          </div>

          {exercise.reps.map((rep, setIndex) => (
            <SetRow
              key={setIndex}
              index={setIndex}
              rep={rep}
              rpe={exercise.rpe[setIndex] || 0}
              onRep={(value) => onRep(index, setIndex, value)}
              onRpe={(value) => onRpe(index, setIndex, value)}
              range={exercise.repRange}
            />
          ))}

          <Timer sec={getRestSeconds(exercise.repRange)} />
        </div>
      )}
    </div>
  );
}
function ProgressView({ history, onBack, onDelete, isDesktop }) {
  const exerciseNames = useMemo(
    () => [...new Set(history.flatMap((entry) => entry.exercises.map((exercise) => exercise.name)))].sort(),
    [history],
  );
  const [selected, setSelected] = useState(exerciseNames[0] ?? "");
  const activeSelected = exerciseNames.includes(selected) ? selected : (exerciseNames[0] ?? "");

  const data = useMemo(() => {
    return history
      .map((entry, sourceIndex) => {
        const exercise = entry.exercises.find((item) => item.name === activeSelected);
        if (!exercise) {
          return null;
        }

        const validReps = exercise.reps.filter((rep) => rep > 0);
        const totalReps = validReps.reduce((sum, rep) => sum + rep, 0);
        const maxRep = validReps.length > 0 ? Math.max(...validReps) : 0;
        const volume = exercise.weight > 0 ? exercise.weight * totalReps : totalReps;
        const avgRpe = calcAvgRpe(exercise.rpe);

        return {
          date: entry.date,
          weight: exercise.weight,
          unit: exercise.unit,
          totalReps,
          maxRep,
          volume,
          reps: exercise.reps,
          avgRpe,
          sourceIndex,
        };
      })
      .filter(Boolean)
      .reverse();
  }, [activeSelected, history]);

  const maxVolume = data.length > 0 ? Math.max(...data.map((item) => item.volume)) : 1;
  const bestWeight = data.length > 0 ? Math.max(...data.map((item) => item.weight)) : 0;
  const bestRep = data.length > 0 ? Math.max(...data.map((item) => item.maxRep)) : 0;
  const firstVolume = data[0]?.volume ?? 0;
  const latestVolume = data.at(-1)?.volume ?? 0;
  const volumeChange = firstVolume > 0 ? Math.round(((latestVolume - firstVolume) / firstVolume) * 100) : 0;

  return (
    <div style={{ background: T.bg, minHeight: "100vh", padding: isDesktop ? "28px 28px 40px" : "20px 16px", color: T.t1 }}>
      <div style={{ maxWidth: isDesktop ? 1180 : 500, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <button onClick={onBack} style={{ width: 32, height: 32, borderRadius: 8, background: T.bg3, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 14 14">
              <path d="M9 2L4 7L9 12" fill="none" stroke={T.t2} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.accent, letterSpacing: "0.12em", marginBottom: 2 }}>PROGRESS</div>
            <div style={{ fontSize: 20, fontWeight: 600 }}>訓練進度</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24 }}>
          {exerciseNames.map((name) => (
            <button
              key={name}
              onClick={() => setSelected(name)}
              style={{
                fontSize: 14,
                padding: "6px 14px",
                borderRadius: 6,
                cursor: "pointer",
                border: "none",
                background: selected === name ? T.accent : T.bg3,
                color: selected === name ? T.bg : T.t2,
                fontWeight: selected === name ? 600 : 400,
                transition: "all 0.15s",
              }}
            >
              {name}
            </button>
          ))}
        </div>

        {data.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: T.t3, fontSize: 16 }}>這個動作還沒有足夠紀錄。</div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(3, minmax(0, 1fr))" : "1fr 1fr 1fr", gap: 8, marginBottom: 24 }}>
              {[
                { label: "最高重量", value: bestWeight > 0 ? `${bestWeight} kg` : "BW", sub: "PR" },
                { label: "最佳次數", value: `${bestRep} 下`, sub: "Best set" },
                {
                  label: "總量變化",
                  value: `${volumeChange >= 0 ? "+" : ""}${volumeChange}%`,
                  sub: data.length > 1 ? `${data.length} 次紀錄` : "剛開始追蹤",
                  color: volumeChange > 0 ? T.green : volumeChange < 0 ? T.red : T.t2,
                },
              ].map((card) => (
                <div key={card.label} style={{ background: T.bg2, borderRadius: 10, padding: "14px 12px", textAlign: "center" }}>
                  <div style={{ fontSize: 12, color: T.t3, marginBottom: 6, fontWeight: 500 }}>{card.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: card.color || T.t1, fontVariantNumeric: "tabular-nums" }}>{card.value}</div>
                  <div style={{ fontSize: 12, color: T.t3, marginTop: 4 }}>{card.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "minmax(0, 1.15fr) minmax(340px, 0.85fr)" : "1fr", gap: 16, alignItems: "start" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.t3, letterSpacing: "0.08em", marginBottom: 12 }}>訓練總量</div>
                <div style={{ background: T.bg2, borderRadius: 12, padding: "16px 14px", marginBottom: isDesktop ? 0 : 24, minHeight: isDesktop ? 320 : "auto" }}>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: isDesktop ? 280 : 120, overflowX: "auto" }}>
                    {data.map((item, index) => {
                      const chartHeight = isDesktop ? 280 : 120;
                      const barAreaHeight = chartHeight - 52;
                      const barHeight = maxVolume > 0 ? Math.max((item.volume / maxVolume) * barAreaHeight, 4) : 4;
                      const isLatest = index === data.length - 1;

                      return (
                        <div key={`${item.date}-${index}`} style={{ flex: "1 1 0", minWidth: 28, maxWidth: 56, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                          <div style={{ fontSize: 13, color: T.t2, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", overflow: "hidden", fontWeight: 500 }}>{Math.round(item.volume)}</div>
                          <div style={{ width: "100%", maxWidth: isDesktop ? 36 : 28, height: barHeight, borderRadius: 4, background: isLatest ? T.accent : `${T.accent}40`, transition: "height 0.3s" }} />
                          <div style={{ fontSize: 13, color: T.t3, whiteSpace: "nowrap" }}>{item.date.slice(5)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.t3, letterSpacing: "0.08em", marginBottom: 12 }}>最近紀錄</div>
                {[...data].reverse().map((item, index) => {
                  return (
                  <div key={`${item.date}-detail-${index}`} style={{ background: T.bg2, borderRadius: 10, padding: "12px 14px", marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, gap: 8 }}>
                      <div style={{ fontSize: 15, fontWeight: 500, color: T.t1 }}>{item.date}</div>
                      <div style={{ display: "flex", gap: 8, fontSize: 14, color: T.t2, fontVariantNumeric: "tabular-nums", alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                        <span style={{ fontWeight: 600, color: T.t1 }}>{item.weight > 0 ? `${item.weight} ${item.unit}` : "BW"}</span>
                        {item.avgRpe > 0 && <span style={{ color: getRpeColor(item.avgRpe) }}>RPE {item.avgRpe}</span>}
                        {item.sourceIndex >= 0 && (
                          <button
                            onClick={() => onDelete(item.sourceIndex)}
                            style={{ fontSize: 13, padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer", background: T.bg3, color: T.red }}
                          >
                            刪除
                          </button>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {item.reps.map((rep, repIndex) => (
                        <div key={repIndex} style={{ flex: 1, textAlign: "center", padding: "6px 0", background: rep > 0 ? T.bg3 : T.bg, borderRadius: 6 }}>
                          <div style={{ fontSize: 16, fontWeight: 600, color: rep > 0 ? T.accent : T.t3, fontVariantNumeric: "tabular-nums" }}>{rep || "-"}</div>
                          <div style={{ fontSize: 11, color: T.t3 }}>S{repIndex + 1}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function HistoryEditor({ entry, programs, onBack, onSave, isDesktop }) {
  const [draft, setDraft] = useState(() => hydrateHistoryEntry(entry, programs));

  useEffect(() => {
    setDraft(hydrateHistoryEntry(entry, programs));
  }, [entry, programs]);

  const updateExerciseWeight = (exerciseIndex, value) => {
    setDraft((previous) => ({
      ...previous,
      exercises: previous.exercises.map((exercise, index) => (
        index === exerciseIndex ? { ...exercise, weight: Math.max(0, Math.round(value * 1000) / 1000) } : exercise
      )),
    }));
  };

  const updateExerciseRep = (exerciseIndex, setIndex, value) => {
    setDraft((previous) => ({
      ...previous,
      exercises: previous.exercises.map((exercise, index) => (
        index === exerciseIndex
          ? { ...exercise, reps: exercise.reps.map((rep, repIndex) => (repIndex === setIndex ? Math.max(0, value) : rep)) }
          : exercise
      )),
    }));
  };

  const updateExerciseRpe = (exerciseIndex, setIndex, value) => {
    const normalized = Math.max(0, Math.min(10, Math.round(value * 2) / 2));
    setDraft((previous) => ({
      ...previous,
      exercises: previous.exercises.map((exercise, index) => (
        index === exerciseIndex
          ? { ...exercise, rpe: exercise.rpe.map((rpe, rpeIndex) => (rpeIndex === setIndex ? normalized : rpe)) }
          : exercise
      )),
    }));
  };

  const updateExerciseStep = (exerciseIndex, value) => {
    setDraft((previous) => ({
      ...previous,
      exercises: previous.exercises.map((exercise, index) => (
        index === exerciseIndex ? { ...exercise, step: value } : exercise
      )),
    }));
  };

  return (
    <div style={{ background: T.bg, minHeight: "100vh", padding: isDesktop ? "28px 28px 40px" : "20px 16px", color: T.t1 }}>
      <div style={{ maxWidth: isDesktop ? 1180 : 500, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: 10, background: T.bg3, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 14 14">
                <path d="M9 2L4 7L9 12" fill="none" stroke={T.t2} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.accent, letterSpacing: "0.12em", marginBottom: 4 }}>EDIT HISTORY</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{draft.day}</div>
              <div style={{ fontSize: 14, color: T.t3, marginTop: 4 }}>{draft.date}，{draft.duration} min</div>
            </div>
          </div>
          <button onClick={() => onSave(draft)} style={{ fontSize: 15, padding: "10px 18px", borderRadius: 10, border: "none", cursor: "pointer", background: T.accent, color: T.bg, fontWeight: 700 }}>
            儲存修改
          </button>
        </div>

        <div style={{ background: T.bg2, borderRadius: 8, padding: "8px 12px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: 3, background: T.orange }} />
          <span style={{ fontSize: 13, color: T.t3 }}>這裡修改的是歷史紀錄，不會影響目前正在進行中的訓練。</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr", gap: 10 }}>
          {draft.exercises.map((exercise, exerciseIndex) => (
            <ExerciseCard
              key={`${exercise.name}-${exerciseIndex}`}
              exercise={exercise}
              index={exerciseIndex}
              number={exerciseIndex + 1}
              onRep={updateExerciseRep}
              onWeight={updateExerciseWeight}
              onRpe={updateExerciseRpe}
              onStepChange={updateExerciseStep}
              historyHint={null}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProgramEditor({ programs, onBack, onSave, isDesktop }) {
  const [draft, setDraft] = useState(() => JSON.parse(JSON.stringify(programs)));
  const [selectedId, setSelectedId] = useState(programs[0]?.id ?? "");
  const selectedProgram = draft.find((program) => program.id === selectedId) ?? draft[0];

  const updateProgramField = (programId, field, value) => {
    setDraft((previous) => previous.map((program) => (
      program.id === programId ? { ...program, [field]: value } : program
    )));
  };

  const updateExerciseField = (programId, exerciseIndex, field, value) => {
    setDraft((previous) => previous.map((program) => (
      program.id === programId
        ? {
          ...program,
          exercises: program.exercises.map((exercise, index) => (
            index === exerciseIndex ? { ...exercise, [field]: value } : exercise
          )),
        }
        : program
    )));
  };

  const addExercise = (programId) => {
    setDraft((previous) => previous.map((program) => (
      program.id === programId
        ? {
          ...program,
          exercises: [
            ...program.exercises,
            { name: "新動作", weight: 0, unit: "kg", sets: 3, repRange: "8-12", note: "" },
          ],
        }
        : program
    )));
  };

  const removeExercise = (programId, exerciseIndex) => {
    setDraft((previous) => previous.map((program) => (
      program.id === programId
        ? { ...program, exercises: program.exercises.filter((_, index) => index !== exerciseIndex) }
        : program
    )));
  };

  const cleanedPrograms = useMemo(() => draft.map((program) => ({
    ...program,
    exercises: program.exercises
      .filter((exercise) => exercise.name.trim() !== "")
      .map((exercise) => ({
        name: exercise.name.trim(),
        weight: Number(exercise.weight) || 0,
        unit: exercise.unit,
        sets: Math.max(1, Number(exercise.sets) || 1),
        repRange: exercise.repRange.trim() || "8-12",
        note: exercise.note ?? "",
      })),
  })), [draft]);

  return (
    <div style={{ background: T.bg, minHeight: "100vh", padding: isDesktop ? "28px 28px 40px" : "20px 16px", color: T.t1 }}>
      <div style={{ maxWidth: isDesktop ? 1200 : 700, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: 10, background: T.bg3, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 14 14">
                <path d="M9 2L4 7L9 12" fill="none" stroke={T.t2} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.accent, letterSpacing: "0.12em", marginBottom: 4 }}>PROGRAM EDITOR</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>編輯課表</div>
              <div style={{ fontSize: 14, color: T.t3, marginTop: 4 }}>可以修改動作、刪除動作，或新增新的動作。</div>
            </div>
          </div>
          <button onClick={() => onSave(cleanedPrograms)} style={{ fontSize: 15, padding: "10px 18px", borderRadius: 10, border: "none", cursor: "pointer", background: T.accent, color: T.bg, fontWeight: 700 }}>
            儲存課表
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "280px minmax(0,1fr)" : "1fr", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {draft.map((program) => (
              <button
                key={program.id}
                onClick={() => setSelectedId(program.id)}
                style={{ textAlign: "left", padding: "14px 14px", borderRadius: 12, border: `1px solid ${selectedId === program.id ? `${T.accent}70` : T.border}`, background: selectedId === program.id ? `${T.accent}14` : T.bg2, color: T.t1, cursor: "pointer" }}
              >
                <div style={{ fontSize: 12, color: T.accent, fontWeight: 700, letterSpacing: "0.12em", marginBottom: 6 }}>{program.tag}</div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{program.day}</div>
                <div style={{ fontSize: 14, color: T.t3 }}>{program.exercises.length} 個動作</div>
              </button>
            ))}
          </div>

          {selectedProgram && (
            <div style={{ background: T.bg2, borderRadius: 16, border: `1px solid ${T.border}`, padding: "16px 16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "1fr 1fr 120px" : "1fr", gap: 10, marginBottom: 16 }}>
                <input value={selectedProgram.day} onChange={(event) => updateProgramField(selectedProgram.id, "day", event.target.value)} style={{ height: 40, borderRadius: 10, border: `1px solid ${T.border}`, background: T.bg3, color: T.t1, padding: "0 12px" }} />
                <input value={selectedProgram.subtitle} onChange={(event) => updateProgramField(selectedProgram.id, "subtitle", event.target.value)} style={{ height: 40, borderRadius: 10, border: `1px solid ${T.border}`, background: T.bg3, color: T.t1, padding: "0 12px" }} />
                <input value={selectedProgram.tag} onChange={(event) => updateProgramField(selectedProgram.id, "tag", event.target.value)} style={{ height: 40, borderRadius: 10, border: `1px solid ${T.border}`, background: T.bg3, color: T.t1, padding: "0 12px" }} />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.t3, letterSpacing: "0.08em" }}>動作列表</div>
                <button onClick={() => addExercise(selectedProgram.id)} style={{ fontSize: 14, padding: "8px 12px", borderRadius: 8, border: "none", cursor: "pointer", background: T.accent, color: T.bg, fontWeight: 700 }}>
                  新增動作
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {selectedProgram.exercises.map((exercise, index) => (
                  <div key={`${exercise.name}-${index}`} style={{ background: T.bg3, borderRadius: 12, padding: "12px 12px", border: `1px solid ${T.border}` }}>
                    <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "minmax(180px,1.4fr) 90px 80px 90px 110px auto" : "1fr 1fr", gap: 8, marginBottom: 8 }}>
                      <input value={exercise.name} onChange={(event) => updateExerciseField(selectedProgram.id, index, "name", event.target.value)} placeholder="動作名稱" style={{ height: 36, borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.t1, padding: "0 10px" }} />
                      <input type="number" value={exercise.weight} step="0.125" min="0" onChange={(event) => updateExerciseField(selectedProgram.id, index, "weight", Number(event.target.value))} placeholder="重量" style={{ height: 36, borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.t1, padding: "0 10px" }} />
                      <select value={exercise.unit} onChange={(event) => updateExerciseField(selectedProgram.id, index, "unit", event.target.value)} style={{ height: 36, borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.t1, padding: "0 10px" }}>
                        <option value="kg">kg</option>
                        <option value="bw">bw</option>
                        <option value="sec">sec</option>
                      </select>
                      <input type="number" value={exercise.sets} min="1" onChange={(event) => updateExerciseField(selectedProgram.id, index, "sets", Number(event.target.value))} placeholder="組數" style={{ height: 36, borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.t1, padding: "0 10px" }} />
                      <input value={exercise.repRange} onChange={(event) => updateExerciseField(selectedProgram.id, index, "repRange", event.target.value)} placeholder="8-12 / AMRAP" style={{ height: 36, borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.t1, padding: "0 10px" }} />
                      <button onClick={() => removeExercise(selectedProgram.id, index)} style={{ height: 36, borderRadius: 8, border: "none", cursor: "pointer", background: T.bg, color: T.red, padding: "0 12px" }}>
                        刪除
                      </button>
                    </div>
                    <textarea value={exercise.note ?? ""} onChange={(event) => updateExerciseField(selectedProgram.id, index, "note", event.target.value)} placeholder="備註 / 提醒" rows={2} style={{ width: "100%", resize: "vertical", borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.t1, padding: "10px 10px", boxSizing: "border-box" }} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("home");
  const [workoutSession, setWorkoutSession] = useState(null);
  const [history, setHistory] = useState([]);
  const [programs, setPrograms] = useState(DEFAULT_PROGRAM);
  const [loading, setLoading] = useState(true);
  const [todayKey] = useState(() => formatLocalDate());
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);
  const [editingHistoryIndex, setEditingHistoryIndex] = useState(null);
  const [exportCopied, setExportCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const storedPrograms = await storage.get(STORAGE_KEYS.program);
        if (!cancelled && storedPrograms) {
          setPrograms(JSON.parse(storedPrograms.value));
        }
      } catch (error) {
        console.error("Failed to load programs", error);
      }

      try {
        const storedHistory = await storage.get(STORAGE_KEYS.history);
        if (!cancelled && storedHistory) {
          setHistory(JSON.parse(storedHistory.value));
        }
      } catch (error) {
        console.error("Failed to load history", error);
      }

      try {
        const storedLive = await storage.get(STORAGE_KEYS.live);
        if (!cancelled && storedLive) {
          setWorkoutSession(normalizeWorkoutSession(JSON.parse(storedLive.value)));
          setView("workout");
        }
      } catch (error) {
        console.error("Failed to load live workout", error);
      }

      if (!cancelled) {
        setLoading(false);
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const setWorkoutAndSave = useCallback((updater) => {
    setWorkoutSession((previous) => {
      if (!previous) {
        return previous;
      }

      const next = typeof updater === "function" ? updater(previous) : updater;
      if (next) {
        void persistLiveWorkout(next);
      }
      return next;
    });
  }, []);

  const startWorkout = useCallback((id) => {
    const program = programs.find((item) => item.id === id);
    if (!program) {
      return;
    }

    const newSession = createWorkoutSession(program);
    setWorkoutSession(newSession);
    void persistLiveWorkout(newSession);
    setView("workout");
  }, [programs]);

  const updateRep = useCallback((exerciseIndex, setIndex, value) => {
    setWorkoutAndSave((previous) => ({
      ...previous,
      exercises: previous.exercises.map((exercise, currentIndex) => (
        currentIndex === exerciseIndex
          ? { ...exercise, reps: exercise.reps.map((rep, currentSet) => (currentSet === setIndex ? value : rep)) }
          : exercise
      )),
    }));
  }, [setWorkoutAndSave]);

  const updateRpe = useCallback((exerciseIndex, setIndex, value) => {
    setWorkoutAndSave((previous) => ({
      ...previous,
      exercises: previous.exercises.map((exercise, currentIndex) => (
        currentIndex === exerciseIndex
          ? { ...exercise, rpe: exercise.rpe.map((rpe, currentSet) => (currentSet === setIndex ? value : rpe)) }
          : exercise
      )),
    }));
  }, [setWorkoutAndSave]);
  const updateWeight = useCallback((exerciseIndex, value) => {
    setWorkoutAndSave((previous) => ({
      ...previous,
      exercises: previous.exercises.map((exercise, currentIndex) => (
        currentIndex === exerciseIndex ? { ...exercise, weight: value } : exercise
      )),
    }));
  }, [setWorkoutAndSave]);

  const updateWeightStep = useCallback((exerciseIndex, value) => {
    setWorkoutAndSave((previous) => ({
      ...previous,
      exercises: previous.exercises.map((exercise, currentIndex) => (
        currentIndex === exerciseIndex ? { ...exercise, step: value } : exercise
      )),
    }));
  }, [setWorkoutAndSave]);

  const discardWorkout = useCallback(async () => {
    await clearLiveWorkout();
    setWorkoutSession(null);
    setView("home");
  }, []);

  const finishWorkout = useCallback(async () => {
    if (!workoutSession) {
      return;
    }

    const entry = {
      date: formatLocalDate(),
      day: workoutSession.day,
      dayId: workoutSession.id,
      duration: Math.round((Date.now() - workoutSession.startTime) / 60000),
      exercises: workoutSession.exercises.map((exercise) => ({
        name: exercise.name,
        weight: exercise.weight,
        unit: exercise.unit,
        reps: exercise.reps,
        rpe: exercise.rpe,
      })),
    };

    const nextHistory = [entry, ...history].slice(0, 100);
    setHistory(nextHistory);

    try {
      await storage.set(STORAGE_KEYS.history, JSON.stringify(nextHistory));
    } catch (error) {
      console.error("Failed to save history", error);
    }

    await clearLiveWorkout();
    setWorkoutSession(null);
    setView("home");
  }, [history, workoutSession]);

  const deleteHistoryEntry = useCallback(async (indexToDelete) => {
    const target = history[indexToDelete];
    if (!target) {
      return;
    }

    const confirmed = window.confirm(`要刪除 ${target.date} 的 ${target.day} 紀錄嗎？`);
    if (!confirmed) {
      return;
    }

    const nextHistory = history.filter((_, index) => index !== indexToDelete);
    setHistory(nextHistory);

    try {
      await storage.set(STORAGE_KEYS.history, JSON.stringify(nextHistory));
    } catch (error) {
      console.error("Failed to delete history", error);
    }
  }, [history]);

  const saveHistoryEntry = useCallback(async (indexToSave, updatedEntry) => {
    const cleanedEntry = {
      date: updatedEntry.date,
      day: updatedEntry.day,
      dayId: updatedEntry.dayId,
      duration: updatedEntry.duration,
      exercises: updatedEntry.exercises.map((exercise) => ({
        name: exercise.name,
        weight: exercise.weight,
        unit: exercise.unit,
        reps: exercise.reps,
        rpe: exercise.rpe,
      })),
    };
    const nextHistory = history.map((entry, index) => (index === indexToSave ? cleanedEntry : entry));
    setHistory(nextHistory);

    try {
      await storage.set(STORAGE_KEYS.history, JSON.stringify(nextHistory));
    } catch (error) {
      console.error("Failed to save edited history", error);
      return;
    }

    setEditingHistoryIndex(null);
    setView("home");
  }, [history]);

  const savePrograms = useCallback(async (updatedPrograms) => {
    setPrograms(updatedPrograms);

    try {
      await storage.set(STORAGE_KEYS.program, JSON.stringify(updatedPrograms));
    } catch (error) {
      console.error("Failed to save programs", error);
      return;
    }

    setView("home");
  }, []);

  const exerciseHistoryMap = useMemo(() => buildExerciseHistoryMap(history), [history]);
  const isDesktop = viewportWidth >= 1024;
  const shellStyle = { background: T.bg, minHeight: "100vh", padding: isDesktop ? "28px 28px 40px" : "20px 16px", color: T.t1 };

  if (loading) {
    return <div style={{ background: T.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: T.t3 }}>載入中...</div>;
  }

  if (view === "progress") {
    return <ProgressView history={history} onBack={() => setView("home")} onDelete={deleteHistoryEntry} isDesktop={isDesktop} />;
  }

  if (view === "edit-history" && editingHistoryIndex !== null && history[editingHistoryIndex]) {
    return (
      <HistoryEditor
        entry={history[editingHistoryIndex]}
        programs={programs}
        isDesktop={isDesktop}
        onBack={() => {
          setEditingHistoryIndex(null);
          setView("home");
        }}
        onSave={(updatedEntry) => void saveHistoryEntry(editingHistoryIndex, updatedEntry)}
      />
    );
  }

  if (view === "edit-program") {
    return (
      <ProgramEditor
        programs={programs}
        isDesktop={isDesktop}
        onBack={() => setView("home")}
        onSave={(updatedPrograms) => void savePrograms(updatedPrograms)}
      />
    );
  }

  const completedExercises = workoutSession ? workoutSession.exercises.filter((exercise) => exercise.reps.every((rep) => rep > 0)).length : 0;
  const totalExercises = workoutSession ? workoutSession.exercises.length : 0;
  const hasAnyInput = workoutSession ? workoutSession.exercises.some((exercise) => exercise.reps.some((rep) => rep > 0)) : false;
  if (view === "workout" && workoutSession) {
    const canDiscard = hasAnyInput && completedExercises !== totalExercises;
    const finishLabel = !hasAnyInput ? "取消" : completedExercises === totalExercises ? "完成訓練" : "先存紀錄";

    return (
      <div style={shellStyle}>
        <div style={{ maxWidth: isDesktop ? 1180 : 500, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.accent, letterSpacing: "0.12em", marginBottom: 6 }}>{workoutSession.tag}</div>
              <div style={{ fontSize: 24, fontWeight: 600, color: T.t1, lineHeight: 1.1 }}>{workoutSession.day}</div>
              <div style={{ fontSize: 15, color: T.t3, marginTop: 6, fontVariantNumeric: "tabular-nums" }}>{completedExercises} / {totalExercises} 已完成</div>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              {canDiscard && (
                <button onClick={() => void discardWorkout()} style={{ fontSize: 14, padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontWeight: 500, border: "none", background: T.bg3, color: T.t3 }}>
                  放棄
                </button>
              )}
              <button
                onClick={() => {
                  if (!hasAnyInput) {
                    void discardWorkout();
                    return;
                  }
                  void finishWorkout();
                }}
                style={{
                  fontSize: 15,
                  padding: "8px 22px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 600,
                  border: "none",
                  transition: "all 0.2s",
                  background: completedExercises === totalExercises ? T.accent : T.bg3,
                  color: completedExercises === totalExercises ? T.bg : T.t2,
                }}
              >
                {finishLabel}
              </button>
            </div>
          </div>

          <div style={{ background: T.bg2, borderRadius: 8, padding: "8px 12px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: 3, background: T.green, animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 13, color: T.t3 }}>輸入會自動保存，下次打開可以接著做。</span>
          </div>

          <div style={{ height: 2, background: T.bg3, borderRadius: 1, marginBottom: 20, overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 1, transition: "width 0.4s cubic-bezier(.4,0,.2,1)", width: `${totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0}%`, background: T.accent }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr", gap: 10 }}>
            {workoutSession.exercises.map((exercise, index) => (
              <ExerciseCard
                key={`${exercise.name}-${index}`}
                exercise={exercise}
                index={index}
                number={index + 1}
                onRep={updateRep}
                onWeight={updateWeight}
                onRpe={updateRpe}
                onStepChange={updateWeightStep}
                historyHint={exerciseHistoryMap[exercise.name]}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const nextProgramId = getNextProgramId(history);
  const nextProgram = programs.find((program) => program.id === nextProgramId) ?? programs[0];
  const recentEntry = history[0] ?? null;
  const lastSameProgram = history.find((entry) => entry.dayId === nextProgramId) ?? null;
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const weeklyEntries = history.filter((entry) => new Date(entry.date) >= sevenDaysAgo);
  const weeklySessions = weeklyEntries.length;
  const weeklyMinutes = weeklyEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
  const weeklySets = weeklyEntries.reduce((sum, entry) => sum + entry.exercises.reduce((exerciseSum, exercise) => exerciseSum + exercise.reps.filter((rep) => rep > 0).length, 0), 0);
  const recentAvgRpe = recentEntry
    ? calcAvgRpe(recentEntry.exercises.flatMap((exercise) => exercise.rpe || []))
    : 0;
  const currentDayTime = new Date(todayKey).getTime();
  const lastSameProgramDate = lastSameProgram ? Math.max(0, Math.floor((currentDayTime - new Date(lastSameProgram.date).getTime()) / 86400000)) : null;
  const estimatedMinutes = Math.max(25, nextProgram.exercises.length * 7);
  const bestSet = history
    .flatMap((entry) => entry.exercises.map((exercise) => ({
      day: entry.day,
      name: exercise.name,
      weight: exercise.weight,
      reps: Math.max(...exercise.reps, 0),
      score: (exercise.weight || 0) * Math.max(...exercise.reps, 0),
      unit: exercise.unit,
    })))
    .sort((left, right) => right.score - left.score)[0] ?? null;
  const upperRecovery = history.find((entry) => entry.dayId?.includes("upper"));
  const lowerRecovery = history.find((entry) => entry.dayId?.includes("lower"));
  const upperRecoveryState = getRecoveryText(upperRecovery, currentDayTime);
  const lowerRecoveryState = getRecoveryText(lowerRecovery, currentDayTime);

  return (
    <div style={shellStyle}>
      <div style={{ maxWidth: isDesktop ? 1180 : 500, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.accent, letterSpacing: "0.12em", marginBottom: 6 }}>HOME GYM</div>
            <div style={{ fontSize: 28, fontWeight: 600, color: T.t1, lineHeight: 1.1 }}>居家訓練計畫</div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button onClick={() => setView("edit-program")} style={{ fontSize: 14, padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontWeight: 600, border: "none", background: T.bg3, color: T.t1 }}>
              編輯課表
            </button>
            {history.length > 0 && (
              <>
                <button onClick={() => setView("progress")} style={{ fontSize: 14, padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontWeight: 600, border: "none", background: T.bg3, color: T.accent, display: "flex", alignItems: "center", gap: 6 }}>
                  <svg width="14" height="14" viewBox="0 0 14 14">
                    <path d="M2 10L5 6L8 8L12 3" fill="none" stroke={T.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  進度追蹤
                </button>
                <button
                  onClick={async () => {
                    const md = exportToMarkdown(history, programs);
                    await navigator.clipboard.writeText(md);
                    setExportCopied(true);
                    setTimeout(() => setExportCopied(false), 2000);
                  }}
                  style={{ fontSize: 14, padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontWeight: 600, border: "none", background: exportCopied ? T.green : T.bg3, color: exportCopied ? T.bg : T.t2, display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s" }}
                >
                  {exportCopied ? "✓ 已複製" : "匯出報告"}
                </button>
              </>
            )}
          </div>
        </div>

        <div style={{ position: "relative", overflow: "hidden", background: `linear-gradient(135deg, ${T.bg2} 0%, #20251A 55%, #2B321B 100%)`, border: `1px solid ${T.borderLight}`, borderRadius: 18, padding: "26px 22px", marginBottom: 16 }}>
          <div style={{ position: "absolute", top: -40, right: -30, width: 120, height: 120, borderRadius: 999, background: `${T.accent}12`, filter: "blur(4px)" }} />
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.accent, letterSpacing: "0.12em", marginBottom: 8 }}>NEXT SESSION</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: T.t1, lineHeight: 1.1, marginBottom: 6 }}>{nextProgram.day}</div>
                <div style={{ fontSize: 15, color: T.t2, lineHeight: 1.5 }}>
                  {nextProgram.subtitle}，{nextProgram.exercises.length} 個動作，預估 {estimatedMinutes} 分鐘
                </div>
              </div>
              <div style={{ padding: "8px 10px", borderRadius: 999, background: `${T.accent}18`, color: T.accent, fontSize: 13, fontWeight: 700 }}>
                {nextProgram.tag}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 18 }}>
              <div style={{ background: "rgba(17,17,16,0.34)", borderRadius: 12, padding: "12px 12px" }}>
                <div style={{ fontSize: 12, color: T.t3, marginBottom: 5 }}>上次做這堂</div>
                <div style={{ fontSize: 16, color: T.t1, fontWeight: 600 }}>
                  {lastSameProgram ? `${lastSameProgram.date}` : "還沒有紀錄"}
                </div>
                <div style={{ fontSize: 13, color: T.t3, marginTop: 4 }}>
                  {lastSameProgramDate === null ? "從這堂開始建立資料" : `${lastSameProgramDate} 天前`}
                </div>
              </div>
              <div style={{ background: "rgba(17,17,16,0.34)", borderRadius: 12, padding: "12px 12px" }}>
                <div style={{ fontSize: 12, color: T.t3, marginBottom: 5 }}>最近一次狀態</div>
                <div style={{ fontSize: 16, color: T.t1, fontWeight: 600 }}>
                  {recentEntry ? `${recentEntry.day}` : "還沒有訓練紀錄"}
                </div>
                <div style={{ fontSize: 13, color: recentAvgRpe > 0 ? getRpeColor(recentAvgRpe) : T.t3, marginTop: 4 }}>
                  {recentAvgRpe > 0 ? `平均 RPE ${recentAvgRpe}` : "做完後會顯示摘要"}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={() => startWorkout(nextProgram.id)}
                style={{ flex: 1, minWidth: 180, fontSize: 16, padding: "12px 18px", borderRadius: 10, border: "none", cursor: "pointer", background: T.accent, color: T.bg, fontWeight: 700 }}
              >
                開始下一次訓練
              </button>
              <button
                onClick={() => setView("progress")}
                style={{ fontSize: 15, padding: "12px 16px", borderRadius: 10, border: `1px solid ${T.borderLight}`, cursor: "pointer", background: "rgba(17,17,16,0.28)", color: T.t1, fontWeight: 600 }}
              >
                查看進度
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(3, minmax(0, 1fr))" : "repeat(3,1fr)", gap: 8, marginBottom: 16 }}>
          {[
            { label: "近 7 天訓練", value: `${weeklySessions} 次`, sub: weeklySessions > 0 ? `${weeklyMinutes} 分鐘` : "還沒開始" },
            { label: "完成組數", value: `${weeklySets} 組`, sub: "最近 7 天" },
            { label: "最佳表現", value: bestSet ? `${bestSet.weight > 0 ? `${bestSet.weight}${bestSet.unit}` : "BW"} x ${bestSet.reps}` : "-", sub: bestSet ? bestSet.name : "尚無資料" },
          ].map((card) => (
            <div key={card.label} style={{ background: T.bg2, borderRadius: 16, padding: "16px 14px", border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 12, color: T.t3, marginBottom: 7 }}>{card.label}</div>
              <div style={{ fontSize: 22, color: T.t1, fontWeight: 700, lineHeight: 1.1, marginBottom: 5 }}>{card.value}</div>
              <div style={{ fontSize: 12, color: T.t3 }}>{card.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr 1fr", gap: 8, marginBottom: 24 }}>
          <div style={{ background: T.bg2, borderRadius: 14, padding: "14px 14px", border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.t3, letterSpacing: "0.1em", marginBottom: 10 }}>恢復狀態</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 15, color: T.t1 }}>上半身</span>
              <span style={{ fontSize: 14, color: upperRecoveryState.color, fontWeight: 700 }}>{upperRecoveryState.label}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 15, color: T.t1 }}>下半身</span>
              <span style={{ fontSize: 14, color: lowerRecoveryState.color, fontWeight: 700 }}>{lowerRecoveryState.label}</span>
            </div>
          </div>

          <div style={{ background: T.bg2, borderRadius: 14, padding: "14px 14px", border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.t3, letterSpacing: "0.1em", marginBottom: 10 }}>最近亮點</div>
            <div style={{ fontSize: 16, color: T.t1, fontWeight: 600, lineHeight: 1.4 }}>
              {bestSet ? `${bestSet.name} 做到 ${bestSet.weight > 0 ? `${bestSet.weight}${bestSet.unit}` : "BW"} x ${bestSet.reps}` : "先完成第一堂，這裡會出現你的最佳表現。"}
            </div>
            {bestSet && <div style={{ fontSize: 13, color: T.t3, marginTop: 6 }}>{bestSet.day}</div>}
          </div>
        </div>

        <div style={{ fontSize: 13, fontWeight: 600, color: T.t3, letterSpacing: "0.08em", marginBottom: 14 }}>訓練順序</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 5, marginBottom: 32 }}>
          {TRAINING_FLOW.map((day, index) => {
            const isRest = day.type === "rest";
            const isNext = day.type === nextProgramId;
            const lastDone = !isRest ? history.find((entry) => entry.dayId === day.type) : null;
            const daysAgo = lastDone ? Math.floor((currentDayTime - new Date(lastDone.date).getTime()) / 86400000) : null;

            return (
              <div
                key={`${day.label}-${index}`}
                onClick={() => { if (!isRest) startWorkout(day.type); }}
                style={{ textAlign: "center", padding: "10px 4px 8px", borderRadius: 8, cursor: isRest ? "default" : "pointer", background: isNext ? T.accent : isRest ? T.bg2 : T.bg3, transition: "all 0.15s" }}
              >
                <div style={{ fontSize: 12, fontWeight: isNext ? 700 : 400, color: isNext ? T.bg : T.t3, marginBottom: 2 }}>{isNext ? "下一次" : day.label}</div>
                <div style={{ fontSize: 14, fontWeight: isRest ? 400 : 600, color: isNext ? T.bg : isRest ? T.t3 : T.t1 }}>{day.short}</div>
                {!isRest && (
                  <div style={{ fontSize: 11, marginTop: 4, color: isNext ? `${T.bg}99` : T.t3 }}>
                    {daysAgo === null ? "未做過" : daysAgo === 0 ? "今天" : `${daysAgo}天前`}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.t3, letterSpacing: "0.08em", marginBottom: 14 }}>快速開始</div>
        <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(4, minmax(0, 1fr))" : "1fr 1fr", gap: 8, marginBottom: 36 }}>
          {programs.map((program) => (
            <div
              key={program.id}
              onClick={() => startWorkout(program.id)}
              className="program-card"
              style={{ padding: "20px 18px", borderRadius: 18, cursor: "pointer", position: "relative", overflow: "hidden", background: program.id === nextProgramId ? `linear-gradient(180deg, ${T.bg2} 0%, #24291B 100%)` : T.bg2, border: `0.5px solid ${program.id === nextProgramId ? `${T.accent}55` : T.border}`, transition: "all 0.2s" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.accent, letterSpacing: "0.12em" }}>{program.tag}</div>
                {program.id === nextProgramId && <div style={{ fontSize: 12, color: T.bg, background: T.accent, padding: "4px 8px", borderRadius: 999, fontWeight: 700 }}>NEXT</div>}
              </div>
              <div style={{ fontSize: 17, fontWeight: 600, color: T.t1, marginBottom: 3, lineHeight: 1.3 }}>{program.day}</div>
              <div style={{ fontSize: 14, color: T.t3 }}>{program.subtitle}，共 {program.exercises.length} 個動作</div>
            </div>
          ))}
        </div>

        {history.length > 0 && (
          <>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.t3, letterSpacing: "0.08em", marginBottom: 14 }}>最近紀錄</div>
            <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr", gap: 8 }}>
            {history.slice(0, 6).map((entry, index) => {
              const avgRpe = calcAvgRpe(entry.exercises.flatMap((exercise) => exercise.rpe || []));
              const completedCount = entry.exercises.filter((exercise) => exercise.reps.some((rep) => rep > 0)).length;

              return (
                <div key={`${entry.date}-${index}`} style={{ display: "flex", alignItems: "center", padding: "14px 16px", gap: 12, background: T.bg2, borderRadius: 10, marginBottom: isDesktop ? 0 : 5 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, background: T.bg3, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: T.accent }}>
                    {entry.dayId?.includes("upper") ? "U" : "L"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 500, color: T.t1 }}>{entry.day}</div>
                    <div style={{ fontSize: 13, color: T.t3, marginTop: 1 }}>
                      {entry.date}，{entry.duration} min
                      {avgRpe > 0 && <span style={{ color: getRpeColor(avgRpe) }}>，RPE {avgRpe}</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ fontSize: 14, color: T.t2, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{completedCount}/{entry.exercises.length}</div>
                    <button
                      onClick={() => {
                        setEditingHistoryIndex(index);
                        setView("edit-history");
                      }}
                      style={{ fontSize: 13, padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer", background: T.bg3, color: T.accent }}
                    >
                      編輯
                    </button>
                    <button
                      onClick={() => void deleteHistoryEntry(index)}
                      style={{ fontSize: 13, padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer", background: T.bg3, color: T.red }}
                    >
                      刪除
                    </button>
                  </div>
                </div>
              );
            })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
