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

export type PlanSource = "owned" | "shared";

export type PlanMetadata = {
	id: string;
	name: string;
	plan: TrainingPlan;
	source: PlanSource;
	ownerName?: string;
	shareCode?: string;
};

export type PlanLibrary = {
	activePlanId: string;
	ownedPlans: PlanMetadata[];
	sharedPlans: PlanMetadata[];
};

export type LogEntry = {
	date: string;
	weight: string;
	reps: string;
	notes?: string;
};

export type LogsByExercise = Record<string, LogEntry[]>;
