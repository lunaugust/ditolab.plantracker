# Exercise Library & ExerciseDB Integration

This document describes the predefined exercise library and ExerciseDB API integration implemented in the GymBuddy application.

## Overview

The application now uses a centralized exercise library that maps exercises to ExerciseDB API identifiers. This enables:
- Displaying exercise demonstration GIFs from ExerciseDB
- Standardized exercise names in Spanish and English
- Graceful fallback for custom exercises
- Automatic matching of AI-generated and imported exercises

## Architecture

### Solution: Hybrid Approach

We implemented **Solution 3** from the original design: a hybrid approach that combines predefined exercises with free-form flexibility.

**Key Features:**
- Curated exercise library with ExerciseDB mappings (`src/data/exerciseLibrary.ts`)
- Optional `exerciseDbId` field on Exercise type
- Automatic exercise name matching for AI/imported plans
- Custom exercises without ExerciseDB IDs remain fully supported

## Files Modified/Added

### New Files
- **`src/data/exerciseLibrary.ts`** - Centralized exercise library with ~40 exercises
- **`src/utils/exerciseMatching.ts`** - Utilities for matching exercises to library
- **`src/__tests__/exerciseLibrary.test.ts`** - Comprehensive test suite (19 tests)

### Modified Files
- **`src/services/types.ts`** - Added optional `exerciseDbId?: string` to Exercise type
- **`src/services/ruleBasedPlanGenerator.ts`** - Now uses exercise library with ExerciseDB IDs
- **`src/services/aiPlanGenerator.ts`** - Enriches AI-generated exercises with DB IDs
- **`src/services/planImporter.ts`** - Enriches imported exercises with DB IDs

## Exercise Library Structure

Each exercise in the library includes:

```typescript
{
  id: string;                 // Unique identifier (e.g., "hack_squat")
  nameEs: string;            // Spanish name (e.g., "Sentadilla Hack")
  nameEn: string;            // English name (e.g., "Hack Squat")
  exerciseDbId: string;      // ExerciseDB API ID (e.g., "1420")
  category: ExerciseCategory; // Muscle group
  equipment?: string;        // Required equipment
  defaultSets: string;       // Default sets (e.g., "4")
  defaultReps: string;       // Default reps (e.g., "12·10·8·6")
  defaultRest: string;       // Default rest (e.g., "90s")
  defaultNote?: string;      // Optional training note
}
```

### Categories
- quadriceps (6 exercises)
- hamstrings (3 exercises)
- glutes (3 exercises)
- chest (5 exercises)
- back (5 exercises)
- shoulders (5 exercises)
- biceps (3 exercises)
- triceps (3 exercises)
- calves (2 exercises)
- core (4 exercises)

**Total: 39 exercises**

## How It Works

### 1. Rule-Based Plan Generation
When generating a plan using the offline rule-based generator:
- Exercises are selected from the library based on muscle groups
- Each exercise includes its `exerciseDbId`
- All exercises are guaranteed to have ExerciseDB IDs

### 2. AI-Generated Plans
When Gemini generates a plan:
- Exercise names are parsed from the AI response
- Each name is matched against the library using fuzzy matching
- Matched exercises get the corresponding `exerciseDbId`
- Unmatched exercises remain without DB IDs (custom exercises)

### 3. Imported Plans
When importing plans from PDF/CSV:
- Exercise names are extracted from the document
- Names are matched against the library
- Matched exercises get `exerciseDbId`
- Unmatched exercises remain custom

### 4. Manual Plan Creation
When users manually create exercises:
- Users can enter any exercise name (free-form)
- Names can optionally be matched to library later
- Custom exercises work without ExerciseDB IDs

## API Usage

### Exercise Library Functions

```typescript
import {
  EXERCISE_LIBRARY,
  getExercisesByCategory,
  getExerciseById,
  getExerciseName,
  findExerciseByName,
  getAllExerciseNames,
} from "../data/exerciseLibrary";

// Get exercises for a specific muscle group
const chestExercises = getExercisesByCategory("chest");

// Find exercise by library ID
const exercise = getExerciseById("hack_squat");

// Get localized name
const name = getExerciseName(exercise, "es"); // "Sentadilla Hack"

// Find by name (fuzzy matching)
const found = findExerciseByName("Hack Squat", "en");

// Get all names for autocomplete
const allNames = getAllExerciseNames("es");
```

### Exercise Matching Functions

