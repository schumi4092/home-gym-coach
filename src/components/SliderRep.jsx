import { useCallback, useRef, useState } from "react";
import { T } from "../constants/theme.js";

export function SliderRep({ value, max, onChange }) {
  const trackRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const progress = max > 0 ? value / max : 0;

  const calculateValue = useCallback(
    (clientX) => {
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0) return 0;
      const ratio = Math.max(0, Math.min(clientX - rect.left, rect.width)) / rect.width;
      return Math.round(ratio * max);
    },
    [max],
  );

  const handleStart = useCallback(
    (event) => {
      event.preventDefault();
      setIsDragging(true);
      const initialX = "touches" in event ? event.touches[0].clientX : event.clientX;
      onChange(calculateValue(initialX));

      const handleMove = (moveEvent) => {
        const clientX = "touches" in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
        onChange(calculateValue(clientX));
      };

      const handleEnd = () => {
        setIsDragging(false);
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleEnd);
        window.removeEventListener("touchmove", handleMove);
        window.removeEventListener("touchend", handleEnd);
      };

      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleEnd);
      window.addEventListener("touchmove", handleMove, { passive: false });
      window.addEventListener("touchend", handleEnd);
    },
    [calculateValue, onChange],
  );

  return (
    <div
      ref={trackRef}
      onMouseDown={handleStart}
      onTouchStart={handleStart}
      style={{ position: "relative", height: 36, borderRadius: 8, cursor: "pointer", background: T.bg3, overflow: "hidden", touchAction: "none", userSelect: "none" }}
    >
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, borderRadius: 8, width: `${progress * 100}%`, background: value > 0 ? `${T.accent}30` : "transparent", transition: isDragging ? "none" : "width 0.15s" }} />
      <div style={{ position: "absolute", top: 0, bottom: 0, width: 4, borderRadius: 2, left: `calc(${progress * 100}% - 2px)`, background: value > 0 ? T.accent : T.t3, transition: isDragging ? "none" : "left 0.15s", opacity: value > 0 ? 1 : 0.5 }} />
      {value > 0 ? (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", paddingLeft: 10, fontSize: 17, fontWeight: 700, color: T.accent, fontVariantNumeric: "tabular-nums", pointerEvents: "none" }}>
          {value}
        </div>
      ) : (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: T.t3, pointerEvents: "none" }}>
          左右滑動記錄次數
        </div>
      )}
    </div>
  );
}
