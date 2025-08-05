// 型別定義
export interface DataParams {
	distribution: string;
	dimensions: number;
	nPositive: number;
	nUnlabeled: number;
	prior: number;
}

export interface ModelParams {
	// nnPU 參數
	activation?: string;
	learning_rate?: number;
	weight_decay?: number;
	n_epochs?: number;
	hidden_dim?: number;

	// uPU 參數
	model_type?: string;
	use_bias?: boolean;
	n_basis?: number;
}

export interface SimulationRequest {
	algorithm: "uPU" | "nnPU";
	seed?: number; // 新增：隨機種子，可選參數
	data_params: {
		distribution: string;
		dims: number;
		n_p: number;
		n_u: number;
		prior: number;
	};
	model_params: ModelParams;
}

export interface DataPoint {
	x: number;
	y: number;
	label: "P" | "U";
}

export interface SimulationResult {
	visualization: {
		pSamples: DataPoint[];
		uSamples: DataPoint[];
		decisionBoundary: Array<[number, number]>;
	};
	metrics: {
		estimatedPrior: number;
		errorRate: number;
		trainingErrorRate: number;
		riskCurve: Array<{ epoch: number; risk: number }>;
	};
}
