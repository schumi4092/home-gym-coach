import { TE, ES, primaryBtn, secondaryBtn } from "../constants/editorial-theme.js";
import { TRAINING_FLOW } from "../constants/defaults.js";
import { calcAvgRpe, getDaysSinceLocalDate } from "../utils/format.js";

export function EditorialHome({
  stats,
  history,
  programs,
  today,
  deloadSuggestion,
  onStart,
  onProgress,
  onEditProgram,
  onEditHistory,
  onDeleteHistory,
  onExportMarkdown,
  onExportBackup,
  onImportClick,
  importRef,
  onImportChange,
  exportCopied,
  importStatus,
}) {
  const {
    nextProgramId,
    nextProgram,
    recentEntry,
    lastSameProgram,
    weeklySessions,
    weeklyMinutes,
    weeklySets,
    recentAvgRpe,
    lastSameProgramDate,
    estimatedMinutes,
    bestSet,
    recoveryByProgram,
  } = stats;

  const dateLine = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const recent = history.slice(0, 6);

  return (
    <div>
      {/* Tool strip */}
      <div style={{ display: "flex", gap: 6, marginBottom: 28, flexWrap: "wrap", justifyContent: "flex-end" }}>
        <button onClick={onEditProgram} style={{ ...secondaryBtn, fontSize: 11, padding: "8px 14px" }}>
          Edit program
        </button>
        {history.length > 0 && (
          <>
            <button
              onClick={onExportMarkdown}
              style={{
                ...secondaryBtn, fontSize: 11, padding: "8px 14px",
                background: exportCopied ? TE.ink : "transparent",
                color: exportCopied ? TE.bg : TE.ink,
              }}
            >
              {exportCopied ? "Copied MD" : "Export MD"}
            </button>
            <button onClick={onExportBackup} style={{ ...secondaryBtn, fontSize: 11, padding: "8px 14px" }}>
              Export backup
            </button>
          </>
        )}
        <button
          onClick={onImportClick}
          style={{
            ...secondaryBtn, fontSize: 11, padding: "8px 14px",
            background: importStatus === "ok" ? TE.ink : "transparent",
            color: importStatus === "ok" ? TE.bg : importStatus === "error" ? TE.accent : TE.ink,
            borderColor: importStatus === "error" ? TE.accent : TE.ink,
          }}
        >
          {importStatus === "ok" ? "Imported" : importStatus === "error" ? "Import failed" : "Import backup"}
        </button>
        <input
          ref={importRef}
          type="file"
          accept=".json"
          style={{ display: "none" }}
          onChange={onImportChange}
        />
      </div>

      {/* Masthead */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ ...ES.mono, fontSize: 11, color: TE.ink3, letterSpacing: "0.15em", marginBottom: 8 }}>
          {dateLine.toUpperCase()} · ISSUE №{history.length + 1}
        </div>
        <h1 style={{
          ...ES.num, fontSize: 96, lineHeight: 0.95, letterSpacing: "-0.04em",
          margin: 0, fontWeight: 400,
        }}>
          Next up:<br />
          <em style={{ fontStyle: "italic", fontWeight: 400 }}>{nextProgram?.day ?? "—"}</em>
        </h1>
        <div style={{ display: "flex", gap: 16, marginTop: 32, alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => onStart(nextProgramId)}
            disabled={!nextProgram}
            style={{ ...primaryBtn, fontSize: 14, padding: "16px 32px", opacity: nextProgram ? 1 : 0.4 }}
          >
            Begin session →
          </button>
          <span style={{ ...ES.mono, fontSize: 11, color: TE.ink3, letterSpacing: "0.08em" }}>
            {nextProgram ? `${nextProgram.exercises.length} exercises · est. ${estimatedMinutes} min` : "No program"}
            {lastSameProgramDate !== null && ` · last done ${lastSameProgramDate}d ago`}
          </span>
        </div>
      </div>

      {/* Deload suggestion */}
      {deloadSuggestion && (
        <div style={{
          marginBottom: 36,
          padding: "18px 20px",
          background: TE.surface,
          borderLeft: `3px solid ${deloadSuggestion.level === "warning" ? TE.accent : TE.ink3}`,
        }}>
          <div style={{ ...ES.label, color: deloadSuggestion.level === "warning" ? TE.accent : TE.ink3, marginBottom: 8 }}>
            {deloadSuggestion.level === "warning" ? "Deload advised" : "Fatigue notice"}
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, color: TE.ink }}>
            {deloadSuggestion.headline}
          </div>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: TE.ink2 }}>{deloadSuggestion.detail}</p>
        </div>
      )}

      {/* Metric strip */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0,
        padding: "28px 0", borderTop: `2px solid ${TE.rule}`, borderBottom: `1px solid ${TE.rule}`,
        marginBottom: 40,
      }}>
        <Metric label="This week" value={weeklySessions} unit={weeklySessions === 1 ? "session" : "sessions"} />
        <Metric label="Minutes · this week" value={weeklyMinutes} unit="min" divider />
        <Metric
          label="Best recent set"
          value={bestSet ? (bestSet.weight > 0 ? `${bestSet.weight}${bestSet.unit}` : "BW") : "—"}
          unit={bestSet ? `× ${bestSet.reps}` : ""}
          divider
        />
      </div>

      {/* Two-column: Recent log + Upcoming */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 48 }}>
        <section>
          <SectionHead kicker="Record" title="Recent sessions" />
          {recent.length === 0 ? (
            <div style={{ ...ES.mono, fontSize: 13, color: TE.ink3, padding: "16px 0" }}>
              No sessions logged yet.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", ...ES.mono, fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${TE.rule}` }}>
                  <Th>Date</Th><Th>Type</Th><Th align="right">Ex.</Th><Th align="right">Min</Th><Th align="right">RPE</Th><Th align="right"></Th>
                </tr>
              </thead>
              <tbody>
                {recent.map((entry, index) => {
                  const avgRpe = calcAvgRpe(
                    entry.exercises.flatMap((exercise) => (exercise.rpe || []).filter((_, i) => !exercise.warmup?.[i])),
                  );
                  const completed = entry.exercises.filter((e) => e.reps.some((r, i) => r > 0 && !e.warmup?.[i])).length;
                  return (
                    <tr key={`${entry.date}-${index}`} className="ed-row-hover" style={{ borderBottom: `1px solid ${TE.rule}` }}>
                      <Td>
                        <span style={{ color: TE.ink3 }}>{entry.date}</span>
                      </Td>
                      <Td>
                        <span style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontStyle: "italic" }}>{entry.day}</span>
                      </Td>
                      <Td align="right">{completed}/{entry.exercises.length}</Td>
                      <Td align="right">{entry.duration > 0 ? entry.duration : "—"}</Td>
                      <Td align="right">{avgRpe > 0 ? avgRpe.toFixed(1) : "—"}</Td>
                      <Td align="right">
                        <button
                          onClick={() => onEditHistory(index)}
                          style={editLink}
                        >edit</button>
                        <button
                          onClick={() => onDeleteHistory(index)}
                          style={{ ...editLink, color: TE.accent, marginLeft: 8 }}
                        >del</button>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {history.length > 0 && (
            <button onClick={onProgress} style={{ ...secondaryBtn, marginTop: 20, fontSize: 11 }}>
              View full archive →
            </button>
          )}
        </section>

        <aside>
          <SectionHead kicker="Up next" title="This week" />
          <WeekGrid history={history} today={today} nextProgramId={nextProgramId} onStart={onStart} />

          <div style={{ marginTop: 32 }}>
            <div style={{ ...ES.label, marginBottom: 12 }}>Recovery</div>
            {recoveryByProgram.map((program) => (
              <RecoveryRow key={program.id} label={program.label} state={program.state} />
            ))}
          </div>

          {recentEntry && (
            <div style={{ marginTop: 32, padding: 20, background: TE.surface, borderLeft: `3px solid ${TE.accent}` }}>
              <div style={{ ...ES.label, color: TE.accent, marginBottom: 8 }}>Last session</div>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, fontStyle: "italic", color: TE.ink2 }}>
                {recentEntry.day} · {recentEntry.duration} min
                {recentAvgRpe > 0 && ` · avg RPE ${recentAvgRpe.toFixed(1)}`}
              </p>
              {lastSameProgram && (
                <p style={{ margin: "6px 0 0", fontSize: 12, color: TE.ink3, ...ES.mono, letterSpacing: "0.06em" }}>
                  SAME PROGRAM · {lastSameProgramDate}d AGO
                </p>
              )}
            </div>
          )}
        </aside>
      </div>

      {/* Quick start program grid */}
      <section style={{ marginTop: 56 }}>
        <SectionHead kicker="Library" title="Quick start" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 0, borderTop: `1px solid ${TE.rule}` }}>
          {programs.map((program) => {
            const isNext = program.id === nextProgramId;
            return (
              <div
                key={program.id}
                onClick={() => onStart(program.id)}
                className="ed-row-hover"
                style={{
                  padding: "20px 16px",
                  borderBottom: `1px solid ${TE.rule}`,
                  borderRight: `1px solid ${TE.rule}`,
                  cursor: "pointer",
                  background: isNext ? TE.highlight : "transparent",
                }}
              >
                <div style={{ ...ES.mono, fontSize: 10, color: TE.ink3, letterSpacing: "0.12em", marginBottom: 8 }}>
                  {program.tag}{isNext && " · NEXT"}
                </div>
                <div style={{ ...ES.num, fontSize: 20, letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: 4 }}>
                  {program.day}
                </div>
                <div style={{ fontSize: 13, color: TE.ink3, fontStyle: "italic" }}>
                  {program.subtitle} · {program.exercises.length} ex.
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

const editLink = {
  background: "transparent", border: 0, cursor: "pointer",
  fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
  color: TE.ink3, letterSpacing: "0.08em", textTransform: "uppercase", padding: 0,
};

function Metric({ label, value, unit, divider }) {
  return (
    <div style={{ paddingLeft: divider ? 32 : 0, borderLeft: divider ? `1px solid ${TE.rule}` : 0 }}>
      <div style={{ ...ES.label, marginBottom: 10 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ ...ES.num, fontSize: 56, lineHeight: 1, letterSpacing: "-0.03em" }}>{value}</span>
        {unit && <span style={{ ...ES.mono, fontSize: 11, color: TE.ink3, letterSpacing: "0.08em" }}>{unit}</span>}
      </div>
    </div>
  );
}

function SectionHead({ kicker, title }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ ...ES.label, marginBottom: 6 }}>{kicker}</div>
      <h2 style={{ ...ES.num, fontSize: 28, margin: 0, letterSpacing: "-0.02em", fontWeight: 500 }}>{title}</h2>
    </div>
  );
}

function Th({ children, align }) {
  return <th style={{ textAlign: align || "left", padding: "10px 0", ...ES.label, fontSize: 10 }}>{children}</th>;
}
function Td({ children, align }) {
  return <td style={{ textAlign: align || "left", padding: "14px 0" }}>{children}</td>;
}

function RecoveryRow({ label, state }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "8px 0", borderBottom: `1px solid ${TE.rule}` }}>
      <span style={{ fontFamily: "'Fraunces', serif", fontSize: 15 }}>{label}</span>
      <span style={{ ...ES.mono, fontSize: 11, letterSpacing: "0.08em", color: TE.ink }}>
        {state.label}
      </span>
    </div>
  );
}

