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

export type OwnedPlan = {
	id: string;
	name: string;
	plan: TrainingPlan;
};

export type SharedPlan = {
	id: string;
	name: string;
	ownerName: string;
	plan: TrainingPlan;
};

export type LogEntry = {
	date: string;
	weight: string;
	reps: string;
	notes?: string;
};

export type LogsByExercise = Record<string, LogEntry[]>;
