import type { AlgorithmStepConfig, StepStatus } from "../types/common";
import { BaseAlgorithmStepsPanel } from "./base/BaseAlgorithmStepsPanel";

export type PNUAlgorithmStep =
	| "IDLE"
	| "GRAPH_CONSTRUCTION"
	| "LABEL_PROPAGATION"
	| "DONE";

interface PNUAlgorithmStepsPanelProps {
	currentStep: PNUAlgorithmStep;
}

export function PNUAlgorithmStepsPanel({
	currentStep,
}: PNUAlgorithmStepsPanelProps) {
	const steps: AlgorithmStepConfig[] = [
		{
			id: "GRAPH_CONSTRUCTION",
			title: "階段一：建立相似度圖譜",
			description: "建立節點關聯",
			details: [
				"計算所有數據點之間的相似度",
				"構建圖結構，連接相近的節點",
				"設定標籤傳播的基礎架構",
			],
		},
		{
			id: "LABEL_PROPAGATION",
			title: "階段二：迭代進行標籤傳播",
			description: "更新節點標籤機率",
			details: [
				"從已標記點開始傳播標籤",
				"計算每個節點的新標籤機率",
				"檢查模型是否收斂",
			],
		},
	];

	const getStepStatus = (stepId: string): StepStatus => {
		const stepOrder = ["GRAPH_CONSTRUCTION", "LABEL_PROPAGATION"];
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
			title="PNU 學習演算法步驟"
			steps={steps}
			getStepStatus={getStepStatus}
		/>
	);
}
