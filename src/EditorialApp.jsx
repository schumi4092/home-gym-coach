import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { DEFAULT_PROGRAM, STORAGE_KEYS } from "./constants/defaults.js";
import { TE, ES } from "./constants/editorial-theme.js";
import { storage, persistLiveWorkout, persistLiveWorkoutDebounced, flushLiveWorkout, clearLiveWorkout } from "./storage/index.js";
import { formatLocalDate } from "./utils/format.js";
import { buildDashboardStats } from "./utils/dashboard.js";
import { checkDeloadSuggestion } from "./utils/coaching.js";
import { exportToMarkdown, exportBackup, importBackup } from "./utils/export.js";
import { normalizeHistory } from "./utils/history.js";
import { createWorkoutSession, normalizeWorkoutSession, getDefaultStep } from "./utils/workout.js";
import { EditorialHome } from "./views/EditorialHome.jsx";
import { EditorialWorkout } from "./views/EditorialWorkout.jsx";

const EditorialProgress = lazy(() => import("./views/EditorialProgress.jsx").then((m) => ({ default: m.EditorialProgress })));
const EditorialHistoryEditor = lazy(() => import("./views/EditorialHistoryEditor.jsx").then((m) => ({ default: m.EditorialHistoryEditor })));
const EditorialProgramEditor = lazy(() => import("./views/EditorialProgramEditor.jsx").then((m) => ({ default: m.EditorialProgramEditor })));

function ViewFallback() {
  return (
    <div style={{ ...ES.shell, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ ...ES.label }}>Loading…</div>
    </div>
  );
}