```typescript
import {
  enrichExerciseWithDbId,
  enrichPlanWithDbIds,
  getPlanMatchingStats,
  getExerciseDbIdsFromPlan,
} from "../utils/exerciseMatching";

// Enrich a single exercise
const enriched = enrichExerciseWithDbId(exercise, "es");

// Enrich entire plan
const enrichedPlan = enrichPlanWithDbIds(plan, "es");

// Get matching statistics
const stats = getPlanMatchingStats(plan);
// { total: 10, matched: 8, unmatched: 2, matchRate: 0.8 }

// Get all unique ExerciseDB IDs
const dbIds = getExerciseDbIdsFromPlan(plan);
```

## ExerciseDB API Integration

### API Structure
The app uses ExerciseDB v2 API:
- **Base URL**: `https://v2.exercisedb.io`
- **Endpoints**:
  - `GET /exercises/exercise/{id}` - Get single exercise details
  - Includes: name, gifUrl, target muscles, instructions, etc.

### Example Usage

```typescript
// Fetch exercise details by ID
async function getExerciseDetails(exerciseDbId: string) {
  const response = await fetch(
    `https://v2.exercisedb.io/exercises/exercise/${exerciseDbId}`
  );
  const data = await response.json();
  return {
    name: data.name,
    gifUrl: data.gifUrl,
    instructions: data.instructions,
    targetMuscle: data.target,
    equipment: data.equipment,
  };
}

// Usage in component
const exercise = { name: "Hack Squat", exerciseDbId: "1420", ... };
if (exercise.exerciseDbId) {
  const details = await getExerciseDetails(exercise.exerciseDbId);
  // Display details.gifUrl in UI
}
```

### Rate Limits
- Free tier: ~60 requests per minute
- Consider caching exercise details in localStorage
- Only fetch when needed (e.g., when user views exercise details)

## Future Enhancements

### Potential Improvements
1. **Exercise Autocomplete** - Show suggestions from library when typing
2. **GIF Display** - Fetch and cache GIFs for exercises with DB IDs
3. **Exercise Details Modal** - Show instructions, target muscles, equipment
4. **Smart Matching** - Improve fuzzy matching algorithm
5. **Library Expansion** - Add more exercises to the library
6. **User Contributions** - Allow users to suggest new library entries

### UI Components (Future)
```typescript
// Example: Exercise card with GIF
<ExerciseCard>
  <ExerciseName>{exercise.name}</ExerciseName>
  {exercise.exerciseDbId && (
    <ExerciseGif
      src={`https://v2.exercisedb.io/image/${exercise.exerciseDbId}`}
      alt={exercise.name}
    />
  )}
  <ExerciseMetadata>
    Sets: {exercise.sets} | Reps: {exercise.reps} | Rest: {exercise.rest}
  </ExerciseMetadata>
</ExerciseCard>
```

## Testing

Run tests:
```bash
npm test                           # All tests
npm test exerciseLibrary          # Library tests only
```

Test coverage:
- Exercise library structure validation
- Category-based exercise retrieval
- Name matching (exact and fuzzy)
- Exercise enrichment
- Plan statistics
- Edge cases (empty plans, missing fields)

## Migration Notes

### Backward Compatibility
- Existing plans without `exerciseDbId` continue to work
- Storage format unchanged (exerciseDbId is optional)
- No data migration required

### Graceful Degradation
- Custom exercises work without ExerciseDB IDs
- UI should check for `exerciseDbId` before fetching GIFs
- Fallback to text-only display for custom exercises

## Contributing

To add new exercises to the library:

1. Find the ExerciseDB ID:
   - Search at https://exercisedb.io
   - Or use API: `GET /exercises/name/{name}`

2. Add to `src/data/exerciseLibrary.ts`:
```typescript
{
  id: "unique_id",
  nameEs: "Nombre Español",
  nameEn: "English Name",
  exerciseDbId: "1234",  // From ExerciseDB
  category: "chest",
  equipment: "barbell",
  defaultSets: "3",
  defaultReps: "10",
  defaultRest: "60s",
  defaultNote: "Optional note",
}
```

3. Run tests to verify:
```bash
npm test exerciseLibrary
```

## Resources

- **ExerciseDB API**: https://v2.exercisedb.io/docs
- **Exercise Browser**: https://exercisedb.io
- **API GitHub**: https://github.com/ExerciseDB/exercisedb-api
