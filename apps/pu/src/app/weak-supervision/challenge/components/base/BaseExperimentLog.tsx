import type { ExperimentStep } from "../../lib/UIController";
import type { StatusIndicator } from "../../types/common";

interface BaseExperimentLogProps {
	currentStep: ExperimentStep;
	statusIndicators?: StatusIndicator[];
	customContent?: React.ReactNode;
	className?: string;
}

export function BaseExperimentLog({
	currentStep,
	statusIndicators = [],
	customContent,
	className = "",
}: BaseExperimentLogProps) {
	const getStepDescription = (step: ExperimentStep): string => {
		switch (step) {
			case "setup":
				return "實驗環境已準備就緒，等待開始訓練...";
			case "start":
				return "正在初始化模型參數...";
			case "learning":
				return "模型正在進行學習訓練...";
			case "result":
				return "訓練完成，正在生成預測結果...";
			case "analysis":
				return "正在分析模型性能和準確率...";
			default:
				return "實驗狀態未知";
		}
	};

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "completed":
				return (
					<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
						✓ 完成
					</span>
				);
			case "active":
			case "running":
				return (
					<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
						● 進行中
					</span>
				);
			case "waiting":
			case "pending":
				return (
					<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
						○ 等待
					</span>
				);
			default:
				return null;
		}
	};

	return (
		<div className={`space-y-4 ${className}`}>
			<div className="bg-gray-50 rounded-lg p-4">
				<h4 className="font-medium text-gray-900 mb-2">當前狀態</h4>
				<p className="text-sm text-gray-600">
					{getStepDescription(currentStep)}
				</p>
			</div>

			{/* 狀態指標 */}
			{statusIndicators.length > 0 && (
				<div className="space-y-2">
					<h4 className="font-medium text-gray-900">執行狀態</h4>
					{statusIndicators.map((indicator, index) => (
						<div
							key={index}
							className="flex items-center justify-between"
						>
							<span className="text-sm text-gray-700">
								{indicator.label}
							</span>
							{getStatusBadge(indicator.status)}
						</div>
					))}
				</div>
			)}
			{/* 自定義內容 */}
			{customContent}
		</div>
	);
}
