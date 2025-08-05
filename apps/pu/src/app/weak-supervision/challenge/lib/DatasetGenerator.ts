import * as d3 from "d3";

// 數據類型定義
export interface DataPoint {
	id: string;
	x: number;
	y: number;
	trueLabel: "α" | "β" | "γ";
	currentLabel: "P" | "U" | "RN" | "PP" | "PN" | "α" | "β" | "γ" | null;
	probabilities: { α: number; β: number; γ: number };
	isLabeled: boolean;
	// 新增動畫相關屬性
	originalX?: number;
	originalY?: number;
	targetX?: number;
	targetY?: number;
	animationPhase?: number;
}

export type LearningMode = "PU" | "PNU" | "CLL";

/**
 * 虛擬數據集生成器
 * 按照規格書要求生成符合高斯分佈的三類數據
 */
export class DatasetGenerator {
	private static instance: DatasetGenerator;

	// 數據分佈參數（按照規格書規定）
	private readonly distributions = {
		α: {
			count: 60,
			featureX: { mean: 0.2, stdev: 0.1 },
			featureY: { mean: 0.3, stdev: 0.15 },
			color: "#4285f4", // 藍色
		},
		β: {
			count: 60,
			featureX: { mean: 0.7, stdev: 0.12 },
			featureY: { mean: 0.2, stdev: 0.1 },
			color: "#ea4335", // 紅色
		},
		γ: {
			count: 60,
			featureX: { mean: 0.5, stdev: 0.1 },
			featureY: { mean: 0.7, stdev: 0.12 },
			color: "#34a853", // 綠色
		},
	};

	public static getInstance(): DatasetGenerator {
		if (!DatasetGenerator.instance) {
			DatasetGenerator.instance = new DatasetGenerator();
		}
		return DatasetGenerator.instance;
	}

	/**
	 * 生成完整的數據集（180個點）
	 */
	public generateDataset(): DataPoint[] {
		const points: DataPoint[] = [];
		let id = 0;

		// 為每個類別生成數據點
		(
			Object.keys(this.distributions) as Array<
				keyof typeof this.distributions
			>
		).forEach((label) => {
			const config = this.distributions[label];

			for (let i = 0; i < config.count; i++) {
				const point = this.generateSinglePoint(label, id++);
				points.push(point);
			}
		});

		// 隨機打亂順序，避免按類別聚集
		return this.shuffleArray(points);
	}

	/**
	 * 生成單個數據點
	 */
	private generateSinglePoint(label: "α" | "β" | "γ", id: number): DataPoint {
		const config = this.distributions[label];

		// 使用 d3 的高斯分佈生成器
		const x = Math.max(
			0,
			Math.min(
				1,
				d3.randomNormal(config.featureX.mean, config.featureX.stdev)(),
			),
		);
		const y = Math.max(
			0,
			Math.min(
				1,
				d3.randomNormal(config.featureY.mean, config.featureY.stdev)(),
			),
		);

		return {
			id: `point_${id}`,
			x,
			y,
			originalX: x,
			originalY: y,
			trueLabel: label,
			currentLabel: null,
			probabilities: { α: 1 / 3, β: 1 / 3, γ: 1 / 3 },
			isLabeled: false,
			animationPhase: 0,
		};
	}

	/**
	 * 根據學習模式初始化標籤
	 */
	public initializeLabelsForMode(
		points: DataPoint[],
		mode: LearningMode,
	): DataPoint[] {
		const newPoints = points.map((p) => ({ ...p }));

		switch (mode) {
			case "PU":
				this.initializePULabels(newPoints);
				break;
			case "PNU":
				this.initializePNULabels(newPoints);
				break;
			case "CLL":
				this.initializeCLLLabels(newPoints);
				break;
		}

		return newPoints;
	}

	/**
	 * PU學習模式：標記一些Class α為P，其他都是U
	 */
	private initializePULabels(points: DataPoint[]): void {
		points.forEach((point) => {
			if (point.trueLabel === "α" && Math.random() < 0.3) {
				point.currentLabel = "P";
				point.isLabeled = true;
				// 重置概率，因為我們確定這是正樣本
				point.probabilities = { α: 1, β: 0, γ: 0 };
			} else {
				point.currentLabel = "U";
				point.isLabeled = false;
				// 未標記樣本保持均等概率
				point.probabilities = { α: 1 / 3, β: 1 / 3, γ: 1 / 3 };
			}
		});
	}

	/**
	 * PNU學習模式：標記少量的α和β
	 */
	private initializePNULabels(points: DataPoint[]): void {
		points.forEach((point) => {
			// 只標記少量的α和β類別樣本
			if (
				(point.trueLabel === "α" || point.trueLabel === "β") &&
				Math.random() < 0.2
			) {
				point.currentLabel = point.trueLabel;
				point.isLabeled = true;
				// 設置確定的標籤概率
				point.probabilities[point.trueLabel] = 1;
				point.probabilities[point.trueLabel === "α" ? "β" : "α"] = 0;
				point.probabilities.γ = 0;
			} else {
				point.currentLabel = null;
				point.isLabeled = false;
				// 未標記樣本保持均等概率
				point.probabilities = { α: 1 / 3, β: 1 / 3, γ: 1 / 3 };
			}
		});
	}

	/**
	 * CLL學習模式：所有點都未標記，但會收到互補標籤
	 */
	private initializeCLLLabels(points: DataPoint[]): void {
		points.forEach((point) => {
			point.currentLabel = null;
			point.isLabeled = false;
			// 所有樣本開始時都有均等概率
			point.probabilities = { α: 1 / 3, β: 1 / 3, γ: 1 / 3 };
		});
	}

	/**
	 * 工具函數：隨機打亂數組
	 */
	private shuffleArray<T>(array: T[]): T[] {
		const result = [...array];
		for (let i = result.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[result[i], result[j]] = [result[j], result[i]];
		}
		return result;
	}

	/**
	 * 獲取類別的標準顏色
	 */
	public getClassColor(label: "α" | "β" | "γ"): string {
		return this.distributions[label].color;
	}

	/**
	 * 計算兩點之間的歐幾里得距離
	 */
	public static calculateDistance(p1: DataPoint, p2: DataPoint): number {
		return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
	}

	/**
	 * 根據概率混合顏色（用於PNU和CLL學習）
	 */
	public static getColorFromProbabilities(probabilities: {
		α: number;
		β: number;
		γ: number;
	}): string {
		const { α, β, γ } = probabilities;

		// RGB顏色值
		const colors = {
			α: { r: 66, g: 133, b: 244 }, // 藍色
			β: { r: 234, g: 67, b: 53 }, // 紅色
			γ: { r: 52, g: 168, b: 83 }, // 綠色
		};

		const r = Math.round(α * colors.α.r + β * colors.β.r + γ * colors.γ.r);
		const g = Math.round(α * colors.α.g + β * colors.β.g + γ * colors.γ.g);
		const b = Math.round(α * colors.α.b + β * colors.β.b + γ * colors.γ.b);

		return `rgb(${r}, ${g}, ${b})`;
	}
}
