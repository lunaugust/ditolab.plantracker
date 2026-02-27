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

export type PlanMetadata = {
	id: string;
	name: string;
	description?: string;
	ownerId: string;
	createdAt: number;
	updatedAt: number;
	isShared: boolean;
	sharedWith: string[];
	source?: "generated" | "imported" | "manual";
};

export type PlanWithMetadata = {
	metadata: PlanMetadata;
	plan: TrainingPlan;
};

export type PlanScope = {
	type: "owned" | "shared";
	planId: string;
	canEdit: boolean;
};

export type LogEntry = {
	date: string;
	weight: string;
	reps: string;
	notes?: string;
};

export type LogsByExercise = Record<string, LogEntry[]>;