function WeekGrid({ history, today, nextProgramId, onStart }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0, borderTop: `1px solid ${TE.rule}`, borderBottom: `1px solid ${TE.rule}` }}>
      {TRAINING_FLOW.map((day, i) => {
        const isRest = day.type === "rest";
        const isNext = day.type === nextProgramId;
        const lastDone = !isRest ? history.find((entry) => entry.dayId === day.type) : null;
        const daysAgo = lastDone ? getDaysSinceLocalDate(lastDone.date, today) : null;

        return (
          <div
            key={`${day.label}-${i}`}
            onClick={() => { if (!isRest) onStart(day.type); }}
            style={{
              padding: "14px 4px", textAlign: "center",
              borderRight: i < 6 ? `1px solid ${TE.rule}` : 0,
              background: isNext ? TE.highlight : "transparent",
              cursor: isRest ? "default" : "pointer",
            }}
          >
            <div style={{ ...ES.label, fontSize: 10, color: TE.ink3 }}>{day.short}</div>
            <div style={{
              ...ES.num, fontSize: 13, marginTop: 4,
              color: isRest ? TE.ink4 : TE.ink,
              fontStyle: isNext ? "italic" : "normal",
            }}>
              {daysAgo === null && !isRest ? "—" : daysAgo === 0 ? "today" : daysAgo !== null ? `${daysAgo}d` : "·"}
            </div>
          </div>
        );
      })}
    </div>
  );
}
