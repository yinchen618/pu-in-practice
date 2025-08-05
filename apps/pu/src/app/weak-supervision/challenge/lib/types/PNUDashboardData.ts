// PNU算法專用的儀表板數據接口
export interface PNUDashboardData {
	accuracy?: number;
	totalSamples?: number;
	misclassifiedSamples?: number;
	currentPhase?: "initial" | "learning" | "analysis";
	logs?: string[];
	iterationsCompleted?: number;
	averageEntropy?: number;
	analysisComplete?: boolean;

	// 保留原有屬性以相容性
	currentStep?: string;
	iteration?: number;
	convergence?: number;
	phase1Status?: "waiting" | "running" | "complete";
	phase2Status?: "waiting" | "running" | "complete";
}
