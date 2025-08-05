import type { DataPoint } from "./DatasetGenerator";
import { DatasetGenerator } from "./DatasetGenerator";
import type { PUDashboardData } from "./types/PUDashboardData";

// 導出 PUDashboardData 類型以便其他文件使用
export type { PUDashboardData };

// 為了向後相容性，保留 DashboardData 別名
export type DashboardData = PUDashboardData;

/**
 * PU學習演算法類
 * 實現「Non-Negative Risk Estimator」演算法 (Niu et al., 2016)
 * 結合 sigmoid 啟動函數和隨機梯度下降優化
 */
export class PULearningAlgorithm {
	private dataPoints: DataPoint[] = [];
	private positivePoints: DataPoint[] = [];
	private unlabeledPoints: DataPoint[] = [];
	private reliableNegativePoints: DataPoint[] = [];

	// 新增：階段狀態管理
	private currentPhase: "initial" | "learning" | "prediction" | "analysis" =
		"initial";
	private predictionComplete = false;
	private analysisComplete = false;

	// Neural Network Parameters (Niu et al., 2016)
	private weights: number[] = []; // 權重向量 [w1, w2, bias]
	private learningRate = 0.01; // 學習率
	private epochs = 100; // 訓練迭代次數
	private priorPositive = 0.5; // 正樣本先驗概率 π

	// 動畫相關回調
	private onProgressUpdate?: (progress: number) => void;
	private onStageComplete?: (stage: string, points: DataPoint[]) => void;
	// 新增：儀表板與日誌回調
	private onDashboardUpdate?: (data: DashboardData) => void;
	private logs: string[] = [];
	private lastLogTime: number = Date.now();

	/**
	 * 添加一條科學日誌並更新儀表板
	 * @param message 日誌訊息
	 * @param data 要更新的儀表板資料
	 * @param type 日誌類型（INFO/WARN/SUCCESS）
	 */
	private addScientificLog(
		message: string,
		data: Partial<DashboardData> = {},
		type: "INFO" | "WARN" | "SUCCESS" = "INFO",
	): void {
		const now = Date.now();
		const timeDiff = (now - this.lastLogTime) / 1000; // 轉換為秒
		this.lastLogTime = now;

		// 科學日誌格式：[時間] (+耗時) [類型] 訊息
		const timeStr = new Date().toLocaleTimeString();
		const diffStr =
			this.logs.length > 0 ? ` (+${timeDiff.toFixed(3)}s)` : "";
		const typeStr = type === "INFO" ? "ℹ️" : type === "WARN" ? "⚠️" : "✅";

		const scientificLog = `[${timeStr}]${diffStr} ${typeStr} ${message}`;

		// 添加到本地日誌陣列
		this.logs.push(scientificLog);

		// 更新儀表板
		if (this.onDashboardUpdate) {
			this.onDashboardUpdate({
				...data,
				logs: [...this.logs], // 發送完整的日誌歷史
			});
		}
	}

	constructor(
		dataPoints: DataPoint[],
		callbacks?: {
			onProgressUpdate?: (progress: number) => void;
			onStageComplete?: (stage: string, points: DataPoint[]) => void;
			onDashboardUpdate?: (data: DashboardData) => void;
		},
	) {
		this.dataPoints = dataPoints.map((p) => ({ ...p }));
		this.onProgressUpdate = callbacks?.onProgressUpdate;
		this.onStageComplete = callbacks?.onStageComplete;
		this.onDashboardUpdate = callbacks?.onDashboardUpdate;

		this.categorizePoints();
		this.initializeWeights();
	}

	/**
	 * Sigmoid 啟動函數 (Niu et al., 2016)
	 * σ(z) = 1 / (1 + exp(-z))
	 */
	private sigmoid(z: number): number {
		// 避免數值溢出
		if (z > 500) {
			return 1.0;
		}
		if (z < -500) {
			return 0.0;
		}
		return 1.0 / (1.0 + Math.exp(-z));
	}

	/**
	 * Sigmoid 函數的導數
	 * σ'(z) = σ(z) * (1 - σ(z))
	 */
	private sigmoidDerivative(sigmoidOutput: number): number {
		return sigmoidOutput * (1.0 - sigmoidOutput);
	}

