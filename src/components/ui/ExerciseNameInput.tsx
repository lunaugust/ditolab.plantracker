import { useState, useEffect, useRef, useCallback } from "react";
import { colors, fonts } from "../../theme";
import { searchExercises } from "../../data/exerciseCatalog";
import { useI18n } from "../../i18n";

type Props = {
  value: string;
  onChange: (name: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  autoFocus?: boolean;
};

export function ExerciseNameInput({ value, onChange, placeholder, style, autoFocus }: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<{ name: string; bodyParts: string[] }[]>([]);
  const [highlighted, setHighlighted] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const doSearch = useCallback((query: string) => {
    if (query.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    searchExercises(query, 15).then((r) => {
      setResults(r);
      setOpen(r.length > 0);
      setHighlighted(-1);
    });
  }, []);

  useEffect(() => {
    doSearch(value);
  }, [value, doSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const select = (name: string) => {
    onChange(name);
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter" && highlighted >= 0) {
      e.preventDefault();
      select(results[highlighted].name);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <input
        ref={inputRef}
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => { if (value.length >= 2) doSearch(value); }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || t("common.searchExercise")}
        style={{ ...defaultInputStyle, ...style }}
      />
      {open && results.length > 0 && (
        <div style={dropdownStyle}>
          {results.map((r, i) => (
            <div
              key={r.name}
              onMouseDown={(e) => { e.preventDefault(); select(r.name); }}
              onMouseEnter={() => setHighlighted(i)}
              style={{
                ...itemStyle,
                background: i === highlighted ? colors.border : "transparent",
              }}
            >
              <span style={{ color: colors.textPrimary, fontSize: 13 }}>{r.name}</span>
              <span style={{ color: colors.textGhost, fontSize: 10, fontFamily: fonts.mono, marginLeft: 8 }}>
                {r.bodyParts.join(", ")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const defaultInputStyle: React.CSSProperties = {
  width: "100%",
  border: `1px solid ${colors.border}`,
  background: colors.bg,
  color: colors.textPrimary,
  borderRadius: 10,
  padding: "10px 12px",
  fontFamily: fonts.sans,
  fontSize: 14,
  boxSizing: "border-box",
};

const dropdownStyle: React.CSSProperties = {
  position: "absolute",
  top: "100%",
  left: 0,
  right: 0,
  zIndex: 50,
  background: colors.surface,
  border: `1px solid ${colors.border}`,
  borderRadius: 10,
  marginTop: 4,
  maxHeight: 220,
  overflowY: "auto",
  boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
};

const itemStyle: React.CSSProperties = {
  padding: "8px 12px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  borderBottom: `1px solid ${colors.border}`,
};
