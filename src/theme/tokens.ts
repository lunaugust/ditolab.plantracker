/* ============================================================
 * Design tokens — single source of truth for the UI theme.
 * Import into CSS Modules via `composes` or use in JS as needed.
 * ============================================================ */

/* ---- Colours ---- */
export const colors = {
  bg:          "#0d0d0d",
  surface:     "#111111",
  surfaceAlt:  "#0f0f0f",
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
  xs: 3,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  xxl: 24,
  xxxl: 28,
};

/* ---- Radii (px) ---- */
export const radii = {
  sm: 7,
  md: 9,
  lg: 10,
  xl: 12,
};

/* ---- Layout ---- */
export const layout = {
  maxContentWidth: 760,
};

/* ---- Timing ---- */
export const SAVE_MSG_DURATION_MS = 2000;

/* ---- Navigation tabs ---- */
export const NAV_ITEMS = [
  { key: "plan", labelKey: "nav.plan" },
  { key: "log",  labelKey: "nav.log" },
];
