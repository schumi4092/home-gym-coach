import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { DEFAULT_PROGRAM, STORAGE_KEYS, TRAINING_FLOW } from "./constants/defaults.js";
import { T } from "./constants/theme.js";
import { storage, persistLiveWorkout, clearLiveWorkout } from "./storage/index.js";
import { calcAvgRpe, formatLocalDate, getRpeColor } from "./utils/format.js";
import { buildExerciseHistoryMap } from "./utils/coaching.js";
import { exportToMarkdown, exportBackup, importBackup } from "./utils/export.js";
import { createWorkoutSession, normalizeWorkoutSession, getNextProgramId, getRecoveryText } from "./utils/workout.js";
import { ExerciseCard } from "./components/ExerciseCard.jsx";
import { ProgressView } from "./views/ProgressView.jsx";
import { HistoryEditor } from "./views/HistoryEditor.jsx";
import { ProgramEditor } from "./views/ProgramEditor.jsx";

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
  const [importStatus, setImportStatus] = useState(null);
  const importRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const storedPrograms = await storage.get(STORAGE_KEYS.program);
        if (!cancelled && storedPrograms) setPrograms(JSON.parse(storedPrograms.value));
      } catch (error) {
        console.error("Failed to load programs", error);
      }

      try {
        const storedHistory = await storage.get(STORAGE_KEYS.history);
        if (!cancelled && storedHistory) setHistory(JSON.parse(storedHistory.value));
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

      if (!cancelled) setLoading(false);
    }

    void loadData();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const setWorkoutAndSave = useCallback((updater) => {
    setWorkoutSession((previous) => {
      if (!previous) return previous;
      const next = typeof updater === "function" ? updater(previous) : updater;
      if (next) void persistLiveWorkout(next);
      return next;
    });
  }, []);

  const startWorkout = useCallback((id) => {
    const program = programs.find((item) => item.id === id);
    if (!program) return;
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
    if (!workoutSession) return;

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
    if (!target) return;

    const confirmed = window.confirm(`要刪除 ${target.date} 的 ${target.day} 紀錄嗎？`);
    if (!confirmed) return;

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
        onBack={() => { setEditingHistoryIndex(null); setView("home"); }}
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
                <button onClick={() => void discardWorkout()} style={{ fontSize: 14, padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontWeight: 500, border: "none", background: T.bg3, color: T.t3 }}>放棄</button>
              )}
              <button
                onClick={() => { if (!hasAnyInput) { void discardWorkout(); return; } void finishWorkout(); }}
                style={{ fontSize: 15, padding: "8px 22px", borderRadius: 8, cursor: "pointer", fontWeight: 600, border: "none", transition: "all 0.2s", background: completedExercises === totalExercises ? T.accent : T.bg3, color: completedExercises === totalExercises ? T.bg : T.t2 }}
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

  // Home view
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
  const recentAvgRpe = recentEntry ? calcAvgRpe(recentEntry.exercises.flatMap((exercise) => exercise.rpe || [])) : 0;
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
                <button
                  onClick={() => exportBackup(history, programs)}
                  style={{ fontSize: 14, padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontWeight: 600, border: "none", background: T.bg3, color: T.t2, display: "flex", alignItems: "center", gap: 6 }}
                >
                  備份
                </button>
              </>
            )}
            <button
              onClick={() => importRef.current?.click()}
              style={{ fontSize: 14, padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontWeight: 600, border: "none", background: importStatus === "ok" ? T.green : importStatus === "error" ? T.red : T.bg3, color: importStatus === "ok" ? T.bg : T.t2, transition: "all 0.2s" }}
            >
              {importStatus === "ok" ? "✓ 匯入成功" : importStatus === "error" ? "✗ 格式錯誤" : "匯入備份"}
            </button>
            <input
              ref={importRef}
              type="file"
              accept=".json"
              style={{ display: "none" }}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                e.target.value = "";
                try {
                  await importBackup(file, setHistory, setPrograms);
                  setImportStatus("ok");
                } catch {
                  setImportStatus("error");
                }
                setTimeout(() => setImportStatus(null), 3000);
              }}
            />
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
              <button onClick={() => startWorkout(nextProgram.id)} style={{ flex: 1, minWidth: 180, fontSize: 16, padding: "12px 18px", borderRadius: 10, border: "none", cursor: "pointer", background: T.accent, color: T.bg, fontWeight: 700 }}>
                開始下一次訓練
              </button>
              <button onClick={() => setView("progress")} style={{ fontSize: 15, padding: "12px 16px", borderRadius: 10, border: `1px solid ${T.borderLight}`, cursor: "pointer", background: "rgba(17,17,16,0.28)", color: T.t1, fontWeight: 600 }}>
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
                        onClick={() => { setEditingHistoryIndex(index); setView("edit-history"); }}
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
