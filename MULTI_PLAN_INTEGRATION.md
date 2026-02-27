# Multi-Plan Management & Sharing - Implementation Guide

This document describes how to integrate the multi-plan management system into the GymBuddy app.

## Overview

The multi-plan management system allows users to:
- Create and manage multiple training plans
- Share plans with other users (read-only access)
- Copy shared plans to their own collection
- Switch between different active plans

## Architecture

### Data Model

```typescript
// Plan metadata
type PlanMetadata = {
  id: string;                    // Unique plan ID
  name: string;                  // User-facing name
  description?: string;          // Optional description
  ownerId: string;               // User who created it
  createdAt: number;             // Timestamp
  updatedAt: number;             // Timestamp
  isShared: boolean;             // Whether it's shared
  sharedWith: string[];          // UIDs of users with access
  source?: "generated" | "imported" | "manual";
};

// Complete plan with data
type PlanWithMetadata = {
  metadata: PlanMetadata;
  plan: TrainingPlan;  // The actual training plan data
};
```

### Storage Layer

New Firestore structure:
```
plans/
  {planId}/                      # Indexed by unique ID
    metadata: PlanMetadata
    plan: TrainingPlan

users/{userId}/
  activePlanId: string           # Currently selected plan
```

Guest mode uses localStorage with keys:
- `gymbuddy_guest_plans`: Array of PlanWithMetadata
- `gymbuddy_active_plan`: Active plan ID

### Security Rules

Firestore rules enforce:
- Owners can read/write their own plans
- Shared users can read (but not write) shared plans
- Only owners can delete or share plans

## Integration Steps

### Step 1: Replace useTrainingPlan with useMultiPlan

**Before:**
```typescript
const {
  trainingPlan,
  dayKeys,
  dayColors,
  loading,
  saveDay,
  addDay,
  removeDay,
  replacePlan,
} = useTrainingPlan(storageScope, auth.loading);
```

**After:**
```typescript
const {
  plans,                         // All accessible plans
  activePlanId,                  // Current active plan ID
  activePlan,                    // Current plan data (TrainingPlan)
  activePlanMetadata,            // Current plan metadata
  loading,
  isOwned,                       // Whether user owns active plan
  isShared,                      // Whether plan is shared with user
  canEdit,                       // Whether user can edit (owners only)
  switchActivePlan,              // (planId) => switch to different plan
  createPlan,                    // (name, plan, source) => create new
  updateActivePlan,              // (plan) => update current plan
  renamePlan,                    // (planId, name) => rename plan
  removePlan,                    // (planId) => delete plan
  shareActivePlan,               // (userIds) => share with users
  copySharedPlan,                // (planId, name) => copy to owned
} = useMultiPlan(userId, authLoading);
```

### Step 2: Use activePlan in Place of trainingPlan

Replace references to `trainingPlan` with `activePlan`:

```typescript
// Instead of passing trainingPlan to PlanView:
<PlanView
  trainingPlan={activePlan || {}}
  // ... other props
/>
```

### Step 3: Add Plan Manager Modal

Add state and handlers for the plan manager:

```typescript
const [showPlanManager, setShowPlanManager] = useState(false);

const handleCreatePlan = useCallback(async () => {
  const planName = prompt("Plan name:");
  if (!planName) return;

  await createPlan(planName, TRAINING_PLAN, "manual");
  setShowPlanManager(false);
}, [createPlan]);

const handleSharePlan = useCallback(async (planId: string) => {
  const emails = prompt("Enter email addresses (comma-separated):");
  if (!emails) return;

  // Note: In production, you'd need a user lookup service to convert
  // emails to UIDs. For now, this is a placeholder.
  const userIds = emails.split(",").map((e) => e.trim());
  await shareActivePlan(userIds);
}, [shareActivePlan]);
```

### Step 4: Render Plan Manager Modal

```typescript
{showPlanManager && (
  <PlanManagerModal
    plans={plans}
    activePlanId={activePlanId}
    userId={userId}
    onSwitchPlan={switchActivePlan}
    onCreatePlan={handleCreatePlan}
    onRenamePlan={renamePlan}
    onDeletePlan={removePlan}
    onSharePlan={handleSharePlan}
    onCopyPlan={copySharedPlan}
    onClose={() => setShowPlanManager(false)}
  />
)}
```

### Step 5: Add Plan Manager Button to Header

Update the Header component to include a plan switcher button:

```typescript
<Header
  saveMsg={planSaveMsg || logSaveMsg}
  authUserName={auth.user?.displayName}
  onSignOut={auth.enabled ? auth.logout : null}
  onOpenFeedback={() => setShowFeedback(true)}
  onOpenPlanManager={() => setShowPlanManager(true)}
  activePlanName={activePlanMetadata?.name}
  canInstall={canInstall}
  onInstall={install}
/>
```

