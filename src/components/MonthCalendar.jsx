import { TE, ES } from "../constants/editorial-theme.js";
import { formatLocalDate, parseLocalDate } from "../utils/format.js";
import { useMemo, useState } from "react";

// Month calendar — "stamp sheet" treatment.
// Each day is a perforated stamp card; trained days get a circular postmark
// in the program's accent color. Two-session days stack a second smaller
// postmark. Today gets a corner ribbon. Out-of-month cells render blank.
export function MonthCalendar({ history, today, programs, onEditHistory, onAddHistory }) {
  const [pickerDate, setPickerDate] = useState(null);
  const year = today.getFullYear();
  const month = today.getMonth();
  const monthLabel = today.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const programById = useMemo(
    () => Object.fromEntries(programs.map((p) => [p.id, p])),
    [programs],
  );

  const { cells, daysInMonth, trainedCount } = useMemo(() => {
    const firstDow = new Date(year, month, 1).getDay();
    const offset = (firstDow + 6) % 7; // Monday-first
    const days = new Date(year, month + 1, 0).getDate();

    const trainedMap = {};
    history.forEach((entry, idx) => {
      const d = parseLocalDate(entry.date);
      if (!d) return;
      if (d.getFullYear() !== year || d.getMonth() !== month) return;
      (trainedMap[d.getDate()] ??= []).push({ entry, index: idx });
    });

    const list = [];
    for (let i = 0; i < offset; i++) list.push({ kind: "empty", key: `pre-${i}` });
    for (let d = 1; d <= days; d++) {
      const records = trainedMap[d] || [];
      const tags = Array.from(
        new Map(
          records
            .map((r) => programById[r.entry.dayId])
            .filter(Boolean)
            .map((p) => [p.id, p]),
        ).values(),
      );
      const dow = ((offset + d - 1) % 7);
      list.push({
        kind: "day",
        key: `d-${d}`,
        day: d,
        records,
        tags,
        isToday: d === today.getDate(),
        isFuture: d > today.getDate(),
        isWeekend: dow >= 5,
      });
    }
    while (list.length % 7 !== 0) list.push({ kind: "empty", key: `post-${list.length}` });

    return {
      cells: list,
      daysInMonth: days,
      trainedCount: Object.keys(trainedMap).length,
    };
  }, [history, year, month, programById, today]);

  const dows = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  const handleAdd = (programId) => {
    if (pickerDate && typeof onAddHistory === "function") {
      onAddHistory(pickerDate, programId);
    }
    setPickerDate(null);
  };

  return (
    <section style={{ maxWidth: 540, width: "100%", justifySelf: "end" }}>
      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-end",
        marginBottom: 20, paddingBottom: 12, borderBottom: `2px solid ${TE.rule}`,
        gap: 12, flexWrap: "wrap",
      }}>
        <div>
          <div style={{ ...ES.label, marginBottom: 6 }}>
            Stamp sheet · {monthLabel.toUpperCase()}
          </div>
          <h2 style={{ ...ES.num, fontSize: 26, margin: 0, letterSpacing: "-0.02em", lineHeight: 1, fontWeight: 500 }}>
            <em style={{ fontStyle: "italic" }}>{trainedCount}</em>
            <span style={{ ...ES.mono, fontSize: 13, color: TE.ink3, marginLeft: 8 }}>
              stamps cancelled
            </span>
          </h2>
        </div>
        <div style={{ ...ES.mono, fontSize: 10, color: TE.ink3, letterSpacing: "0.14em", textAlign: "right" }}>
          {trainedCount}/{daysInMonth} TRAINED<br />
          POSTMARK = SESSION
        </div>
      </div>

      {/* DOW header */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0, marginBottom: 8 }}>
        {dows.map((d, i) => (
          <div key={d} style={{
            ...ES.mono, fontSize: 9, color: i >= 5 ? TE.ink4 : TE.ink3,
            letterSpacing: "0.16em", padding: "6px 0", textAlign: "center",
          }}>{d}</div>
        ))}
      </div>

      {/* Stamp grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
        {cells.map((cell) => {
          if (cell.kind === "empty") {
            return <div key={cell.key} style={{ aspectRatio: "1 / 1.15" }} />;
          }
          return (
            <StampCell
              key={cell.key}
              cell={cell}
              year={year}
              month={month}
              onEditHistory={onEditHistory}
              onRequestAdd={onAddHistory ? (date) => setPickerDate(date) : undefined}
            />
          );
        })}
      </div>

      {pickerDate && (
        <AddSessionModal
          date={pickerDate}
          programs={programs}
          onSelect={handleAdd}
          onClose={() => setPickerDate(null)}
        />
      )}

      {/* Legend */}
      <div style={{
        ...ES.mono, fontSize: 10, color: TE.ink3, letterSpacing: "0.1em",
        marginTop: 14, display: "flex", gap: 16, flexWrap: "wrap",
      }}>
        {programs.map((p) => (
          <span key={p.id} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{
              width: 12, height: 12, borderRadius: "50%",
              border: `1.5px solid ${p.accent || TE.ink}`, display: "inline-block",
            }} />
            {p.tag}
          </span>
        ))}
      </div>
    </section>
  );
}