	/**
	 * 初始化神經網路權重 (小隨機值)
	 */
	private initializeWeights(): void {
		this.weights = [
			(Math.random() - 0.5) * 0.1, // w1 (x 座標權重)
			(Math.random() - 0.5) * 0.1, // w2 (y 座標權重)
			(Math.random() - 0.5) * 0.1, // bias
		];
	}

	/**
	 * 前向傳播：計算點的分類概率
	 * f(x) = σ(w1*x + w2*y + bias)
	 */
	private forwardPass(point: DataPoint): number {
		const z =
			this.weights[0] * point.x +
			this.weights[1] * point.y +
			this.weights[2];
		return this.sigmoid(z);
	}

	/**
	 * Non-Negative Risk Estimator (Niu et al., 2016)
	 * 計算 PU 學習的風險函數
	 */
	private calculatePULoss(): number {
		let positiveRisk = 0;
		let unlabeledRisk = 0;
		let negativeRisk = 0;

		// 正樣本風險：R_P^+ = (1/n_P) * Σ ℓ(f(x_i))
		for (const point of this.positivePoints) {
			const prediction = this.forwardPass(point);
			positiveRisk += -Math.log(prediction + 1e-15); // 負對數損失
		}
		positiveRisk =
			this.priorPositive * (positiveRisk / this.positivePoints.length);

		// 未標記樣本風險：R_U = (1/n_U) * Σ ℓ(f(x_i))
		for (const point of this.unlabeledPoints) {
			const prediction = this.forwardPass(point);
			unlabeledRisk += -Math.log(1 - prediction + 1e-15); // 負樣本損失
		}
		unlabeledRisk = unlabeledRisk / this.unlabeledPoints.length;

		// 負樣本風險估計：R_N^- = R_U - π * R_P^+
		negativeRisk =
			unlabeledRisk -
			this.priorPositive * (positiveRisk / this.priorPositive);

		// Non-negative constraint: max(0, R_N^-)
		negativeRisk = Math.max(0, negativeRisk);

		// 總風險：R = π * R_P^+ + (1-π) * R_N^-
		const totalRisk =
			positiveRisk + (1 - this.priorPositive) * negativeRisk;

		return totalRisk;
	}

	/**
	 * 隨機梯度下降優化 (Niu et al., 2016)
	 * 使用 mini-batch SGD 更新權重
	 */
	private performSGDStep(): void {
		const gradients = [0, 0, 0]; // [∂L/∂w1, ∂L/∂w2, ∂L/∂bias]

		// 計算正樣本梯度
		for (const point of this.positivePoints) {
			const prediction = this.forwardPass(point);
			const error = prediction - 1; // 正樣本目標為 1
			const sigmoidGrad = this.sigmoidDerivative(prediction);

			gradients[0] += error * sigmoidGrad * point.x;
			gradients[1] += error * sigmoidGrad * point.y;
			gradients[2] += error * sigmoidGrad;
		}

		// 正樣本梯度歸一化
		const posScale = this.priorPositive / this.positivePoints.length;
		gradients[0] *= posScale;
		gradients[1] *= posScale;
		gradients[2] *= posScale;

		// 計算未標記樣本梯度（負樣本估計）
		const negativeGradients = [0, 0, 0];
		for (const point of this.unlabeledPoints) {
			const prediction = this.forwardPass(point);
			const error = prediction - 0; // 負樣本目標為 0
			const sigmoidGrad = this.sigmoidDerivative(prediction);

			negativeGradients[0] += error * sigmoidGrad * point.x;
			negativeGradients[1] += error * sigmoidGrad * point.y;
			negativeGradients[2] += error * sigmoidGrad;
		}

		// 未標記樣本梯度歸一化
		const unlabeledScale =
			(1 - this.priorPositive) / this.unlabeledPoints.length;
		negativeGradients[0] *= unlabeledScale;
		negativeGradients[1] *= unlabeledScale;
		negativeGradients[2] *= unlabeledScale;

		// Non-negative constraint 的梯度調整
		const currentLoss = this.calculatePULoss();
		const nonNegativeScale = currentLoss > 0 ? 1.0 : 0.0;

		// 更新權重
		for (let i = 0; i < 3; i++) {
			const totalGradient =
				gradients[i] + nonNegativeScale * negativeGradients[i];
			this.weights[i] -= this.learningRate * totalGradient;
		}
	}

