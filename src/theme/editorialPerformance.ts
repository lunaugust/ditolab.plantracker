import type { CSSProperties } from "react";
import { colors, fonts } from "./tokens";

export const editorialPerformance = {
  accent: colors.accent.blue,
  accentSoft: `${colors.accent.blue}14`,
  panelRadius: 24,
  heroRadius: 30,
  panelBorder: `1px solid ${colors.textPrimary}14`,
  softBorder: `1px solid ${colors.textPrimary}10`,
  shadow: "0 24px 64px rgba(0, 0, 0, 0.30)",
  appBackground: `radial-gradient(circle at top, ${colors.accent.blue}18 0%, transparent 32%), radial-gradient(circle at 82% 0%, ${colors.accent.green}10 0%, transparent 24%), linear-gradient(180deg, ${colors.bg} 0%, ${colors.surfaceAlt} 100%)`,
};

export function performanceHeroStyle(accent = editorialPerformance.accent): CSSProperties {
  return {
    background: `linear-gradient(180deg, ${colors.textPrimary}10 0%, ${accent}16 22%, ${colors.surfaceAlt}f2 100%)`,
    border: `1px solid ${accent}3d`,
    borderRadius: editorialPerformance.heroRadius,
    padding: 18,
    boxShadow: editorialPerformance.shadow,
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    animation: "quietGlassCardIn 520ms cubic-bezier(0.22, 1, 0.36, 1) both",
  };
}

export function performancePanelStyle(accent?: string, muted = false): CSSProperties {
  return {
    background: `linear-gradient(180deg, ${colors.textPrimary}${muted ? "05" : "08"} 0%, ${(muted ? colors.surfaceAlt : colors.surface)}f1 100%)`,
    border: accent ? `1px solid ${accent}30` : editorialPerformance.softBorder,
    borderRadius: editorialPerformance.panelRadius,
    boxShadow: muted ? "0 14px 30px rgba(0, 0, 0, 0.18)" : editorialPerformance.shadow,
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    animation: "quietGlassCardIn 480ms cubic-bezier(0.22, 1, 0.36, 1) both",
  };
}

export function performanceGhostButtonStyle(accent = colors.textSecondary): CSSProperties {
  return {
    border: `1px solid ${accent === colors.textSecondary ? `${colors.textPrimary}12` : `${accent}40`}`,
    background: `linear-gradient(180deg, ${colors.textPrimary}0d 0%, ${colors.surfaceAlt}dc 100%)`,
    color: accent,
    borderRadius: 999,
    padding: "10px 14px",
    cursor: "pointer",
    fontFamily: fonts.mono,
    fontSize: 11,
    minHeight: 40,
    boxShadow: "0 12px 30px rgba(0, 0, 0, 0.18)",
    WebkitTapHighlightColor: "transparent",
  };
}

export function performancePillStyle(active: boolean, accent: string): CSSProperties {
  return {
    border: `1px solid ${active ? `${accent}55` : `${colors.textPrimary}10`}`,
    background: active
      ? `linear-gradient(180deg, ${colors.textPrimary}10 0%, ${accent}18 100%)`
      : `linear-gradient(180deg, ${colors.textPrimary}08 0%, ${colors.surfaceAlt}d8 100%)`,
    color: active ? colors.textPrimary : colors.textSecondary,
    borderRadius: 999,
    minHeight: 44,
    padding: "0 14px",
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1,
    boxShadow: active ? "0 10px 24px rgba(0, 0, 0, 0.20)" : "none",
    WebkitTapHighlightColor: "transparent",
  };
}

export function performanceEyebrowStyle(color = editorialPerformance.accent): CSSProperties {
  return {
    fontFamily: fonts.mono,
    fontSize: 10,
    color,
    letterSpacing: 2.4,
    textTransform: "uppercase",
  };
}

export function quietGlassAppShellStyle(): CSSProperties {
  return {
    background: editorialPerformance.appBackground,
    minHeight: "100dvh",
    fontFamily: fonts.sans,
    color: colors.textPrimary,
    animation: "quietGlassPageIn 380ms cubic-bezier(0.22, 1, 0.36, 1) both",
  };
}