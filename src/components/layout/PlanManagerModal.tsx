import { useState, useCallback } from "react";
import { colors, fonts } from "../../theme";
import { useI18n } from "../../i18n";
import type { PlanMetadata } from "../../services/types";
import type { CSSProperties } from "react";

interface PlanManagerModalProps {
  plans: PlanMetadata[];
  activePlanId: string | null;
  userId: string;
  onSwitchPlan: (planId: string) => void;
  onCreatePlan: () => void;
  onRenamePlan: (planId: string, newName: string) => void;
  onDeletePlan: (planId: string) => void;
  onSharePlan: (planId: string) => void;
  onCopyPlan: (planId: string, newName: string) => void;
  onClose: () => void;
}

export function PlanManagerModal({
  plans,
  activePlanId,
  userId,
  onSwitchPlan,
  onCreatePlan,
  onRenamePlan,
  onDeletePlan,
  onSharePlan,
  onCopyPlan,
  onClose,
}: PlanManagerModalProps) {
  const { t } = useI18n();
  const [tab, setTab] = useState<"owned" | "shared">("owned");
  const [renamingPlanId, setRenamingPlanId] = useState<string | null>(null);
  const [newPlanName, setNewPlanName] = useState("");
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [copyingPlanId, setCopyingPlanId] = useState<string | null>(null);
  const [copyPlanName, setCopyPlanName] = useState("");

  const ownedPlans = plans.filter((p) => p.ownerId === userId);
  const sharedPlans = plans.filter((p) => p.ownerId !== userId);
  const currentPlans = tab === "owned" ? ownedPlans : sharedPlans;

  const handleRename = useCallback((planId: string) => {
    if (newPlanName.trim()) {
      onRenamePlan(planId, newPlanName.trim());
      setRenamingPlanId(null);
      setNewPlanName("");
    }
  }, [newPlanName, onRenamePlan]);

  const handleCopy = useCallback((planId: string) => {
    if (copyPlanName.trim()) {
      onCopyPlan(planId, copyPlanName.trim());
      setCopyingPlanId(null);
      setCopyPlanName("");
    }
  }, [copyPlanName, onCopyPlan]);

  return (
    <div
      onClick={onClose}
      style={styles.backdrop}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={styles.sheet}
      >
        <div style={styles.handle} />

        <div style={styles.titleRow}>
          <div style={styles.title}>{t("planManager.title")}</div>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          <button
            onClick={() => setTab("owned")}
            style={{
              ...styles.tab,
              borderBottomColor: tab === "owned" ? colors.accent.blue : "transparent",
              color: tab === "owned" ? colors.accent.blue : colors.textSecondary,
            }}
          >
            {t("planManager.myPlans")} ({ownedPlans.length})
          </button>
          <button
            onClick={() => setTab("shared")}
            style={{
              ...styles.tab,
              borderBottomColor: tab === "shared" ? colors.accent.blue : "transparent",
              color: tab === "shared" ? colors.accent.blue : colors.textSecondary,
            }}
          >
            {t("planManager.sharedWithMe")} ({sharedPlans.length})
          </button>
        </div>

        {/* Plan list */}
        <div style={styles.planList}>
          {currentPlans.length === 0 ? (
            <div style={styles.emptyState}>
              {tab === "owned" ? t("planManager.noPlanSelected") : t("planManager.sharedWithMe")}
            </div>
          ) : (
            currentPlans.map((plan) => {
              const isActive = plan.id === activePlanId;
              const isOwned = plan.ownerId === userId;
              const isRenaming = renamingPlanId === plan.id;
              const isCopying = copyingPlanId === plan.id;
              const isConfirmingDelete = confirmingDeleteId === plan.id;

              return (
                <div
                  key={plan.id}
                  style={{
                    ...styles.planCard,
                    borderColor: isActive ? colors.accent.blue : colors.border,
                    background: isActive ? `${colors.accent.blue}08` : colors.surface,
                  }}
                >
                  {/* Plan name and status */}
                  <div style={styles.planCardHeader}>
                    <div>
                      {isRenaming ? (
                        <input
                          type="text"
                          value={newPlanName}
                          onChange={(e) => setNewPlanName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRename(plan.id);
                            if (e.key === "Escape") {
                              setRenamingPlanId(null);
                              setNewPlanName("");
                            }
                          }}
                          placeholder={t("planManager.planNamePlaceholder")}
                          style={styles.input}
                          autoFocus
                        />
                      ) : (
                        <div style={styles.planName}>{plan.name}</div>
                      )}
                      <div style={styles.planMeta}>
                        {isOwned ? (
                          <>
                            <span style={styles.badge}>{t("planManager.owned")}</span>
                            {plan.isShared && (
                              <span style={styles.badgeSecondary}>
                                {t("planManager.sharedWithCount", { count: plan.sharedWith.length })}
                              </span>
                            )}
                          </>
                        ) : (
                          <span style={styles.badgeSecondary}>{t("planManager.readOnly")}</span>
                        )}
                      </div>
                    </div>
                    {isActive && <div style={styles.activeIndicator}>●</div>}
                  </div>

                  {/* Copy dialog for shared plans */}
                  {isCopying && (
                    <div style={styles.actionRow}>
                      <input
                        type="text"
                        value={copyPlanName}
                        onChange={(e) => setCopyPlanName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCopy(plan.id);
                          if (e.key === "Escape") {
                            setCopyingPlanId(null);
                            setCopyPlanName("");
                          }
                        }}
                        placeholder={t("planManager.planNamePlaceholder")}
                        style={styles.input}
                        autoFocus
                      />
                      <button onClick={() => handleCopy(plan.id)} style={styles.btnPrimary}>
                        {t("common.save")}
                      </button>
                      <button onClick={() => {
                        setCopyingPlanId(null);
                        setCopyPlanName("");
                      }} style={styles.btnGhost}>
                        {t("common.cancel")}
                      </button>
                    </div>
                  )}

                  {/* Delete confirmation */}
                  {isConfirmingDelete && (
                    <div style={styles.confirmBox}>
                      <div style={styles.confirmText}>{t("planManager.confirmDelete")}</div>
                      <div style={styles.actionRow}>
                        <button onClick={() => {
                          onDeletePlan(plan.id);
                          setConfirmingDeleteId(null);
                        }} style={styles.btnDanger}>
                          {t("planManager.deletePlan")}
                        </button>
                        <button onClick={() => setConfirmingDeleteId(null)} style={styles.btnGhost}>
                          {t("common.cancel")}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {!isRenaming && !isCopying && !isConfirmingDelete && (
                    <div style={styles.actions}>
                      {!isActive && (
                        <button
                          onClick={() => onSwitchPlan(plan.id)}
                          style={styles.btnPrimary}
                        >
                          {t("planManager.switchPlan")}
                        </button>
                      )}
                      {isOwned ? (
                        <>
                          <button
                            onClick={() => {
                              setRenamingPlanId(plan.id);
                              setNewPlanName(plan.name);
                            }}
                            style={styles.btnGhost}
                          >
                            {t("planManager.renamePlan")}
                          </button>
                          <button
                            onClick={() => onSharePlan(plan.id)}
                            style={styles.btnGhost}
                          >
                            {t("planManager.sharePlan")}
                          </button>
                          {ownedPlans.length > 1 && (
                            <button
                              onClick={() => setConfirmingDeleteId(plan.id)}
                              style={styles.btnGhost}
                            >
                              {t("planManager.deletePlan")}
                            </button>
                          )}
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setCopyingPlanId(plan.id);
                            setCopyPlanName(t("planManager.copyOfPlan", { name: plan.name }));
                          }}
                          style={styles.btnGhost}
                        >
                          {t("planManager.copyPlan")}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Create plan button (only in owned tab) */}
        {tab === "owned" && (
          <button onClick={onCreatePlan} style={styles.createBtn}>
            {t("planManager.createPlan")}
          </button>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  backdrop: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    zIndex: 1000,
  },
  sheet: {
    background: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    width: "100%",
    maxWidth: 600,
    maxHeight: "85dvh",
    padding: "8px 16px 24px",
    display: "flex",
    flexDirection: "column",
    gap: 16,
    overflowY: "auto",
  },
  handle: {
    width: 40,
    height: 4,
    background: colors.border,
    borderRadius: 2,
    alignSelf: "center",
  },
  titleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: fonts.size.lg,
    fontWeight: fonts.weight.bold,
    color: colors.textPrimary,
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: fonts.size.xl,
    color: colors.textSecondary,
    cursor: "pointer",
    padding: 8,
  },
  tabs: {
    display: "flex",
    gap: 16,
    borderBottom: `1px solid ${colors.border}`,
  },
  tab: {
    background: "none",
    border: "none",
    borderBottom: "2px solid transparent",
    padding: "8px 4px",
    fontSize: fonts.size.md,
    fontWeight: fonts.weight.medium,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  planList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    overflowY: "auto",
    maxHeight: "50dvh",
  },
  emptyState: {
    textAlign: "center",
    padding: 32,
    color: colors.textMuted,
    fontSize: fonts.size.md,
  },
  planCard: {
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  planCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  planName: {
    fontSize: fonts.size.md,
    fontWeight: fonts.weight.semibold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  planMeta: {
    display: "flex",
    gap: 8,
    alignItems: "center",
  },
  badge: {
    fontSize: fonts.size.xs,
    padding: "2px 8px",
    borderRadius: 4,
    background: `${colors.accent.blue}18`,
    color: colors.accent.blue,
    fontWeight: fonts.weight.medium,
  },
  badgeSecondary: {
    fontSize: fonts.size.xs,
    padding: "2px 8px",
    borderRadius: 4,
    background: colors.bgAlt,
    color: colors.textSecondary,
    fontWeight: fonts.weight.medium,
  },
  activeIndicator: {
    fontSize: fonts.size.lg,
    color: colors.accent.blue,
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  input: {
    width: "100%",
    padding: "8px 12px",
    border: `1px solid ${colors.border}`,
    borderRadius: 6,
    fontSize: fonts.size.md,
    fontFamily: "inherit",
    background: colors.surface,
    color: colors.textPrimary,
  },
  actionRow: {
    display: "flex",
    gap: 8,
    alignItems: "center",
  },
  confirmBox: {
    background: colors.bgAlt,
    padding: 12,
    borderRadius: 6,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  confirmText: {
    fontSize: fonts.size.sm,
    color: colors.textSecondary,
  },
  btnPrimary: {
    padding: "8px 16px",
    background: colors.accent.blue,
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: fonts.size.sm,
    fontWeight: fonts.weight.medium,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  btnGhost: {
    padding: "8px 16px",
    background: "none",
    color: colors.textSecondary,
    border: `1px solid ${colors.border}`,
    borderRadius: 6,
    fontSize: fonts.size.sm,
    fontWeight: fonts.weight.medium,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  btnDanger: {
    padding: "8px 16px",
    background: colors.accent.red,
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: fonts.size.sm,
    fontWeight: fonts.weight.medium,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  createBtn: {
    width: "100%",
    padding: "12px",
    background: colors.accent.blue,
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: fonts.size.md,
    fontWeight: fonts.weight.semibold,
    cursor: "pointer",
  },
};
