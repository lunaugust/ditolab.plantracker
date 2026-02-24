/**
 * App changelog — single source of truth for "What's New" popup.
 *
 * HOW TO SHIP A RELEASE:
 *  1. Bump APP_VERSION (semver string).
 *  2. Prepend a new entry to CHANGELOG (newest first).
 *  3. The WhatsNewModal will automatically show on next load for any user
 *     whose stored "gymbuddy_seen_version" differs from APP_VERSION.
 */

export const APP_VERSION = "1.2.0";

/** localStorage key that tracks the last version the user dismissed. */
export const WHATS_NEW_STORAGE_KEY = "gymbuddy_seen_version";

export type ChangelogFeature = {
  /** A single emoji or symbol used as the bullet icon. */
  icon: string;
  /** Feature description in Spanish. */
  es: string;
  /** Feature description in English. */
  en: string;
};

export type ChangelogEntry = {
  version: string;
  /** ISO date string, e.g. "2026-02-24". */
  date: string;
  features: ChangelogFeature[];
};

/**
 * Full release history — newest first.
 * The modal only shows the FIRST (latest) entry.
 */
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.2.0",
    date: "2026-02-24",
    features: [
      {
        icon: "↑",
        es: "Importá tu plan de entrenamiento desde un PDF o CSV — la IA lo convierte automáticamente.",
        en: "Import your training plan from a PDF or CSV — AI converts it automatically.",
      },
      {
        icon: "✦",
        es: "El generador de planes con IA ahora soporta más objetivos y detecta mejor las limitaciones físicas.",
        en: "The AI plan generator now supports more goals and better handles physical limitations.",
      },
    ],
  },
  {
    version: "1.1.0",
    date: "2026-02-01",
    features: [
      {
        icon: "✦",
        es: "Generador de planes de entrenamiento con inteligencia artificial (Gemini).",
        en: "AI-powered training plan generator (Gemini).",
      },
      {
        icon: "💬",
        es: "Podés enviarnos comentarios directamente desde la app.",
        en: "You can now send us feedback directly from the app.",
      },
    ],
  },
  {
    version: "1.0.0",
    date: "2026-01-15",
    features: [
      {
        icon: "🚀",
        es: "Lanzamiento inicial: plan de entrenamiento, registro de series y progresión por ejercicio.",
        en: "Initial launch: training plan, set logging, and per-exercise progress tracking.",
      },
    ],
  },
];
