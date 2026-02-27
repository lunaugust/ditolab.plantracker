import { colors, fonts } from "../../theme";
import type { CSSProperties } from "react";

interface FloatingPlanSelectorProps {
  planName: string;
  canEdit: boolean;
  onOpenPlanManager: () => void;
}

/**
 * Floating action button for plan selection - mobile-optimized UX
 * Positioned in bottom-right corner for easy thumb access
 */
export function FloatingPlanSelector({ planName, canEdit, onOpenPlanManager }: FloatingPlanSelectorProps) {
  return (
    <button
      onClick={onOpenPlanManager}
      style={styles.fab}
      aria-label="Manage training plans"
    >
      <div style={styles.fabContent}>
        <div style={styles.iconContainer}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="9" x2="15" y2="9" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
          {!canEdit && <div style={styles.lockBadge}>🔒</div>}
        </div>
        <div style={styles.textContainer}>
          <div style={styles.label}>PLAN</div>
          <div style={styles.planName}>{planName}</div>
        </div>
      </div>
    </button>
  );
}

const styles: Record<string, CSSProperties> = {
  fab: {
    position: "fixed",
    bottom: 24,
    right: 20,
    zIndex: 500,

    background: `linear-gradient(135deg, ${colors.accent.blue}, ${colors.accent.blue}dd)`,
    border: `1px solid ${colors.accent.blue}`,
    borderRadius: 20,

    padding: "12px 18px",

    display: "flex",
    alignItems: "center",
    gap: 10,

    cursor: "pointer",

    boxShadow: `0 4px 16px ${colors.accent.blue}40, 0 2px 8px rgba(0,0,0,0.3)`,

    transition: "all 0.2s ease",

    // Mobile-friendly tap target
    minWidth: 56,
    minHeight: 48,

    WebkitTapHighlightColor: "transparent",
  },

  fabContent: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  iconContainer: {
    position: "relative",
    color: colors.textOnAccent,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  lockBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    fontSize: 10,
    lineHeight: 1,
    filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))",
  },

  textContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 1,
    minWidth: 0, // Allow text to shrink
  },

  label: {
    fontFamily: fonts.mono,
    fontSize: 9,
    fontWeight: fonts.weight.bold,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: `${colors.textOnAccent}cc`,
    lineHeight: 1,
  },

  planName: {
    fontFamily: fonts.sans,
    fontSize: 14,
    fontWeight: fonts.weight.semibold,
    color: colors.textOnAccent,
    lineHeight: 1.2,

    // Truncate long names gracefully
    maxWidth: 180,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
};
