/* ============================================================
 * Design tokens — single source of truth for the UI theme.
 * Import into CSS Modules via `composes` or use in JS as needed.
 * ============================================================ */

/* ---- Colours ---- */
export const colors = {
  bg:          "#0d0d0d",
  surface:     "#111111",
  surfaceAlt:  "#0f0f0f",
  surfaceElevated: "#161616",
  border:      "#1e1e1e",
  borderLight: "#1a1a1a",
  borderDim:   "#151515",

  textPrimary:   "#f0ede8",
  textSecondary: "#888888",
  textMuted:     "#555555",
  textDim:       "#444444",
  textGhost:     "#333333",
  textDisabled:  "#2a2a2a",

  accent: {
    orange: "#e8643a",
    blue:   "#3ab8e8",
    green:  "#7de83a",
  },

  success: "#7de83a",
  warning: "#e8643a",
  danger:  "#e85a5a",

  tooltipBg:    "#1a1a1a",
  textOnAccent: "#ffffff",
};

/* ---- Typography ---- */
export const fonts = {
  sans:  "'DM Sans', sans-serif",
  mono:  "'DM Mono', monospace",
  googleImport:
    "https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700&family=DM+Mono:wght@400;500&display=swap",
};

/* ---- Spacing (px) ---- */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 28,
  xxxl: 32,
};

/* ---- Radii (px) ---- */
export const radii = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
};

/* ---- Layout ---- */
export const layout = {
  maxContentWidth: 760,
};

/* ---- Timing ---- */
export const SAVE_MSG_DURATION_MS = 2000;

/* ---- Navigation tabs ---- */
export const NAV_ITEMS = [
  { key: "plan",     labelKey: "nav.plan" },
  { key: "log",      labelKey: "nav.log" },
  { key: "progress", labelKey: "nav.progress" },
];
