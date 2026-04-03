import { useCallback, useEffect, useRef, useState } from "react";
import { T, panelStyle, primaryMiniButtonStyle, secondaryMiniButtonStyle } from "../constants/theme.js";
import { formatSeconds } from "../utils/format.js";

export function Timer({ sec = 90 }) {
  const [total, setTotal] = useState(sec);
  const [left, setLeft] = useState(null);
  const [running, setRunning] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const start = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setLeft(total);
    setRunning(true);
    timerRef.current = setInterval(() => {
      setLeft((previous) => {
        if (previous === null || previous <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          setRunning(false);
          navigator.vibrate?.(300);
          return 0;
        }
        return previous - 1;
      });
    }, 1000);
  }, [total]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRunning(false);
    setLeft(null);
  }, []);

  const done = left === 0;
  const progress = left !== null ? left / total : 1;
  const radius = 16;
  const circumference = 2 * Math.PI * radius;

  return (
    <div style={{ ...panelStyle, display: "flex", alignItems: "center", gap: 12, padding: "12px 12px", marginTop: 10 }}>
      <div style={{ position: "relative", width: 40, height: 40, flexShrink: 0 }}>
        <svg width="40" height="40" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r={radius} fill="none" stroke={T.bg3} strokeWidth="2.5" />
          <circle
            cx="20" cy="20" r={radius} fill="none"
            stroke={done ? T.red : running ? T.accent : T.t3}
            strokeWidth="2.5" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            transform="rotate(-90 20 20)"
            style={{ transition: "stroke-dashoffset 0.4s cubic-bezier(.4,0,.2,1)" }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: done ? T.red : T.t1 }}>
          {left !== null ? formatSeconds(left) : formatSeconds(total)}
        </div>
      </div>

      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
        {!running && left === null && (
          <>
            {[60, 90, 120].map((seconds) => (
              <button
                key={seconds}
                onClick={() => setTotal(seconds)}
                style={{ fontSize: 13, padding: "4px 10px", borderRadius: 999, cursor: "pointer", border: `1px solid ${total === seconds ? `${T.t1}33` : T.border}`, background: total === seconds ? T.t1 : T.bg3, color: total === seconds ? T.bg : T.t3, fontWeight: total === seconds ? 700 : 500, transition: "all 0.15s" }}
              >
                {seconds}s
              </button>
            ))}
            <button onClick={start} style={primaryMiniButtonStyle}>開始</button>
          </>
        )}
        {running && <button onClick={stop} style={secondaryMiniButtonStyle}>停止</button>}
        {done && (
          <>
            <span style={{ fontSize: 14, fontWeight: 600, color: T.red }}>休息結束</span>
            <button onClick={() => setLeft(null)} style={secondaryMiniButtonStyle}>OK</button>
          </>
        )}
      </div>
    </div>
  );
}
