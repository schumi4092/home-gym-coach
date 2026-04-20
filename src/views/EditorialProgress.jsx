import { useMemo, useState } from "react";
import { TE, ES, secondaryBtn } from "../constants/editorial-theme.js";
import { calcAvgRpe, estimate1RM } from "../utils/format.js";
import { buildWeeklyTrends, buildMonthlyTrends } from "../utils/trends.js";

export function EditorialProgress({ history, onExit, onEdit, onDelete }) {
  const exerciseNames = useMemo(
    () => [...new Set(history.flatMap((entry) => entry.exercises.map((exercise) => exercise.name)))].sort(),
    [history],
  );
  const [active, setActive] = useState(() => exerciseNames[0] ?? "");
  const [trendPeriod, setTrendPeriod] = useState("week");
  const trends = useMemo(
    () => trendPeriod === "week" ? buildWeeklyTrends(history) : buildMonthlyTrends(history),
    [history, trendPeriod],
  );
  const activeName = exerciseNames.includes(active) ? active : exerciseNames[0] ?? "";

  const data = useMemo(() => {
    if (!activeName) return [];
    return history
      .map((entry, sourceIndex) => {
        const exercise = entry.exercises.find((ex) => ex.name === activeName);
        if (!exercise) return null;
        const validReps = exercise.reps.filter((r, i) => r > 0 && !exercise.warmup?.[i]);
        if (validReps.length === 0) return null;
        const maxRep = Math.max(...validReps);
        const totalReps = validReps.reduce((sum, r) => sum + r, 0);
        const volume = exercise.weight > 0 ? exercise.weight * totalReps : totalReps;
        const workingRpes = (exercise.rpe || []).filter((_, i) => !exercise.warmup?.[i]);
        return {
          date: entry.date,
          weight: exercise.weight,
          unit: exercise.unit,
          sets: validReps,
          topReps: maxRep,
          rpe: calcAvgRpe(workingRpes),
          e1rm: estimate1RM(exercise.weight, maxRep),
          volume,
          sourceIndex,
        };
      })
      .filter(Boolean)
      .reverse();
  }, [activeName, history]);

  const dataWithPr = useMemo(() => {
    let bestScore = 0;
    return data.map((point) => {
      const score = (point.weight || 0) * point.topReps;
      const pr = score > bestScore;
      if (pr) bestScore = score;
      return { ...point, pr };
    });
  }, [data]);

  const latest = dataWithPr[dataWithPr.length - 1];
  const first = dataWithPr[0];
  const weightDelta = first && first.weight > 0
    ? (((latest.weight - first.weight) / first.weight) * 100).toFixed(0)
    : 0;

  if (exerciseNames.length === 0) {
    return (
      <div>
        <div style={{ marginBottom: 36 }}>
          <div style={{ ...ES.label, marginBottom: 8 }}>Archive</div>
          <h1 style={{ ...ES.num, fontSize: 56, margin: 0, letterSpacing: "-0.03em", lineHeight: 1, fontWeight: 500 }}>
            <em style={{ fontStyle: "italic", fontWeight: 400 }}>No records yet</em>
          </h1>
        </div>
        <p style={{ fontSize: 15, color: TE.ink3, lineHeight: 1.6, maxWidth: 420 }}>
          Finish a session to start building your archive.
        </p>
        <button onClick={onExit} style={{ ...secondaryBtn, marginTop: 24 }}>← Back to journal</button>
      </div>
    );
  }

  // chart geometry
  const W = 720, H = 260, PAD = { t: 30, r: 20, b: 40, l: 40 };
  const maxW = Math.max(2, ...dataWithPr.map((d) => d.weight)) + 2;
  const minW = Math.max(0, Math.min(...dataWithPr.map((d) => d.weight)) - 2);
  const denom = maxW - minW || 1;
  const xStep = dataWithPr.length > 1 ? (W - PAD.l - PAD.r) / (dataWithPr.length - 1) : 0;
  const yScale = (v) => PAD.t + (H - PAD.t - PAD.b) * (1 - (v - minW) / denom);
  const pts = dataWithPr.map((d, i) => ({ x: PAD.l + i * xStep, y: yScale(d.weight), d }));
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

  return (
    <div>
      {/* Overall trends */}
      <section style={{ marginBottom: 56 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
          <div>
            <div style={{ ...ES.label, marginBottom: 6 }}>Overview</div>
            <h2 style={{ ...ES.num, fontSize: 28, margin: 0, letterSpacing: "-0.02em", fontWeight: 500 }}>
              Training volume
            </h2>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {[{ id: "week", label: "Weekly" }, { id: "month", label: "Monthly" }].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setTrendPeriod(opt.id)}
                style={{
                  padding: "6px 14px", fontSize: 11,
                  background: trendPeriod === opt.id ? TE.ink : "transparent",
                  color: trendPeriod === opt.id ? TE.bg : TE.ink,
                  border: `1px solid ${TE.ink}`, cursor: "pointer",
                  fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase",
                }}
              >{opt.label}</button>
            ))}
          </div>
        </div>
        <TrendTable trends={trends} period={trendPeriod} />
      </section>

      {/* Masthead */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ ...ES.label, marginBottom: 8 }}>By exercise</div>
        <h1 style={{ ...ES.num, fontSize: 56, margin: 0, letterSpacing: "-0.03em", lineHeight: 1, fontWeight: 500 }}>
          <em style={{ fontStyle: "italic", fontWeight: 400 }}>{activeName}</em>
        </h1>
        <div style={{ ...ES.mono, fontSize: 11, color: TE.ink3, marginTop: 10, letterSpacing: "0.08em" }}>
          {dataWithPr.length} SESSIONS · TRACKED SINCE {first?.date ?? "—"}
        </div>
      </div>

      {/* Exercise selector */}
      <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${TE.rule}`, marginBottom: 36, overflowX: "auto" }}>
        {exerciseNames.map((name) => (
          <button
            key={name}
            onClick={() => setActive(name)}
            style={{
              padding: "12px 18px",
              background: "transparent",
              color: activeName === name ? TE.ink : TE.ink3,
              border: 0,
              borderBottom: `2px solid ${activeName === name ? TE.ink : "transparent"}`,
              marginBottom: -1,
              cursor: "pointer",
              fontFamily: "'Fraunces', serif", fontSize: 15,
              fontStyle: activeName === name ? "italic" : "normal",
              whiteSpace: "nowrap",
            }}
          >{name}</button>
        ))}
      </div>

      {/* Stats strip */}
      {latest && (
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
          padding: "24px 0", borderTop: `2px solid ${TE.rule}`, borderBottom: `1px solid ${TE.rule}`,
          marginBottom: 36,
        }}>
          <Stat
            label="Current"
            value={latest.weight > 0 ? latest.weight : "BW"}
            unit={latest.weight > 0 ? latest.unit : ""}
          />
          <Stat label="Top reps" value={latest.topReps} unit="reps" divider />
          <Stat
            label="Progress"
            value={weightDelta > 0 ? `+${weightDelta}%` : `${weightDelta}%`}
            unit={`vs ${first?.date ?? ""}`}
            divider
          />
          <Stat
            label="Last RPE"
            value={latest.rpe > 0 ? latest.rpe.toFixed(1) : "—"}
            unit={latest.rpe > 0 ? "avg" : ""}
            divider
          />
        </div>
      )}

      {/* Chart */}
      {dataWithPr.length > 1 && (
        <section style={{ marginBottom: 48 }}>
          <SectionHead kicker="Figure 1" title={`Working weight · ${dataWithPr.length} sessions`} />
          <div style={{ background: TE.surface, padding: "20px 10px 10px", border: `1px solid ${TE.rule}` }}>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
              {[minW, (minW + maxW) / 2, maxW].map((v, i) => (
                <g key={i}>
                  <line x1={PAD.l} x2={W - PAD.r} y1={yScale(v)} y2={yScale(v)} stroke={TE.ink4} strokeDasharray="2 4" strokeWidth="0.5" />
                  <text x={PAD.l - 8} y={yScale(v) + 4} textAnchor="end" fontSize="10" fontFamily="IBM Plex Mono" fill={TE.ink3}>
                    {v.toFixed(0)}
                  </text>
                </g>
              ))}
              <path d={path} fill="none" stroke={TE.ink} strokeWidth="1.5" />
              {pts.map((p, i) => (
                <g key={i}>
                  {p.d.pr && (
                    <circle cx={p.x} cy={p.y} r={12} fill="none" stroke={TE.accent} strokeWidth="1" />
                  )}
                  <circle cx={p.x} cy={p.y} r={p.d.pr ? 5 : 3.5} fill={p.d.pr ? TE.accent : TE.ink} />
                  {i % Math.max(1, Math.floor(pts.length / 6)) === 0 && (
                    <text x={p.x} y={H - PAD.b + 18} textAnchor="middle" fontSize="10" fontFamily="IBM Plex Mono" fill={TE.ink3}>
                      {p.d.date.slice(5)}
                    </text>
                  )}
                  {p.d.pr && (
                    <text x={p.x} y={p.y - 18} textAnchor="middle" fontSize="10" fontFamily="IBM Plex Mono" fill={TE.accent} fontWeight="600" letterSpacing="1">
                      PR
                    </text>
                  )}
                </g>
              ))}
            </svg>
          </div>
          <div style={{ ...ES.mono, fontSize: 10, color: TE.ink3, marginTop: 8, letterSpacing: "0.08em" }}>
            CIRCLED POINTS INDICATE PERSONAL RECORDS · Y-AXIS: WORKING WEIGHT
          </div>
        </section>
      )}

      {/* Session log table */}
      <section>
        <SectionHead kicker="Log" title="Session history" />
        <table style={{ width: "100%", borderCollapse: "collapse", ...ES.mono, fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${TE.rule}` }}>
              <Th>Date</Th>
              <Th align="right">Weight</Th>
              <Th>Sets</Th>
              <Th align="right">RPE</Th>
              <Th align="right">e1RM</Th>
              <Th align="right"></Th>
              <Th align="right"></Th>
            </tr>
          </thead>
          <tbody>
            {[...dataWithPr].reverse().map((r, i) => (
              <tr key={i} className="ed-row-hover" style={{ borderBottom: `1px solid ${TE.rule}` }}>
                <Td><span style={{ color: TE.ink3 }}>{r.date}</span></Td>
                <Td align="right">{r.weight > 0 ? `${r.weight} ${r.unit}` : "BW"}</Td>
                <Td><span style={ES.monoNum}>{r.sets.join(" · ")}</span></Td>
                <Td align="right">{r.rpe > 0 ? r.rpe.toFixed(1) : "—"}</Td>
                <Td align="right">{r.e1rm > 0 ? r.e1rm.toFixed(1) : "—"}</Td>
                <Td align="right">
                  {r.pr && <span style={{ color: TE.accent, fontWeight: 700, letterSpacing: "0.1em", fontSize: 10 }}>PR</span>}
                </Td>
                <Td align="right">
                  <button onClick={() => onEdit(r.sourceIndex)} style={rowAction}>edit</button>
                  <button onClick={() => onDelete(r.sourceIndex)} style={{ ...rowAction, color: TE.accent, marginLeft: 8 }}>del</button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <button onClick={onExit} style={{ ...secondaryBtn, marginTop: 36 }}>← Back to journal</button>
    </div>
  );
}

function TrendTable({ trends, period }) {
  if (trends.length === 0) {
    return (
      <div style={{ ...ES.mono, fontSize: 13, color: TE.ink3, padding: "16px 0", borderTop: `2px solid ${TE.rule}`, borderBottom: `1px solid ${TE.rule}` }}>
        Not enough data yet.
      </div>
    );
  }
  const maxVolume = Math.max(...trends.map((t) => t.volume), 1);
  const recent = trends.slice(-12);
  return (
    <div>
      <table style={{ width: "100%", borderCollapse: "collapse", ...ES.mono, fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${TE.rule}` }}>
            <Th>{period === "week" ? "Week of" : "Month"}</Th>
            <Th align="right">Sessions</Th>
            <Th align="right">Sets</Th>
            <Th align="right">Minutes</Th>
            <Th align="right">Volume</Th>
            <Th align="right">RPE</Th>
            <Th>{""}</Th>
          </tr>
        </thead>
        <tbody>
          {[...recent].reverse().map((t) => (
            <tr key={t.label} style={{ borderBottom: `1px solid ${TE.rule}` }}>
              <Td><span style={{ color: TE.ink3 }}>{t.label}</span></Td>
              <Td align="right">{t.sessions}</Td>
              <Td align="right">{t.sets}</Td>
              <Td align="right">{t.minutes}</Td>
              <Td align="right">{t.volume.toLocaleString()}</Td>
              <Td align="right">{t.avgRpe > 0 ? t.avgRpe.toFixed(1) : "—"}</Td>
              <Td>
                <div style={{
                  height: 4, background: TE.ink,
                  width: `${(t.volume / maxVolume) * 100}%`,
                  minWidth: t.volume > 0 ? 4 : 0,
                }} />
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ ...ES.mono, fontSize: 10, color: TE.ink3, marginTop: 8, letterSpacing: "0.08em" }}>
        BAR = VOLUME RELATIVE TO PEAK · LAST {recent.length} {period === "week" ? "WEEKS" : "MONTHS"}
      </div>
    </div>
  );
}

const rowAction = {
  background: "transparent", border: 0, cursor: "pointer",
  fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
  color: TE.ink3, letterSpacing: "0.08em", textTransform: "uppercase", padding: 0,
};

function Stat({ label, value, unit, divider }) {
  return (
    <div style={{ paddingLeft: divider ? 24 : 0, borderLeft: divider ? `1px solid ${TE.rule}` : 0 }}>
      <div style={{ ...ES.label, marginBottom: 8 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ ...ES.num, fontSize: 36, letterSpacing: "-0.02em", lineHeight: 1 }}>{value}</span>
        {unit && <span style={{ ...ES.mono, fontSize: 10, color: TE.ink3, letterSpacing: "0.08em" }}>{unit}</span>}
      </div>
    </div>
  );
}

function SectionHead({ kicker, title }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ ...ES.label, marginBottom: 6 }}>{kicker}</div>
      <h2 style={{ ...ES.num, fontSize: 24, margin: 0, letterSpacing: "-0.02em", fontWeight: 500 }}>{title}</h2>
    </div>
  );
}

function Th({ children, align }) {
  return <th style={{ textAlign: align || "left", padding: "10px 0", ...ES.label, fontSize: 10 }}>{children}</th>;
}
function Td({ children, align }) {
  return <td style={{ textAlign: align || "left", padding: "14px 0" }}>{children}</td>;
}
