export const T = {
  bg: "#111110",
  bg2: "#1A1A18",
  bg3: "#222220",
  bg4: "#2C2C29",
  bg5: "#161715",
  t1: "#F0EDE6",
  t2: "#A8A59C",
  t3: "#6B6962",
  border: "#2E2E2B",
  borderLight: "#3A3A36",
  accent: "#C8FF3E",
  green: "#4ADE80",
  amber: "#FBBF24",
  orange: "#FB923C",
  red: "#EF4444",
};

export const primaryMiniButtonStyle = {
  fontSize: 13,
  padding: "4px 14px",
  background: T.accent,
  color: T.bg,
  border: `1px solid ${T.accent}66`,
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 700,
  boxShadow: `0 8px 20px ${T.accent}16`,
};

export const secondaryMiniButtonStyle = {
  fontSize: 13,
  padding: "4px 14px",
  background: T.bg3,
  color: T.t2,
  border: `1px solid ${T.border}`,
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 600,
};

export const panelStyle = {
  background: T.bg2,
  borderRadius: 12,
  border: `1px solid ${T.border}`,
  boxShadow: `inset 0 1px 0 ${T.borderLight}22`,
};

export const statCardStyle = {
  ...panelStyle,
  padding: "14px 12px",
  textAlign: "center",
};

export const sectionLabelStyle = {
  fontSize: 13,
  fontWeight: 600,
  color: T.t3,
  letterSpacing: "0.08em",
  marginBottom: 12,
};

export const pillButtonBaseStyle = {
  fontSize: 14,
  padding: "8px 16px",
  borderRadius: 999,
  cursor: "pointer",
  border: `1px solid ${T.border}`,
  background: T.bg3,
  color: T.t2,
  fontWeight: 600,
  transition: "all 0.15s",
};

export const softChipStyle = {
  fontSize: 13,
  fontWeight: 700,
  padding: "4px 10px",
  borderRadius: 999,
  fontVariantNumeric: "tabular-nums",
};

export const primaryButtonStyle = {
  fontSize: 15,
  padding: "10px 18px",
  borderRadius: 12,
  cursor: "pointer",
  border: `1px solid ${T.accent}66`,
  background: T.accent,
  color: T.bg,
  fontWeight: 700,
  boxShadow: `0 12px 28px ${T.accent}16`,
};

export const secondaryButtonStyle = {
  fontSize: 15,
  padding: "10px 18px",
  borderRadius: 12,
  cursor: "pointer",
  border: `1px solid ${T.border}`,
  background: T.bg3,
  color: T.t1,
  fontWeight: 600,
};

export const iconButtonStyle = {
  width: 36,
  height: 36,
  borderRadius: 10,
  background: T.bg3,
  border: `1px solid ${T.border}`,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export const inputBaseStyle = {
  height: 40,
  borderRadius: 10,
  border: `1px solid ${T.border}`,
  background: T.bg3,
  color: T.t1,
  padding: "0 12px",
  boxSizing: "border-box",
};

export const textareaBaseStyle = {
  width: "100%",
  resize: "vertical",
  borderRadius: 10,
  border: `1px solid ${T.border}`,
  background: T.bg3,
  color: T.t1,
  padding: "10px 12px",
  boxSizing: "border-box",
};
