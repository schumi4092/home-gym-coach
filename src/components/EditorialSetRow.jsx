import { TE, ES } from "../constants/editorial-theme.js";
import { RPE_OPTIONS } from "../constants/defaults.js";

export function EditorialSetRow({
  index,
  rep,
  rpe,
  warmup,
  onRep,
  onRpe,
  onToggleWarmup,
  range,
  isActive,
  lastRep,
  onFocus,
}) {
  const done = rep > 0;

  const adjust = (delta) => {
    const next = Math.max(0, rep + delta);
    onRep(next);
  };

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
            {done ? (
              <>
                <span style={{
                  ...ES.num,
                  fontSize: warmup ? 22 : 32,
                  color: warmup ? TE.ink3 : TE.ink,
                  lineHeight: 1,
                  fontStyle: warmup ? "italic" : "normal",
                }}>{rep}</span>
                <span style={{ fontSize: 11, color: TE.ink3, fontStyle: "italic" }}>reps</span>
              </>
            ) : (
              <span style={{ ...ES.num, fontSize: 24, color: TE.ink4, fontStyle: "italic" }}>
                {isActive ? "—" : "·"}
              </span>
            )}
          </div>
          <div style={{ marginTop: 4, ...ES.mono, fontSize: 10, color: TE.ink4, letterSpacing: "0.08em" }}>
            {warmup ? "WARM-UP" : `TARGET ${range}`}
            {lastRep != null && lastRep > 0 && ` · LAST ${lastRep}`}
          </div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleWarmup?.(); }}
            title="Toggle warm-up"
            style={{
              ...stepBtnBase,
              width: 38, height: 38,
              background: warmup ? TE.ink : "transparent",
              color: warmup ? TE.bg : TE.ink3,
              borderColor: warmup ? TE.ink : TE.ink4,
              fontSize: 11, letterSpacing: "0.08em",
            }}
          >W</button>
          <StepBtn onClick={(e) => { e.stopPropagation(); adjust(-1); }} disabled={rep <= 0}>−</StepBtn>
          <StepBtn onClick={(e) => { e.stopPropagation(); adjust(1); }}>+</StepBtn>
        </div>
      </div>
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
