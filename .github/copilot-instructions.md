# Copilot Instructions for this codebase

## Big picture architecture
- This is a Vite + React single-page app with 3 views: `plan`, `log`, `progress`.
- Root orchestration lives in `src/App.jsx`: it wires `useNavigation`, `useTrainingLogs`, `useAuth`, and `useTrainingPlan`, then renders view components from `src/components/views/`.
- Navigation state is local UI state (`src/hooks/useNavigation.js`): current view, active day, selected exercise.
- Training log state is persistence-backed (`src/hooks/useTrainingLogs.js`): bootstrap from storage, mutate (`addLog`, `deleteLog`), persist, and expose save feedback.
- Training plan state is editable and persistence-backed (`src/hooks/useTrainingPlan.js`): bootstrap from storage or static defaults, mutate (`saveDay`, `addDay`, `removeDay`), persist, and expose save feedback.
- Static default workouts live in `src/data/trainingPlan.js` (`TRAINING_PLAN`, `DAY_KEYS`, `DAY_COLORS`, `ALL_EXERCISES`).

## Service boundaries and data flow
- Persistence boundary is `src/services/storageService.js`; UI/hooks should call `loadLogs` / `persistLogs` / `loadTrainingPlan` / `persistTrainingPlan`, not `localStorage` or Firestore directly.
- For authenticated users, Firestore is the primary store; localStorage is a best-effort cache. If Firestore succeeds but localStorage fails, the operation does **not** throw.
- Guest users (scope `"guest"`) use localStorage only.
- Log object shape is `Record<exerciseId, LogEntry[]>`.
- `addLog` ignores entries only when both `weight` and `reps` are empty.
- Helper transforms for display/charting belong in `src/utils/helpers.js` (`getLastLog`, `computeWeightStats`, `buildChartData`, `formatDate`, `padIndex`, `makeExerciseId`).

## Hooks — state management patterns
- **Stale-closure prevention**: `useTrainingLogs` mutations (`addLog`, `deleteLog`) use React's **functional state updater** (`setLogs(prev => ...)`) to always read the latest state. Follow this pattern for any new mutation that reads-then-writes.
- **Timer cleanup**: `useTrainingLogs` and `useTrainingPlan` store `setTimeout` IDs in a `useRef` and clear them on unmount to avoid setting state on unmounted components.
- Keep stateful logic in hooks (`src/hooks/`), not in `App.jsx` or layout components.

## Internationalisation (i18n)
- All UI copy is served through `src/i18n/` (`translations.js` + context in `index.jsx`).
- Supported languages: `es` (default), `en`. Language is stored in `localStorage` key `gymbuddy_lang`.
- Use `t("key.path")` from `useI18n()` for all user-facing string literals; never hardcode UI text.
- Translation keys support interpolation: `t("plan.dayNameTemplate", { n: 2 })`.

## Authentication
- Firebase Auth (Google sign-in) is optional; the app gracefully degrades to guest mode when Firebase env vars are missing.
- Auth service lives in `src/services/authService.js`; Firebase client init in `src/services/firebaseClient.js`.
- `useAuth` hook (`src/hooks/useAuth.js`) encapsulates auth state, loading, error, login, and logout.
- The header title displays the authenticated user's first name, falling back to "GymBuddy" for guests.

## UI and styling conventions
- Styling is primarily inline style objects inside components (see `src/components/views/*.jsx`, `src/components/layout/Header.jsx`).
- Reuse theme tokens from `src/theme/tokens.js` via `src/theme/index.js`; do not introduce ad-hoc colors/fonts. **Never hardcode hex colours** (e.g. `#222`); always use `colors.*` tokens.
- Shared UI primitives are re-exported from `src/components/ui/index.js`; prefer composing existing primitives before creating new ones.
- Shared utilities (e.g. `makeExerciseId`) live in `src/utils/helpers.js`; do not duplicate logic across components and hooks.

## Testing and verification workflow
- Unit/integration tests: `npm test` (Vitest, jsdom).
- Watch mode: `npm run test:watch`; coverage: `npm run test:coverage`.
- E2E tests: `npm run test:e2e` (Playwright with `webServer.command = npm run dev`).
- Full suite: `npm run test:all`.
- When changing chart UI, note tests mock `ResponsiveContainer` in `src/__tests__/App.test.jsx`.
- Hook tests mock persistence service (`vi.mock("../services/storageService")`); follow this pattern for deterministic tests.
- When a hook mutation triggers async state updates (e.g. `persist`), use `await act(async () => ...)` in tests to avoid React `act()` warnings.

## Project-specific implementation patterns
- Preserve the view-key contract (`plan`, `log`, `progress`) used across `NAV_ITEMS`, navigation hook, and header nav.
- Exercise identity is always `exercise.id` from the training plan; never use display name as a key.
- Generate new exercise IDs via the shared `makeExerciseId()` utility from `src/utils/helpers.js`.
- For new features touching logs, update: view usage, hook behavior, and helper/test coverage together.
- `PlanView` manages its own draft editing state locally; it does **not** receive `addExercise`/`removeExercise` as props.

## Config and integration points
- Build/dev scripts are defined in `package.json` (`dev`, `build`, `preview`, `test:*`).
- Vite config in `vite.config.js` includes PWA setup (`vite-plugin-pwa`) and Vitest settings.
- Global CSS (`src/styles/global.css`) handles mobile-safe viewport/safe-area behavior; avoid duplicating these behaviors in components.
- `src/index.js` is a backward-compatibility re-export of `App`; the real entry point is `src/main.jsx`.

## AI Plan Generator
- The app supports AI-generated training plans via a multi-step wizard (`PlanGeneratorWizard`).
- **Firebase AI Logic** (`firebase/ai` with `GoogleAIBackend`) calls **Gemini 2.0 Flash** for authenticated users. The `ai` instance is exported from `src/services/firebaseClient.js`.
- **Rule-based fallback** (`src/services/ruleBasedPlanGenerator.js`) generates plans offline using curated exercise templates. Used automatically when Firebase AI is unavailable (guest mode, missing config, API failure).
- Generator config (wizard options, defaults, colors) lives in `src/data/planGeneratorConfig.js`.
- AI service lives in `src/services/aiPlanGenerator.js`; it exports `isAIAvailable()` and `generateTrainingPlan(form, language)` which returns `{ plan, source: "ai" | "rules" }`.
- The wizard collects: experience level, goal, limitations (free text), days per week, and minutes per session.
- `useTrainingPlan` exposes `replacePlan(newPlan)` to swap the entire plan with a generated one.
- The "✦ Generate" button in `PlanView` opens the wizard as a full-screen overlay managed by `App.jsx` state (`showGenerator`).
- All generator UI strings use `generator.*` i18n keys; both ES and EN translations are complete.
- Generator tests live in `src/__tests__/planGenerator.test.js` (16 tests covering shape, volume scaling, day counts, time limits, and translations).
