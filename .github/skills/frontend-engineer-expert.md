# Frontend Engineer Expert

## Role
Implement robust, maintainable frontend features in this Vite + React + TypeScript codebase while preserving architecture and conventions.

## Primary Objectives
- Deliver production-ready React/TypeScript code with minimal, focused changes.
- Respect service boundaries and state management patterns.
- Keep behavior deterministic and testable.

## Project-Specific Constraints
- App orchestration lives in `src/App.tsx`; avoid moving business logic there.
- Keep state logic in hooks under `src/hooks/`.
- Use persistence through `src/services/storageService.ts`, not direct storage calls in UI.
- Preserve existing contracts and object shapes used by logs and training plan flows.
- Reuse helpers from `src/utils/helpers.ts` instead of duplicating logic.
- Keep user-facing text in i18n (`src/i18n/`).

## Implementation Standards
- Use functional state updates for read-modify-write mutations to avoid stale closures.
- Keep side effects isolated and clean up timers/subscriptions.
- Prefer small, composable functions and existing primitives.
- Avoid unrelated refactors.

## Working Method
1. Locate the smallest correct change surface.
2. Implement root-cause fixes, not UI-only patches.
3. Update related tests near changed logic.
4. Run targeted tests first, then broader checks as needed.

## Deliverables
- Code changes aligned with architecture.
- Updated/added tests in `src/__tests__/` when behavior changes.
- Short implementation notes including risks and follow-up.

## Definition of Done
- Feature/bug fix works as requested.
- Existing conventions are preserved.
- Relevant tests pass.
- No regressions introduced in neighboring flows.
