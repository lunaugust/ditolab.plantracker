import { useState, useRef, useEffect } from "react";
import { colors, fonts } from "../../theme";
import { getAllExerciseNames } from "../../data/exerciseLibrary";
import type { Language } from "../../services/types";

/**
 * Autocomplete input for exercise names
 *
 * Shows suggestions from the exercise library as user types.
 * Allows custom values not in the library.
 */
export function ExerciseAutocomplete({
  value,
  onChange,
  placeholder,
  language = "es",
  style,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  language?: Language;
  style?: React.CSSProperties;
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Get all exercise names for the current language
  const allExercises = getAllExerciseNames(language);

  useEffect(() => {
    if (!value || value.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Filter exercises that match the input
    const searchTerm = value.toLowerCase();
    const matches = allExercises
      .filter((name) => name.toLowerCase().includes(searchTerm))
      .slice(0, 8); // Limit to 8 suggestions

    setSuggestions(matches);
    setShowSuggestions(matches.length > 0);
    setHighlightedIndex(-1);
  }, [value, allExercises]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelectSuggestion(suggestions[highlightedIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleBlur = () => {
    // Delay to allow click on suggestion to register
    setTimeout(() => {
      setShowSuggestions(false);
    }, 150);
  };

  return (
    <div style={styles.container}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (suggestions.length > 0) {
            setShowSuggestions(true);
          }
        }}
        onBlur={handleBlur}
        placeholder={placeholder}
        style={{ ...styles.input, ...style }}
      />

      {showSuggestions && suggestions.length > 0 && (
        <div ref={suggestionsRef} style={styles.suggestionsDropdown}>
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion}
              style={{
                ...styles.suggestionItem,
                ...(index === highlightedIndex
                  ? styles.suggestionItemHighlighted
                  : {}),
              }}
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent blur
                handleSelectSuggestion(suggestion);
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <span style={styles.suggestionIcon}>📚</span>
              <span style={styles.suggestionText}>{suggestion}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: "relative",
    width: "100%",
  },
  input: {
    width: "100%",
    border: `1px solid ${colors.border}`,
    background: colors.bg,
    color: colors.textPrimary,
    borderRadius: 10,
    padding: "10px 12px",
    fontFamily: fonts.sans,
    fontSize: 14,
    outline: "none",
  },
  suggestionsDropdown: {
    position: "absolute",
    top: "calc(100% + 4px)",
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: 10,
    maxHeight: 300,
    overflowY: "auto",
    zIndex: 1000,
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
  },
  suggestionItem: {
    padding: "10px 12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 8,
    transition: "background 0.1s",
  },
  suggestionItemHighlighted: {
    backgroundColor: colors.surfaceAlt,
  },
  suggestionIcon: {
    fontSize: 14,
    opacity: 0.6,
  },
  suggestionText: {
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
  },
};
