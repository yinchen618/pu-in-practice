// 共用的型別定義
export type StepStatus = "waiting" | "active" | "completed" | "pending";

// 學習模式類型
export type LearningMode = "PU" | "PNU" | "CLL";

// 演算法步驟類型
export type PUAlgorithmStep =
	| "IDLE"
	| "FINDING_CENTROID"
	| "MARKING_RN"
	| "TRAINING_SVM"
	| "DONE";
export type PNUAlgorithmStep =
	| "IDLE"
	| "GRAPH_CONSTRUCTION"
	| "LABEL_PROPAGATION"
	| "DONE";
export type CLLAlgorithmStep =
	| "IDLE"
	| "POSSIBILITY_INITIALIZATION"
	| "CLUE_PROCESSING"
	| "DONE";

export interface AlgorithmStepConfig {
	id: string;
	title: string;
	description: string;
	details: string[];
}

export interface ExperimentState {
	currentStep: string;
	isRunning: boolean;
	accuracy: number;
	progress: number;
}

export interface MetricValue {
	label: string;
	value: string | number;
	format?: "number" | "percentage" | "text" | "coordinate";
	precision?: number;
}

export interface StatusIndicator {
	label: string;
	status: StepStatus;
	description?: string;
}
