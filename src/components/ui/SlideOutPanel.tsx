import { useEffect } from "react";
import { colors } from "../../theme";

/**
 * Responsive slide-out panel:
 * - Desktop: Right-side panel (350px width)
 * - Mobile: Bottom sheet (slides up from bottom)
 *
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   children: React.ReactNode,
 * }} props
 */
export function SlideOutPanel({ isOpen, onClose, children }) {
  // Close on escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when panel is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          ...styles.backdrop,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
        }}
      />

      {/* Panel */}
      <div
        style={{
          ...styles.panel,
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={styles.closeButton}
          aria-label="Close panel"
        >
          ✕
        </button>

        {/* Content */}
        <div style={styles.content}>
          {children}
        </div>
      </div>
    </>
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.5)",
    zIndex: 200,
    transition: "opacity 0.2s ease",
    backdropFilter: "blur(4px)",
    WebkitBackdropFilter: "blur(4px)",
  },
  panel: {
    position: "fixed",
    top: 0,
    right: 0,
    width: "min(400px, 100vw)",
    height: "100dvh",
    background: colors.bg,
    borderLeft: `1px solid ${colors.border}`,
    zIndex: 201,
    overflowY: "auto",
    transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "-4px 0 24px rgba(0, 0, 0, 0.3)",
    // Mobile: bottom sheet
    "@media (max-width: 768px)": {
      width: "100vw",
      top: "auto",
      bottom: 0,
      height: "85dvh",
      maxHeight: "85dvh",
      borderLeft: "none",
      borderTop: `1px solid ${colors.border}`,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    },
  },
  closeButton: {
    position: "sticky",
    top: 0,
    right: 0,
    zIndex: 10,
    float: "right",
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: "50%",
    width: 36,
    height: 36,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: 18,
    color: colors.textMuted,
    margin: "16px 16px 0 0",
    WebkitTapHighlightColor: "transparent",
  },
  content: {
    padding: "0 20px 24px 20px",
    clear: "both",
  },
};