	/**
	 * 使用隨機梯度下降訓練模型
	 */
	private async trainNeuralNetwork(): Promise<void> {
		this.addScientificLog(
			`開始神經網路訓練 (SGD, ${this.epochs} epochs, lr=${this.learningRate})`,
		);

		for (let epoch = 0; epoch < this.epochs; epoch++) {
			// 執行一步 SGD
			this.performSGDStep();

			// 每 10 個 epoch 記錄一次損失
			if (epoch % 10 === 0) {
				const currentLoss = this.calculatePULoss();
				this.addScientificLog(
					`Epoch ${epoch}/${this.epochs}, Loss: ${currentLoss.toFixed(6)}, Weights: [${this.weights.map((w) => w.toFixed(4)).join(", ")}]`,
				);

				// 更新儀表板
				if (this.onDashboardUpdate) {
					this.onDashboardUpdate({
						iteration: epoch + 1,
						margin: currentLoss,
					});
				}
			}

			// 添加小延遲使訓練過程可視化
			if (epoch % 5 === 0) {
				await new Promise((resolve) => setTimeout(resolve, 50));
			}
		}

		const finalLoss = this.calculatePULoss();
		this.addScientificLog(
			`神經網路訓練完成！最終損失: ${finalLoss.toFixed(6)}`,
			{},
			"SUCCESS",
		);
	}

	/**
	 * 分類初始點
	 */
	private categorizePoints(): void {
		this.positivePoints = this.dataPoints.filter(
			(p) => p.currentLabel === "P",
		);
		this.unlabeledPoints = this.dataPoints.filter(
			(p) => p.currentLabel === "U",
		);
	}

	/**
	 * 執行PU學習演算法到預測階段
	 */
	public async execute(): Promise<DataPoint[]> {
		this.currentPhase = "learning";
		this.lastLogTime = Date.now(); // 重置計時器

		// 初始化儀表板狀態
		this.addScientificLog("啟動 PU 學習演算法...", {
			phase1Status: "waiting",
			phase2Status: "waiting",
		});

		this.addScientificLog(
			`初始資料集: ${this.dataPoints.length} 個點 (${this.positivePoints.length} 個已標記正樣本)`,
		);

		// 階段1：找出可靠負樣本
		await this.findReliableNegativeSamples();

		// 階段2：訓練分類器並進行預測
		await this.trainClassifierAndPredict();

		this.currentPhase = "prediction";
		this.predictionComplete = true;

		this.addScientificLog(
			"演算法執行完成！",
			{
				currentStep: "DONE",
				phase1Status: "complete",
				phase2Status: "complete",
			},
			"SUCCESS",
		);

		await new Promise((resolve) => setTimeout(resolve, 500));

		return this.dataPoints;
	}

	/**
	 * 執行結果分析階段（顯示預測的對錯）
	 */
	public async analyzeResults(): Promise<DataPoint[]> {
		if (!this.predictionComplete) {
			throw new Error("必須先完成預測階段才能進行結果分析");
		}

		this.currentPhase = "analysis";
		await this.performAccuracyAnalysis();
		this.analysisComplete = true;

		return this.dataPoints;
	}

