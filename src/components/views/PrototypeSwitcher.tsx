import { colors, fonts } from "../../theme";

export type ProtoKey = "A" | "B" | "C";

const OPTIONS: { key: ProtoKey; label: string; desc: string }[] = [
  { key: "A", label: "A", desc: "Inline" },
  { key: "B", label: "B", desc: "Sheet" },
  { key: "C", label: "C", desc: "Detail" },
];

export const PROTO_STORAGE_KEY = "gymbuddy_proto";

/**
 * Small prototype switcher bar shown at the top of each unified plan prototype.
 * Lets the user cycle between the 3 UI pattern options.
 */
export function PrototypeSwitcher({
  active,
  onChange,
}: {
  active: ProtoKey;
  onChange: (p: ProtoKey) => void;
}) {
  return (
    <div style={styles.container}>
      <span style={styles.label}>PROTOTYPE</span>
      <div style={styles.buttons}>
        {OPTIONS.map(({ key, label, desc }) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              style={{
                ...styles.btn,
                background: isActive ? `${colors.accent.orange}1a` : "transparent",
                color: isActive ? colors.accent.orange : colors.textMuted,
                borderColor: isActive ? colors.accent.orange : colors.border,
              }}
            >
              <span style={{ fontWeight: 700 }}>{label}</span>
              <span style={styles.desc}> {desc}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
    paddingBottom: 12,
    borderBottom: `1px solid ${colors.borderDim}`,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.textGhost,
    letterSpacing: 2,
    textTransform: "uppercase" as const,
    flexShrink: 0,
  },
  buttons: {
    display: "flex",
    gap: 4,
  },
  btn: {
    fontFamily: fonts.mono,
    fontSize: 10,
    padding: "4px 8px",
    borderRadius: 8,
    border: "1px solid",
    cursor: "pointer",
    lineHeight: 1.5,
    WebkitTapHighlightColor: "transparent",
  },
  desc: {
    opacity: 0.65,
    fontWeight: 400,
  },
};
