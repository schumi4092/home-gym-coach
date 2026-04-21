import { useEffect, useMemo, useRef, useState } from "react";
import { TE, ES } from "../constants/editorial-theme.js";
import { RPE_OPTIONS } from "../constants/defaults.js";
import { parseRepRange, formatExerciseLoad } from "../utils/format.js";

export function EditorialSetRow({
  index,
  rep,
  rpe,
  warmup,
  setWeight,
  unit,
  showWeightStepper,
  onAdjustWeight,
  onRep,
  onRpe,
  onToggleWarmup,
  onRemove,
  range,
  isActive,
  lastRep,
  onFocus,
}) {
  const done = rep > 0;
  const [editing, setEditing] = useState(false);
  const [draftValue, setDraftValue] = useState(String(rep));
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const adjust = (delta) => {
    const next = Math.max(0, rep + delta);
    onRep(next);
  };

  const commitDraft = () => {
    const parsed = Math.max(0, Math.floor(Number(draftValue) || 0));
    onRep(parsed);
    setEditing(false);
  };

  const openEditor = () => {
    setDraftValue(String(rep));
    setEditing(true);
  };

  const quickPicks = useMemo(() => buildQuickPicks(range), [range]);
  const labelColor = warmup ? TE.ink4 : (isActive ? TE.accent : TE.ink3);

  return (
    <div
      onClick={onFocus}
      style={{
        padding: "16px 14px",
        borderBottom: `1px solid ${TE.rule}`,
        background: isActive ? TE.surface : "transparent",
        borderLeft: `3px solid ${isActive ? TE.accent : "transparent"}`,
        cursor: onFocus ? "pointer" : "default",
        opacity: warmup ? 0.72 : 1,
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "44px 1fr auto", gap: 14, alignItems: "center", marginBottom: 10 }}>
        <div style={{ ...ES.monoNum, fontSize: 12, color: labelColor, fontWeight: 600, letterSpacing: "0.08em" }}>
          {warmup ? "WU" : `S${index + 1}`}
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            {editing ? (
              <input
                ref={inputRef}
                type="number"
                inputMode="numeric"
                value={draftValue}
                onChange={(e) => setDraftValue(e.target.value)}
                onBlur={commitDraft}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); commitDraft(); }
                  if (e.key === "Escape") { e.preventDefault(); setEditing(false); }
                }}
                style={{
                  ...ES.num,
                  fontSize: warmup ? 22 : 32,
                  width: 70, background: "transparent",
                  border: "none", borderBottom: `2px solid ${TE.ink}`,
                  color: TE.ink, padding: "0 4px", outline: "none",
                  lineHeight: 1,
                }}
              />
            ) : done ? (
              <span
                onClick={(e) => { e.stopPropagation(); openEditor(); }}
                title="Click to type"
                style={{
                  ...ES.num,
                  fontSize: warmup ? 22 : 32,
                  color: warmup ? TE.ink3 : TE.ink,
                  lineHeight: 1,
                  fontStyle: warmup ? "italic" : "normal",
                  cursor: "text",
                }}
              >{rep}</span>
            ) : (
              <span
                onClick={(e) => { e.stopPropagation(); openEditor(); }}
                style={{ ...ES.num, fontSize: 24, color: TE.ink4, fontStyle: "italic", cursor: "text" }}
              >
                {isActive ? "—" : "·"}
              </span>
            )}
            {!editing && <span style={{ fontSize: 11, color: TE.ink3, fontStyle: "italic" }}>reps</span>}
          </div>
          <div style={{ marginTop: 4, ...ES.mono, fontSize: 10, color: TE.ink4, letterSpacing: "0.08em" }}>
            {warmup ? "WARM-UP" : `TARGET ${range}`}
            {lastRep != null && lastRep > 0 && ` · LAST ${lastRep}`}
          </div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <StepBtn onClick={(e) => { e.stopPropagation(); adjust(-1); }} disabled={rep <= 0}>−</StepBtn>
          <StepBtn onClick={(e) => { e.stopPropagation(); adjust(1); }}>+</StepBtn>
          {onRemove && (
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              title="Remove this set"
              style={{
                ...stepBtnBase,
                width: 28, height: 38,
                border: `1px solid ${TE.ink4}`,
                color: TE.ink4,
                fontSize: 16,
                lineHeight: 1,
              }}
            >×</button>
          )}
        </div>
      </div>

      {showWeightStepper && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, paddingLeft: 58, marginBottom: 10 }}>
          <span style={{ ...ES.mono, fontSize: 10, color: TE.ink3, letterSpacing: "0.1em" }}>LOAD</span>
          <button
            onClick={(e) => { e.stopPropagation(); onAdjustWeight(-1); }}
            style={inlineWeightBtn}
          >−</button>
          <span style={{ ...ES.num, fontSize: 16, minWidth: 60, textAlign: "center", color: TE.ink2 }}>
            {formatExerciseLoad(setWeight, unit)}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onAdjustWeight(1); }}
            style={inlineWeightBtn}
          >+</button>
        </div>
      )}

      {quickPicks.length > 0 && (
        <div style={{ display: "flex", gap: 18, paddingLeft: 58, marginBottom: 12, flexWrap: "wrap", alignItems: "baseline" }}>
          {quickPicks.map((v) => (
            <QuickPickNumber key={v} value={v} active={rep === v} onPick={onRep} />
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 2, paddingLeft: 58, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ ...ES.mono, fontSize: 10, color: TE.ink3, marginRight: 8, letterSpacing: "0.1em" }}>RPE</span>
        {RPE_OPTIONS.map(v => (
          <button
            key={v}
            onClick={(e) => { e.stopPropagation(); onRpe(rpe === v ? 0 : v); }}
            style={{
              width: 34, height: 28,
              background: rpe === v ? TE.ink : "transparent",
              color: rpe === v ? TE.bg : TE.ink3,
              border: `1px solid ${rpe === v ? TE.ink : TE.ink4}`,
              fontSize: 11, cursor: "pointer",
              fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600,
            }}
          >{v}</button>
        ))}
      </div>
    </div>
  );
}

function QuickPickNumber({ value, active, onPick }) {
  const [hover, setHover] = useState(false);
  const underline = active
    ? `2px solid ${TE.ink}`
    : hover
      ? `1px solid ${TE.ink3}`
      : "1px solid transparent";
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onPick(value); }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: "transparent",
        border: "none",
        padding: "2px 0 6px",
        cursor: "pointer",
        fontFamily: "'Fraunces', Georgia, serif",
        fontVariantNumeric: "tabular-nums",
        fontSize: active ? 20 : 17,
        fontWeight: active ? 600 : 400,
        color: active ? TE.ink : TE.ink3,
        borderBottom: underline,
        lineHeight: 1,
        transition: "font-size 80ms ease, color 120ms ease",
      }}
    >{value}</button>
  );
}

