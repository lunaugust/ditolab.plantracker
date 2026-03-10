import { useState, useEffect, useRef, useCallback } from "react";
import { searchExercises } from "../../data/exerciseCatalog";
import { useI18n } from "../../i18n";
import { useExerciseGif } from "../../hooks";
import { useLocalizedExerciseName } from "../../hooks/useLocalizedExerciseName";
import classes from "./ExerciseNameInput.module.css";

type SearchResult = {
  exerciseId: string;
  name: string;
  nameEs?: string;
  bodyParts: string[];
};

type Props = {
  value: string;
  onChange: (name: string, exerciseId?: string) => void;
  placeholder?: string;
  inputClassName?: string;
  containerClassName?: string;
  autoFocus?: boolean;
};

export function ExerciseNameInput({ value, onChange, placeholder, inputClassName, containerClassName, autoFocus }: Props) {
  const { t, language } = useI18n();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [inputText, setInputText] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [highlighted, setHighlighted] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const localizedValue = useLocalizedExerciseName(value);
  const inputDisplayValue = editing ? inputText : localizedValue;
  const previewResult = results[highlighted] ?? results[0] ?? null;
  const previewGifUrl = useExerciseGif(previewResult?.exerciseId, previewResult?.name);

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
    if (editing) doSearch(inputText);
  }, [inputText, doSearch, editing]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setEditing(false);
        setInputText("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const select = (name: string, exerciseId?: string, localizedName?: string) => {
    onChange(name, exerciseId);
    setInputText(localizedName ?? name);
    setOpen(false);
    setEditing(false);
    inputRef.current?.blur();
  };

  const displayName = (r: { name: string; nameEs?: string }) => {
    if (language === "es" && r.nameEs) return r.nameEs;
    return r.name;
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
      const r = results[highlighted];
      select(r.name, r.exerciseId, displayName(r));
    } else if (e.key === "Escape") {
      setOpen(false);
      setEditing(false);
      setInputText("");
    }
  };

  return (
    <div ref={containerRef} className={`${classes.container}${containerClassName ? ` ${containerClassName}` : ""}`}>
      <input
        ref={inputRef}
        autoFocus={autoFocus}
        value={inputDisplayValue}
        onChange={(e) => { setInputText(e.target.value); onChange(e.target.value); }}
        onFocus={() => { setEditing(true); setInputText(localizedValue); if (localizedValue.length >= 2) doSearch(localizedValue); }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || t("common.searchExercise")}
        className={`${classes.input}${inputClassName ? ` ${inputClassName}` : ""}`}
      />
      {open && results.length > 0 && (
        <div className={classes.dropdown}>
          {previewResult && previewGifUrl && (
            <div className={classes.previewCard} aria-live="polite">
              <div className={classes.previewMediaWrap}>
                <img
                  src={previewGifUrl}
                  alt={`${displayName(previewResult)} ${t("nav.gif")}`}
                  className={classes.previewMedia}
                />
              </div>
              <div className={classes.previewContent}>
                <div className={classes.previewEyebrow}>{t("nav.gif")}</div>
                <div className={classes.previewName}>{displayName(previewResult)}</div>
                <div className={classes.previewMeta}>{previewResult.bodyParts.join(", ")}</div>
              </div>
            </div>
          )}
          {results.map((r, i) => (
            <div
              key={r.exerciseId}
              onMouseDown={(e) => { e.preventDefault(); select(r.name, r.exerciseId, displayName(r)); }}
              onMouseEnter={() => setHighlighted(i)}
              className={`${classes.item}${i === highlighted ? ` ${classes.itemActive}` : ""}`}
            >
              <span className={classes.name}>{displayName(r)}</span>
              <span className={classes.meta}>
                {r.bodyParts.join(", ")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
