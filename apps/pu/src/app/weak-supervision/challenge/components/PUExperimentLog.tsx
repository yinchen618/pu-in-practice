import type { ExperimentStep } from "../lib/UIController";
import type { StatusIndicator } from "../types/common";
import { BaseExperimentLog } from "./base/BaseExperimentLog";

interface PUExperimentLogProps {
	currentStep: ExperimentStep;
	phase1Status: "waiting" | "running" | "complete";
	phase2Status: "waiting" | "running" | "complete";
	className?: string;
	// 新增統計數據屬性
	analysisStats?: {
		totalPoints: number;
		truePositives: number;
		falsePositives: number;
		trueNegatives: number;
		falseNegatives: number;
		accuracy: number;
	};
}

export function PUExperimentLog({
	currentStep,
	phase1Status,
	phase2Status,
	className,
	analysisStats,
}: PUExperimentLogProps) {
	const statusIndicators: StatusIndicator[] = [
		{
			label: "正樣本質心計算",
			status:
				phase1Status === "complete"
					? "completed"
					: phase1Status === "running"
						? "active"
						: "waiting",
			description: "確定決策邊界參考點",
		},
		{
			label: "可靠負樣本挖掘",
			status:
				phase2Status === "complete"
					? "completed"
					: phase2Status === "running"
						? "active"
						: "waiting",
			description: "識別遠離正樣本的資料點",
		},
	];

	const customContent = (
		<div className="space-y-4">
			{currentStep === "setup" && (
				<div className="bg-blue-50 rounded-lg p-4">
					<h4 className="font-medium text-blue-900 mb-2">
						🔬 PU 學習實驗
					</h4>
					<p className="text-sm text-blue-800">
						歡迎來到「大海撈針」挑戰！我們只有少數正樣本和大量未標記數據，
						需要找出隱藏在其中的負樣本。
					</p>
				</div>
			)}

			{currentStep === "learning" && (
				<div className="bg-orange-50 rounded-lg p-4">
					<h4 className="font-medium text-orange-900 mb-2">
						🔍 演算法執行中
					</h4>
					<p className="text-sm text-orange-800">
						正在執行 PU 學習演算法，透過質心距離挖掘可靠負樣本...
					</p>
				</div>
			)}

			{currentStep === "result" && (
				<div className="bg-green-50 rounded-lg p-4">
					<h4 className="font-medium text-green-900 mb-2">
						✅ 預測完成
					</h4>
					<p className="text-sm text-green-800">
						已完成初步預測，點擊「分析實驗結果」查看詳細分析。
					</p>
				</div>
			)}

			{currentStep === "analysis" && analysisStats && (
				<div className="bg-purple-50 rounded-lg p-4 space-y-3">
					<h4 className="font-medium text-purple-900 mb-3">
						📈 實驗結果分析
					</h4>

					<div className="bg-white rounded-lg p-3 space-y-2">
						<div className="flex items-center gap-2">
							<span className="text-green-600 font-semibold">
								✅ 預測正確：
								{analysisStats.truePositives +
									analysisStats.trueNegatives}{" "}
								個
							</span>
						</div>
						<p className="text-sm text-gray-700 ml-6">
							AI 成功找到了{" "}
							<strong>{analysisStats.truePositives}</strong>{" "}
							個正樣本（包括初始的 10 個和新發現的{" "}
							{analysisStats.truePositives - 10}{" "}
							個），並正確排除了{" "}
							<strong>{analysisStats.trueNegatives}</strong>{" "}
							個負樣本。
						</p>
					</div>

					<div className="bg-white rounded-lg p-3 space-y-2">
						<div className="flex items-center gap-2">
							<span className="text-red-600 font-semibold">
								❌ 預測錯誤：
								{analysisStats.falsePositives +
									analysisStats.falseNegatives}{" "}
								個
							</span>
						</div>
						<div className="text-sm text-gray-700 ml-6 space-y-1">
							<p>
								<strong>漏網之魚 (False Negative):</strong> 有{" "}
								<strong>{analysisStats.falseNegatives}</strong>{" "}
								個真正的正樣本，AI 沒能發現它們（灰色點上的
								❌）。
							</p>
							<p>
								<strong>錯認好人 (False Positive):</strong> AI
								把{" "}
								<strong>{analysisStats.falsePositives}</strong>{" "}
								個負樣本誤認為是正樣本（淺藍點上的 ❌）。
							</p>
						</div>
					</div>

					<div className="border-t pt-3">
						<div className="bg-blue-100 rounded-lg p-3">
							<h5 className="font-semibold text-blue-900 mb-2">
								最終結論：
							</h5>
							<p className="text-sm text-blue-800">
								綜合以上表現，模型準確率為{" "}
								<strong>
									{(analysisStats.accuracy * 100).toFixed(0)}%
								</strong>
								。PU
								學習在只有正樣本線索的困難情況下，依然展現了強大的挖掘能力！
							</p>
						</div>
					</div>
				</div>
			)}
		</div>
	);

	return (
		<BaseExperimentLog
			currentStep={currentStep}
			statusIndicators={statusIndicators}
			customContent={customContent}
			className={className}
		/>
	);
}
