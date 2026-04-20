// Editorial Timer — replaces components/Timer.jsx visually
import { useCallback, useEffect, useRef, useState } from "react";
import { TE, ES } from "../constants/editorial-theme.js";
import { formatSeconds } from "../utils/format.js";

export function EditorialTimer({ sec = 90, autoStartKey = 0 }) {
  const [total, setTotal] = useState(sec);
  const [left, setLeft] = useState(null);
  const [running, setRunning] = useState(false);
  const ref = useRef(null);
  const lastAutoKey = useRef(autoStartKey);

  useEffect(() => () => { if (ref.current) clearInterval(ref.current); }, []);

  const startWith = useCallback((seconds) => {
    if (ref.current) clearInterval(ref.current);
    setLeft(seconds);
    setRunning(true);
    ref.current = setInterval(() => {
      setLeft(p => {
        if (p === null || p <= 1) {
          clearInterval(ref.current); ref.current = null; setRunning(false);
          navigator.vibrate?.(300);
          return 0;
        }
        return p - 1;
      });
    }, 1000);
  }, []);

  const start = useCallback(() => startWith(total), [startWith, total]);

  const stop = useCallback(() => {
    if (ref.current) clearInterval(ref.current);
    ref.current = null; setRunning(false); setLeft(null);
  }, []);

  useEffect(() => {
    if (autoStartKey !== lastAutoKey.current && autoStartKey > 0) {
      lastAutoKey.current = autoStartKey;
      startWith(sec);
    }
  }, [autoStartKey, sec, startWith]);

  useEffect(() => {
    if (!running && left === null) setTotal(sec);
  }, [sec, running, left]);

  return (
    <div style={{ padding: "20px 0", borderTop: `1px solid ${TE.rule}`, borderBottom: `1px solid ${TE.rule}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div style={{ ...ES.label }}>Rest timer</div>
        <div style={{ ...ES.num, fontSize: 40, lineHeight: 1, color: left === 0 ? TE.accent : TE.ink, letterSpacing: "-0.03em" }}>
          {left !== null ? formatSeconds(left) : formatSeconds(total)}
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap" }}>
        {[60, 90, 120, 180].map(s => (
          <button key={s} onClick={() => !running && setTotal(s)} style={{
            padding: "6px 12px", fontSize: 11,
            background: total === s ? TE.ink : "transparent",
            color: total === s ? TE.bg : TE.ink,
            border: `1px solid ${TE.ink}`, cursor: "pointer",
            fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.06em",
          }}>{s}s</button>
        ))}
        <div style={{ flex: 1 }} />
        {!running && left === null && (
          <button onClick={start} style={{
            background: TE.accent, color: TE.bg, border: 0, padding: "6px 16px",
            fontSize: 11, fontWeight: 700, cursor: "pointer",
            fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase",
          }}>Start</button>
        )}
        {running && (
          <button onClick={stop} style={{
            background: "transparent", color: TE.ink, border: `1px solid ${TE.ink}`,
            padding: "6px 16px", fontSize: 11, cursor: "pointer",
            fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase",
          }}>Stop</button>
        )}
        {left === 0 && (
          <button onClick={() => setLeft(null)} style={{
            background: TE.ink, color: TE.bg, border: 0, padding: "6px 16px",
            fontSize: 11, cursor: "pointer",
            fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase",
          }}>OK</button>
        )}
      </div>
    </div>
  );
}