	/**
	 * 階段1：找出可靠負樣本
	 * 按照規格書要求：找到距離所有正樣本最遠的點
	 */
	private async findReliableNegativeSamples(): Promise<void> {
		// 更新階段狀態
		this.addScientificLog("階段1: 開始尋找可靠負樣本", {
			currentStep: "FINDING_CENTROID",
			phase1Status: "running",
			phase2Status: "waiting",
		});

		// 步驟 1.1: 計算正樣本質心
		this.addScientificLog("正在計算正樣本群的質心座標...");
		const pCentroid = this.calculateCentroid(this.positivePoints);

		this.addScientificLog(
			`質心計算完成 → (${pCentroid.x.toFixed(4)}, ${pCentroid.y.toFixed(4)})`,
			{ pCentroid },
			"SUCCESS",
		);
		await new Promise((resolve) => setTimeout(resolve, 500));

		// 步驟 1.2: 尋找並標記 RN
		this.addScientificLog("開始掃描未標註樣本，尋找可靠負樣本...", {
			currentStep: "MARKING_RN",
		});
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// 計算每個未標記點到所有正樣本的最小距離
		const pointsWithDistance = this.unlabeledPoints.map((point) => {
			let minDistToPositive = Number.POSITIVE_INFINITY;

			this.positivePoints.forEach((posPoint) => {
				const dist = DatasetGenerator.calculateDistance(
					point,
					posPoint,
				);
				minDistToPositive = Math.min(minDistToPositive, dist);
			});

			return {
				point,
				minDistToPositive,
			};
		});

		// 按距離排序，選擇最遠的30%作為可靠負樣本
		pointsWithDistance.sort(
			(a, b) => b.minDistToPositive - a.minDistToPositive,
		);
		const reliableNegativeCount = Math.floor(
			pointsWithDistance.length * 0.3,
		);

		// 漸進式標記可靠負樣本（增強視覺效果）
		for (let i = 0; i < reliableNegativeCount; i++) {
			const { point } = pointsWithDistance[i];
			point.currentLabel = "RN";
			point.animationPhase = 1;

			if (this.onDashboardUpdate) {
				this.onDashboardUpdate({ rnCount: i + 1 });
			}

			// 更新進度
			if (this.onProgressUpdate) {
				this.onProgressUpdate(((i + 1) / reliableNegativeCount) * 0.5); // 前50%進度
			}

			// 添加小延遲使動畫更流暢
			await new Promise((resolve) => setTimeout(resolve, 50));
		}

		this.reliableNegativePoints = this.dataPoints.filter(
			(p) => p.currentLabel === "RN",
		);

		if (this.onStageComplete) {
			this.onStageComplete("reliable_negative_found", [
				...this.dataPoints,
			]);
		}
	}

	/**
	 * 階段2：使用神經網路訓練分類器並進行預測 (Niu et al., 2016)
	 * 結合 Non-Negative Risk Estimator 和 Sigmoid 啟動函數
	 */
	private async trainClassifierAndPredict(): Promise<void> {
		// 更新階段狀態
		this.addScientificLog(
			"階段2: 初始化神經網路分類器 (Niu et al., 2016)",
			{
				currentStep: "TRAINING_SVM",
				phase1Status: "complete",
				phase2Status: "running",
			},
		);

		// 設置正樣本先驗概率
		this.priorPositive =
			this.positivePoints.length / this.dataPoints.length;
		this.addScientificLog(
			`正樣本先驗概率 π = ${this.priorPositive.toFixed(4)} (${this.positivePoints.length}/${this.dataPoints.length})`,
		);

		// 訓練神經網路
		await this.trainNeuralNetwork();

		// 使用訓練好的模型進行預測
		await this.performNeuralNetworkPrediction();

		if (this.onStageComplete) {
			this.onStageComplete("prediction_complete", [...this.dataPoints]);
		}
	}

