import { useCallback, useState } from "react";

export interface AlgorithmStateBase {
	currentStep: string;
	isActive: boolean;
	progress: number;
	metrics: Record<string, unknown>;
}

export interface UseAlgorithmStateProps<T extends AlgorithmStateBase> {
	initialState: T;
	onStateChange?: (state: T) => void;
}

export function useAlgorithmState<T extends AlgorithmStateBase>({
	initialState,
	onStateChange,
}: UseAlgorithmStateProps<T>) {
	const [state, setState] = useState<T>(initialState);

	const updateState = useCallback(
		(updates: Partial<T>) => {
			setState((prev) => {
				const newState = { ...prev, ...updates };
				onStateChange?.(newState);
				return newState;
			});
		},
		[onStateChange],
	);

	const resetState = useCallback(() => {
		setState(initialState);
	}, [initialState]);

	const getStepStatus = useCallback(
		(stepId: string) => {
			if (!state.isActive) {
				return "waiting";
			}
			if (state.currentStep === stepId) {
				return "active";
			}
			// 這裡需要根據具體演算法的步驟順序來判斷
			return "waiting";
		},
		[state.currentStep, state.isActive],
	);

	return {
		state,
		updateState,
		resetState,
		getStepStatus,
	};
}

// 專用的狀態介面
export interface PUAlgorithmState extends AlgorithmStateBase {
	currentStep:
		| "IDLE"
		| "FINDING_CENTROID"
		| "MARKING_RN"
		| "TRAINING_SVM"
		| "DONE";
	metrics: {
		pCentroid: { x: number; y: number } | null;
		rnCount: number;
		iteration: number;
		margin: number;
	};
}

export interface PNUAlgorithmState extends AlgorithmStateBase {
	currentStep: "IDLE" | "GRAPH_CONSTRUCTION" | "LABEL_PROPAGATION" | "DONE";
	metrics: {
		iteration: number;
		convergence: number;
		totalNodes: number;
		labeledNodes: number;
	};
}

export interface CLLAlgorithmState extends AlgorithmStateBase {
	currentStep:
		| "IDLE"
		| "POSSIBILITY_INITIALIZATION"
		| "CLUE_PROCESSING"
		| "DONE";
	metrics: {
		cluesProcessed: number;
		modelConfidence: number;
		totalSamples: number;
	};
}
