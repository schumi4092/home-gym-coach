import { useMemo, useState } from "react";
import { T } from "../constants/theme.js";
import { calcAvgRpe, getRpeColor } from "../utils/format.js";

export function ProgressView({ history, onBack, onDelete, isDesktop }) {
  const exerciseNames = useMemo(
    () => [...new Set(history.flatMap((entry) => entry.exercises.map((exercise) => exercise.name)))].sort(),
    [history],
  );
  const [selected, setSelected] = useState(exerciseNames[0] ?? "");
  const activeSelected = exerciseNames.includes(selected) ? selected : (exerciseNames[0] ?? "");

  const data = useMemo(() => {
    return history
      .map((entry, sourceIndex) => {
        const exercise = entry.exercises.find((item) => item.name === activeSelected);
        if (!exercise) return null;

        const validReps = exercise.reps.filter((rep) => rep > 0);
        const totalReps = validReps.reduce((sum, rep) => sum + rep, 0);
        const maxRep = validReps.length > 0 ? Math.max(...validReps) : 0;
        const volume = exercise.weight > 0 ? exercise.weight * totalReps : totalReps;
        const avgRpe = calcAvgRpe(exercise.rpe);

        return { date: entry.date, weight: exercise.weight, unit: exercise.unit, totalReps, maxRep, volume, reps: exercise.reps, avgRpe, sourceIndex };
      })
      .filter(Boolean)
      .reverse();
  }, [activeSelected, history]);

  const maxVolume = data.length > 0 ? Math.max(...data.map((item) => item.volume)) : 1;
  const bestWeight = data.length > 0 ? Math.max(...data.map((item) => item.weight)) : 0;
  const bestRep = data.length > 0 ? Math.max(...data.map((item) => item.maxRep)) : 0;
  const firstVolume = data[0]?.volume ?? 0;
  const latestVolume = data.at(-1)?.volume ?? 0;
  const volumeChange = firstVolume > 0 ? Math.round(((latestVolume - firstVolume) / firstVolume) * 100) : 0;

  return (
    <div style={{ background: T.bg, minHeight: "100vh", padding: isDesktop ? "28px 28px 40px" : "20px 16px", color: T.t1 }}>
      <div style={{ maxWidth: isDesktop ? 1180 : 500, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <button onClick={onBack} style={{ width: 32, height: 32, borderRadius: 8, background: T.bg3, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 14 14">
              <path d="M9 2L4 7L9 12" fill="none" stroke={T.t2} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.accent, letterSpacing: "0.12em", marginBottom: 2 }}>PROGRESS</div>
            <div style={{ fontSize: 20, fontWeight: 600 }}>訓練進度</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24 }}>
          {exerciseNames.map((name) => (
            <button key={name} onClick={() => setSelected(name)} style={{ fontSize: 14, padding: "6px 14px", borderRadius: 6, cursor: "pointer", border: "none", background: selected === name ? T.accent : T.bg3, color: selected === name ? T.bg : T.t2, fontWeight: selected === name ? 600 : 400, transition: "all 0.15s" }}>
              {name}
            </button>
          ))}
        </div>

        {data.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: T.t3, fontSize: 16 }}>這個動作還沒有足夠紀錄。</div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(3, minmax(0, 1fr))" : "1fr 1fr 1fr", gap: 8, marginBottom: 24 }}>
              {[
                { label: "最高重量", value: bestWeight > 0 ? `${bestWeight} kg` : "BW", sub: "PR" },
                { label: "最佳次數", value: `${bestRep} 下`, sub: "Best set" },
                { label: "總量變化", value: `${volumeChange >= 0 ? "+" : ""}${volumeChange}%`, sub: data.length > 1 ? `${data.length} 次紀錄` : "剛開始追蹤", color: volumeChange > 0 ? T.green : volumeChange < 0 ? T.red : T.t2 },
              ].map((card) => (
                <div key={card.label} style={{ background: T.bg2, borderRadius: 10, padding: "14px 12px", textAlign: "center" }}>
                  <div style={{ fontSize: 12, color: T.t3, marginBottom: 6, fontWeight: 500 }}>{card.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: card.color || T.t1, fontVariantNumeric: "tabular-nums" }}>{card.value}</div>
                  <div style={{ fontSize: 12, color: T.t3, marginTop: 4 }}>{card.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "minmax(0, 1.15fr) minmax(340px, 0.85fr)" : "1fr", gap: 16, alignItems: "start" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.t3, letterSpacing: "0.08em", marginBottom: 12 }}>訓練總量</div>
                <div style={{ background: T.bg2, borderRadius: 12, padding: "16px 14px", marginBottom: isDesktop ? 0 : 24, minHeight: isDesktop ? 320 : "auto" }}>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: isDesktop ? 280 : 120, overflowX: "auto" }}>
                    {data.map((item, index) => {
                      const chartHeight = isDesktop ? 280 : 120;
                      const barAreaHeight = chartHeight - 52;
                      const barHeight = maxVolume > 0 ? Math.max((item.volume / maxVolume) * barAreaHeight, 4) : 4;
                      const isLatest = index === data.length - 1;
                      return (
                        <div key={`${item.date}-${index}`} style={{ flex: "1 1 0", minWidth: 28, maxWidth: 56, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                          <div style={{ fontSize: 13, color: T.t2, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", overflow: "hidden", fontWeight: 500 }}>{Math.round(item.volume)}</div>
                          <div style={{ width: "100%", maxWidth: isDesktop ? 36 : 28, height: barHeight, borderRadius: 4, background: isLatest ? T.accent : `${T.accent}40`, transition: "height 0.3s" }} />
                          <div style={{ fontSize: 13, color: T.t3, whiteSpace: "nowrap" }}>{item.date.slice(5)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.t3, letterSpacing: "0.08em", marginBottom: 12 }}>最近紀錄</div>
                {[...data].reverse().map((item, index) => (
                  <div key={`${item.date}-detail-${index}`} style={{ background: T.bg2, borderRadius: 10, padding: "12px 14px", marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, gap: 8 }}>
                      <div style={{ fontSize: 15, fontWeight: 500, color: T.t1 }}>{item.date}</div>
                      <div style={{ display: "flex", gap: 8, fontSize: 14, color: T.t2, fontVariantNumeric: "tabular-nums", alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                        <span style={{ fontWeight: 600, color: T.t1 }}>{item.weight > 0 ? `${item.weight} ${item.unit}` : "BW"}</span>
                        {item.avgRpe > 0 && <span style={{ color: getRpeColor(item.avgRpe) }}>RPE {item.avgRpe}</span>}
                        {item.sourceIndex >= 0 && (
                          <button onClick={() => onDelete(item.sourceIndex)} style={{ fontSize: 13, padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer", background: T.bg3, color: T.red }}>
                            刪除
                          </button>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {item.reps.map((rep, repIndex) => (
                        <div key={repIndex} style={{ flex: 1, textAlign: "center", padding: "6px 0", background: rep > 0 ? T.bg3 : T.bg, borderRadius: 6 }}>
                          <div style={{ fontSize: 16, fontWeight: 600, color: rep > 0 ? T.accent : T.t3, fontVariantNumeric: "tabular-nums" }}>{rep || "-"}</div>
                          <div style={{ fontSize: 11, color: T.t3 }}>S{repIndex + 1}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
