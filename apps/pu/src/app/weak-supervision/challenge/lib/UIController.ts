import type { DataPoint, LearningMode } from "./DatasetGenerator";

// 實驗步驟
export type ExperimentStep =
	| "setup"
	| "start"
	| "learning"
	| "result"
	| "analysis";

// 日誌訊息類型
export interface LogMessage {
	step: ExperimentStep;
	mode: LearningMode;
	title: string;
	content: string;
	formula?: string;
}

/**
 * UI控制器類
 * 負責管理使用者介面的狀態和互動
 */
export class UIController {
	private currentMode: LearningMode = "PU";
	private currentStep: ExperimentStep = "setup";
	private currentLog: LogMessage | null = null;
	private animationProgress = 0;

	// 回調函數
	private onModeChange?: (mode: LearningMode) => void;
	private onStepChange?: (step: ExperimentStep) => void;
	private onLogUpdate?: (log: LogMessage) => void;
	private onProgressUpdate?: (progress: number) => void;

	constructor(callbacks?: {
		onModeChange?: (mode: LearningMode) => void;
		onStepChange?: (step: ExperimentStep) => void;
		onLogUpdate?: (log: LogMessage) => void;
		onProgressUpdate?: (progress: number) => void;
	}) {
		this.onModeChange = callbacks?.onModeChange;
		this.onStepChange = callbacks?.onStepChange;
		this.onLogUpdate = callbacks?.onLogUpdate;
		this.onProgressUpdate = callbacks?.onProgressUpdate;

		// 初始化日誌
		this.updateLogMessage();
	}

	/**
	 * 切換學習模式
	 */
	public setMode(mode: LearningMode): void {
		this.currentMode = mode;
		this.currentStep = "setup";
		this.animationProgress = 0;

		this.updateLogMessage();

		if (this.onModeChange) {
			this.onModeChange(mode);
		}
		if (this.onStepChange) {
			this.onStepChange("setup");
		}
	}

	/**
	 * 設置實驗步驟
	 */
	public setStep(step: ExperimentStep): void {
		this.currentStep = step;
		this.updateLogMessage();

		if (this.onStepChange) {
			this.onStepChange(step);
		}
	}

	/**
	 * 更新動畫進度
	 */
	public setAnimationProgress(progress: number): void {
		this.animationProgress = progress;
		if (this.onProgressUpdate) {
			this.onProgressUpdate(progress);
		}
	}

	/**
	 * 更新日誌訊息
	 */
	private updateLogMessage(): void {
		const messages = this.getLogMessages();
		this.currentLog = messages[this.currentMode][this.currentStep];

		if (this.onLogUpdate && this.currentLog) {
			this.onLogUpdate(this.currentLog);
		}
	}

	/**
	 * 更新日誌訊息並替換動態內容（如準確率）
	 */
	public updateLogMessageWithAccuracy(accuracy: number): void {
		const messages = this.getLogMessages();
		this.currentLog = messages[this.currentMode][this.currentStep];

		if (this.currentLog?.content.includes("{accuracy}")) {
			this.currentLog = {
				...this.currentLog,
				content: this.currentLog.content.replace(
					"{accuracy}",
					accuracy.toString(),
				),
			};
		}

		if (this.onLogUpdate && this.currentLog) {
			this.onLogUpdate(this.currentLog);
		}
	}

	/**
	 * 更新日誌訊息並替換動態內容（如準確率和統計數字）
	 */
	public updateLogMessageWithStats(stats: {
		accuracy: number;
		truePositives: number;
		falsePositives: number;
		trueNegatives: number;
		falseNegatives: number;
	}): void {
		const messages = this.getLogMessages();
		this.currentLog = messages[this.currentMode][this.currentStep];

		if (this.currentLog?.content.includes("{accuracy}")) {
			let content = this.currentLog.content.replace(
				"{accuracy}",
				stats.accuracy.toString(),
			);

			// 如果是分析階段，添加更詳細的統計信息
			if (this.currentStep === "analysis" && this.currentMode === "PU") {
				content = content.replace(
					"✅ 預測正確：AI 成功找到了隱藏的正樣本，並正確排除了負樣本。",
					`✅ 預測正確：AI 成功找到了 ${stats.truePositives} 個隱藏的正樣本，並正確排除了 ${stats.trueNegatives} 個負樣本。`,
				);
				content = content.replace(
					"• 漏網之魚 (False Negative)：真正的正樣本，AI 沒能發現它們。",
					`• 漏網之魚 (False Negative)：有 ${stats.falseNegatives} 個真正的正樣本，AI 沒能發現它們。`,
				);
				content = content.replace(
					"• 錯認好人 (False Positive)：AI 把負樣本誤認為是正樣本。",
					`• 錯認好人 (False Positive)：AI 把 ${stats.falsePositives} 個負樣本誤認為是正樣本。`,
				);
			}

			this.currentLog = {
				...this.currentLog,
				content: content,
			};
		}

		if (this.onLogUpdate && this.currentLog) {
			this.onLogUpdate(this.currentLog);
		}
	}

