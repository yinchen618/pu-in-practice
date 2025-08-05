import type { DataPoint } from "./DatasetGenerator";
import { DatasetGenerator } from "./DatasetGenerator";
import type { PNUDashboardData } from "./types/PNUDashboardData";

/**
 * PNU學習演算法類
 * 實現標籤傳播算法 (Label Propagation)
 */
export class PNULearningAlgorithm {
	private dataPoints: DataPoint[] = [];
	private labeledPoints: DataPoint[] = [];
	private unlabeledPoints: DataPoint[] = [];
	private readonly maxIterations = 20;
	private readonly sigma = 0.1; // 高斯核函數的參數，適合0-1範圍的特徵空間

	// 動畫相關回調
	private onProgressUpdate?: (progress: number) => void;
	private onIterationComplete?: (
		iteration: number,
		points: DataPoint[],
	) => void;

	// 新增：儀表板與日誌回調
	private onDashboardUpdate?: (data: PNUDashboardData) => void;
	private logs: string[] = [];
	private lastLogTime: number = Date.now();

	// 新增：階段狀態管理
	private currentPhase: "initial" | "learning" | "analysis" = "initial";
	private analysisComplete = false;

	constructor(
		labeledData: DataPoint[],
		unlabeledData: DataPoint[],
		onProgressUpdate?: (progress: number) => void,
		onIterationComplete?: (iteration: number, points: DataPoint[]) => void,
		onDashboardUpdate?: (data: PNUDashboardData) => void,
	) {
		this.labeledPoints = labeledData.map((p) => ({ ...p }));
		this.unlabeledPoints = unlabeledData.map((p) => ({ ...p }));
		this.dataPoints = [...this.labeledPoints, ...this.unlabeledPoints];
		this.onProgressUpdate = onProgressUpdate;
		this.onIterationComplete = onIterationComplete;
		this.onDashboardUpdate = onDashboardUpdate;

		// 初始化日誌
		this.addScientificLog(
			"開始正向無標籤學習 (PNU)",
			"系統開始初始化標籤傳播參數",
		);
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
	private updateDashboard(): void {
		if (!this.onDashboardUpdate) {
			return;
		}

		const accuracy = this.calculateAccuracy();
		const misclassifiedCount = this.getMisclassifiedPoints().length;
		const totalPoints = this.dataPoints.length;
		const averageEntropy = this.calculateAverageEntropy();

		const dashboardData: PNUDashboardData = {
			accuracy,
			totalSamples: totalPoints,
			misclassifiedSamples: misclassifiedCount,
			currentPhase: this.currentPhase,
			logs: [...this.logs],
			iterationsCompleted: 0, // 將在實際迭代中更新
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
			(sum, point) => sum + this.calculateEntropy(point.probabilities),
			0,
		);
		return totalEntropy / this.dataPoints.length;
	}

	/**
	 * 執行完整的PNU學習演算法
	 */
	public async execute(): Promise<DataPoint[]> {
		this.addScientificLog("階段切換", "開始執行正向無標籤學習算法");

		// 階段1：學習階段
		this.currentPhase = "learning";
		this.addScientificLog(
			"學習階段開始",
			`準備進行標籤傳播，最大迭代次數: ${this.maxIterations}`,
		);

		await this.runLabelPropagation();

		// 階段2：分析階段
		this.currentPhase = "analysis";
		this.addScientificLog("分析階段開始", "開始分析學習結果並計算最終預測");

		await this.runResultAnalysis();

		this.analysisComplete = true;
		this.addScientificLog(
			"算法完成",
			`PNU學習完成，最終準確率: ${this.calculateAccuracy()}%`,
		);

		return this.dataPoints;
	}

	/**
	 * 新增：標籤傳播主要流程
	 */
	private async runLabelPropagation(): Promise<void> {
		this.addScientificLog("標籤傳播開始", "開始迭代標籤傳播過程");

		for (let iteration = 0; iteration < this.maxIterations; iteration++) {
			this.addScientificLog("迭代開始", `第 ${iteration + 1} 次迭代開始`);

			const previousPoints = this.dataPoints.map((p) => ({ ...p }));

			// 對每個無標籤點進行標籤傳播
			for (const unlabeledPoint of this.unlabeledPoints) {
				this.propagateLabel(unlabeledPoint);
			}

			// 檢查收斂
			const converged = this.checkConvergence(
				previousPoints,
				this.dataPoints,
			);

			this.addScientificLog(
				"迭代完成",
				`第 ${iteration + 1} 次迭代完成，收斂狀態: ${converged ? "已收斂" : "未收斂"}`,
			);

			// 更新進度
			if (this.onProgressUpdate) {
				this.onProgressUpdate((iteration + 1) / this.maxIterations);
			}

			// 通知迭代完成
			if (this.onIterationComplete) {
				this.onIterationComplete(iteration + 1, [...this.dataPoints]);
			}

			// 如果收斂，提前結束
			if (converged) {
				this.addScientificLog(
					"提前收斂",
					`算法在第 ${iteration + 1} 次迭代後收斂`,
				);
				break;
			}

			// 添加延遲使過程可視化
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}

		this.addScientificLog("標籤傳播完成", "標籤傳播階段結束");
	}

	/**
	 * 新增：結果分析階段
	 */
	private async runResultAnalysis(): Promise<void> {
		this.addScientificLog("分析開始", "分析標籤傳播的整體效果");

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

		// 分析標籤傳播效果
		this.addScientificLog(
			"傳播分析",
			`標籤從 ${this.labeledPoints.length} 個已標籤樣本傳播至 ${this.unlabeledPoints.length} 個無標籤樣本`,
		);

		// 添加延遲以顯示分析過程
		await new Promise((resolve) => setTimeout(resolve, 1000));

		this.addScientificLog("分析完成", "正向無標籤學習分析階段完成");
	}

	/**
	 * 對單個無標籤點進行標籤傳播
	 */
	private propagateLabel(unlabeledPoint: DataPoint): void {
		const newProbabilities = { α: 0, β: 0, γ: 0 };
		let totalWeight = 0;

		// 計算與所有已標籤點的相似度加權平均
		this.labeledPoints.forEach((labeledPoint) => {
			const weight = this.calculateSimilarity(
				unlabeledPoint,
				labeledPoint,
			);
			totalWeight += weight;

			newProbabilities.α += weight * labeledPoint.probabilities.α;
			newProbabilities.β += weight * labeledPoint.probabilities.β;
			newProbabilities.γ += weight * labeledPoint.probabilities.γ;
		});

		// 標準化概率
		if (totalWeight > 0) {
			newProbabilities.α /= totalWeight;
			newProbabilities.β /= totalWeight;
			newProbabilities.γ /= totalWeight;
		}

		// 更新概率
		unlabeledPoint.probabilities = newProbabilities;
		unlabeledPoint.animationPhase = 1; // 標記為已更新
	}

	/**
	 * 計算兩點之間的相似度（使用高斯核函數）
	 */
	private calculateSimilarity(point1: DataPoint, point2: DataPoint): number {
		const distance = DatasetGenerator.calculateDistance(point1, point2);
		return Math.exp(-(distance * distance) / (2 * this.sigma * this.sigma));
	}

	/**
	 * 檢查算法是否收斂
	 */
	private checkConvergence(
		previousIteration: DataPoint[],
		currentIteration: DataPoint[],
		threshold = 0.001,
	): boolean {
		for (let i = 0; i < previousIteration.length; i++) {
			const prev = previousIteration[i].probabilities;
			const curr = currentIteration[i].probabilities;

			const change =
				Math.abs(prev.α - curr.α) +
				Math.abs(prev.β - curr.β) +
				Math.abs(prev.γ - curr.γ);

			if (change > threshold) {
				return false;
			}
		}
		return true;
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
	 * 計算概率熵（用於衡量不確定性）
	 */
	private calculateEntropy(probabilities: {
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
	 * 獲取概率確定性（最高概率值）
	 */
	public static getProbabilityCertainty(probabilities: {
		α: number;
		β: number;
		γ: number;
	}): number {
		return Math.max(probabilities.α, probabilities.β, probabilities.γ);
	}

	/**
	 * 獲取當前處理階段的說明文字
	 */
	public getCurrentStageDescription(currentIteration: number): string {
		if (currentIteration === 0) {
			return "初始化：設置已標籤和無標籤樣本的初始概率";
		}
		if (currentIteration <= this.maxIterations / 3) {
			return `標籤傳播 ${currentIteration}：從已標籤樣本傳播信息到鄰近的無標籤樣本`;
		}
		if (currentIteration <= (this.maxIterations * 2) / 3) {
			return `迭代優化 ${currentIteration}：持續改善無標籤樣本的分類概率`;
		}
		return `收斂檢查 ${currentIteration}：確保算法達到穩定狀態`;
	}

	/**
	 * 獲取相似度矩陣（用於可視化）
	 */
	public getSimilarityMatrix(): number[][] {
		const matrix: number[][] = [];

		this.dataPoints.forEach((point1) => {
			const row: number[] = [];
			this.dataPoints.forEach((point2) => {
				const similarity = this.calculateSimilarity(point1, point2);
				row.push(similarity);
			});
			matrix.push(row);
		});

		return matrix;
	}

	/**
	 * 獲取標籤傳播的數學表示
	 */
	public getLabelPropagationFormula(): string {
		return "f(xi) = Σ w(xi,xj) × y(xj) / Σ w(xi,xj), where w(xi,xj) = exp(-||xi-xj||²/2σ²)";
	}

	/**
	 * 檢查是否可以分析結果
	 */
	public canAnalyzeResults(): boolean {
		return this.analysisComplete;
	}

	/**
	 * 執行結果分析階段
	 */
	public async analyzeResults(): Promise<DataPoint[]> {
		this.addScientificLog("深度分析開始", "開始進行深度結果分析");

		// 模擬分析過程中的進度更新
		const analysisSteps = [
			"分析標籤傳播收斂性",
			"計算分類不確定性",
			"識別邊界樣本",
			"評估傳播效果",
			"生成最終報告",
		];

		for (let i = 0; i < analysisSteps.length; i++) {
			this.addScientificLog("分析進行", analysisSteps[i]);

			// 更新進度
			if (this.onProgressUpdate) {
				this.onProgressUpdate((i + 1) / analysisSteps.length);
			}

			// 添加延遲使分析過程可視化
			await new Promise((resolve) => setTimeout(resolve, 800));
		}

		// 分析最終統計
		const stats = this.getAnalysisStats();
		this.addScientificLog(
			"分析完成",
			`最終準確率: ${stats.accuracy}%, 平均不確定性: ${stats.averageEntropy.toFixed(3)}`,
		);

		// 更新儀表板
		if (this.onDashboardUpdate) {
			this.onDashboardUpdate({
				currentPhase: "analysis",
				iteration: this.maxIterations,
				convergence: 0.001,
				averageEntropy: stats.averageEntropy,
				logs: [...this.logs],
			});
		}

		return this.dataPoints;
	}

	/**
	 * 獲取分析統計信息
	 */
	public getAnalysisStats(): {
		accuracy: number;
		averageEntropy: number;
		misclassifiedCount: number;
		totalSamples: number;
		labeledSamples: number;
		unlabeledSamples: number;
	} {
		const misclassified = this.getMisclassifiedPoints();
		return {
			accuracy: this.calculateAccuracy(),
			averageEntropy: this.calculateAverageEntropy(),
			misclassifiedCount: misclassified.length,
			totalSamples: this.dataPoints.length,
			labeledSamples: this.labeledPoints.length,
			unlabeledSamples: this.unlabeledPoints.length,
		};
	}
}
