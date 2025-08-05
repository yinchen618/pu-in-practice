import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { LearningMode } from "../lib/DatasetGenerator";
import type { ExperimentStep } from "../lib/UIController";

interface ExperimentControlProps {
	currentStep: ExperimentStep;
	currentMode: LearningMode;
	animationProgress: number;
	accuracy: number;
	isRunning: boolean;
	showPredictionResult: boolean;
	canAnalyzeResults: boolean;
	onStartTraining: () => void;
	onAnalyzeResults: () => void;
	onResetExperiment: () => void;
}

export function ExperimentControl({
	currentStep,
	currentMode,
	animationProgress,
	accuracy,
	isRunning,
	showPredictionResult,
	canAnalyzeResults,
	onStartTraining,
	onAnalyzeResults,
	onResetExperiment,
}: ExperimentControlProps) {
	const getStepLabel = (step: ExperimentStep) => {
		switch (step) {
			case "setup":
				return "實驗設定";
			case "start":
				return "啟動模型";
			case "learning":
				return "學習中";
			case "result":
				return "查看結果";
			case "analysis":
				return "結果分析";
			default:
				return "未知";
		}
	};

	const shouldShowAccuracy = () => {
		return (
			(currentStep === "result" && currentMode !== "PU") ||
			(currentStep === "result" &&
				currentMode === "PU" &&
				!showPredictionResult) ||
			currentStep === "analysis"
		);
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>實驗控制</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* 當前步驟指示 */}
				<div className="flex items-center gap-2">
					<span className="text-sm font-medium">當前步驟:</span>
					<Badge variant="secondary">
						{getStepLabel(currentStep)}
					</Badge>
				</div>

				{/* 進度條 */}
				{currentStep === "learning" && (
					<div className="space-y-2">
						<div className="flex justify-between text-sm">
							<span>學習進度</span>
							<span>{animationProgress.toFixed(0)}%</span>
						</div>
						<Progress value={animationProgress} />
					</div>
				)}

				{/* 準確率顯示 */}
				{shouldShowAccuracy() && (
					<div className="p-3 bg-blue-50 rounded-lg">
						<div className="text-sm font-medium">模型準確率</div>
						<div className="text-2xl font-bold text-blue-600">
							{accuracy === 0 &&
							(currentStep === "result" ||
								currentStep === "analysis")
								? "計算中..."
								: `${accuracy}%`}
						</div>
					</div>
				)}

				{/* 操作按鈕 */}
				<div className="space-y-2">
					{currentStep === "setup" && (
						<Button
							className="w-full"
							onClick={onStartTraining}
							disabled={isRunning}
						>
							啟動模型訓練
						</Button>
					)}

					{currentStep === "result" &&
						currentMode === "PU" &&
						showPredictionResult &&
						canAnalyzeResults && (
							<Button
								className="w-full"
								onClick={onAnalyzeResults}
								variant="secondary"
								disabled={isRunning}
							>
								分析實驗結果
							</Button>
						)}

					{((currentStep === "result" && currentMode !== "PU") ||
						currentStep === "analysis") && (
						<Button
							className="w-full"
							onClick={onAnalyzeResults}
							variant="secondary"
							disabled={isRunning}
						>
							分析實驗結果
						</Button>
					)}

					<Button
						className="w-full"
						variant="outline"
						onClick={onResetExperiment}
						disabled={isRunning}
					>
						重置實驗
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
