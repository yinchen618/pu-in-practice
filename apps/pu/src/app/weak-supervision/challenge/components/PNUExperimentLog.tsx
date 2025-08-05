import type { ExperimentStep } from "../lib/UIController";
import type { StatusIndicator } from "../types/common";
import { BaseExperimentLog } from "./base/BaseExperimentLog";

interface PNUExperimentLogProps {
	currentStep: ExperimentStep;
	iteration: number;
	convergence: number;
	className?: string;
}

export function PNUExperimentLog({
	currentStep,
	iteration,
	convergence,
	className,
}: PNUExperimentLogProps) {
	const statusIndicators: StatusIndicator[] = [
		{
			label: "圖結構建立",
			status:
				iteration > 0
					? "completed"
					: currentStep === "learning"
						? "active"
						: "waiting",
			description: "建立節點相似度關係",
		},
		{
			label: "標籤傳播",
			status:
				convergence < 0.01
					? "completed"
					: iteration > 0
						? "active"
						: "waiting",
			description: `迭代 ${iteration} 次，收斂值 ${convergence.toFixed(4)}`,
		},
	];

	const customContent = (
		<div className="space-y-4">
			{currentStep === "setup" && (
				<div className="bg-purple-50 rounded-lg p-4">
					<h4 className="font-medium text-purple-900 mb-2">
						🕸️ PNU 學習實驗
					</h4>
					<p className="text-sm text-purple-800">
						半監督學習挑戰！利用少量標記數據和圖傳播算法，
						為大量未標記數據進行分類。
					</p>
				</div>
			)}

			{currentStep === "learning" && (
				<div className="bg-indigo-50 rounded-lg p-4">
					<h4 className="font-medium text-indigo-900 mb-2">
						🌊 標籤傳播中
					</h4>
					<p className="text-sm text-indigo-800">
						標籤正在圖網路中傳播，從已知節點擴散到未知節點...
					</p>
					<div className="mt-2 text-xs text-indigo-700">
						<div>當前迭代: {iteration}</div>
						<div>收斂程度: {convergence.toFixed(4)}</div>
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
