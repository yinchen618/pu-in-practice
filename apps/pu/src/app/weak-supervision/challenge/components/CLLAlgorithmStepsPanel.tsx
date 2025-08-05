import type { AlgorithmStepConfig, StepStatus } from "../types/common";
import { BaseAlgorithmStepsPanel } from "./base/BaseAlgorithmStepsPanel";

export type CLLAlgorithmStep =
	| "IDLE"
	| "POSSIBILITY_INITIALIZATION"
	| "CLUE_PROCESSING"
	| "DONE";

interface CLLAlgorithmStepsPanelProps {
	currentStep: CLLAlgorithmStep;
}

export function CLLAlgorithmStepsPanel({
	currentStep,
}: CLLAlgorithmStepsPanelProps) {
	const steps: AlgorithmStepConfig[] = [
		{
			id: "POSSIBILITY_INITIALIZATION",
			title: "階段一：初始化可能性空間",
			description: "設定所有類別的初始機率",
			details: [
				"為每個數據點設定均等的類別機率",
				"建立機率向量 P = [1/K, 1/K, 1/K]",
				"準備接受互補標籤線索",
			],
		},
		{
			id: "CLUE_PROCESSING",
			title: "階段二：根據「不在場證明」進行迭代推理",
			description: "處理線索，更新機率",
			details: [
				"接收互補標籤線索 (Y ≠ k)",
				"對目標點設定 P(Y=k|X) = 0",
				"重新正規化機率分佈",
				"向鄰近點傳播推理結果",
			],
		},
	];

	const getStepStatus = (stepId: string): StepStatus => {
		const stepOrder = ["POSSIBILITY_INITIALIZATION", "CLUE_PROCESSING"];
		const currentIndex = stepOrder.indexOf(currentStep);
		const stepIndex = stepOrder.indexOf(stepId);

		if (currentStep === "IDLE") {
			return "waiting";
		}
		if (currentStep === "DONE") {
			return "completed";
		}
		if (stepIndex < currentIndex) {
			return "completed";
		}
		if (stepIndex === currentIndex) {
			return "active";
		}
		return "waiting";
	};

	return (
		<BaseAlgorithmStepsPanel
			title="CLL 學習演算法步驟"
			steps={steps}
			getStepStatus={getStepStatus}
		/>
	);
}
