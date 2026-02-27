# Copilot Instructions for this codebase

## Big picture architecture
- This is a Vite + React single-page app. Root orchestration lives in `src/App.tsx`: it wires `useNavigation`, `useTrainingLogs`, `useAuth`, and `useTrainingPlan`, then renders view components from `src/components/views/`.
- The main screen is `PlanView`. Clicking an exercise navigates to `ExerciseDetailView` (full-screen), which contains **Log** and **Progress** tabs. There are no separate top-level Log or Progress view screens.
- Navigation state is local UI state (`src/hooks/useNavigation.ts`): active training day and selected exercise. When `selectedExercise` is non-null, `ExerciseDetailView` is shown; otherwise `PlanView` is shown.
- Training log state is persistence-backed (`src/hooks/useTrainingLogs.ts`): bootstrap from storage, mutate (`addLog`, `deleteLog`), persist, and expose save feedback.
- Training plan state is editable and persistence-backed (`src/hooks/useTrainingPlan.ts`): bootstrap from storage or static defaults, mutate (`saveDay`, `addDay`, `removeDay`), persist, and expose save feedback.
- Static default workouts live in `src/data/trainingPlan.js` (`TRAINING_PLAN`, `DAY_KEYS`, `DAY_COLORS`, `ALL_EXERCISES`).

## Service boundaries and data flow
- Persistence boundary is `src/services/storageService.js`; UI/hooks should call `loadLogs` / `persistLogs` / `loadTrainingPlan` / `persistTrainingPlan`, not `localStorage` or Firestore directly.
- For authenticated users, Firestore is the primary store; localStorage is a best-effort cache. If Firestore succeeds but localStorage fails, the operation does **not** throw.
- Guest users (scope `"guest"`) use localStorage only.
- Log object shape is `Record<exerciseId, LogEntry[]>`.
- `addLog` ignores entries only when both `weight` and `reps` are empty.
- Helper transforms for display/charting belong in `src/utils/helpers.js` (`getLastLog`, `computeWeightStats`, `buildChartData`, `formatDate`, `padIndex`, `makeExerciseId`).

## Hooks — state management patterns
- **Stale-closure prevention**: `useTrainingLogs` and `useTrainingPlan` use a **mutable ref pattern** — a `logsRef` / `trainingPlanRef` is kept in sync with state via `useEffect`, and all mutations read from `ref.current` then call `setState` + `persist` separately. Do not call `persist` inside a `setState` functional updater.
- **Timer cleanup**: `useTrainingLogs` and `useTrainingPlan` store `setTimeout` IDs in a `useRef` and clear them on unmount to avoid setting state on unmounted components.
- Keep stateful logic in hooks (`src/hooks/`), not in `App.tsx` or layout components.

## Internationalisation (i18n)
- All UI copy is served through `src/i18n/` (`translations.ts` + context in `index.tsx`).
- Supported languages: `es` (default), `en`. Language is stored in `localStorage` key `gymbuddy_lang`.
- Use `t("key.path")` from `useI18n()` for all user-facing string literals; never hardcode UI text.
- Translation keys support interpolation: `t("plan.dayNameTemplate", { n: 2 })`.

## Authentication
- Firebase Auth (Google sign-in) is optional; the app gracefully degrades to guest mode when Firebase env vars are missing.
- Auth service lives in `src/services/authService.js`; Firebase client init in `src/services/firebaseClient.js`.
- `useAuth` hook (`src/hooks/useAuth.js`) encapsulates auth state, loading, error, login, and logout.
- The header title displays the authenticated user's first name, falling back to "GymBuddy" for guests.

## UI and styling conventions
- Styling is primarily inline style objects inside components (see `src/components/views/*.tsx`, `src/components/layout/Header.tsx`).
- Reuse theme tokens from `src/theme/tokens.ts` via `src/theme/index.ts`; do not introduce ad-hoc colors/fonts. **Never hardcode hex colours** (e.g. `#222`); always use `colors.*` tokens.
- Shared UI primitives are re-exported from `src/components/ui/index.ts`; prefer composing existing primitives before creating new ones.
- Shared utilities (e.g. `makeExerciseId`) live in `src/utils/helpers.ts`; do not duplicate logic across components and hooks.

