# Copilot Instructions for this codebase

## Big picture architecture
- This is a Vite + React single-page app with 3 views: `plan`, `log`, `progress`.
- Root orchestration lives in `src/App.jsx`: it wires `useNavigation` + `useTrainingLogs` and renders view components from `src/components/views/`.
- Navigation state is local UI state (`src/hooks/useNavigation.js`): current view, active day, selected exercise.
- Training log state is persistence-backed (`src/hooks/useTrainingLogs.js`): bootstrap from storage, mutate (`addLog`, `deleteLog`), persist, and expose save feedback.
- Data source for workouts is static config in `src/data/trainingPlan.js` (`TRAINING_PLAN`, `DAY_KEYS`, `DAY_COLORS`, `ALL_EXERCISES`).

## Service boundaries and data flow
- Persistence boundary is `src/services/storageService.js`; UI/hooks should call `loadLogs` / `persistLogs`, not `localStorage` directly.
- Log object shape is `Record<exerciseId, LogEntry[]>`; storage key is `augusto_logs`.
- `addLog` ignores entries only when both `weight` and `reps` are empty.
- Helper transforms for display/charting belong in `src/utils/helpers.js` (`getLastLog`, `computeWeightStats`, `buildChartData`, `formatDate`).

## UI and styling conventions
- Styling is primarily inline style objects inside components (see `src/components/views/*.jsx`, `src/components/layout/Header.jsx`).
- Reuse theme tokens from `src/theme/tokens.js` via `src/theme/index.js`; do not introduce ad-hoc colors/fonts.
- UI copy is Spanish and fitness-specific (e.g., `SELECCIONÁ UN EJERCICIO`, `Guardar registro`, `Progresión`). Keep wording consistent.
- Shared UI primitives are re-exported from `src/components/ui/index.js`; prefer composing existing primitives before creating new ones.

## Testing and verification workflow
- Unit/integration tests: `npm test` (Vitest, jsdom).
- Watch mode: `npm run test:watch`; coverage: `npm run test:coverage`.
- E2E tests: `npm run test:e2e` (Playwright with `webServer.command = npm run dev`).
- Full suite: `npm run test:all`.
- When changing chart UI, note tests mock `ResponsiveContainer` in `src/__tests__/App.test.jsx`.
- Hook tests mock persistence service (`vi.mock("../services/storageService")`); follow this pattern for deterministic tests.

## Project-specific implementation patterns
- Keep stateful logic in hooks (`src/hooks/`), not in `App.jsx` or layout components.
- Preserve the view-key contract (`plan`, `log`, `progress`) used across `NAV_ITEMS`, navigation hook, and header nav.
- Exercise identity is always `exercise.id` from `TRAINING_PLAN`; never use display name as a key.
- For new features touching logs, update: view usage, hook behavior, and helper/test coverage together.

## Config and integration points
- Build/dev scripts are defined in `package.json` (`dev`, `build`, `preview`, `test:*`).
- Vite config in `vite.config.js` includes PWA setup (`vite-plugin-pwa`) and Vitest settings.
- Global CSS (`src/styles/global.css`) handles mobile-safe viewport/safe-area behavior; avoid duplicating these behaviors in components.