	/**
	 * 獲取所有日誌訊息
	 */
	private getLogMessages(): Record<
		LearningMode,
		Record<ExperimentStep, LogMessage>
	> {
		return {
			PU: {
				setup: {
					step: "setup",
					mode: "PU",
					title: "🧬 PU學習實驗設定",
					content:
						"問題定義：醫生只給了我們一些確定的「癌症」病例 (P - 藍色圓點)，但有海量的未標記病例 (U - 灰色圓點)，裡面混雜了健康樣本和未發現的癌症樣本。\n\n實驗設定：我們需要從這些不完美的標籤中，找出所有潛在的癌症病例。注意到許多真正的癌症樣本被錯誤地標記為「未知」。這就是 PU 學習要解決的核心挑戰。",
				},
				start: {
					step: "start",
					mode: "PU",
					title: "🚀 啟動PU學習模型",
					content:
						"模型思路：我們將使用杉山教授提出的「迭代式可靠負樣本挖掘」演算法。\n\n第一步：在未標記樣本中，找出距離所有已知正樣本最遠的點，這些點很可能是真正的負樣本。\n第二步：使用這些可靠負樣本和已知正樣本訓練 SVM 分類器。\n第三步：用訓練好的分類器對剩餘樣本進行分類。",
				},
				learning: {
					step: "learning",
					mode: "PU",
					title: "🔬 PU學習演算法執行中...",
					content:
						"階段一：可靠負樣本挖掘\n- 計算每個未標記點到所有正樣本的最小距離\n- 選擇距離最遠的 30% 作為可靠負樣本 (RN)\n\n階段二：SVM 分類器訓練\n- 基於正樣本 (P) 和可靠負樣本 (RN) 訓練分類器\n- 最大化兩類之間的間隔 (Margin)",
					formula: "min(w,b) ½||w||² s.t. yi(w·xi - b) ≥ 1",
				},
				result: {
					step: "result",
					mode: "PU",
					title: "📊 PU學習預測結果",
					content:
						"PU 學習完成！\n\n🔵 深藍點：初始已知的正樣本。\n💧 淺藍點：AI 預測這是隱藏的正樣本。\n⚫️ 灰色點：AI 預測這是負樣本（健康病例）。\n\n---\n模型思路：AI 學習了深藍點的特徵，並畫出了一條決策邊界（橙色虛線），然後將邊界內的未標註點判斷為新的正樣本。",
				},
				analysis: {
					step: "analysis",
					mode: "PU",
					title: "📈 實驗結果分析",
					content:
						"✅ 預測正確：AI 成功找到了隱藏的正樣本，並正確排除了負樣本。\n❌ 預測錯誤：\n• 漏網之魚 (False Negative)：真正的正樣本，AI 沒能發現它們。\n• 錯認好人 (False Positive)：AI 把負樣本誤認為是正樣本。\n\n---\n最終結論：綜合以上表現，模型準確率為 {accuracy}%。PU 學習在只有正樣本線索的困難情況下，依然展現了強大的挖掘能力！",
				},
			},
			PNU: {
				setup: {
					step: "setup",
					mode: "PNU",
					title: "🌐 PNU學習實驗設定",
					content:
						"問題定義：我們只有少量被標記為 α 類（藍色）和 β 類（紅色）的數據，還有一個未知的 γ 類（綠色）完全沒有標記。如何利用這些稀少的線索，去分類海量的未標記數據？\n\n實驗設定：這是多分類場景下的半監督學習。我們將透過標籤傳播機制，讓已知標籤的「確定性」像波紋一樣向鄰近的未標記樣本傳播。",
				},
				start: {
					step: "start",
					mode: "PNU",
					title: "🚀 啟動PNU學習模型",
					content:
						"模型思路：杉山教授改進的標籤傳播演算法 (Label Propagation)\n\n核心假設：相似的樣本應該有相似的標籤\n傳播機制：每個未標記的點會根據其鄰居的標籤概率和距離遠近，來更新自身的標籤概率\n收斂條件：當所有點的標籤概率不再顯著變化時停止迭代",
				},
				learning: {
					step: "learning",
					mode: "PNU",
					title: "🔬 標籤傳播演算法執行中...",
					content:
						"迭代傳播過程：\n• 每個未標記點根據鄰居的當前標籤概率更新自身概率\n• 距離近的鄰居影響大，距離遠的鄰居影響小\n• 顏色的變化反映了標籤確定性的傳播過程\n• 已標記的點保持其原始標籤不變",
					formula: "Yi^(t+1) ← Σj Tij Yj^(t)",
				},
				result: {
					step: "result",
					mode: "PNU",
					title: "📊 PNU學習預測結果",
					content:
						"標籤傳播完成！\n\n顏色含義：\n• 深藍色：高度可能是 α 類\n• 深紅色：高度可能是 β 類  \n• 深綠色：高度可能是 γ 類\n• 混合色：概率介於多個類別之間\n\n連接線：顯示標籤傳播的影響網絡",
				},
				analysis: {
					step: "analysis",
					mode: "PNU",
					title: "📈 PNU學習實驗結果分析",
					content:
						"✅ 傳播效果：少量的標記信息成功擴散到整個數據集\n❌ 邊界混淆：紅色 ❌ 顯示分類邊界附近的錯誤\n\n📚 杉山教授的理論貢獻：\n• 將圖論與機器學習結合，數據點構成圖的節點\n• 利用隨機遊走理論，實現標籤的平滑傳播\n• 解決了「標記樣本極少」的半監督學習問題\n\n🔬 演算法本質：透過鄰域結構的幾何假設，讓「物以類聚」的直覺在高維空間中實現。",
				},
			},
			CLL: {
				setup: {
					step: "setup",
					mode: "CLL",
					title: "🔍 CLL學習實驗設定",
					content:
						"問題定義：想像一場破案遊戲 - 目擊者不認得嫌犯，但他能肯定地告訴我們「嫌犯不是A」、「嫌犯不是B」。如何利用這些排除法線索來縮小範圍，最終破案？\n\n實驗設定：這就是互補標籤學習 (Complementary Label Learning)。我們將收到一系列否定信息，例如「這個樣本不是 α 類」，然後利用排除法和貝氏推理進行分類。",
				},
				start: {
					step: "start",
					mode: "CLL",
					title: "🚀 啟動CLL學習模型",
					content:
						"模型思路：杉山教授的概率排除與修正演算法\n\n核心概念：當收到「Y ≠ c」的信息時，我們將該類的概率設為0，並按比例提升其他類的概率\n傳播機制：排除信息會向鄰近樣本傳播，形成「疑犯排除網絡」\n推理邏輯：多個否定信息的累積，最終指向正確的分類",
				},
				learning: {
					step: "learning",
					mode: "CLL",
					title: "🔬 互補標籤學習執行中...",
					content:
						"排除與修正過程：\n1️⃣ 接收互補標籤信息（例如：🚫β 表示「不是β類」）\n2️⃣ 將排除類別的概率設為0\n3️⃣ 重新分配剩餘概率給其他類別\n4️⃣ 向鄰居傳播此排除信息\n\n紅色虛線：排除信息的影響範圍",
				},
				result: {
					step: "result",
					mode: "CLL",
					title: "📊 CLL學習預測結果",
					content:
						"排除法分類完成！\n\n推理結果：\n• 透過收集多個「不是什麼」的信息\n• 模型推斷出每個樣本最可能的真實類別\n• 顏色深淺反映最終的分類確信度\n\n🔍 破案邏輯：排除了不可能，剩下的就是真相！",
				},
				analysis: {
					step: "analysis",
					mode: "CLL",
					title: "📈 CLL學習實驗結果分析",
					content:
						"✅ 排除法的威力：透過多個否定信息的累積，成功推斷出正確分類\n❌ 信息不足：紅色 ❌ 顯示排除信息不充分的錯誤案例\n\n📚 杉山教授的創新：\n• 首次系統化研究「否定標籤」的學習問題\n• 將貝氏定理應用於互補信息處理\n• 解決了「獲得正確標籤困難，但排除錯誤標籤容易」的實際場景\n\n🔬 數學美學：P(Y=k|X,Y≠c) ∝ P(Y=k|X) - 體現了「排除一個選項，提升其他選項可信度」的邏輯。",
				},
			},
		};
	}

