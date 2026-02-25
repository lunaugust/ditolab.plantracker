export type ViewKey = "plan" | "log" | "progress";

export type Language = "es" | "en";

export type Exercise = {
	id: string;
	name: string;
	sets: string;
	reps: string;
	rest?: string;
	note?: string;
	/**
	 * Lowercase English name for ExerciseDB API lookup.
	 * Populated automatically by the rule-based generator and AI/import prompts.
	 * Used by ExerciseRow to fetch the exercise GIF.
	 */
	exerciseDbName?: string;
};

export type TrainingDay = {
	label: string;
	color: string;
	exercises: Exercise[];
};

export type TrainingPlan = Record<string, TrainingDay>;

export type LogEntry = {
	date: string;
	weight: string;
	reps: string;
	notes?: string;
};

export type LogsByExercise = Record<string, LogEntry[]>;