	/**
	 * 使用訓練好的神經網路進行預測
	 */
	private async performNeuralNetworkPrediction(): Promise<void> {
		const remainingUnlabeled = this.dataPoints.filter(
			(p) => p.currentLabel === "U",
		);

		this.addScientificLog(
			`使用神經網路預測 ${remainingUnlabeled.length} 個未標記樣本...`,
		);

		for (let i = 0; i < remainingUnlabeled.length; i++) {
			const point = remainingUnlabeled[i];

			// 使用 sigmoid 啟動函數計算正樣本概率
			const positiveProbability = this.forwardPass(point);

			// 更新點的概率資訊
			point.probabilities = {
				α: positiveProbability,
				β: 1 - positiveProbability,
				γ: 0, // PU 學習只處理二元分類
			};

			// 基於概率閾值進行分類 (通常用 0.5)
			point.currentLabel = positiveProbability > 0.5 ? "PP" : "PN";
			point.animationPhase = 2;

			// 計算決策置信度（距離決策邊界的距離）
			const confidence = Math.abs(positiveProbability - 0.5) * 2;

			if (this.onDashboardUpdate) {
				this.onDashboardUpdate({
					iteration: i + 1,
					margin: confidence,
					logs: [
						`[${new Date().toLocaleTimeString()}] 樣本 ${i + 1}/${remainingUnlabeled.length}: P(positive)=${positiveProbability.toFixed(3)}, 預測=${point.currentLabel}`,
					],
				});
			}

			// 更新進度
			if (this.onProgressUpdate) {
				this.onProgressUpdate(
					0.5 + ((i + 1) / remainingUnlabeled.length) * 0.5,
				); // 後50%進度
			}

			// 添加小延遲使分類過程可視化
			await new Promise((resolve) => setTimeout(resolve, 30));
		}

		this.addScientificLog(
			`神經網路預測完成！預測為正樣本: ${this.dataPoints.filter((p) => p.currentLabel === "PP").length} 個`,
			{},
			"SUCCESS",
		);
	}

	/**
	 * 執行準確率分析階段
	 * 為每個點添加正確/錯誤的標記
	 */
	private async performAccuracyAnalysis(): Promise<void> {
		this.addScientificLog("開始進行預測結果分析", {}, "INFO");

		const predictedPoints = this.dataPoints.filter(
			(p) => p.currentLabel === "PP" || p.currentLabel === "PN",
		);

		this.addScientificLog(
			`分析範圍: ${predictedPoints.length} 個預測樣本`,
			{},
			"INFO",
		);

		for (let i = 0; i < predictedPoints.length; i++) {
			const point = predictedPoints[i];

			// 判斷預測是否正確
			const predictedAsPositive = point.currentLabel === "PP";
			const actuallyPositive = point.trueLabel === "α";
			const isCorrect = predictedAsPositive === actuallyPositive;

			// 設置分析階段標記
			point.animationPhase = 3;

			this.addScientificLog(
				`樣本 #${i + 1} [${predictedAsPositive ? "PP" : "PN"}] -> ${isCorrect ? "正確預測" : "預測錯誤"} ` +
					`(實際: ${actuallyPositive ? "α" : "β"})`,
				{},
				isCorrect ? "SUCCESS" : "WARN",
			);

			// 可以在這裡添加視覺反饋，比如添加 ✅ 或 ❌ 標記
			// 這部分的視覺效果應該在組件中處理

			// 更新進度
			if (this.onProgressUpdate) {
				this.onProgressUpdate((i + 1) / predictedPoints.length);
			}

			// 添加小延遲使分析過程可視化
			await new Promise((resolve) => setTimeout(resolve, 20));
		}

		if (this.onStageComplete) {
			this.onStageComplete("analysis_complete", [...this.dataPoints]);
		}
	}

	/**
	 * 獲取神經網路決策邊界線的坐標 (Niu et al., 2016)
	 * 決策邊界：w1*x + w2*y + bias = 0 (sigmoid(z) = 0.5 時)
	 */
	public getDecisionBoundary(): {
		x1: number;
		y1: number;
		x2: number;
		y2: number;
	} | null {
		if (this.weights.length !== 3) {
			return null;
		}

		const [w1, w2, bias] = this.weights;

		// 如果權重太小，無法繪製有意義的邊界
		if (Math.abs(w1) < 1e-6 && Math.abs(w2) < 1e-6) {
			return null;
		}

		// 決策邊界方程：w1*x + w2*y + bias = 0
		// 重新整理為：y = -(w1*x + bias) / w2

		let x1: number;
		let y1: number;
		let x2: number;
		let y2: number;

		if (Math.abs(w2) > Math.abs(w1)) {
			// 以 x 為主軸
			x1 = 0;
			x2 = 1;
			y1 = -(w1 * x1 + bias) / w2;
			y2 = -(w1 * x2 + bias) / w2;
		} else {
			// 以 y 為主軸
			y1 = 0;
			y2 = 1;
			x1 = -(w2 * y1 + bias) / w1;
			x2 = -(w2 * y2 + bias) / w1;
		}

		// 確保邊界線在可視範圍內
		const clamp = (value: number) => Math.max(0, Math.min(1, value));

		return {
			x1: clamp(x1),
			y1: clamp(y1),
			x2: clamp(x2),
			y2: clamp(y2),
		};
	}

