import { useState } from "react";
import { T } from "../constants/theme.js";
import { calcAvgRpe, formatExerciseLoad, getRpeColor } from "../utils/format.js";
import { getAdjustedWeight, getDefaultStep, getRestSeconds } from "../utils/workout.js";
import { createCoachingHint } from "../utils/coaching.js";
import { Timer } from "./Timer.jsx";
import { SetRow } from "./SetRow.jsx";

export function ExerciseCard({ exercise, index, onRep, onWeight, onRpe, onStepChange, number, historyHint }) {
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
    <div style={{ borderRadius: 12, marginBottom: 6, overflow: "hidden", transition: "all 0.2s", background: open ? T.bg2 : "transparent", border: `0.5px solid ${open ? T.borderLight : "transparent"}` }}>
      <div onClick={() => setOpen((current) => !current)} style={{ padding: "16px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, userSelect: "none" }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, background: allDone ? T.accent : T.bg3, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: allDone ? T.bg : T.t3, transition: "all 0.3s" }}>
          {allDone ? (
            <svg width="14" height="14" viewBox="0 0 14 14">
              <path d="M2.5 7.5L5.5 10.5L11.5 3.5" fill="none" stroke={T.bg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : number}
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
          <div style={{ fontSize: 14, color: T.t1, padding: "10px 12px", lineHeight: 1.6, background: T.bg3, borderRadius: 8, marginBottom: 12, borderLeft: `2px solid ${T.accent}` }}>
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
            <div style={{ fontSize: 14, color: T.t2, padding: "10px 12px", lineHeight: 1.6, background: T.bg3, borderRadius: 8, marginBottom: 12, borderLeft: `2px solid ${T.accent}40` }}>
              <div style={{ color: T.t3, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 4 }}>COACH NOTE</div>
              {exercise.note}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: T.t3, fontWeight: 500 }}>重量</span>
            <div style={{ display: "inline-flex", alignItems: "center", borderRadius: 8, overflow: "hidden", border: `0.5px solid ${T.border}` }}>
              <button onClick={() => onWeight(index, getAdjustedWeight(exercise.weight, exercise.step ?? getDefaultStep(exercise.unit), -1))} style={{ width: 32, height: 30, border: "none", background: T.bg3, color: T.t2, fontSize: 17, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>-</button>
              <div style={{ minWidth: 56, height: 30, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: T.t1, background: T.bg2, padding: "0 4px" }}>
                {exercise.weight > 0 ? `${exercise.weight} ${exercise.unit}` : "BW"}
              </div>
              <button onClick={() => onWeight(index, getAdjustedWeight(exercise.weight, exercise.step ?? getDefaultStep(exercise.unit), 1))} style={{ width: 32, height: 30, border: "none", background: T.bg3, color: T.t2, fontSize: 17, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
            </div>
            {exercise.unit === "kg" && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 13, color: T.t3, fontWeight: 500 }}>步進</span>
                <select value={String(exercise.step ?? 1)} onChange={(event) => onStepChange(index, Number(event.target.value))} style={{ height: 30, borderRadius: 8, border: `0.5px solid ${T.border}`, background: T.bg3, color: T.t1, padding: "0 8px", fontSize: 14 }}>
                  {[1, 0.5, 0.25, 0.125].map((step) => (
                    <option key={step} value={step}>{step} kg</option>
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
