import { useCallback, useEffect, useRef, useState } from "react";

export function VirtualList({ items, itemHeight, overscan = 3, maxHeight, renderItem, style }) {
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);

  const handleScroll = useCallback(() => {
    if (containerRef.current) setScrollTop(containerRef.current.scrollTop);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const totalHeight = items.length * itemHeight;
  const visibleCount = Math.ceil(maxHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(items.length, startIndex + visibleCount + overscan * 2);

  return (
    <div ref={containerRef} style={{ ...style, maxHeight, overflowY: "auto" }}>
      <div style={{ height: totalHeight, position: "relative" }}>
        {items.slice(startIndex, endIndex).map((item, i) => (
          <div key={startIndex + i} style={{ position: "absolute", top: (startIndex + i) * itemHeight, width: "100%", height: itemHeight }}>
            {renderItem(item, startIndex + i)}
          </div>
        ))}
      </div>
    </div>
  );
}