	/**
	 * 計算點群的質心
	 */
	private calculateCentroid(points: DataPoint[]): { x: number; y: number } {
		const sumX = points.reduce((sum, p) => sum + p.x, 0);
		const sumY = points.reduce((sum, p) => sum + p.y, 0);
		return {
			x: sumX / points.length,
			y: sumY / points.length,
		};
	}

	/**
	 * 獲取當前階段的說明文字
	 */
	public getCurrentStageDescription(): string {
		switch (this.currentPhase) {
			case "initial":
				return "準備開始PU學習：使用神經網路識別隱藏的正樣本";
			case "learning": {
				const stage1Complete = this.reliableNegativePoints.length > 0;
				const hasUnlabeled = this.dataPoints.some(
					(p) => p.currentLabel === "U",
				);

				if (!stage1Complete) {
					return "尋找可靠負樣本：距離所有正樣本最遠的點";
				}
				if (hasUnlabeled) {
					return "訓練神經網路：使用 Sigmoid 啟動函數和隨機梯度下降 (Niu et al., 2016)";
				}
				return "神經網路學習完成，準備進行預測";
			}
			case "prediction":
				return "神經網路預測結果：基於 Non-Negative Risk Estimator 的分類";
			case "analysis":
				return "實驗結果分析：評估神經網路預測的準確性";
			default:
				return "PU學習演算法 (Niu et al., 2016)";
		}
	}

	/**
	 * 獲取當前階段
	 */
	public getCurrentPhase():
		| "initial"
		| "learning"
		| "prediction"
		| "analysis" {
		return this.currentPhase;
	}

	/**
	 * 檢查是否可以進行結果分析
	 */
	public canAnalyzeResults(): boolean {
		const canAnalyze = this.predictionComplete && !this.analysisComplete;
		console.log("[PULearningAlgorithm.canAnalyzeResults]");
		console.log("  predictionComplete:", this.predictionComplete);
		console.log("  analysisComplete:", this.analysisComplete);
		console.log("  canAnalyze:", canAnalyze);
		return canAnalyze;
	}

	/**
	 * 檢查分析是否已完成
	 */
	public isAnalysisComplete(): boolean {
		return this.analysisComplete;
	}

	/**
	 * 獲取預測統計信息
	 */
	public getPredictionStats(): {
		totalPredictedPositive: number;
		totalPredictedNegative: number;
		totalOriginalPositive: number;
		totalReliableNegative: number;
	} {
		const predictedPositive = this.dataPoints.filter(
			(p) => p.currentLabel === "PP",
		).length;
		const predictedNegative = this.dataPoints.filter(
			(p) => p.currentLabel === "PN",
		).length;
		const originalPositive = this.positivePoints.length;
		const reliableNegative = this.reliableNegativePoints.length;

		return {
			totalPredictedPositive: predictedPositive,
			totalPredictedNegative: predictedNegative,
			totalOriginalPositive: originalPositive,
			totalReliableNegative: reliableNegative,
		};
	}

	/**
	 * 獲取分析結果統計
	 */
	public getAnalysisStats(): {
		truePositives: number;
		falsePositives: number;
		trueNegatives: number;
		falseNegatives: number;
		accuracy: number;
	} | null {
		if (!this.analysisComplete) {
			return null;
		}

		let truePositives = 0;
		let falsePositives = 0;
		let trueNegatives = 0;
		let falseNegatives = 0;

		// 包括原始正樣本和預測結果
		this.dataPoints.forEach((point) => {
			const predictedAsPositive =
				point.currentLabel === "P" || point.currentLabel === "PP";
			const actuallyPositive = point.trueLabel === "α";

			if (predictedAsPositive && actuallyPositive) {
				truePositives++;
			} else if (predictedAsPositive && !actuallyPositive) {
				falsePositives++;
			} else if (!predictedAsPositive && !actuallyPositive) {
				trueNegatives++;
			} else if (!predictedAsPositive && actuallyPositive) {
				falseNegatives++;
			}
		});

		const accuracy = Math.round(
			((truePositives + trueNegatives) / this.dataPoints.length) * 100,
		);

		return {
			truePositives,
			falsePositives,
			trueNegatives,
			falseNegatives,
			accuracy,
		};
	}

