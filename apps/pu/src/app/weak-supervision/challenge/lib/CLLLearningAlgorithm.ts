import type { DataPoint } from "./DatasetGenerator";
import { DatasetGenerator } from "./DatasetGenerator";
import type { CLLDashboardData } from "./types/CLLDashboardData";

/**
 * CLL學習演算法類
 * 實現概率排除與修正算法 (Complementary Label Learning)
 */
export class CLLLearningAlgorithm {
	private dataPoints: DataPoint[] = [];
	private complementaryLabels: Array<{
		pointIndex: number;
		excludeLabel: "α" | "β" | "γ";
	}> = [];

	// 動畫相關回調
	private onProgressUpdate?: (progress: number) => void;
	private onComplementaryLabelReceived?: (
		pointIndex: number,
		excludeLabel: string,
		points: DataPoint[],
	) => void;

	// 新增：儀表板與日誌回調
	private onDashboardUpdate?: (data: CLLDashboardData) => void;
	private logs: string[] = [];
	private lastLogTime: number = Date.now();

	// 新增：階段狀態管理
	private currentPhase: "initial" | "learning" | "analysis" = "initial";
	private analysisComplete = false;

	constructor(
		dataPoints: DataPoint[],
		callbacks?: {
			onProgressUpdate?: (progress: number) => void;
			onComplementaryLabelReceived?: (
				pointIndex: number,
				excludeLabel: string,
				points: DataPoint[],
			) => void;
			onDashboardUpdate?: (data: CLLDashboardData) => void;
		},
	) {
		this.dataPoints = dataPoints.map((p) => ({ ...p }));
		this.onProgressUpdate = callbacks?.onProgressUpdate;
		this.onComplementaryLabelReceived =
			callbacks?.onComplementaryLabelReceived;
		this.onDashboardUpdate = callbacks?.onDashboardUpdate;

		// 初始化日誌
		this.addScientificLog(
			"開始補充標籤學習 (CLL)",
			"系統開始初始化標籤學習參數",
		);

		this.generateComplementaryLabels();
	}

	/**
	 * 生成互補標籤
	 * 模擬接收到的否定信息
	 */
	private generateComplementaryLabels(): void {
		// 按照規格書要求，生成一些互補標籤
		this.complementaryLabels = [
			{ pointIndex: 10, excludeLabel: "β" },
			{ pointIndex: 70, excludeLabel: "α" },
			{ pointIndex: 130, excludeLabel: "γ" },
			{ pointIndex: 25, excludeLabel: "γ" },
			{ pointIndex: 85, excludeLabel: "β" },
			{ pointIndex: 45, excludeLabel: "α" },
			{ pointIndex: 120, excludeLabel: "β" },
			{ pointIndex: 155, excludeLabel: "γ" },
		];
	}

	/**
	 * 執行完整的CLL學習演算法
	 */
	public async execute(): Promise<DataPoint[]> {
		this.addScientificLog("開始CLL學習", "開始執行互補標籤學習算法");

		// 階段1：初始化可能性空間
		this.currentPhase = "initial";
		this.updateDashboard("初始化可能性空間");

		await this.initializePossibilitySpace();

		// 階段2：根據「不在場證明」進行迭代推理
		this.currentPhase = "learning";
		this.updateDashboard("開始處理互補標籤線索");

		await this.processComplementaryLabels();

		// 階段3：分析階段
		this.currentPhase = "analysis";
		this.addScientificLog("分析階段開始", "開始分析學習結果並計算最終預測");

		await this.runResultAnalysis();

		this.analysisComplete = true;
		this.addScientificLog(
			"算法完成",
			`CLL學習完成，最終準確率: ${this.calculateAccuracy()}%`,
		);

		return this.dataPoints;
	}

	/**
	 * 新增：初始化可能性空間
	 * 根據規格書，為每個點設置均等的初始機率
	 */
	private async initializePossibilitySpace(): Promise<void> {
		this.addScientificLog(
			"初始化機率分佈",
			"為所有數據點設置均等的類別機率分佈",
		);

		// 為每個點設置均等的機率 [1/3, 1/3, 1/3]
		this.dataPoints.forEach((point) => {
			point.probabilities = {
				α: 1 / 3,
				β: 1 / 3,
				γ: 1 / 3,
			};
			// 設置動畫階段為初始化
			point.animationPhase = 0;
		});

		this.updateDashboard("初始化完成");

		// 短暫延遲以顯示初始化效果
		await new Promise((resolve) => setTimeout(resolve, 1000));
	}

