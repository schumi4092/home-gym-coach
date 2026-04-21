import { useMemo, useState } from "react";
import { TE, ES, primaryBtn, secondaryBtn } from "../constants/editorial-theme.js";
import { EditorialExerciseCard } from "../components/EditorialExerciseCard.jsx";
import { EditorialTimer } from "../components/EditorialTimer.jsx";
import { buildExerciseHistoryMap, createCoachingHint } from "../utils/coaching.js";
import { getRestSeconds } from "../utils/workout.js";
import { formatExerciseLoad } from "../utils/format.js";

export function EditorialWorkout({
  session,
  history,
  programs,
  onUpdateRep,
  onUpdateRpe,
  onUpdateWeight,
  onUpdateSetWeight,
  onToggleWarmup,
  onAddSet: rawAddSet,
  onRemoveSet: rawRemoveSet,
  onUpdateExerciseNote,
  onUpdateSessionNote,
  onSubstituteExercise,
  onFinish,
  onDiscard,
}) {
  const [activeEx, setActiveEx] = useState(0);
  const [activeSet, setActiveSet] = useState(0);
  const [timerTrigger, setTimerTrigger] = useState(0);
  const [swapTargetIndex, setSwapTargetIndex] = useState(null);

  const exerciseHistoryMap = useMemo(() => buildExerciseHistoryMap(history), [history]);
  const workingSetsOf = (ex) => ex.reps.filter((r, i) => r > 0 && !ex.warmup?.[i]).length;
  const workingTargetOf = (ex) => ex.reps.filter((_, i) => !ex.warmup?.[i]).length;

  const totalSets = session.exercises.reduce((sum, ex) => sum + workingTargetOf(ex), 0);
  const doneSets = session.exercises.reduce((sum, ex) => sum + workingSetsOf(ex), 0);
  const completedExercises = session.exercises.filter((ex) => {
    const workingReps = ex.reps.filter((_, i) => !ex.warmup?.[i]);
    return workingReps.length > 0 && workingReps.every((r) => r > 0);
  }).length;
  const hasAnyInput = session.exercises.some((ex) => ex.reps.some((r) => r > 0));

  const currentExercise = session.exercises[activeEx];
  const currentHint = exerciseHistoryMap[currentExercise?.name];
  const lastReps = currentHint?.latest?.reps ?? [];
  const lastSessionText = currentHint?.latest
    ? currentHint.latest.reps
        .map((r, i) => `S${i + 1} ${r}r${currentHint.latest.avgRpe > 0 ? ` @ ${currentHint.latest.avgRpe}` : ""}`)
        .join(" · ")
    : null;
  const lastSummaryText = currentHint?.latest
    ? `上次 ${formatExerciseLoad(currentHint.latest.weight, currentHint.latest.unit)}，做了 ${currentHint.latest.reps.join("/")}。`
    : null;
  const coachNote = useMemo(
    () => currentExercise ? createCoachingHint(currentExercise, currentHint?.latest, currentHint?.best) : null,
    [currentExercise, currentHint],
  );

  const restSeconds = currentExercise ? getRestSeconds(currentExercise.repRange) : 90;
  const finishLabel = !hasAnyInput ? "Cancel" : completedExercises === session.exercises.length ? "Complete session" : "End session";

  const handleRep = (exIdx, setIdx, value) => {
    const prev = session.exercises[exIdx].reps[setIdx];
    const isWarmup = session.exercises[exIdx].warmup?.[setIdx];
    onUpdateRep(exIdx, setIdx, value);
    if (value > 0 && value !== prev && !isWarmup) {
      setTimerTrigger((k) => k + 1);
    }
    if (value > 0 && exIdx === activeEx && setIdx === activeSet) {
      const ex = session.exercises[exIdx];
      if (setIdx + 1 < ex.reps.length) setActiveSet(setIdx + 1);
    }
  };

  const focusExercise = (exIdx) => {
    setActiveEx(exIdx);
    const firstEmpty = session.exercises[exIdx].reps.findIndex((r) => r === 0);
    setActiveSet(firstEmpty === -1 ? 0 : firstEmpty);
  };

  const onAddSet = (exIdx, opts = {}) => {
    rawAddSet(exIdx, opts);
    if (exIdx === activeEx && opts.position === "start") {
      setActiveSet((s) => s + 1);
    }
  };

  const onRemoveSet = (exIdx, setIdx) => {
    rawRemoveSet(exIdx, setIdx);
    if (exIdx !== activeEx) return;
    const nextLen = (session.exercises[exIdx]?.reps.length ?? 1) - 1;
    setActiveSet((s) => {
      if (setIdx < s) return Math.max(0, s - 1);
      if (setIdx === s) return Math.max(0, Math.min(s, nextLen - 1));
      return s;
    });
  };

  return (
    <div>
      <div style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24, flexWrap: "wrap" }}>
        <div>
          <div style={{ ...ES.mono, fontSize: 11, color: TE.ink3, letterSpacing: "0.15em", marginBottom: 6 }}>
            {session.tag} · IN PROGRESS
          </div>
          <h1 style={{ ...ES.num, fontSize: 56, margin: 0, lineHeight: 1, letterSpacing: "-0.03em", fontWeight: 500 }}>
            <em style={{ fontStyle: "italic", fontWeight: 400 }}>{session.day}</em>
          </h1>
          <div style={{ ...ES.mono, fontSize: 11, color: TE.ink3, marginTop: 10, letterSpacing: "0.08em" }}>
            {completedExercises}/{session.exercises.length} EXERCISES · {doneSets}/{totalSets} WORKING SETS · AUTO-SAVED
          </div>
        </div>
        {/* Session note (compact, top-right) */}
        <div style={{ flex: "1 1 260px", maxWidth: 420 }}>
          <div style={{ ...ES.label, marginBottom: 6 }}>Session note</div>
          <textarea
            value={session.sessionNote ?? ""}
            onChange={(e) => onUpdateSessionNote?.(e.target.value)}
            placeholder="sleep, mood, energy…"
            rows={2}
            style={{
              width: "100%", boxSizing: "border-box",
              border: `1px solid ${TE.ink4}`, background: "transparent",
              padding: "8px 10px", resize: "vertical",
              fontFamily: "'Fraunces', Georgia, serif", fontSize: 13, color: TE.ink,
              fontStyle: "italic",
            }}
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 280px", gap: 40, alignItems: "start" }}>
        {/* LEFT: exercise list */}
        <aside style={{ borderRight: `1px solid ${TE.rule}`, paddingRight: 24 }}>
          <div style={{ ...ES.label, marginBottom: 12 }}>Session · {session.tag}</div>
          <div style={{ ...ES.num, fontSize: 40, fontWeight: 500, letterSpacing: "-0.02em", marginBottom: 24, lineHeight: 1 }}>
            {doneSets}<span style={{ color: TE.ink4, fontSize: 20 }}>/{totalSets}</span>
          </div>
          <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {session.exercises.map((ex, i) => {
              const workingDone = workingSetsOf(ex);
              const workingTotal = workingTargetOf(ex);
              const isActive = i === activeEx;
              return (
                <li
                  key={i}
                  onClick={() => focusExercise(i)}
                  style={{
                    padding: "14px 0", borderBottom: `1px solid ${TE.rule}`,
                    cursor: "pointer", display: "flex", alignItems: "baseline", gap: 10,
                  }}
                >
                  <span style={{ ...ES.mono, fontSize: 10, color: TE.ink4, width: 20 }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      ...ES.num, fontSize: 15,
                      color: isActive ? TE.ink : TE.ink3,
                      fontStyle: isActive ? "italic" : "normal",
                      fontWeight: isActive ? 600 : 400,
                      letterSpacing: "-0.01em",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {ex.name}
                    </div>
                    <div style={{ ...ES.mono, fontSize: 10, color: TE.ink4, marginTop: 2, letterSpacing: "0.05em" }}>
                      {workingDone}/{workingTotal} sets
                    </div>
                  </div>
                  {workingDone === workingTotal && workingTotal > 0 && (
                    <span style={{ fontSize: 14, color: TE.accent }}>●</span>
                  )}
                </li>
              );
            })}
          </ol>
        </aside>

        {/* CENTER: focused exercise */}
        <main>
          {currentExercise && (
            <EditorialExerciseCard
              exercise={currentExercise}
              index={activeEx}
              onRep={handleRep}
              onRpe={onUpdateRpe}
              onWeight={onUpdateWeight}
              onSetWeight={onUpdateSetWeight}
              onToggleWarmup={onToggleWarmup}
              onAddSet={onAddSet}
              onRemoveSet={onRemoveSet}
              onUpdateExerciseNote={onUpdateExerciseNote}
              onSubstitute={onSubstituteExercise ? (idx) => setSwapTargetIndex(idx) : undefined}
              lastSession={lastSessionText}
              lastSummary={lastSummaryText}
              lastReps={lastReps}
              activeSet={activeSet}
              setActiveSet={setActiveSet}
            />
          )}
        </main>

        {/* RIGHT: timer + coach + exit */}
        <aside>
          <EditorialTimer sec={restSeconds} autoStartKey={timerTrigger} />
          {coachNote && (
            <div style={{ marginTop: 24, padding: 16, borderLeft: `3px solid ${TE.accent}`, background: TE.surface }}>
              <div style={{ ...ES.label, color: TE.accent, marginBottom: 8 }}>Coach · {coachNote.headline}</div>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, fontStyle: "italic", color: TE.ink2 }}>
                {coachNote.detail}
              </p>
            </div>
          )}

          <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${TE.rule}` }}>
            <div style={{ ...ES.label, marginBottom: 12 }}>Session controls</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                onClick={() => { if (!hasAnyInput) onDiscard(); else onFinish(); }}
                style={{ ...primaryBtn, width: "100%" }}
              >
                {finishLabel}
              </button>
              {hasAnyInput && completedExercises !== session.exercises.length && (
                <button onClick={onDiscard} style={{ ...secondaryBtn, width: "100%", borderColor: TE.accent, color: TE.accent }}>
                  Discard session
                </button>
              )}
            </div>
          </div>
        </aside>
      </div>

      {swapTargetIndex !== null && (
        <SwapExerciseModal
          programs={programs}
          currentName={session.exercises[swapTargetIndex]?.name}
          onClose={() => setSwapTargetIndex(null)}
          onPick={(replacement) => {
            onSubstituteExercise(swapTargetIndex, replacement);
            setSwapTargetIndex(null);
          }}
        />
      )}
    </div>
  );
}

function SwapExerciseModal({ programs, currentName, onClose, onPick }) {
  const [filter, setFilter] = useState("");
  const [customMode, setCustomMode] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customSets, setCustomSets] = useState(3);
  const [customRange, setCustomRange] = useState("8-12");
  const [customUnit, setCustomUnit] = useState("kg");
  const [customWeight, setCustomWeight] = useState(0);

  const candidates = useMemo(() => {
    const seen = new Set();
    const list = [];
    for (const program of programs) {
      for (const exercise of program.exercises) {
        if (seen.has(exercise.name) || exercise.name === currentName) continue;
        seen.add(exercise.name);
        list.push({ ...exercise, programTag: program.tag });
      }
    }
    if (!filter) return list;
    const lower = filter.toLowerCase();
    return list.filter((e) => e.name.toLowerCase().includes(lower));
  }, [programs, currentName, filter]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(20, 19, 15, 0.55)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: TE.bg, maxWidth: 560, width: "100%", maxHeight: "80vh",
          display: "flex", flexDirection: "column",
          border: `2px solid ${TE.ink}`,
        }}
      >
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${TE.rule}` }}>
          <div style={{ ...ES.label, marginBottom: 6 }}>Swap exercise</div>
          <div style={{ ...ES.num, fontSize: 22, letterSpacing: "-0.02em" }}>
            Replace <em style={{ fontStyle: "italic" }}>{currentName}</em>
          </div>
        </div>

        {!customMode ? (
          <>
            <div style={{ padding: "12px 24px", borderBottom: `1px solid ${TE.rule}` }}>
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="search exercises…"
                style={{
                  width: "100%", boxSizing: "border-box",
                  border: `1px solid ${TE.ink4}`, background: "transparent",
                  padding: "8px 10px",
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: TE.ink,
                }}
              />
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {candidates.length === 0 ? (
                <div style={{ padding: 20, ...ES.mono, fontSize: 12, color: TE.ink3 }}>No matches.</div>
              ) : candidates.map((ex) => (
                <button
                  key={ex.name}
                  onClick={() => onPick(ex)}
                  style={{
                    display: "block", width: "100%", textAlign: "left",
                    padding: "12px 24px", border: 0, borderBottom: `1px solid ${TE.rule}`,
                    background: "transparent", cursor: "pointer",
                  }}
                >
                  <div style={{ ...ES.num, fontSize: 16, letterSpacing: "-0.01em" }}>{ex.name}</div>
                  <div style={{ ...ES.mono, fontSize: 10, color: TE.ink3, letterSpacing: "0.08em", marginTop: 4 }}>
                    {ex.programTag} · {ex.sets} × {ex.repRange}
                    {ex.unit !== "bw" && ` · ${ex.weight}${ex.unit}`}
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
            <Field label="Name">
              <input value={customName} onChange={(e) => setCustomName(e.target.value)} style={inputStyle} />
            </Field>
            <Field label="Sets">
              <input type="number" min={1} value={customSets} onChange={(e) => setCustomSets(Math.max(1, Number(e.target.value) || 1))} style={inputStyle} />
            </Field>
            <Field label="Rep range">
              <input value={customRange} onChange={(e) => setCustomRange(e.target.value)} style={inputStyle} />
            </Field>
            <Field label="Unit">
              <select value={customUnit} onChange={(e) => setCustomUnit(e.target.value)} style={inputStyle}>
                <option value="kg">kg</option>
                <option value="bw">bw</option>
                <option value="sec">sec</option>
              </select>
            </Field>
            {customUnit !== "bw" && (
              <Field label="Starting weight">
                <input type="number" min={0} value={customWeight} onChange={(e) => setCustomWeight(Number(e.target.value) || 0)} style={inputStyle} />
              </Field>
            )}
          </div>
        )}

        <div style={{ padding: "14px 24px", borderTop: `1px solid ${TE.rule}`, display: "flex", gap: 8, justifyContent: "space-between" }}>
          <button onClick={() => setCustomMode((v) => !v)} style={{ ...secondaryBtn, fontSize: 11, padding: "8px 14px" }}>
            {customMode ? "← Pick from list" : "Custom exercise →"}
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onClose} style={{ ...secondaryBtn, fontSize: 11, padding: "8px 14px" }}>Cancel</button>
            {customMode && (
              <button
                onClick={() => {
                  if (!customName.trim()) return;
                  onPick({
                    name: customName.trim(),
                    sets: customSets,
                    repRange: customRange,
                    unit: customUnit,
                    weight: customUnit === "bw" ? 0 : customWeight,
                  });
                }}
                style={{ ...primaryBtn, fontSize: 11, padding: "8px 14px" }}
              >
                Use custom
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ ...ES.label }}>{label}</span>
      {children}
    </label>
  );
}

const inputStyle = {
  border: `1px solid ${TE.ink4}`, background: "transparent",
  padding: "8px 10px",
  fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: TE.ink,
};