	/**
	 * 計算分類準確率 (保持向後兼容)
	 */
	public calculateAccuracy(): number {
		const stats = this.getAnalysisStats();
		return stats ? stats.accuracy : 0;
	}

	/**
	 * 獲取錯誤分類的點 (保持向後兼容)
	 */
	public getMisclassifiedPoints(): DataPoint[] {
		return this.dataPoints.filter((point) => {
			const predictedIsPositive =
				point.currentLabel === "P" || point.currentLabel === "PP";
			const actuallyIsPositive = point.trueLabel === "α";
			return predictedIsPositive !== actuallyIsPositive;
		});
	}

	/**
	 * 獲取演算法統計資訊
	 */
	public getAlgorithmStats() {
		const currentPULoss = this.calculatePULoss();

		return {
			name: "PU Learning with Neural Network",
			description:
				"Positive-Unlabeled Learning with Sigmoid Activation & SGD (Niu et al., 2016)",
			positivePoints: this.positivePoints.length,
			unlabeledPoints: this.dataPoints.filter(
				(p) => p.currentLabel === "U",
			).length,
			reliableNegativePoints: this.reliableNegativePoints.length,
			predictedPositivePoints: this.dataPoints.filter(
				(p) => p.currentLabel === "P" || p.currentLabel === "PP",
			).length,
			predictedNegativePoints: this.dataPoints.filter(
				(p) => p.currentLabel === "RN" || p.currentLabel === "PN",
			).length,
			learningRate: this.learningRate,
			epochs: this.epochs,
			puLoss: currentPULoss,
			weights: {
				w1: this.weights[0] || 0,
				w2: this.weights[1] || 0,
				bias: this.weights[2] || 0,
			},
		};
	}

	/**
	 * 獲取儀表板數據
	 */
	public getDashboardData(): PUDashboardData {
		const analysisStats = this.getAnalysisStats();
		const algorithmStats = this.getAlgorithmStats();

		return {
			// 演算法核心數據
			pCentroid:
				this.positivePoints.length > 0
					? this.calculateCentroid(this.positivePoints)
					: null,
			rnCount: this.reliableNegativePoints.length,
			iteration: this.epochs,
			margin: 0, // Neural network doesn't use SVM margin

			// 演算法狀態
			currentStep:
				this.currentPhase === "initial"
					? "IDLE"
					: this.currentPhase === "learning"
						? "TRAINING_SVM"
						: this.currentPhase === "prediction"
							? "DONE"
							: this.currentPhase === "analysis"
								? "DONE"
								: "IDLE",
			isTraining: this.currentPhase === "learning",

			// 準確性指標
			accuracy: analysisStats?.accuracy || 0,
			totalSamples: this.dataPoints.length,
			positiveSamples: this.positivePoints.length,
			unlabeledSamples: this.dataPoints.filter(
				(p) => p.currentLabel === "U",
			).length,

			// 進度追蹤
			currentPhase:
				this.currentPhase === "prediction"
					? "learning"
					: this.currentPhase, // Map prediction to learning for compatibility
			logs: this.logs,
			analysisComplete: this.analysisComplete,

			// 相容性屬性
			misclassifiedSamples: this.getMisclassifiedPoints().length,
			averageEntropy: 0,
			phase1Status:
				this.reliableNegativePoints.length > 0 ? "complete" : "waiting",
			phase2Status: this.predictionComplete ? "complete" : "waiting",

			// Neural Network 統計
			algorithmStats: algorithmStats,
		};
	}
}
