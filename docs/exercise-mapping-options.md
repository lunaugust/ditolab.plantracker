# ExerciseDB mapping: three approaches

Context: AI-generated plans, manual plan creation, and imported plans currently accept free-text exercise names. To show the correct ExerciseDB GIF in exercise details, we need a deterministic way to attach an ExerciseDB entry to each exercise. Below are three alternative solutions that fit the existing architecture (React + hooks, storage service boundary).

1) Canonical exercise catalog with explicit ExerciseDB IDs  
   - Create a curated `exerciseCatalog` (slug → { displayName, exerciseDbId, bodyPart, equipment, translations }).  
   - Constrain new exercises to this catalog: manual creation uses a searchable dropdown, the AI prompt is seeded with allowed names, and import flows auto-map by slug/synonyms.  
   - Store `exerciseDbId` on each exercise (optional field) so the UI can fetch/display the GIF. Deterministic, low runtime cost; requires ongoing curation of the catalog.

2) Name normalization + fuzzy resolver service  
   - Keep free-text entry but add a resolver that normalizes names (lowercase, strip accents, common aliases) and fuzzy-matches against a lookup table of ExerciseDB IDs.  
   - Attach the matched `exerciseDbId` during AI parsing, manual save, and import parsing; store it alongside the exercise.  
   - Minimizes UI changes and works with existing content, but needs synonym tables and guardrails to avoid incorrect matches; allow a null/unknown state when confidence is low.

3) User-confirmed mapping workflow  
   - After AI generation/import/manual save, detect exercises without an `exerciseDbId` and prompt the user to confirm or pick an ExerciseDB suggestion (typeahead backed by the API or local cache).  
   - Persist the chosen `exerciseDbId`; cache past selections to auto-apply in future imports for the same names.  
   - Highest accuracy and resilient to new exercises; adds a light review step to the UI.