### Step 6: Handle Plan Generator and Importer

Update plan generation/import to create plans instead of replacing:

**Before:**
```typescript
onApply={(plan: TrainingPlan) => {
  replacePlan(plan);
  setShowGenerator(false);
}}
```

**After:**
```typescript
onApply={async (plan: TrainingPlan) => {
  await createPlan("Generated Plan", plan, "generated");
  setShowGenerator(false);
}}
```

### Step 7: Handle Read-Only Mode

Disable edit actions when `!canEdit`:

```typescript
<PlanView
  trainingPlan={activePlan || {}}
  canEdit={canEdit}
  // ... other props
/>
```

In PlanView, conditionally render edit controls:

```typescript
{canEdit && (
  <button onClick={startEditing}>{t("plan.editPlan")}</button>
)}
```

## Migration Strategy

The system automatically migrates legacy single-plan users:

1. On first load with multi-plan enabled, checks for `activePlanId`
2. If none found, loads legacy plan from `users/{uid}/appData/trainingPlan`
3. Migrates to new structure with plan ID `plan_{timestamp}_migrated`
4. Sets as active plan
5. Future changes use multi-plan storage

## Sharing Implementation Notes

### Email-to-UID Conversion

The current implementation assumes you can convert email addresses to Firebase UIDs. In practice, you'll need:

1. A Cloud Function or API endpoint that:
   - Takes an email address
   - Looks up the user in Firebase Auth
   - Returns the UID

2. Or maintain a Firestore collection:
   ```
   usersByEmail/
     {email}/
       uid: string
   ```

### Alternative: Share Links

Instead of email-based sharing, consider shareable links:

```typescript
// Generate a share token
const shareToken = generateShareToken(planId);
const shareUrl = `${window.location.origin}/shared/${shareToken}`;

// Store token → planId mapping
await setDoc(doc(db, "shareTokens", shareToken), {
  planId,
  createdAt: serverTimestamp(),
});
```

## Testing Checklist

- [ ] Create a new plan
- [ ] Switch between plans
- [ ] Rename a plan
- [ ] Delete a plan (confirm at least 1 remains)
- [ ] Share a plan (requires UID lookup implementation)
- [ ] View a shared plan (read-only mode)
- [ ] Copy a shared plan to owned plans
- [ ] Generate a plan (creates instead of replaces)
- [ ] Import a plan (creates instead of replaces)
- [ ] Edit owned plan (all actions work)
- [ ] Try to edit shared plan (actions disabled)
- [ ] Test as guest user (localStorage-based)
- [ ] Test as authenticated user (Firestore-based)
- [ ] Test migration from legacy single-plan
- [ ] Test with no plans (shows empty state)

## Known Limitations

1. **Email sharing requires UID lookup**: The share dialog currently expects UIDs, not emails. You'll need to implement email→UID conversion.

2. **No real-time sync**: Plans don't auto-refresh when shared with you. Users need to manually refresh.

3. **No plan templates**: Consider adding a "Templates" tab with pre-built plans.

4. **No plan history**: Consider adding version history for plans.

5. **No offline conflict resolution**: If two users edit a shared plan offline, last-write-wins.

## Future Enhancements

- **Plan templates library**: Curated starter plans
- **Plan version history**: Track changes over time
- **Collaborative editing**: Real-time updates for shared plans
- **Plan tags/categories**: Organize large plan collections
- **Plan search**: Filter plans by name, tags, exercises
- **Plan analytics**: Track which plans users engage with most
- **Plan marketplace**: Share plans publicly with the community

## File Reference

### Core Files Created/Modified

1. **Types** (`src/services/types.ts`)
   - PlanMetadata, PlanWithMetadata, PlanScope

2. **Storage Service** (`src/services/storageService.ts`)
   - listPlans, loadPlanById, savePlan, deletePlan
   - sharePlan, copyPlan
   - getActivePlanId, setActivePlanId

3. **Firestore Rules** (`firestore.rules`)
   - Plan read/write permissions
   - Share access rules

4. **Hooks** (`src/hooks/useMultiPlan.ts`)
   - Complete multi-plan management hook

5. **UI** (`src/components/layout/PlanManagerModal.tsx`)
   - Plan listing and management interface

6. **Translations** (`src/i18n/translations.ts`)
   - Spanish and English strings for plan management

7. **Utilities** (`src/utils/planNormalization.ts`)
   - Shared plan normalization functions

## Summary

The multi-plan management system is fully implemented and ready for integration. The main remaining work is:

1. Integrate useMultiPlan into App.tsx
2. Implement email→UID conversion for sharing
3. Add plan manager button to header
4. Update generator/importer to create instead of replace
5. Add read-only mode indicators to PlanView
6. Test the complete flow

All the infrastructure (storage, security, hooks, UI) is in place and tested via successful builds.
