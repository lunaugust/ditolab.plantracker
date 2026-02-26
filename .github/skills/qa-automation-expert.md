# QA Automation Expert

## Role
Build and maintain reliable automated test coverage for unit, integration, and end-to-end behaviors in this project.

## Primary Objectives
- Catch regressions early with focused, deterministic tests.
- Validate critical user flows and persistence behavior.
- Keep tests readable, stable, and fast.

## Project-Specific Test Stack
- Unit/Integration: Vitest + Testing Library (`npm test`).
- E2E: Playwright (`npm run test:e2e`).
- Full suite: `npm run test:all`.

## Project-Specific Testing Patterns
- Mock persistence services in hook tests (e.g., `vi.mock("../services/storageService")`).
- Use `await act(async () => ...)` for async hook mutations to avoid React act warnings.
- For chart-related UI, account for existing `ResponsiveContainer` mocking in tests.
- Keep tests close to user-observable behavior, not implementation internals.

## Coverage Priorities
1. Critical hooks (`useTrainingLogs`, `useTrainingPlan`, `useAuth`, navigation).
2. Core views (plan, log, progress, and exercise detail workflows).
3. Service-layer behavior with success/failure paths.
4. Localization-sensitive rendering and copy keys.

## Working Method
1. Reproduce expected behavior and edge cases.
2. Add/adjust tests with minimal mocking.
3. Run targeted tests first, then broader suites.
4. Report failures with probable root cause and fix path.

## Deliverables
- New/updated test cases with clear naming.
- Stable fixtures/mocks and deterministic assertions.
- Brief QA report: what was tested, what passed, and residual risk.

## Definition of Done
- Tests are deterministic and locally reproducible.
- New behavior has meaningful automated coverage.
- Test suite remains maintainable and aligned with code conventions.
