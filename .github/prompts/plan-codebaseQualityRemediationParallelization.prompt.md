## Plan: Codebase Quality Remediation Parallelization (DRAFT)

Discovery is complete across app architecture, hooks, services, UI consistency, tests, and config. The highest-risk issues are architecture/documentation drift, stale E2E coverage, mutation-pattern risks in state hooks, and disabled TypeScript safety. Based on your decisions, this plan assumes unified flow is canonical, legacy components are removed now, TS hardening is aggressive, and privacy work is notice-only (no retention change). The sequence below is optimized for parallel cloud agents with clear dependency gates and low merge-conflict overlap.

**Findings Snapshot**
- High risk: architecture contract mismatch between instructions and runtime ([.github/copilot-instructions.md](.github/copilot-instructions.md), [src/App.tsx](src/App.tsx#L131-L170), [src/components/layout/Header.tsx](src/components/layout/Header.tsx#L15-L18)).
- High risk: stale E2E paths targeting old nav ([e2e/app.spec.ts](e2e/app.spec.ts#L30-L160)).
- High risk: log mutation/persist pattern may cause non-deterministic updates ([src/hooks/useTrainingLogs.ts](src/hooks/useTrainingLogs.ts#L43-L78)).
- Medium risk: non-functional updater pattern in plan mutations ([src/hooks/useTrainingPlan.ts](src/hooks/useTrainingPlan.ts#L130-L199)).
- High debt: TS guardrails weakened ([tsconfig.json](tsconfig.json#L12-L13)).
- Medium inconsistency: i18n and theme-token policy violations ([src/components/layout/WhatsNewModal.tsx](src/components/layout/WhatsNewModal.tsx#L38), [src/components/views/PlanGeneratorWizard.tsx](src/components/views/PlanGeneratorWizard.tsx#L384), [src/styles/global.css](src/styles/global.css#L14-L22)).

**Steps**
1. Freeze architecture contract and cleanup targets in docs.
   - Update canonical flow language in [.github/copilot-instructions.md](.github/copilot-instructions.md).
   - Ensure skills index alignment in [.github/skills/README.md](.github/skills/README.md).
   - Record this as governance baseline before refactors.

2. Remove legacy unused UI surfaces and prune exports/imports.
   - Remove legacy view/component files and exports from [src/components/views/index.ts](src/components/views/index.ts) and [src/components/ui/index.ts](src/components/ui/index.ts).
   - Candidate removals discovered: [src/components/views/LogView.tsx](src/components/views/LogView.tsx), [src/components/views/ProgressView.tsx](src/components/views/ProgressView.tsx), [src/components/ui/SlideOutPanel.tsx](src/components/ui/SlideOutPanel.tsx), [src/components/ui/ExerciseDetailPanel.tsx](src/components/ui/ExerciseDetailPanel.tsx).
   - Run compile/import checks immediately after pruning.

3. Stabilize state mutation integrity in hooks.
   - Refactor updater/persist flow in [src/hooks/useTrainingLogs.ts](src/hooks/useTrainingLogs.ts) around persist, addLog, deleteLog.
   - Convert read-modify-write mutations to functional updater pattern in [src/hooks/useTrainingPlan.ts](src/hooks/useTrainingPlan.ts) for saveDay, addDay, removeDay, addExercise, removeExercise.
   - Preserve existing service boundaries in [src/services/storageService.ts](src/services/storageService.ts).

4. Rebuild E2E to current unified UX contract.
   - Rewrite scenarios in [e2e/app.spec.ts](e2e/app.spec.ts) to match unified plan + full-screen exercise detail flow.
   - Harden selectors against translated text volatility where possible.
   - Keep only critical journeys first: open app, navigate exercise detail, log set, verify progress signal.

5. Close i18n and copy consistency gaps.
   - Replace literals with translation keys in [src/components/layout/WhatsNewModal.tsx](src/components/layout/WhatsNewModal.tsx), [src/components/views/PlanGeneratorWizard.tsx](src/components/views/PlanGeneratorWizard.tsx), [src/components/layout/AuthScreen.tsx](src/components/layout/AuthScreen.tsx).
   - Add/normalize keys in [src/i18n/translations.ts](src/i18n/translations.ts).
   - Validate both ES and EN paths.

6. Execute theme/token compliance sweep.
   - Replace hardcoded colors/fonts in [src/components/views/ExerciseDetailView.tsx](src/components/views/ExerciseDetailView.tsx), [src/components/views/PlanImportWizard.tsx](src/components/views/PlanImportWizard.tsx), and [src/styles/global.css](src/styles/global.css).
   - Use approved tokens from [src/theme/tokens.ts](src/theme/tokens.ts) and exports in [src/theme/index.ts](src/theme/index.ts).

7. Aggressive TypeScript hardening rollout.
   - Remove noCheck and tighten compiler constraints in [tsconfig.json](tsconfig.json).
   - Fix surfaced typing issues first in hooks/services touched above, then views.
   - Prioritize high-churn modules: [src/hooks/useTrainingLogs.ts](src/hooks/useTrainingLogs.ts), [src/hooks/useTrainingPlan.ts](src/hooks/useTrainingPlan.ts), [src/services/aiPlanGenerator.ts](src/services/aiPlanGenerator.ts), [src/services/planImporter.ts](src/services/planImporter.ts).

8. Privacy notice-only changes for sensitive text paths.
   - Add clear user-facing notice around free-text AI limitations and feedback submission flows in [src/components/views/PlanGeneratorWizard.tsx](src/components/views/PlanGeneratorWizard.tsx) and [src/components/layout/FeedbackModal.tsx](src/components/layout/FeedbackModal.tsx).
   - Keep storage behavior unchanged per your decision; do not implement retention/expiry.
   - Ensure copy is localized in [src/i18n/translations.ts](src/i18n/translations.ts).

9. Test debt closure and confidence gates.
   - Expand importer behavioral tests in [src/__tests__/planImporter.test.ts](src/__tests__/planImporter.test.ts) to include importPlanFromFile success/error boundaries.
   - Strengthen authenticated-storage path tests in [src/__tests__/storageService.test.ts](src/__tests__/storageService.test.ts).
   - Update impacted hook tests in [src/__tests__/useTrainingLogs.test.ts](src/__tests__/useTrainingLogs.test.ts) and [src/__tests__/useTrainingPlan.test.ts](src/__tests__/useTrainingPlan.test.ts).

10. Final integration pass and release readiness.
   - Run unit, E2E, and production build.
   - Produce a risk log with remaining non-blocking debt and deferred items.

**Parallel Cloud-Agent Workstreams**
- Agent A (M): Docs/contract alignment and governance baseline.
- Agent B (M): Legacy component removal and export pruning.
- Agent C (M): Hook mutation integrity refactor + hook tests.
- Agent D (L): E2E rewrite for unified UX.
- Agent E (S): i18n literal sweep + translations update.
- Agent F (S): Theme/token compliance sweep.
- Agent G (L): TS aggressive hardening and fix cascade.
- Agent H (S): Privacy notice-only UX/copy implementation.
- Agent I (M): Importer/storage test debt closure.

**Dependency & Merge Strategy**
- Wave 1 (parallel): A, E, F, H.
- Wave 2 (parallel, after A baseline): B, C, I.
- Wave 3 (after B/C mostly merged): G.
- Wave 4 (after C + primary UX stabilized): D.
- Merge order: A → E/F/H → B/C/I → G → D.
- Conflict hotspots to isolate: [src/i18n/translations.ts](src/i18n/translations.ts), [src/components/views/PlanGeneratorWizard.tsx](src/components/views/PlanGeneratorWizard.tsx), [tsconfig.json](tsconfig.json), [src/App.tsx](src/App.tsx).

**Verification**
- Unit/integration: npm test
- Focused hooks/tests while iterating: npm test -- useTrainingLogs or useTrainingPlan or planImporter
- E2E: npm run test:e2e
- Full suite: npm run test:all
- Build/type gate: npm run build

**Decisions**
- Architecture: Unified flow is canonical.
- Legacy surfaces: Delete now.
- Type safety: Aggressive hardening trajectory.
- Privacy: Notice-only changes; no retention-policy implementation in this initiative.