	/**
	 * 獲取已處理的互補標籤數量
	 */
	private getProcessedLabelsCount(): number {
		if (
			this.currentPhase === "learning" ||
			this.currentPhase === "analysis"
		) {
			return this.complementaryLabels.length;
		}
		return 0;
	}

	/**
	 * 新增：結果分析階段
	 */
	private async runResultAnalysis(): Promise<void> {
		this.addScientificLog("分析開始", "分析補充標籤學習的整體效果");

		// 分析分類準確率
		const accuracy = this.calculateAccuracy();
		this.addScientificLog("準確率分析", `當前分類準確率: ${accuracy}%`);

		// 分析熵值變化
		const averageEntropy = this.calculateAverageEntropy();
		this.addScientificLog(
			"不確定性分析",
			`平均概率熵: ${averageEntropy.toFixed(3)} (值越低表示分類越確定)`,
		);

		// 分析錯誤分類
		const misclassified = this.getMisclassifiedPoints();
		this.addScientificLog(
			"錯誤分析",
			`錯誤分類樣本: ${misclassified.length} / ${this.dataPoints.length}`,
		);

		// 分析補充標籤效果
		this.addScientificLog(
			"補充標籤分析",
			`處理了 ${this.complementaryLabels.length} 個排除約束，平均每個約束影響多個樣本`,
		);

		// 添加延遲以顯示分析過程
		await new Promise((resolve) => setTimeout(resolve, 1000));

		this.addScientificLog("分析完成", "補充標籤學習分析階段完成");
	}

	/**
	 * 處理互補標籤信息
	 * 核心思想：P(Y=k | X, Y≠c) - 利用排除信息更新後驗概率
	 */
	private async processComplementaryLabels(): Promise<void> {
		this.addScientificLog(
			"開始處理補充標籤",
			`準備處理 ${this.complementaryLabels.length} 個排除約束`,
		);

		for (let i = 0; i < this.complementaryLabels.length; i++) {
			const { pointIndex, excludeLabel } = this.complementaryLabels[i];

			// 確保索引有效
			if (pointIndex >= this.dataPoints.length) {
				this.addScientificLog(
					"跳過無效索引",
					`樣本索引 ${pointIndex} 超出範圍`,
				);
				continue;
			}

			const point = this.dataPoints[pointIndex];
			const oldProb = point.probabilities[excludeLabel];

			this.addScientificLog(
				"處理排除約束",
				`樣本 ${pointIndex}: 排除標籤 '${excludeLabel}' (原概率: ${oldProb.toFixed(3)})`,
			);

			// 階段1：對目標點應用排除規則
			this.applyExclusionRule(point, excludeLabel);

			const newProb = point.probabilities[excludeLabel];
			this.addScientificLog(
				"排除規則應用",
				`樣本 ${pointIndex}: '${excludeLabel}' 概率 ${oldProb.toFixed(3)} → ${newProb.toFixed(3)}`,
			);

			// 階段2：向鄰居傳播這個信息
			await this.propagateExclusionInfo(point, excludeLabel, 0.2); // 影響半徑 0.2

			this.addScientificLog(
				"信息傳播完成",
				`樣本 ${pointIndex} 的排除信息已傳播至鄰近樣本`,
			);

			// 更新進度
			if (this.onProgressUpdate) {
				this.onProgressUpdate(
					(i + 1) / this.complementaryLabels.length,
				);
			}

			// 更新儀表板
			this.updateDashboard(`已處理 ${i + 1} 個互補標籤線索`);

			// 通知互補標籤接收
			if (this.onComplementaryLabelReceived) {
				this.onComplementaryLabelReceived(pointIndex, excludeLabel, [
					...this.dataPoints,
				]);
			}

			// 添加延遲使過程可視化
			await new Promise((resolve) => setTimeout(resolve, 800));
		}

		this.addScientificLog(
			"補充標籤處理完成",
			`已處理完所有 ${this.complementaryLabels.length} 個排除約束`,
		);
	}

	/**
	 * 對單個點應用排除規則
	 */
	private applyExclusionRule(
		point: DataPoint,
		excludeLabel: "α" | "β" | "γ",
	): void {
		// 保存被排除的概率
		const excludedProb = point.probabilities[excludeLabel];

		// 將排除的類別概率設為0
		point.probabilities[excludeLabel] = 0;

		// 獲取剩餘的類別
		const remainingLabels = (["α", "β", "γ"] as const).filter(
			(label) => label !== excludeLabel,
		);

		// 計算剩餘類別的總概率
		const totalRemaining = remainingLabels.reduce(
			(sum, label) => sum + point.probabilities[label],
			0,
		);

		if (totalRemaining > 0) {
			// 按比例重新分配被排除的概率
			remainingLabels.forEach((label) => {
				const redistributionRatio =
					point.probabilities[label] / totalRemaining;
				point.probabilities[label] +=
					excludedProb * redistributionRatio;
			});
		} else {
			// 如果剩餘概率為0，平均分配
			remainingLabels.forEach((label) => {
				point.probabilities[label] = 1 / remainingLabels.length;
			});
		}

		// 標記動畫階段
		point.animationPhase = 1;
	}

