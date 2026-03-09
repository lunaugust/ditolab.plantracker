/**
 * App changelog — single source of truth for "What's New" popup.
 *
 * HOW TO SHIP A RELEASE:
 *  1. Bump APP_VERSION (semver string).
 *  2. Prepend a new entry to CHANGELOG (newest first).
 *  3. The WhatsNewModal will automatically show on next load for any user
 *     whose stored "gymbuddy_seen_version" differs from APP_VERSION.
 */

export const APP_VERSION = "1.9.0";

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
 * The modal shows the FIRST (latest) entry and the immediately previous entry.
 */
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.9.0",
    date: "2026-03-09",
    features: [
      {
        icon: "📰",
        es: "Nuevo rediseño Editorial Performance en toda la app con jerarquía más clara, métricas destacadas y superficies más legibles en móvil.",
        en: "New Editorial Performance redesign across the app with clearer hierarchy, stronger metrics, and more legible mobile surfaces.",
      },
      {
        icon: "📱",
        es: "Plan, detalle, historial, generador, importador y modales ahora comparten el mismo lenguaje visual para una experiencia más consistente.",
        en: "Plan, detail, history, generator, importer, and modal flows now share the same visual language for a more consistent experience.",
      },
    ],
  },
  {
    version: "1.8.0",
    date: "2026-03-09",
    features: [
      {
        icon: "🎨",
        es: "Nueva galeria de rediseno con cuatro conceptos mobile-first para comparar estilos y jerarquias completas de la app.",
        en: "New redesign gallery with four mobile-first concepts so you can compare full app styles and hierarchy directions.",
      },
      {
        icon: "🧭",
        es: "Los mocks cubren plan, detalle de ejercicio, historial, generador, importador y overlays para evaluar la experiencia completa.",
        en: "The mocks now cover plan, exercise detail, history, generator, importer, and overlays so you can review the full experience.",
      },
    ],
  },
  {
    version: "1.7.0",
    date: "2026-03-09",
    features: [
      {
        icon: "📚",
        es: "Nuevo historial de sesiones con pantalla dedicada: revisá entrenamientos anteriores, duración y progreso por ejercicio.",
        en: "New dedicated session history screen: review previous workouts, duration, and per-exercise progress.",
      },
      {
        icon: "↩",
        es: "Las sesiones activas ahora sobreviven al volver al plan y se pueden reanudar después.",
        en: "Active sessions now survive going back to the plan and can be resumed later.",
      },
    ],
  },
  {
    version: "1.6.0",
    date: "2026-03-06",
    features: [
      {
        icon: "🏋️",
        es: "Nueva sesión de entrenamiento: iniciá por día, seguí ejercicio por ejercicio y marcá avances en orden.",
        en: "New workout session mode: start by day, move exercise by exercise, and track progress in sequence.",
      },
      {
        icon: "⏱️",
        es: "Timer total de sesión y contador de descanso entre ejercicios, con opción para saltar el descanso.",
        en: "Session timer and rest countdown between exercises, with an option to skip rest.",
      },
    ],
  },
  {
    version: "1.5.0",
    date: "2026-02-26",
    features: [
      {
        icon: "⚡",
        es: "Nuevo banner de \"Usar último\" en Registrar: reutilizá peso y reps con un toque.",
        en: "New \"Use last\" banner in Log: reuse weight and reps with one tap.",
      },
      {
        icon: "🎯",
        es: "Stepper y atajos de repeticiones para cargar sets más rápido desde el móvil.",
        en: "Reps stepper and quick picks make logging sets faster on mobile.",
      },
    ],
  },
  {
    version: "1.4.0",
    date: "2026-02-26",
    features: [
      {
        icon: "↩",
        es: "Botón volver rediseñado: ahora es más visible y fácil de encontrar.",
        en: "Redesigned back button: now more visible and easier to find.",
      },
      {
        icon: "🎬",
        es: "GIFs de ejercicios: ahora podés ver una animación de cómo hacer cada ejercicio.",
        en: "Exercise GIFs: now you can see an animation of how to perform each exercise.",
      },
      {
        icon: "⚖",
        es: "Entrada de peso mejorada: campo más ancho con botones ±2.5 kg para ajustes precisos.",
        en: "Improved weight input: wider field with ±2.5 kg buttons for precise adjustments.",
      },
    ],
  },
  {
    version: "1.3.0",
    date: "2026-02-25",
    features: [
      {
        icon: "🧭",
        es: "Nuevo flujo unificado: desde Plan tocás un ejercicio y navegás a su vista de detalle en pantalla completa.",
        en: "New unified flow: from Plan, tap an exercise to navigate to its full-screen detail view.",
      },
      {
        icon: "↩",
        es: "Navegación simplificada: botón volver para regresar al plan, con una interfaz enfocada en solo dos pestañas (Registrar y Progresión).",
        en: "Simplified navigation: back button returns to plan, with a focused two-tab interface (Log and Progress).",
      },
    ],
  },
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