function StampCell({ cell, year, month, onEditHistory, onRequestAdd }) {
  const { day, records, tags, isToday, isFuture, isWeekend } = cell;
  const trained = tags.length > 0;
  const primary = tags[0];
  const secondary = tags[1];

  const canEdit = trained && typeof onEditHistory === "function";
  const canAdd = !trained && typeof onRequestAdd === "function";
  const clickable = canEdit || canAdd;

  const handleClick = () => {
    if (canEdit) {
      onEditHistory(records[0].index);
    } else if (canAdd) {
      const dateStr = formatLocalDate(new Date(year, month, day));
      onRequestAdd(dateStr);
    }
  };

  const titleText = canEdit
    ? `Edit ${records[0].entry.day} · ${records[0].entry.date}`
    : canAdd
      ? `Log session · ${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      : undefined;

  return (
    <div
      onClick={clickable ? handleClick : undefined}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleClick(); } } : undefined}
      title={titleText}
      style={{
      aspectRatio: "1 / 1.15",
      position: "relative",
      background: isWeekend ? TE.bgAlt : TE.surface,
      border: `1px dashed ${TE.ink3}`,
      outline: isToday ? `2px solid ${TE.accent}` : "none",
      outlineOffset: isToday ? 2 : 0,
      padding: "8px 8px 6px",
      display: "flex", flexDirection: "column", justifyContent: "space-between",
      opacity: isFuture && !trained ? 0.35 : 1,
      overflow: "hidden",
      cursor: clickable ? "pointer" : "default",
      transition: "transform 120ms ease, box-shadow 120ms ease",
    }}
      onMouseEnter={clickable ? (e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 4px 0 -2px ${TE.ink}`; } : undefined}
      onMouseLeave={clickable ? (e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; } : undefined}
    >
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        position: "relative", zIndex: 1,
      }}>
        <span style={{
          ...ES.num, fontSize: 20, lineHeight: 1,
          color: isToday ? TE.accent : TE.ink,
          fontStyle: isToday ? "italic" : "normal",
        }}>{day}</span>
        {primary && (
          <span style={{
            ...ES.mono, fontSize: 7, letterSpacing: "0.16em",
            color: TE.ink4, writingMode: "vertical-rl",
            transform: "rotate(180deg)",
          }}>NO. {String(day).padStart(2, "0")}</span>
        )}
      </div>

      {primary && (
        <div style={{ position: "relative", flex: 1, marginTop: 2 }}>
          <div style={{
            position: "absolute", bottom: -2, right: -2,
            width: 50, height: 50, borderRadius: "50%",
            border: `1.5px solid ${primary.accent || TE.ink}`,
            color: primary.accent || TE.ink,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexDirection: "column",
            transform: "rotate(-8deg)",
            background: `${primary.accent || TE.ink}10`,
          }}>
            <span style={{ ...ES.mono, fontSize: 9, fontWeight: 600, letterSpacing: "0.1em" }}>
              {primary.tag}
            </span>
            <span style={{ ...ES.mono, fontSize: 6, letterSpacing: "0.1em", opacity: 0.7 }}>
              ✓ DONE
            </span>
          </div>
          {secondary && (
            <div style={{
              position: "absolute", bottom: 24, left: -2,
              width: 32, height: 32, borderRadius: "50%",
              border: `1px solid ${secondary.accent || TE.ink}`,
              color: secondary.accent || TE.ink,
              display: "flex", alignItems: "center", justifyContent: "center",
              transform: "rotate(6deg)",
              background: `${secondary.accent || TE.ink}10`,
              ...ES.mono, fontSize: 7, letterSpacing: "0.08em",
            }}>{secondary.tag}</div>
          )}
        </div>
      )}

      {canAdd && (
        <div style={{
          position: "absolute", bottom: 6, right: 8,
          ...ES.mono, fontSize: 9, letterSpacing: "0.1em",
          color: TE.ink4,
        }}>+ LOG</div>
      )}

      {isToday && (
        <div style={{
          position: "absolute", top: 4, left: -18, transform: "rotate(-45deg)",
          background: TE.accent, color: TE.bg,
          ...ES.mono, fontSize: 7, letterSpacing: "0.16em",
          padding: "2px 18px", zIndex: 2,
        }}>TODAY</div>
      )}
    </div>
  );
}

function AddSessionModal({ date, programs, onSelect, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(20, 19, 15, 0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 100, padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: TE.bg, padding: "32px 32px 24px",
          border: `1px solid ${TE.ink}`, maxWidth: 460, width: "100%",
        }}
      >
        <div style={{ ...ES.label, marginBottom: 8 }}>Log session for</div>
        <h3 style={{ ...ES.num, fontSize: 26, margin: 0, marginBottom: 24, letterSpacing: "-0.02em" }}>
          {date}
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 0, borderTop: `1px solid ${TE.rule}` }}>
          {programs.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              style={{
                background: "transparent", border: 0,
                borderBottom: `1px solid ${TE.rule}`,
                padding: "16px 4px", textAlign: "left", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 14,
                fontFamily: "inherit",
              }}
            >
              <span style={{
                width: 16, height: 16, borderRadius: "50%",
                border: `1.5px solid ${p.accent || TE.ink}`,
                background: `${p.accent || TE.ink}22`,
                flexShrink: 0,
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ ...ES.mono, fontSize: 10, color: TE.ink3, letterSpacing: "0.12em" }}>
                  {p.tag}
                </div>
                <div style={{ ...ES.num, fontSize: 18, color: TE.ink }}>{p.day}</div>
              </div>
              <span style={{ ...ES.mono, fontSize: 11, color: TE.ink3, letterSpacing: "0.1em" }}>
                {p.exercises.length} EX →
              </span>
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          style={{
            marginTop: 18, padding: "8px 0",
            ...ES.mono, fontSize: 11, letterSpacing: "0.12em",
            background: "transparent", border: 0, cursor: "pointer", color: TE.ink3,
          }}
        >
          CANCEL
        </button>
      </div>
    </div>
  );
}