	/**
	 * 獲取當前狀態
	 */
	public getCurrentState(): {
		mode: LearningMode;
		step: ExperimentStep;
		log: LogMessage | null;
		progress: number;
	} {
		return {
			mode: this.currentMode,
			step: this.currentStep,
			log: this.currentLog,
			progress: this.animationProgress,
		};
	}

	/**
	 * 獲取控制按鈕的狀態和文字
	 */
	public getButtonState(): {
		text: string;
		disabled: boolean;
		variant: "primary" | "secondary" | "success" | "warning" | "info";
	} {
		switch (this.currentStep) {
			case "setup":
				return {
					text: "🚀 啟動模型訓練",
					disabled: false,
					variant: "success",
				};
			case "start":
				return {
					text: "⏳ 準備啟動...",
					disabled: true,
					variant: "warning",
				};
			case "learning":
				return {
					text: `🔄 模型運算中... ${Math.round(this.animationProgress * 100)}%`,
					disabled: true,
					variant: "primary",
				};
			case "result":
				return {
					text: "📊 分析實驗結果",
					disabled: false,
					variant: "info",
				};
			case "analysis":
				return {
					text: "🔄 重置實驗",
					disabled: false,
					variant: "secondary",
				};
			default:
				return {
					text: "開始",
					disabled: false,
					variant: "primary",
				};
		}
	}

