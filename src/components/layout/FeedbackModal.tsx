import { useState, useCallback } from "react";
import { colors, fonts } from "../../theme";
import { useI18n } from "../../i18n";
import { saveFeedback } from "../../services/feedbackService";
import type { CSSProperties } from "react";
import {
  performanceGhostButtonStyle,
  performanceHeroStyle,
  performancePanelStyle,
  performancePillStyle,
} from "../../theme/editorialPerformance";

const CATEGORIES = ["bug", "suggestion", "general", "plan"];

interface FeedbackModalProps {
  scope: string;
  currentView: string;
  onClose: () => void;
}

export function FeedbackModal({ scope, currentView, onClose }: FeedbackModalProps) {
  const { t } = useI18n();
  const [rating, setRating] = useState<number | null>(null);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = useCallback(async () => {
    if (!message.trim()) {
      setError(t("feedback.messageRequired"));
      return;
    }
    setSending(true);
    setError("");
    try {
      await saveFeedback(scope, { rating, category, message, view: currentView });
      setDone(true);
      setTimeout(onClose, 1800);
    } catch {
      setError(t("feedback.error"));
    } finally {
      setSending(false);
    }
  }, [scope, rating, category, message, currentView, onClose, t]);

  return (
    /* Backdrop */
    <div
      onClick={onClose}
      style={styles.backdrop}
    >
      {/* Sheet */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={styles.sheet}
      >
        {/* Handle bar */}
        <div style={styles.handle} />

        <div style={{ ...styles.heroCard, ...performanceHeroStyle(colors.accent.orange) }}>
          <div style={styles.titleRow}>
            <div>
              <div style={styles.title}>{t("feedback.title")}</div>
              <div style={styles.subtitle}>{t("feedback.subtitle")}</div>
            </div>
            <button onClick={onClose} style={styles.closeBtn}>✕</button>
          </div>
        </div>

        {done ? (
          <div style={{ ...styles.successMsg, ...performancePanelStyle(colors.accent.orange) }}>{t("feedback.success")}</div>
        ) : (
          <>
            {/* Star rating */}
            <div style={styles.fieldLabel}>{t("feedback.ratingLabel")}</div>
            <div style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((n) => {
                const filled = n <= (hoveredStar ?? rating ?? 0);
                return (
                  <button
                    key={n}
                    onClick={() => setRating(n)}
                    onMouseEnter={() => setHoveredStar(n)}
                    onMouseLeave={() => setHoveredStar(null)}
                    style={{ ...styles.star, color: filled ? colors.accent.orange : colors.border }}
                  >
                    ★
                  </button>
                );
              })}
            </div>

            {/* Category chips */}
            <div style={styles.fieldLabel}>{t("feedback.categoryLabel")}</div>
            <div style={styles.chips}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  style={{
                    ...styles.chip,
                    ...performancePillStyle(category === cat, colors.accent.orange),
                  }}
                >
                  {t(`feedback.categories.${cat}`)}
                </button>
              ))}
            </div>

            {/* Message */}
            <div style={styles.fieldLabel}>{t("feedback.messageLabel")}</div>
            <div style={{ ...styles.formCard, ...performancePanelStyle(colors.accent.orange) }}>
              <textarea
                value={message}
                onChange={(e) => { setMessage(e.target.value); setError(""); }}
                placeholder={t("feedback.messagePlaceholder")}
                rows={4}
                style={styles.textarea}
              />
              {error && <div style={styles.errorMsg}>{error}</div>}

              {/* Privacy notice */}
              <div style={styles.privacyNote}>
                🔒 {t("feedback.privacyNotice")}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button onClick={onClose} style={styles.cancelBtn}>
                {t("common.cancel")}
              </button>
              <button
                onClick={handleSubmit}
                disabled={sending}
                style={{ ...styles.submitBtn, opacity: sending ? 0.6 : 1 }}
              >
                {sending ? t("feedback.sending") : t("feedback.submit")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  backdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 200,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "flex-end",
  },
  sheet: {
    width: "100%",
    background: colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: "16px 20px max(24px, env(safe-area-inset-bottom))",
    borderTop: `1px solid ${colors.border}`,
    boxSizing: "border-box",
    maxHeight: "90dvh",
    overflowY: "auto",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    background: colors.border,
    margin: "0 auto 20px",
  },
  heroCard: {
    marginBottom: 18,
  },
  titleRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: -0.8,
    color: colors.textPrimary,
    lineHeight: 1.05,
  },
  subtitle: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 8,
    letterSpacing: 1,
  },
  closeBtn: {
    ...performanceGhostButtonStyle(colors.accent.orange),
    background: colors.surfaceElevated,
    color: colors.textSecondary,
    fontSize: 14,
    cursor: "pointer",
    padding: "8px 12px",
    WebkitTapHighlightColor: "transparent",
  },
  fieldLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
    marginTop: 16,
  },
  starsRow: {
    display: "flex",
    gap: 4,
    marginBottom: 4,
  },
  star: {
    background: "transparent",
    border: "none",
    fontSize: 32,
    cursor: "pointer",
    padding: "2px 4px",
    WebkitTapHighlightColor: "transparent",
    transition: "color 0.1s",
    minWidth: 44,
    minHeight: 44,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  chips: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  chip: {
    border: `1px solid ${colors.border}`,
    borderRadius: 999,
    padding: "8px 14px",
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
    transition: "all 0.15s",
    whiteSpace: "nowrap",
    minHeight: 36,
  },
  formCard: {
    padding: 14,
  },
  textarea: {
    width: "100%",
    background: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: 14,
    padding: "12px 14px",
    color: colors.textPrimary,
    fontFamily: fonts.sans,
    fontSize: 14,
    resize: "vertical",
    minHeight: 90,
    boxSizing: "border-box",
  },
  errorMsg: {
    marginTop: 6,
    color: colors.warning,
    fontFamily: fonts.mono,
    fontSize: 11,
  },
  privacyNote: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textDim,
    marginTop: 12,
    lineHeight: 1.4,
  },
  cancelBtn: {
    ...performanceGhostButtonStyle(colors.accent.orange),
    border: `1px solid ${colors.border}`,
    background: colors.surfaceElevated,
    color: colors.textSecondary,
    borderRadius: 14,
    padding: "14px 20px",
    fontFamily: fonts.mono,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
  },
  submitBtn: {
    flex: 1,
    border: "none",
    background: colors.accent.orange,
    color: colors.bg,
    borderRadius: 14,
    padding: "14px 20px",
    fontFamily: fonts.mono,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  successMsg: {
    textAlign: "center",
    padding: "28px 18px",
    fontSize: 18,
    fontWeight: 600,
    color: colors.textPrimary,
  },
};
