import { useEffect, useState } from "react";
import { TE, ES, primaryBtn, secondaryBtn, editStepBtn } from "../constants/editorial-theme.js";
import { hydrateHistoryEntry } from "../utils/workout.js";

const numInputStyle = {
  width: 56,
  background: "transparent",
  border: "none",
  borderBottom: `1px solid ${TE.ink}`,
  color: TE.ink,
  textAlign: "center",
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: 15,
  padding: "6px 0",
  outline: "none",
};

export function EditorialHistoryEditor({ entry, programs, onBack, onSave }) {
  const [draft, setDraft] = useState(() => hydrateHistoryEntry(entry, programs));

  useEffect(() => {
    setDraft(hydrateHistoryEntry(entry, programs));
  }, [entry, programs]);

  const updateWeight = (exIdx, value) => {
    setDraft((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) => (
        i === exIdx ? { ...ex, weight: Math.max(0, Math.round(value * 1000) / 1000) } : ex
      )),
    }));
  };

  const updateRep = (exIdx, setIdx, value) => {
    setDraft((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) => (
        i === exIdx
          ? { ...ex, reps: ex.reps.map((r, j) => (j === setIdx ? Math.max(0, value) : r)) }
          : ex
      )),
    }));
  };

  const updateRpe = (exIdx, setIdx, value) => {
    const normalized = Math.max(0, Math.min(10, Math.round(value * 2) / 2));
    setDraft((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) => (
        i === exIdx
          ? { ...ex, rpe: ex.rpe.map((r, j) => (j === setIdx ? normalized : r)) }
          : ex
      )),
    }));
  };

  const toggleWarmup = (exIdx, setIdx) => {
    setDraft((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) => {
        if (i !== exIdx) return ex;
        const warmup = [...(ex.warmup || ex.reps.map(() => false))];
        warmup[setIdx] = !warmup[setIdx];
        return { ...ex, warmup };
      }),
    }));
  };

  const updateExerciseNote = (exIdx, note) => {
    setDraft((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) => (i === exIdx ? { ...ex, exerciseNote: note } : ex)),
    }));
  };

  const updateSessionNote = (note) => {
    setDraft((prev) => ({ ...prev, sessionNote: note }));
  };

  return (
    <div style={ES.shell}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <header style={{ marginBottom: 28 }}>
          <div style={{ ...ES.label, marginBottom: 10 }}>THE TRAINING RECORD · EDIT HISTORY</div>
          <hr style={ES.thickRule} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: "18px 0 14px" }}>
            <div>
              <h1 style={{ ...ES.num, fontSize: 42, margin: 0, lineHeight: 1 }}>{draft.day}</h1>
              <div style={{ ...ES.mono, marginTop: 10, fontSize: 13, color: TE.ink3, letterSpacing: "0.06em" }}>
                {draft.date} · {draft.duration} min · {draft.exercises.length} movements
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={onBack} style={secondaryBtn}>← Back</button>
              <button onClick={() => onSave(draft)} style={primaryBtn}>Save Changes</button>
            </div>
          </div>
          <hr style={ES.rule} />
        </header>

        <div style={{
          background: TE.accentSoft,
          border: `1px solid ${TE.accent}`,
          padding: "10px 14px",
          marginBottom: 22,
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 12,
          color: TE.ink2,
          letterSpacing: "0.02em",
        }}>
          <span style={{ fontWeight: 600, color: TE.accent }}>NOTE</span>
          <span>編輯歷史紀錄不會影響目前進行中的訓練。</span>
        </div>

        <section style={{ marginBottom: 22 }}>
          <div style={{ ...ES.label, marginBottom: 8 }}>Session Note</div>
          <textarea
            value={draft.sessionNote ?? ""}
            onChange={(e) => updateSessionNote(e.target.value)}
            placeholder="How the session felt, overall notes…"
            rows={2}
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: TE.surface,
              border: `1px solid ${TE.ink4}`,
              color: TE.ink,
              padding: "10px 12px",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 13,
              outline: "none",
              resize: "vertical",
            }}
          />
        </section>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          {draft.exercises.map((exercise, exIdx) => (
            <ExerciseEditBlock
              key={`${exercise.name}-${exIdx}`}
              exercise={exercise}
              exIdx={exIdx}
              onWeight={updateWeight}
              onRep={updateRep}
              onRpe={updateRpe}
              onToggleWarmup={toggleWarmup}
              onNote={updateExerciseNote}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ExerciseEditBlock({ exercise, exIdx, onWeight, onRep, onRpe, onToggleWarmup, onNote }) {
  const isWeighted = exercise.unit === "kg";

  return (
    <article style={{ background: TE.surface, border: `1px solid ${TE.ink}`, padding: "18px 18px 16px" }}>
      <header style={{ marginBottom: 14 }}>
        <div style={{ ...ES.label, marginBottom: 4 }}>Movement {String(exIdx + 1).padStart(2, "0")}</div>
        <h2 style={{ ...ES.num, fontSize: 22, margin: 0 }}>{exercise.name}</h2>
        <div style={{ ...ES.mono, fontSize: 11, color: TE.ink3, marginTop: 4, letterSpacing: "0.04em" }}>
          Target · {exercise.repRange} · {exercise.unit}
        </div>
      </header>

      <hr style={{ ...ES.rule, margin: "8px 0 14px" }} />

      {isWeighted && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <span style={ES.label}>Weight</span>
          <button onClick={() => onWeight(exIdx, Math.max(0, exercise.weight - (exercise.step ?? 2.5)))} style={editStepBtn}>−</button>
          <div style={{ ...ES.num, fontSize: 24, minWidth: 64, textAlign: "center" }}>
            {exercise.weight}
            <span style={{ fontSize: 11, color: TE.ink3, marginLeft: 4, fontFamily: "'IBM Plex Mono', monospace" }}>{exercise.unit}</span>
          </div>
          <button onClick={() => onWeight(exIdx, exercise.weight + (exercise.step ?? 2.5))} style={editStepBtn}>+</button>
        </div>
      )}

      <div style={{ borderTop: `1px solid ${TE.ink4}` }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "32px 1fr 1fr 56px",
          gap: 10,
          padding: "8px 2px",
          ...ES.label,
          fontSize: 10,
          borderBottom: `1px solid ${TE.ink4}`,
        }}>
          <span>Set</span>
          <span>Reps</span>
          <span>RPE</span>
          <span style={{ textAlign: "right" }}>Warm</span>
        </div>
        {exercise.reps.map((rep, setIdx) => {
          const warmup = exercise.warmup?.[setIdx] ?? false;
          return (
            <div
              key={setIdx}
              style={{
                display: "grid",
                gridTemplateColumns: "32px 1fr 1fr 56px",
                gap: 10,
                alignItems: "center",
                padding: "10px 2px",
                borderBottom: setIdx < exercise.reps.length - 1 ? `1px solid ${TE.ink4}` : "none",
                opacity: warmup ? 0.72 : 1,
              }}
            >
              <span style={{ ...ES.monoNum, fontSize: 13, color: TE.ink3 }}>{String(setIdx + 1).padStart(2, "0")}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button onClick={() => onRep(exIdx, setIdx, Math.max(0, rep - 1))} style={{ ...editStepBtn, width: 28, height: 28, fontSize: 14 }}>−</button>
                <input
                  type="number"
                  min="0"
                  value={rep}
                  onChange={(e) => onRep(exIdx, setIdx, Number(e.target.value))}
                  style={numInputStyle}
                />
                <button onClick={() => onRep(exIdx, setIdx, rep + 1)} style={{ ...editStepBtn, width: 28, height: 28, fontSize: 14 }}>+</button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button onClick={() => onRpe(exIdx, setIdx, Math.max(0, (exercise.rpe?.[setIdx] ?? 0) - 0.5))} style={{ ...editStepBtn, width: 28, height: 28, fontSize: 14 }}>−</button>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="10"
                  value={exercise.rpe?.[setIdx] ?? 0}
                  onChange={(e) => onRpe(exIdx, setIdx, Number(e.target.value))}
                  style={numInputStyle}
                />
                <button onClick={() => onRpe(exIdx, setIdx, Math.min(10, (exercise.rpe?.[setIdx] ?? 0) + 0.5))} style={{ ...editStepBtn, width: 28, height: 28, fontSize: 14 }}>+</button>
              </div>
              <button
                onClick={() => onToggleWarmup(exIdx, setIdx)}
                title="Toggle warm-up"
                style={{
                  justifySelf: "end",
                  width: 38,
                  height: 28,
                  background: warmup ? TE.ink : "transparent",
                  color: warmup ? TE.bg : TE.ink3,
                  border: `1px solid ${warmup ? TE.ink : TE.ink4}`,
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  letterSpacing: "0.08em",
                  cursor: "pointer",
                }}
              >W</button>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 14 }}>
        <div style={{ ...ES.label, fontSize: 10, marginBottom: 6 }}>Exercise Note</div>
        <textarea
          value={exercise.exerciseNote ?? ""}
          onChange={(e) => onNote(exIdx, e.target.value)}
          placeholder="Cues, form notes, tempo…"
          rows={2}
          style={{
            width: "100%",
            boxSizing: "border-box",
            background: TE.bg,
            border: `1px solid ${TE.ink4}`,
            color: TE.ink,
            padding: "8px 10px",
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 12,
            outline: "none",
            resize: "vertical",
          }}
        />
      </div>
    </article>
  );
}
