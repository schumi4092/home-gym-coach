import { T } from "../constants/theme.js";
import { RPE_OPTIONS } from "../constants/defaults.js";
import { calculateRepMax } from "../utils/workout.js";
import { getRpeColor } from "../utils/format.js";
import { SliderRep } from "./SliderRep.jsx";

export function SetRow({ index, rep, rpe, onRep, onRpe, range }) {
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
              style={{ width: 38, height: 28, fontSize: 12, fontWeight: 600, borderRadius: 6, cursor: "pointer", border: active ? "none" : `1px solid ${T.border}`, background: active ? color : "transparent", color: active ? T.bg : T.t3, transition: "all 0.12s", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              {value}
            </button>
          );
        })}
      </div>
    </div>
  );
}
