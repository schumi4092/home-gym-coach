import { TE, ES } from "../constants/editorial-theme.js";
import { EditorialSetRow } from "./EditorialSetRow.jsx";
import { formatExerciseLoad } from "../utils/format.js";
import { getAdjustedWeight, getSetWeight } from "../utils/workout.js";

export function EditorialExerciseCard({
  exercise,
  index,
  onRep,
  onRpe,
  onWeight,
  onSetWeight,
  onToggleWarmup,
  onAddSet,
  onRemoveSet,
  onUpdateExerciseNote,
  onSubstitute,
  lastSession,
  lastSummary,
  lastReps,
  activeSet,
  setActiveSet,
}) {
  const unit = exercise.unit;
  const step = exercise.step ?? 1;
  const workingSetCount = exercise.reps.filter((_, i) => !exercise.warmup?.[i]).length;
  const warmupCount = exercise.reps.length - workingSetCount;

  const adjustWeight = (direction) => {
    if (unit === "bw") return;
    onWeight(index, getAdjustedWeight(exercise.weight, step, direction));
  };

  return (
    <article style={{ background: TE.bg }}>
      <header style={{ paddingBottom: 16, borderBottom: `2px solid ${TE.rule}`, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginBottom: 8 }}>
          <div style={{ ...ES.label }}>Exercise {String(index + 1).padStart(2, "0")}</div>
          {onSubstitute && (
            <button
              onClick={() => onSubstitute(index)}
              style={{
                background: "transparent", border: `1px solid ${TE.ink4}`,
                padding: "4px 10px", fontSize: 10,
                fontFamily: "'IBM Plex Mono', monospace",
                letterSpacing: "0.1em", textTransform: "uppercase",
                color: TE.ink3, cursor: "pointer",
              }}
            >Swap</button>
          )}
        </div>
        <h2 style={{ ...ES.num, fontSize: 36, margin: 0, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
          {exercise.name}
        </h2>
        <div style={{ display: "flex", gap: 24, marginTop: 10, ...ES.mono, fontSize: 11, color: TE.ink3, letterSpacing: "0.08em", flexWrap: "wrap" }}>
          <span>TARGET · {exercise.repRange} reps</span>
          <span>{workingSetCount} working{warmupCount > 0 ? ` · ${warmupCount} warm-up` : ""}</span>
        </div>
        {(lastSummary || exercise.note) && (
          <p style={{ margin: "12px 0 0", fontSize: 14, color: TE.ink2, fontStyle: "italic", lineHeight: 1.5 }}>
            {lastSummary ?? exercise.note}
          </p>
        )}
      </header>

      {/* Weight bar */}
      {unit !== "bw" && (
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, padding: "12px 14px", background: TE.surface }}>
          <div style={{ ...ES.label }}>Working weight</div>
          <div style={{ flex: 1 }} />
          <button onClick={() => adjustWeight(-1)} style={stepperBtn}>−</button>
          <div style={{ ...ES.num, fontSize: 28, letterSpacing: "-0.02em", minWidth: 80, textAlign: "center" }}>
            {formatExerciseLoad(exercise.weight, unit)}
          </div>
          <button onClick={() => adjustWeight(1)} style={stepperBtn}>+</button>
        </div>
      )}

      {lastSession && (
        <div style={{ marginBottom: 16, padding: "10px 14px", background: TE.surface, borderLeft: `3px solid ${TE.ink3}` }}>
          <div style={{ ...ES.label, marginBottom: 4, fontSize: 10 }}>Last session</div>
          <div style={{ ...ES.mono, fontSize: 13, color: TE.ink2 }}>{lastSession}</div>
        </div>
      )}

      <div>
        {onAddSet && (
          <div style={{ display: "flex", justifyContent: "flex-end", padding: "0 0 8px" }}>
            <button
              onClick={() => onAddSet(index, { warmup: true, position: "start" })}
              style={addBtn}
            >+ Warm-up set</button>
          </div>
        )}
        {exercise.reps.map((rep, setIdx) => {
          const isWarmup = exercise.warmup?.[setIdx] ?? false;
          const setWeight = getSetWeight(exercise, setIdx);
          const adjustSetWeight = (direction) => {
            if (unit === "bw") return;
            onSetWeight?.(index, setIdx, getAdjustedWeight(setWeight, step, direction));
          };
          return (
            <EditorialSetRow
              key={setIdx}
              index={setIdx}
              rep={rep}
              rpe={exercise.rpe[setIdx] ?? 0}
              warmup={isWarmup}
              setWeight={setWeight}
              unit={unit}
              showWeightStepper={isWarmup && unit !== "bw" && !!onSetWeight}
              onAdjustWeight={adjustSetWeight}
              onRep={(v) => onRep(index, setIdx, v)}
              onRpe={(v) => onRpe(index, setIdx, v)}
              onToggleWarmup={() => onToggleWarmup?.(index, setIdx)}
              onRemove={onRemoveSet && exercise.reps.length > 1 ? () => onRemoveSet(index, setIdx) : undefined}
              range={exercise.repRange}
              isActive={setIdx === activeSet}
              lastRep={lastReps?.[setIdx]}
              onFocus={() => setActiveSet(setIdx)}
            />
          );
        })}
        {onAddSet && (
          <div style={{ display: "flex", justifyContent: "flex-end", padding: "10px 0 0" }}>
            <button
              onClick={() => onAddSet(index, { warmup: false, position: "end" })}
              style={addBtn}
            >+ Add set</button>
          </div>
        )}
      </div>

      {/* Per-exercise note */}
      <div style={{ marginTop: 18 }}>
        <div style={{ ...ES.label, marginBottom: 6 }}>Today&apos;s note</div>
        <textarea
          value={exercise.exerciseNote ?? ""}
          onChange={(e) => onUpdateExerciseNote?.(index, e.target.value)}
          placeholder="e.g. left shoulder clicky on S2"
          rows={2}
          style={{
            width: "100%", boxSizing: "border-box",
            border: `1px solid ${TE.ink4}`, background: "transparent",
            padding: "10px 12px", resize: "vertical",
            fontFamily: "'Fraunces', Georgia, serif", fontSize: 14, color: TE.ink,
            fontStyle: "italic",
          }}
        />
      </div>
    </article>
  );
}

const stepperBtn = {
  width: 36, height: 36,
  border: `1.5px solid ${TE.ink}`,
  background: "transparent",
  color: TE.ink,
  fontSize: 18,
  cursor: "pointer",
  fontFamily: "'IBM Plex Mono', monospace",
  display: "flex", alignItems: "center", justifyContent: "center",
};

const addBtn = {
  background: "transparent",
  border: `1px dashed ${TE.ink4}`,
  color: TE.ink3,
  padding: "6px 14px",
  fontSize: 11,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  fontFamily: "'IBM Plex Mono', monospace",
  cursor: "pointer",
};
