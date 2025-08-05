// PU算法專用的儀表板數據接口
export interface PUDashboardData {
	// 演算法核心數據
	pCentroid?: { x: number; y: number } | null;
	rnCount?: number;
	iteration?: number;
	margin?: number;

	// 演算法狀態
	currentStep?:
		| "IDLE"
		| "FINDING_CENTROID"
		| "MARKING_RN"
		| "TRAINING_SVM"
		| "DONE";
	isTraining?: boolean;

	// 準確性指標
	accuracy?: number;
	totalSamples?: number;
	positiveSamples?: number;
	unlabeledSamples?: number;

	// 進度追蹤
	currentPhase?: "initial" | "learning" | "analysis";
	logs?: string[];
	analysisComplete?: boolean;

	// 相容性屬性（保留與其他演算法的統一性）
	misclassifiedSamples?: number;
	averageEntropy?: number;
	phase1Status?: "waiting" | "running" | "complete";
	phase2Status?: "waiting" | "running" | "complete";

	// Neural Network 統計 (Niu et al., 2016)
	algorithmStats?: {
		name: string;
		description: string;
		positivePoints: number;
		unlabeledPoints: number;
		reliableNegativePoints: number;
		predictedPositivePoints: number;
		predictedNegativePoints: number;
		learningRate: number;
		epochs: number;
		puLoss: number;
		weights: {
			w1: number;
			w2: number;
			bias: number;
		};
	};
}
