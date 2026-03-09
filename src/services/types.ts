export type ViewKey = "plan" | "log" | "progress";

export type Language = "es" | "en";

export type Exercise = {
	id: string;
	exerciseId?: string;
	name: string;
	sets: string;
	reps: string;
	rest?: string;
	note?: string;
	noteSource?: "catalog" | "custom";
	noteCatalogId?: string;
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

export type WorkoutSession = {
	dayKey: string;
	startedAt: number;
	currentExerciseIndex: number;
	totalExercises: number;
	restSecondsLeft: number;
	advanceOnRestEnd: boolean;
	endOnRestEnd: boolean;
	loggedSetsByExercise: Record<string, number>;
};

export type WorkoutSessionExerciseSummary = {
	exerciseId: string;
	name: string;
	plannedSets: number;
	completedSets: number;
	rest?: string;
};

export type WorkoutHistoryEntry = {
	id: string;
	dayKey: string;
	dayLabel: string;
	startedAt: string;
	endedAt: string;
	durationSeconds: number;
	totalExercises: number;
	completedExercises: number;
	totalLoggedSets: number;
	completed: boolean;
	exercises: WorkoutSessionExerciseSummary[];
};