	/**
	 * 向鄰居傳播排除信息
	 */
	private async propagateExclusionInfo(
		sourcePoint: DataPoint,
		excludeLabel: "α" | "β" | "γ",
		influenceRadius: number,
	): Promise<void> {
		const influenceStrength = 0.1; // 影響強度

		this.dataPoints.forEach((neighborPoint) => {
			if (neighborPoint.id === sourcePoint.id) {
				return;
			}

			// 計算距離
			const distance = DatasetGenerator.calculateDistance(
				sourcePoint,
				neighborPoint,
			);

			// 只影響在影響半徑內的點
			if (distance < influenceRadius) {
				// 計算影響權重（距離越近影響越大）
				const influence = Math.exp(-distance * 5) * influenceStrength;

				// 減少鄰居對排除類別的概率
				const currentExcludedProb =
					neighborPoint.probabilities[excludeLabel];
				const reduction = currentExcludedProb * influence;
				neighborPoint.probabilities[excludeLabel] -= reduction;

				// 將減少的概率重新分配給其他類別
				const otherLabels = (["α", "β", "γ"] as const).filter(
					(label) => label !== excludeLabel,
				);
				const redistributionPerLabel = reduction / otherLabels.length;

				otherLabels.forEach((label) => {
					neighborPoint.probabilities[label] +=
						redistributionPerLabel;
				});

				// 標記為受影響
				neighborPoint.animationPhase = 0.5;
			}
		});
	}

	/**
	 * 獲取影響網絡的邊（用於可視化）
	 */
	public getInfluenceEdges(sourcePointIndex: number, influenceRadius = 0.2) {
		const edges: Array<{
			source: DataPoint;
			target: DataPoint;
			influence: number;
		}> = [];

		if (sourcePointIndex >= this.dataPoints.length) {
			return edges;
		}

		const sourcePoint = this.dataPoints[sourcePointIndex];

		this.dataPoints.forEach((targetPoint) => {
			if (targetPoint.id === sourcePoint.id) {
				return;
			}

			const distance = DatasetGenerator.calculateDistance(
				sourcePoint,
				targetPoint,
			);

			if (distance < influenceRadius) {
				const influence = Math.exp(-distance * 5);
				edges.push({
					source: sourcePoint,
					target: targetPoint,
					influence,
				});
			}
		});

		return edges;
	}

	/**
	 * 新增：科學日誌記錄方法
	 */
	private addScientificLog(action: string, detail: string): void {
		const currentTime = Date.now();
		const timeDiff = currentTime - this.lastLogTime;
		this.lastLogTime = currentTime;

		const logEntry = `[${new Date().toLocaleTimeString()}] ${action}: ${detail} (耗時: ${timeDiff}ms)`;
		this.logs.push(logEntry);

		// 限制日誌長度
		if (this.logs.length > 50) {
			this.logs = this.logs.slice(-50);
		}

		// 更新儀表板
		this.updateDashboard();
	}

	/**
	 * 新增：更新儀表板資料
	 */
	private updateDashboard(message?: string): void {
		if (!this.onDashboardUpdate) {
			return;
		}

		const accuracy = this.calculateAccuracy();
		const misclassifiedCount = this.getMisclassifiedPoints().length;
		const totalPoints = this.dataPoints.length;
		const averageEntropy = this.calculateAverageEntropy();

		const dashboardData: CLLDashboardData = {
			accuracy,
			totalSamples: totalPoints,
			misclassifiedSamples: misclassifiedCount,
			currentPhase: this.currentPhase,
			logs: message ? [...this.logs, message] : [...this.logs],
			complementaryLabelsProcessed: this.getProcessedLabelsCount(),
			averageEntropy,
			analysisComplete: this.analysisComplete,
		};

		this.onDashboardUpdate(dashboardData);
	}

	/**
	 * 新增：計算平均熵值
	 */
	private calculateAverageEntropy(): number {
		const totalEntropy = this.dataPoints.reduce(
			(sum, point) =>
				sum +
				CLLLearningAlgorithm.calculateEntropy(point.probabilities),
			0,
		);
		return totalEntropy / this.dataPoints.length;
	}

