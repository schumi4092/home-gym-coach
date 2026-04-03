import { useEffect, useState } from "react";
import { T, iconButtonStyle, panelStyle, primaryButtonStyle } from "../constants/theme.js";
import { hydrateHistoryEntry } from "../utils/workout.js";
import { ExerciseCard } from "../components/ExerciseCard.jsx";

export function HistoryEditor({ entry, programs, onBack, onSave, isDesktop }) {
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
            <button onClick={onBack} style={iconButtonStyle}>
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
          <button onClick={() => onSave(draft)} style={primaryButtonStyle}>
            儲存修改
          </button>
        </div>

        <div style={{ ...panelStyle, borderRadius: 10, padding: "8px 12px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: 3, background: T.orange }} />
          <span style={{ fontSize: 13, color: T.t3 }}>這裡修改的是歷史紀錄，不會影響目前正在進行中的訓練。</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr", gap: 10, alignItems: "start" }}>
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
