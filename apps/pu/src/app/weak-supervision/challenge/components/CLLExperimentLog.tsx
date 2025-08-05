import type { ExperimentStep } from "../lib/UIController";
import type { StatusIndicator } from "../types/common";
import { BaseExperimentLog } from "./base/BaseExperimentLog";

interface CLLExperimentLogProps {
	currentStep: ExperimentStep;
	cluesProcessed: number;
	className?: string;
}

export function CLLExperimentLog({
	currentStep,
	cluesProcessed,
	className,
}: CLLExperimentLogProps) {
	const statusIndicators: StatusIndicator[] = [
		{
			label: "可能性初始化",
			status:
				cluesProcessed > 0
					? "completed"
					: currentStep === "learning"
						? "active"
						: "waiting",
			description: "設定均等類別機率",
		},
		{
			label: "線索處理",
			status:
				currentStep === "result" || currentStep === "analysis"
					? "completed"
					: cluesProcessed > 0
						? "active"
						: "waiting",
			description: `已處理 ${cluesProcessed} 個線索`,
		},
	];

	const customContent = (
		<div className="space-y-4">
			{currentStep === "setup" && (
				<div className="bg-amber-50 rounded-lg p-4">
					<h4 className="font-medium text-amber-900 mb-2">
						🕵️ CLL 學習實驗
					</h4>
					<p className="text-sm text-amber-800">
						「排除法」推理挑戰！通過獲得「不是什麼」的線索，
						逐步縮小可能範圍，推斷出正確答案。
					</p>
				</div>
			)}

			{currentStep === "learning" && (
				<div className="bg-yellow-50 rounded-lg p-4">
					<h4 className="font-medium text-yellow-900 mb-2">
						🔍 線索處理中
					</h4>
					<p className="text-sm text-yellow-800">
						正在收集和處理互補標籤線索，運用排除法進行推理...
					</p>
					<div className="mt-2 text-xs text-yellow-700">
						<div>已處理線索: {cluesProcessed}</div>
						<div>
							推理進度:{" "}
							{Math.min(100, (cluesProcessed / 10) * 100).toFixed(
								0,
							)}
							%
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
