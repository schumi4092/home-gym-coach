// Editorial theme — warm paper + deep ink training journal
export const TE = {
  bg: "#EEE8DA",
  bgAlt: "#E5DFD0",
  surface: "#F5F0E2",
  ink: "#14130F",
  ink2: "#2B2A24",
  ink3: "#55534A",
  ink4: "#857F6F",
  rule: "#14130F",
  accent: "#C8501E",
  accentSoft: "#EAD8C6",
  highlight: "#F2E27A",
};

// Per-split accent colors — used by MonthCalendar postmarks, can be reused
// in progress charts, quick-start cards, etc. Order matches DEFAULT_PROGRAM.
export const SPLIT_COLORS = {
  "upper-a": "#C8501E", // PUSH — house accent
  "lower-a": "#3B6B4F", // QUAD — deep moss
  "upper-b": "#1F4E79", // PULL — ink blue
  "lower-b": "#7A4E8C", // POST — plum
};

export const ES = {
  shell: {
    background: TE.bg,
    color: TE.ink,
    fontFamily: "'Fraunces', Georgia, 'Songti TC', serif",
    minHeight: "100vh",
    padding: "36px 48px 56px",
  },
  mono: {
    fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
    fontFeatureSettings: "'ss01'",
  },
  label: {
    fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
    fontSize: 11,
    color: TE.ink3,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
  },
  num: {
    fontFamily: "'Fraunces', Georgia, serif",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 500,
    letterSpacing: "-0.02em",
  },
  monoNum: {
    fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
    fontVariantNumeric: "tabular-nums",
  },
  rule: { height: 1, background: TE.rule, border: 0, margin: 0 },
  thickRule: { height: 2, background: TE.rule, border: 0, margin: 0 },
};

export const editStepBtn = {
  width: 40, height: 40, border: `1.5px solid ${TE.ink}`, background: "transparent",
  color: TE.ink, fontSize: 20, cursor: "pointer",
  fontFamily: "'IBM Plex Mono', monospace",
  display: "flex", alignItems: "center", justifyContent: "center",
};

export const primaryBtn = {
  background: TE.ink, color: TE.bg, border: 0,
  padding: "12px 24px", fontSize: 13, fontWeight: 600, cursor: "pointer",
  fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.08em", textTransform: "uppercase",
};

export const secondaryBtn = {
  background: "transparent", color: TE.ink,
  border: `1px solid ${TE.ink}`,
  padding: "12px 20px", fontSize: 13, fontWeight: 500, cursor: "pointer",
  fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.08em", textTransform: "uppercase",
};