	/**
	 * 獲取當前處理階段的說明文字
	 */
	public getCurrentStageDescription(currentStep: number): string {
		if (currentStep === 0) {
			return "初始化：所有樣本具有均等的類別概率";
		}
		if (currentStep <= this.complementaryLabels.length / 2) {
			return `接收互補標籤 ${currentStep}：排除某些類別的可能性`;
		}
		if (currentStep <= this.complementaryLabels.length * 0.8) {
			return `信息傳播 ${currentStep}：排除信息向鄰居擴散`;
		}
		return `信息整合 ${currentStep}：多個排除信息累積形成最終分類`;
	}

	/**
	 * 計算分類準確率
	 */
	public calculateAccuracy(): number {
		let correct = 0;

		this.dataPoints.forEach((point) => {
			const predictedLabel = this.getPredictedLabel(point);
			if (predictedLabel === point.trueLabel) {
				correct++;
			}
		});

		return Math.round((correct / this.dataPoints.length) * 100);
	}

	/**
	 * 根據概率獲取預測標籤
	 */
	private getPredictedLabel(point: DataPoint): "α" | "β" | "γ" {
		const { α, β, γ } = point.probabilities;

		if (α >= β && α >= γ) {
			return "α";
		}
		if (β >= γ) {
			return "β";
		}
		return "γ";
	}

	/**
	 * 獲取錯誤分類的點
	 */
	public getMisclassifiedPoints(): DataPoint[] {
		return this.dataPoints.filter((point) => {
			const predictedLabel = this.getPredictedLabel(point);
			return predictedLabel !== point.trueLabel;
		});
	}

	/**
	 * 新增：分析實驗結果
	 */
	public async analyzeResults(): Promise<DataPoint[]> {
		this.addScientificLog("開始結果分析", "分析 CLL 學習的實驗結果");

		// 計算最終預測
		this.dataPoints.forEach((point) => {
			const predictedLabel = this.getPredictedLabel(point);
			point.currentLabel = predictedLabel;
		});

		// 更新儀表板
		this.updateDashboard("分析完成");

		this.addScientificLog(
			"結果分析完成",
			`最終準確率: ${this.calculateAccuracy()}%`,
		);

		return this.dataPoints;
	}

	/**
	 * 新增：獲取分析統計資料
	 */
	public getAnalysisStats(): {
		accuracy: number;
		totalSamples: number;
		correctPredictions: number;
		misclassifiedSamples: number;
		averageConfidence: number;
		cluesProcessed: number;
	} {
		const totalSamples = this.dataPoints.length;
		const misclassified = this.getMisclassifiedPoints();
		const correctPredictions = totalSamples - misclassified.length;
		const accuracy = this.calculateAccuracy();

		// 計算平均信心度（預測類別的平均機率）
		const averageConfidence =
			this.dataPoints.reduce((sum, point) => {
				const predictedLabel = this.getPredictedLabel(point);
				return sum + point.probabilities[predictedLabel];
			}, 0) / totalSamples;

		return {
			accuracy,
			totalSamples,
			correctPredictions,
			misclassifiedSamples: misclassified.length,
			averageConfidence: averageConfidence * 100, // 轉為百分比
			cluesProcessed: this.complementaryLabels.length,
		};
	}

	/**
	 * 新增：檢查是否可以分析結果
	 */
	public canAnalyzeResults(): boolean {
		return this.analysisComplete || this.currentPhase === "analysis";
	}

	/**
	 * 獲取互補標籤歷史
	 */
	public getComplementaryLabelHistory(): Array<{
		pointIndex: number;
		excludeLabel: "α" | "β" | "γ";
		description: string;
	}> {
		return this.complementaryLabels.map(({ pointIndex, excludeLabel }) => ({
			pointIndex,
			excludeLabel,
			description: `樣本 ${pointIndex}: 「不是 ${excludeLabel} 類」`,
		}));
	}

	/**
	 * 計算概率熵（用於衡量不確定性）
	 */
	public static calculateEntropy(probabilities: {
		α: number;
		β: number;
		γ: number;
	}): number {
		const { α, β, γ } = probabilities;
		const probs = [α, β, γ].filter((p) => p > 0); // 避免 log(0)

		return -probs.reduce(
			(entropy, prob) => entropy + prob * Math.log2(prob),
			0,
		);
	}

	/**
	 * 獲取貝氏更新的數學表示
	 */
	public getBayesianUpdateFormula(excludeLabel: "α" | "β" | "γ"): string {
		const remaining = ["α", "β", "γ"].filter(
			(label) => label !== excludeLabel,
		);
		return `P(Y=${remaining[0]}|X,Y≠${excludeLabel}) ∝ P(Y=${remaining[0]}|X)`;
	}
}