	/**
	 * 獲取準確率統計信息
	 */
	public getAccuracyStats(
		totalPoints: number,
		correctPoints: number,
		misclassifiedPoints: DataPoint[],
	): {
		accuracy: number;
		total: number;
		correct: number;
		errors: number;
		errorsByClass: Record<string, number>;
	} {
		const accuracy = Math.round((correctPoints / totalPoints) * 100);
		const errors = misclassifiedPoints.length;

		// 統計各類別的錯誤數
		const errorsByClass: Record<string, number> = { α: 0, β: 0, γ: 0 };
		misclassifiedPoints.forEach((point) => {
			errorsByClass[point.trueLabel]++;
		});

		return {
			accuracy,
			total: totalPoints,
			correct: correctPoints,
			errors,
			errorsByClass,
		};
	}

	/**
	 * 獲取圖例信息
	 */
	public getLegendItems(mode: LearningMode): Array<{
		color: string;
		label: string;
		description: string;
	}> {
		switch (mode) {
			case "PU":
				return [
					{
						color: "#4285f4",
						label: "正樣本 (P)",
						description: "已確認的癌症病例",
					},
					{
						color: "#9e9e9e",
						label: "可靠負樣本 (RN)",
						description: "很可能是健康的樣本",
					},
					{
						color: "#e0e0e0",
						label: "未標記 (U)",
						description: "待分類的樣本",
					},
				];
			case "PNU":
				return [
					{
						color: "#4285f4",
						label: "α 類別",
						description: "已標記的第一類",
					},
					{
						color: "#ea4335",
						label: "β 類別",
						description: "已標記的第二類",
					},
					{
						color: "#34a853",
						label: "γ 類別",
						description: "未標記的第三類",
					},
				];
			case "CLL":
				return [
					{
						color: "#4285f4",
						label: "α 類別",
						description: "通過排除法推斷",
					},
					{
						color: "#ea4335",
						label: "β 類別",
						description: "通過排除法推斷",
					},
					{
						color: "#34a853",
						label: "γ 類別",
						description: "通過排除法推斷",
					},
					{
						color: "red",
						label: "❌ 預測錯誤",
						description: "排除信息不足導致的錯誤",
					},
				];
			default:
				return [];
		}
	}
}
