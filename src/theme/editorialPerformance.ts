import type { CSSProperties } from "react";
import { colors, fonts } from "./tokens";

export const editorialPerformance = {
  accent: colors.accent.blue,
  accentSoft: `${colors.accent.blue}18`,
  panelRadius: 18,
  heroRadius: 24,
  panelBorder: `1px solid ${colors.border}`,
  softBorder: `1px solid ${colors.borderLight}`,
  shadow: "0 18px 40px rgba(0, 0, 0, 0.22)",
};

export function performanceHeroStyle(accent = editorialPerformance.accent): CSSProperties {
  return {
    background: `linear-gradient(180deg, ${editorialPerformance.accentSoft} 0%, ${colors.surfaceAlt} 100%)`,
    border: `1px solid ${accent}44`,
    borderRadius: editorialPerformance.heroRadius,
    padding: 18,
    boxShadow: editorialPerformance.shadow,
  };
}

export function performancePanelStyle(accent?: string, muted = false): CSSProperties {
  return {
    background: muted ? colors.surfaceAlt : colors.surface,
    border: accent ? `1px solid ${accent}33` : editorialPerformance.softBorder,
    borderRadius: editorialPerformance.panelRadius,
    boxShadow: muted ? "none" : editorialPerformance.shadow,
  };
}

export function performanceGhostButtonStyle(accent = colors.textSecondary): CSSProperties {
  return {
    border: `1px solid ${accent === colors.textSecondary ? colors.border : `${accent}55`}`,
    background: colors.surface,
    color: accent,
    borderRadius: 999,
    padding: "10px 14px",
    cursor: "pointer",
    fontFamily: fonts.mono,
    fontSize: 11,
    minHeight: 40,
    boxShadow: "0 10px 24px rgba(0, 0, 0, 0.16)",
    WebkitTapHighlightColor: "transparent",
  };
}

export function performancePillStyle(active: boolean, accent: string): CSSProperties {
  return {
    border: `1px solid ${active ? `${accent}66` : colors.border}`,
    background: active ? `${accent}18` : colors.surface,
    color: active ? accent : colors.textMuted,
    borderRadius: 999,
    minHeight: 44,
    padding: "0 14px",
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1,
    WebkitTapHighlightColor: "transparent",
  };
}

export function performanceEyebrowStyle(color = editorialPerformance.accent): CSSProperties {
  return {
    fontFamily: fonts.mono,
    fontSize: 10,
    color,
    letterSpacing: 2,
    textTransform: "uppercase",
  };
}