function buildQuickPicks(range) {
  const { min, max, type } = parseRepRange(range);

  if (type === "amrap" || min == null) {
    return [3, 5, 6, 8, 10, 12, 15];
  }

  const low = Math.max(1, min - 1);
  const high = (max ?? min) + 1;
  const picks = [];
  for (let v = low; v <= high; v += 1) picks.push(v);
  return picks;
}

const inlineWeightBtn = {
  width: 26, height: 26,
  border: `1px solid ${TE.ink4}`,
  background: "transparent",
  color: TE.ink2,
  fontSize: 14,
  cursor: "pointer",
  fontFamily: "'IBM Plex Mono', monospace",
  display: "flex", alignItems: "center", justifyContent: "center",
};

const stepBtnBase = {
  border: `1.5px solid ${TE.ink}`,
  background: "transparent",
  color: TE.ink,
  cursor: "pointer",
  fontFamily: "'IBM Plex Mono', monospace",
  display: "flex", alignItems: "center", justifyContent: "center",
};

function StepBtn({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...stepBtnBase,
        width: 38, height: 38,
        borderColor: disabled ? TE.ink4 : TE.ink,
        color: disabled ? TE.ink4 : TE.ink,
        fontSize: 20,
        cursor: disabled ? "default" : "pointer",
      }}
    >
      {children}
    </button>
  );
}
