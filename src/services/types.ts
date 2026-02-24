export type ViewKey = "plan" | "log" | "progress";

export type Language = "es" | "en";

export type Exercise = {
	id: string;
	name: string;
	sets: string;
	reps: string;
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