export default function EditorialApp() {
  const [view, setView] = useState("home");
  const [workoutSession, setWorkoutSession] = useState(null);
  const [history, setHistory] = useState([]);
  const [programs, setPrograms] = useState(DEFAULT_PROGRAM);
  const [loading, setLoading] = useState(true);
  const [today] = useState(() => new Date());
  const [editingHistoryIndex, setEditingHistoryIndex] = useState(null);
  const [exportCopied, setExportCopied] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const importRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const storedPrograms = await storage.get(STORAGE_KEYS.program);
        if (!cancelled && storedPrograms) {
          const parsedPrograms = JSON.parse(storedPrograms.value);
          if (Array.isArray(parsedPrograms) && parsedPrograms.length > 0) {
            setPrograms(parsedPrograms);
          }
        }
      } catch (error) {
        console.error("Failed to load programs", error);
      }

      try {
        const storedHistory = await storage.get(STORAGE_KEYS.history);
        if (!cancelled && storedHistory) {
          setHistory(normalizeHistory(JSON.parse(storedHistory.value)));
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

      if (!cancelled) setLoading(false);
    }

    void loadData();
    return () => { cancelled = true; };
  }, []);

  const setWorkoutAndSave = useCallback((updater, { debounce = false } = {}) => {
    setWorkoutSession((previous) => {
      if (!previous) return previous;
      const next = typeof updater === "function" ? updater(previous) : updater;
      if (next) {
        if (debounce) persistLiveWorkoutDebounced(next);
        else void persistLiveWorkout(next);
      }
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

  const updateSetWeight = useCallback((exerciseIndex, setIndex, value) => {
    setWorkoutAndSave((previous) => ({
      ...previous,
      exercises: previous.exercises.map((exercise, currentIndex) => {
        if (currentIndex !== exerciseIndex) return exercise;
        const base = exercise.setWeights ?? exercise.reps.map(() => null);
        return {
          ...exercise,
          setWeights: base.map((w, i) => (i === setIndex ? value : w)),
        };
      }),
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

  const toggleWarmup = useCallback((exerciseIndex, setIndex) => {
    setWorkoutAndSave((previous) => ({
      ...previous,
      exercises: previous.exercises.map((exercise, currentIndex) => (
        currentIndex === exerciseIndex
          ? { ...exercise, warmup: exercise.warmup.map((w, i) => (i === setIndex ? !w : w)) }
          : exercise
      )),
    }));
  }, [setWorkoutAndSave]);

  const addSet = useCallback((exerciseIndex, { warmup = false, position = "end" } = {}) => {
    setWorkoutAndSave((previous) => ({
      ...previous,
      exercises: previous.exercises.map((exercise, currentIndex) => {
        if (currentIndex !== exerciseIndex) return exercise;
        const insertAt = position === "start" ? 0 : exercise.reps.length;
        const insert = (arr, value) => [...arr.slice(0, insertAt), value, ...arr.slice(insertAt)];
        const defaultWarmupWeight = warmup && exercise.unit !== "bw"
          ? Math.max(0, Math.round(exercise.weight * 0.5 * 100) / 100)
          : null;
        return {
          ...exercise,
          reps: insert(exercise.reps, 0),
          rpe: insert(exercise.rpe ?? exercise.reps.map(() => 0), 0),
          warmup: insert(exercise.warmup ?? exercise.reps.map(() => false), warmup),
          setWeights: insert(exercise.setWeights ?? exercise.reps.map(() => null), defaultWarmupWeight),
          sets: exercise.reps.length + 1,
        };
      }),
    }));
  }, [setWorkoutAndSave]);

  const removeSet = useCallback((exerciseIndex, setIndex) => {
    setWorkoutAndSave((previous) => ({
      ...previous,
      exercises: previous.exercises.map((exercise, currentIndex) => {
        if (currentIndex !== exerciseIndex) return exercise;
        if (exercise.reps.length <= 1) return exercise;
        const drop = (arr) => arr.filter((_, i) => i !== setIndex);
        return {
          ...exercise,
          reps: drop(exercise.reps),
          rpe: drop(exercise.rpe ?? exercise.reps.map(() => 0)),
          warmup: drop(exercise.warmup ?? exercise.reps.map(() => false)),
          setWeights: drop(exercise.setWeights ?? exercise.reps.map(() => null)),
          sets: exercise.reps.length - 1,
        };
      }),
    }));
  }, [setWorkoutAndSave]);

  const updateExerciseNote = useCallback((exerciseIndex, note) => {
    setWorkoutAndSave((previous) => ({
      ...previous,
      exercises: previous.exercises.map((exercise, currentIndex) => (
        currentIndex === exerciseIndex ? { ...exercise, exerciseNote: note } : exercise
      )),
    }), { debounce: true });
  }, [setWorkoutAndSave]);

  const updateSessionNote = useCallback((note) => {
    setWorkoutAndSave((previous) => ({ ...previous, sessionNote: note }), { debounce: true });
  }, [setWorkoutAndSave]);

  const substituteExercise = useCallback((exerciseIndex, replacement) => {
    setWorkoutAndSave((previous) => {
      const sets = replacement.sets ?? previous.exercises[exerciseIndex].reps.length;
      const nextExercise = {
        name: replacement.name,
        weight: replacement.weight ?? 0,
        unit: replacement.unit ?? "kg",
        sets,
        repRange: replacement.repRange ?? "8-12",
        note: replacement.note ?? "",
        step: replacement.step ?? getDefaultStep(replacement.unit ?? "kg"),
        reps: new Array(sets).fill(0),
        rpe: new Array(sets).fill(0),
        warmup: new Array(sets).fill(false),
        setWeights: new Array(sets).fill(null),
        exerciseNote: "",
      };
      return {
        ...previous,
        exercises: previous.exercises.map((exercise, currentIndex) => (
          currentIndex === exerciseIndex ? nextExercise : exercise
        )),
      };
    });
  }, [setWorkoutAndSave]);

  const discardWorkout = useCallback(async () => {
    await flushLiveWorkout();
    await clearLiveWorkout();
    setWorkoutSession(null);
    setView("home");
  }, []);

  const finishWorkout = useCallback(async () => {
    if (!workoutSession) return;
    await flushLiveWorkout();

    const entry = {
      date: formatLocalDate(),
      day: workoutSession.day,
      dayId: workoutSession.id,
      duration: Math.round((Date.now() - workoutSession.startTime) / 60000),
      sessionNote: workoutSession.sessionNote ?? "",
      exercises: workoutSession.exercises.map((exercise) => ({
        name: exercise.name,
        weight: exercise.weight,
        unit: exercise.unit,
        reps: exercise.reps,
        rpe: exercise.rpe,
        warmup: exercise.warmup ?? exercise.reps.map(() => false),
        setWeights: exercise.setWeights ?? exercise.reps.map(() => null),
        exerciseNote: exercise.exerciseNote ?? "",
      })),
    };

    const nextHistory = normalizeHistory([entry, ...history]);
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
      sessionNote: updatedEntry.sessionNote ?? "",
      exercises: updatedEntry.exercises.map((exercise) => ({
        name: exercise.name,
        weight: exercise.weight,
        unit: exercise.unit,
        reps: exercise.reps,
        rpe: exercise.rpe,
        warmup: exercise.warmup ?? exercise.reps.map(() => false),
        setWeights: exercise.setWeights ?? exercise.reps.map(() => null),
        exerciseNote: exercise.exerciseNote ?? "",
      })),
    };
    const nextHistory = normalizeHistory(
      history.map((entry, index) => (index === indexToSave ? cleanedEntry : entry)),
    );
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

  const dashboardStats = useMemo(
    () => buildDashboardStats(history, programs, today),
    [history, programs, today],
  );
  const deloadSuggestion = useMemo(() => checkDeloadSuggestion(history), [history]);

  const handleExportMarkdown = useCallback(async () => {
    const md = exportToMarkdown(history);
    await navigator.clipboard.writeText(md);
    setExportCopied(true);
    setTimeout(() => setExportCopied(false), 2000);
  }, [history]);

  const handleImportClick = useCallback(() => importRef.current?.click(), []);

  const handleImportChange = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    try {
      await importBackup(file, setHistory, setPrograms);
      setImportStatus("ok");
    } catch {
      setImportStatus("error");
    }
    setTimeout(() => setImportStatus(null), 3000);
  }, []);

  if (loading) {
    return (
      <div style={{ ...ES.shell, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ ...ES.label }}>Loading…</div>
      </div>
    );
  }

  if (view === "edit-history" && editingHistoryIndex !== null && history[editingHistoryIndex]) {
    return (
      <Suspense fallback={<ViewFallback />}>
        <EditorialHistoryEditor
          entry={history[editingHistoryIndex]}
          programs={programs}
          onBack={() => { setEditingHistoryIndex(null); setView("home"); }}
          onSave={(updatedEntry) => void saveHistoryEntry(editingHistoryIndex, updatedEntry)}
        />
      </Suspense>
    );
  }

  if (view === "edit-program") {
    return (
      <Suspense fallback={<ViewFallback />}>
        <EditorialProgramEditor
          programs={programs}
          onBack={() => setView("home")}
          onSave={(updatedPrograms) => void savePrograms(updatedPrograms)}
        />
      </Suspense>
    );
  }

  if (view === "workout" && workoutSession) {
    return (
      <div style={ES.shell}>
        <EditorialNav view={view} setView={setView} />
        <EditorialWorkout
          session={workoutSession}
          history={history}
          programs={programs}
          onUpdateRep={updateRep}
          onUpdateRpe={updateRpe}
          onUpdateWeight={updateWeight}
          onUpdateSetWeight={updateSetWeight}
          onUpdateStep={updateWeightStep}
          onToggleWarmup={toggleWarmup}
          onAddSet={addSet}
          onRemoveSet={removeSet}
          onUpdateExerciseNote={updateExerciseNote}
          onUpdateSessionNote={updateSessionNote}
          onSubstituteExercise={substituteExercise}
          onFinish={() => void finishWorkout()}
          onDiscard={() => void discardWorkout()}
        />
      </div>
    );
  }

  if (view === "progress") {
    return (
      <div style={ES.shell}>
        <EditorialNav view={view} setView={setView} />
        <Suspense fallback={<ViewFallback />}>
          <EditorialProgress
            history={history}
            onExit={() => setView("home")}
            onEdit={(index) => { setEditingHistoryIndex(index); setView("edit-history"); }}
            onDelete={(index) => void deleteHistoryEntry(index)}
          />
        </Suspense>
      </div>
    );
  }

  return (
    <div style={ES.shell}>
      <EditorialNav view={view} setView={setView} />
      <EditorialHome
        stats={dashboardStats}
        history={history}
        programs={programs}
        today={today}
        deloadSuggestion={deloadSuggestion}
        onStart={(id) => startWorkout(id)}
        onProgress={() => setView("progress")}
        onEditProgram={() => setView("edit-program")}
        onEditHistory={(index) => { setEditingHistoryIndex(index); setView("edit-history"); }}
        onDeleteHistory={(index) => void deleteHistoryEntry(index)}
        onExportMarkdown={handleExportMarkdown}
        onExportBackup={() => exportBackup(history, programs)}
        onImportClick={handleImportClick}
        importRef={importRef}
        onImportChange={handleImportChange}
        exportCopied={exportCopied}
        importStatus={importStatus}
      />
    </div>
  );
}

function EditorialNav({ view, setView }) {
  const items = [
    { id: "home", label: "Journal" },
    { id: "progress", label: "Archive" },
  ];
  return (
    <nav style={{
      display: "flex", alignItems: "baseline", justifyContent: "space-between",
      paddingBottom: 20, borderBottom: `2px solid ${TE.rule}`, marginBottom: 40,
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
        <div style={{ ...ES.num, fontSize: 28, fontWeight: 500, letterSpacing: "-0.02em" }}>
          The Training Record
        </div>
        <div style={{ ...ES.mono, fontSize: 10, color: TE.ink3, letterSpacing: "0.15em" }}>
          EST. {new Date().getFullYear()} · VOL. I
        </div>
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {items.map(it => (
          <button key={it.id} onClick={() => setView(it.id)} style={{
            padding: "8px 16px",
            background: view === it.id ? TE.ink : "transparent",
            color: view === it.id ? TE.bg : TE.ink,
            border: `1px solid ${TE.ink}`, cursor: "pointer",
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase",
          }}>{it.label}</button>
        ))}
      </div>
    </nav>
  );
}