## Testing and verification workflow
- Unit/integration tests: `npm test` (Vitest, jsdom).
- Watch mode: `npm run test:watch`; coverage: `npm run test:coverage`.
- E2E tests: `npm run test:e2e` (Playwright with `webServer.command = npm run dev`).
- Full suite: `npm run test:all`.
- When changing chart UI, note tests mock `ResponsiveContainer` in `src/__tests__/App.test.jsx`.
- Hook tests mock persistence service (`vi.mock("../services/storageService")`); follow this pattern for deterministic tests.
- When a hook mutation triggers async state updates (e.g. `persist`), use `await act(async () => ...)` in tests to avoid React `act()` warnings.

## Project-specific implementation patterns
- Exercise identity is always `exercise.id` from the training plan; never use display name as a key.
- Generate new exercise IDs via the shared `makeExerciseId()` utility from `src/utils/helpers.ts`.
- For new features touching logs, update: view usage, hook behavior, and helper/test coverage together.
- `PlanView` manages its own draft editing state locally; it does **not** receive `addExercise`/`removeExercise` as props.

## Changelog and What's New policy
- Every time a new feature is introduced or the interface is redesigned, update `src/data/changelog.ts` as part of the same change.
- Keep the What's New pop-up/modal configured to display exactly the latest changelog entry and the immediately previous entry.

## Config and integration points
- Build/dev scripts are defined in `package.json` (`dev`, `build`, `preview`, `test:*`).
- Vite config in `vite.config.ts` includes PWA setup (`vite-plugin-pwa`) and Vitest settings.
- Global CSS (`src/styles/global.css`) handles mobile-safe viewport/safe-area behavior; avoid duplicating these behaviors in components.
- `src/index.ts` is a backward-compatibility re-export of `App`; the real entry point is `src/main.tsx`.

## AI Plan Generator
- The app supports AI-generated training plans via a multi-step wizard (`PlanGeneratorWizard`).
- **Firebase AI Logic** (`firebase/ai` with `GoogleAIBackend`) calls **Gemini 2.0 Flash** for authenticated users. The `ai` instance is exported from `src/services/firebaseClient.ts`.
- **Rule-based fallback** (`src/services/ruleBasedPlanGenerator.ts`) generates plans offline using curated exercise templates. Used automatically when Firebase AI is unavailable (guest mode, missing config, API failure).
- Generator config (wizard options, defaults, colors) lives in `src/data/planGeneratorConfig.ts`.
- AI service lives in `src/services/aiPlanGenerator.ts`; it exports `isAIAvailable()` and `generateTrainingPlan(form, language)` which returns `{ plan, source: "ai" | "rules" }`.
- The wizard collects: experience level, goal, limitations (free text), days per week, and minutes per session.
- The limitations textarea shows a localized privacy notice (`generator.limitationsPrivacyNotice`) so users know their text is sent to the AI.
- `useTrainingPlan` exposes `replacePlan(newPlan)` to swap the entire plan with a generated one.
- The "✦ Generate" button in `PlanView` opens the wizard as a full-screen overlay managed by `App.tsx` state (`showGenerator`).
- All generator UI strings use `generator.*` i18n keys; both ES and EN translations are complete.
- Generator tests live in `src/__tests__/planGenerator.test.ts` (16 tests covering shape, volume scaling, day counts, time limits, and translations).

## Agent Skills
- Role-specific skill guides live in `.github/skills/`.
- Start at `.github/skills/README.md` to choose the right role profile for the task:
	- UX/UI Expert (`.github/skills/ux-ui-expert.md`)
	- Frontend Engineer Expert (`.github/skills/frontend-engineer-expert.md`)
	- QA Automation Expert (`.github/skills/qa-automation-expert.md`)
