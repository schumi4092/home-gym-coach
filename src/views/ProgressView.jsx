import { useMemo, useState } from "react";
import { T, panelStyle, pillButtonBaseStyle, softChipStyle, statCardStyle } from "../constants/theme.js";
import { calcAvgRpe, estimate1RM, getRpeColor } from "../utils/format.js";
import { VirtualList } from "../components/VirtualList.jsx";
import { buildWeeklyTrends, buildMonthlyTrends } from "../utils/trends.js";

export function ProgressView({ history, onBack, onDelete, isDesktop }) {
  const exerciseNames = useMemo(
    () => [...new Set(history.flatMap((entry) => entry.exercises.map((exercise) => exercise.name)))].sort(),
    [history],
  );
  const [selected, setSelected] = useState(exerciseNames[0] ?? "");
  const [chartMode, setChartMode] = useState("volume");
  const [trendPeriod, setTrendPeriod] = useState("week");

  const weeklyTrends = useMemo(() => buildWeeklyTrends(history), [history]);
  const monthlyTrends = useMemo(() => buildMonthlyTrends(history), [history]);
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

        const e1rm = estimate1RM(exercise.weight, maxRep);

        return { date: entry.date, weight: exercise.weight, unit: exercise.unit, totalReps, maxRep, volume, reps: exercise.reps, avgRpe, sourceIndex, e1rm };
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
  const best1RM = data.length > 0 ? Math.max(...data.map((item) => item.e1rm)) : 0;
  const latest1RM = data.at(-1)?.e1rm ?? 0;
  const max1RM = data.length > 0 ? Math.max(...data.map((item) => item.e1rm), 1) : 1;
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
            <button key={name} onClick={() => setSelected(name)} style={{ ...pillButtonBaseStyle, padding: "6px 14px", borderColor: selected === name ? `${T.accent}55` : T.border, background: selected === name ? T.accent : T.bg3, color: selected === name ? T.bg : T.t2, fontWeight: selected === name ? 700 : 500 }}>
              {name}
            </button>
          ))}
        </div>

        {data.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: T.t3, fontSize: 16 }}>這個動作還沒有足夠紀錄。</div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(4, minmax(0, 1fr))" : "1fr 1fr", gap: 10, marginBottom: 24 }}>
              {[
                { label: "最高重量", value: bestWeight > 0 ? `${bestWeight} kg` : "BW", sub: "PR" },
                { label: "最佳次數", value: `${bestRep} 下`, sub: "Best set" },
                { label: "總量變化", value: `${volumeChange >= 0 ? "+" : ""}${volumeChange}%`, sub: data.length > 1 ? `${data.length} 次紀錄` : "剛開始追蹤", color: volumeChange > 0 ? T.green : volumeChange < 0 ? T.red : T.t2 },
                { label: "預估 1RM", value: best1RM > 0 ? `${best1RM} kg` : "-", sub: latest1RM > 0 ? `最近 ${latest1RM} kg` : "Epley 公式", color: latest1RM >= best1RM && best1RM > 0 ? T.green : T.t1 },
              ].map((card) => (
                <div key={card.label} style={statCardStyle}>
                  <div style={{ fontSize: 12, color: T.t3, marginBottom: 6, fontWeight: 500 }}>{card.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: card.color || T.t1, fontVariantNumeric: "tabular-nums" }}>{card.value}</div>
                  <div style={{ fontSize: 12, color: T.t3, marginTop: 4 }}>{card.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "minmax(0, 1.15fr) minmax(340px, 0.85fr)" : "1fr", gap: 16, alignItems: "start" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  {[
                    { key: "volume", label: "訓練總量" },
                    { key: "e1rm", label: "預估 1RM" },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setChartMode(tab.key)}
                      style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", background: "none", border: "none", cursor: "pointer", padding: 0, color: chartMode === tab.key ? T.accent : T.t3, borderBottom: chartMode === tab.key ? `2px solid ${T.accent}` : "2px solid transparent", paddingBottom: 3 }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div style={{ ...panelStyle, padding: "16px 14px", marginBottom: isDesktop ? 0 : 24, minHeight: isDesktop ? 320 : "auto" }}>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: isDesktop ? 280 : 120, overflowX: "auto" }}>
                    {data.map((item, index) => {
                      const chartHeight = isDesktop ? 280 : 120;
                      const barAreaHeight = chartHeight - 52;
                      const isVolume = chartMode === "volume";
                      const chartValue = isVolume ? item.volume : item.e1rm;
                      const chartMax = isVolume ? maxVolume : max1RM;
                      const barHeight = chartMax > 0 ? Math.max((chartValue / chartMax) * barAreaHeight, 4) : 4;
                      const isLatest = index === data.length - 1;
                      return (
                        <div key={`${item.date}-${index}`} style={{ flex: "1 1 0", minWidth: 28, maxWidth: 56, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                          <div style={{ fontSize: 13, color: T.t2, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", overflow: "hidden", fontWeight: 500 }}>{Math.round(chartValue)}</div>
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
                {(() => {
                  const reversed = [...data].reverse();
                  const ITEM_H = isDesktop ? 108 : 118;
                  const MAX_H = isDesktop ? 640 : 480;
                  const needsVirtual = reversed.length > 8;

                  const renderRecord = (item, index) => (
                    <div key={`${item.date}-detail-${index}`} style={{ background: T.bg2, borderRadius: 12, padding: isDesktop ? "14px 16px" : "12px 14px", marginBottom: 8, minHeight: ITEM_H - 8, boxSizing: "border-box", border: `1px solid ${T.border}`, boxShadow: `inset 0 1px 0 ${T.borderLight}33` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: isDesktop ? "center" : "stretch", flexDirection: isDesktop ? "row" : "column", marginBottom: 10, gap: 8 }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 600, color: T.t1, fontVariantNumeric: "tabular-nums", lineHeight: 1.2 }}>{item.date}</div>
                          <div style={{ fontSize: 11, color: T.t3, marginTop: 4, letterSpacing: "0.08em" }}>RECENT SESSION</div>
                        </div>
                        <div style={{ display: "flex", alignItems: isDesktop ? "center" : "flex-start", justifyContent: "space-between", gap: 8, flexWrap: isDesktop ? "nowrap" : "wrap" }}>
                          <div style={{ display: "flex", gap: 8, fontSize: 13, color: T.t2, fontVariantNumeric: "tabular-nums", alignItems: "center", flexWrap: "wrap", justifyContent: isDesktop ? "flex-end" : "flex-start" }}>
                          <span style={{ ...softChipStyle, color: T.t1, background: T.bg3 }}>{item.weight > 0 ? `${item.weight} ${item.unit}` : "BW"}</span>
                          {item.avgRpe > 0 && <span style={{ ...softChipStyle, color: getRpeColor(item.avgRpe), background: `${getRpeColor(item.avgRpe)}12` }}>RPE {item.avgRpe}</span>}
                          </div>
                          {item.sourceIndex >= 0 && (
                            <button onClick={() => onDelete(item.sourceIndex)} style={{ fontSize: 13, padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer", background: T.bg3, color: T.red, flexShrink: 0 }}>
                              刪除
                            </button>
                          )}
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(item.reps.length, 1)}, minmax(0, 1fr))`, gap: 6 }}>
                        {item.reps.map((rep, repIndex) => (
                          <div key={repIndex} style={{ textAlign: "center", padding: "9px 0 7px", background: rep > 0 ? T.bg3 : T.bg, borderRadius: 8, minWidth: 0, border: `1px solid ${rep > 0 ? `${T.accent}22` : T.border}` }}>
                            <div style={{ fontSize: 16, fontWeight: 700, color: rep > 0 ? T.accent : T.t3, fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>{rep || "-"}</div>
                            <div style={{ fontSize: 11, color: T.t3, marginTop: 2, letterSpacing: "0.04em" }}>S{repIndex + 1}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );

                  if (needsVirtual) {
                    return (
                      <VirtualList
                        items={reversed}
                        itemHeight={ITEM_H}
                        maxHeight={MAX_H}
                        renderItem={renderRecord}
                      />
                    );
                  }

                  return reversed.map((item, index) => renderRecord(item, index));
                })()}
              </div>
            </div>
          </>
        )}
        {history.length >= 2 && (() => {
          const trends = trendPeriod === "week" ? weeklyTrends : monthlyTrends;
          const maxTrendVol = Math.max(1, ...trends.map((t) => t.volume));

          return (
            <div style={{ marginTop: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.accent, letterSpacing: "0.12em" }}>TRENDS</div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>整體趨勢</div>
                <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                  {[
                    { key: "week", label: "週" },
                    { key: "month", label: "月" },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setTrendPeriod(tab.key)}
                      style={{ ...pillButtonBaseStyle, fontSize: 13, padding: "5px 12px", borderColor: trendPeriod === tab.key ? `${T.accent}55` : T.border, background: trendPeriod === tab.key ? T.accent : T.bg3, color: trendPeriod === tab.key ? T.bg : T.t2, fontWeight: trendPeriod === tab.key ? 700 : 500 }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(4, minmax(0, 1fr))" : "1fr 1fr", gap: 10, marginBottom: 20 }}>
                {(() => {
                  const latest = trends.at(-1);
                  const prev = trends.at(-2);
                  if (!latest) return null;
                  const volChange = prev && prev.volume > 0 ? Math.round(((latest.volume - prev.volume) / prev.volume) * 100) : 0;
                  return [
                    { label: "訓練次數", value: `${latest.sessions} 次`, sub: trendPeriod === "week" ? latest.label : `${latest.label} 月` },
                    { label: "總訓練量", value: latest.volume.toLocaleString(), sub: volChange !== 0 ? `${volChange >= 0 ? "+" : ""}${volChange}% vs 前期` : "—" , color: volChange > 0 ? T.green : volChange < 0 ? T.red : T.t2 },
                    { label: "完成組數", value: `${latest.sets} 組`, sub: `${latest.minutes} 分鐘` },
                    { label: "平均 RPE", value: latest.avgRpe > 0 ? `${latest.avgRpe}` : "-", sub: "最近一期", color: latest.avgRpe >= 9 ? T.red : latest.avgRpe >= 8 ? T.amber : T.green },
                  ].map((card) => (
                    <div key={card.label} style={statCardStyle}>
                      <div style={{ fontSize: 12, color: T.t3, marginBottom: 6, fontWeight: 500 }}>{card.label}</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: card.color || T.t1, fontVariantNumeric: "tabular-nums" }}>{card.value}</div>
                      <div style={{ fontSize: 12, color: T.t3, marginTop: 4 }}>{card.sub}</div>
                    </div>
                  ));
                })()}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.t3, letterSpacing: "0.08em", marginBottom: 12 }}>
                    {trendPeriod === "week" ? "每週" : "每月"}訓練量
                  </div>
                  <div style={{ ...panelStyle, padding: "16px 14px" }}>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: isDesktop ? 200 : 120, overflowX: "auto" }}>
                      {trends.map((t, index) => {
                        const chartH = isDesktop ? 200 : 120;
                        const barArea = chartH - 52;
                        const barH = Math.max((t.volume / maxTrendVol) * barArea, 4);
                        const isLatest = index === trends.length - 1;
                        return (
                          <div key={t.label} style={{ flex: "1 1 0", minWidth: 36, maxWidth: 64, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                            <div style={{ fontSize: 12, color: T.t2, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", fontWeight: 500 }}>{t.volume > 999 ? `${(t.volume / 1000).toFixed(1)}k` : t.volume}</div>
                            <div style={{ width: "100%", maxWidth: isDesktop ? 36 : 28, height: barH, borderRadius: 4, background: isLatest ? T.accent : `${T.accent}40`, transition: "height 0.3s" }} />
                            <div style={{ fontSize: 11, color: T.t3, whiteSpace: "nowrap" }}>{trendPeriod === "week" ? t.label.slice(5) : t.label.slice(5) + "月"}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.t3, letterSpacing: "0.08em", marginBottom: 12 }}>
                    {trendPeriod === "week" ? "每週" : "每月"}頻率 & RPE
                  </div>
                  <div style={{ ...panelStyle, padding: "16px 14px" }}>
                    {trends.map((t, index) => (
                      <div key={t.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: index < trends.length - 1 ? `1px solid ${T.border}` : "none" }}>
                        <div style={{ fontSize: 13, color: T.t3, minWidth: 56, fontVariantNumeric: "tabular-nums" }}>{trendPeriod === "week" ? t.label.slice(5) : t.label}</div>
                        <div style={{ flex: 1, height: 6, background: T.bg3, borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ height: "100%", borderRadius: 3, background: T.accent, width: `${Math.min(100, (t.sessions / (trendPeriod === "week" ? 5 : 20)) * 100)}%`, transition: "width 0.3s" }} />
                        </div>
                        <div style={{ fontSize: 13, color: T.t1, fontWeight: 600, minWidth: 28, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{t.sessions}次</div>
                        <div style={{ fontSize: 13, color: t.avgRpe >= 9 ? T.red : t.avgRpe >= 8 ? T.amber : T.green, minWidth: 32, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                          {t.avgRpe > 0 ? t.avgRpe : "-"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
