import type { AlgorithmStepConfig, StepStatus } from "../types/common";
import { BaseAlgorithmStepsPanel } from "./base/BaseAlgorithmStepsPanel";

export type PUAlgorithmStep =
	| "IDLE"
	| "FINDING_CENTROID"
	| "MARKING_RN"
	| "TRAINING_SVM"
	| "DONE";

interface PUAlgorithmStepsPanelProps {
	currentStep: PUAlgorithmStep;
}

export function PUAlgorithmStepsPanel({
	currentStep,
}: PUAlgorithmStepsPanelProps) {
	const steps: AlgorithmStepConfig[] = [
		{
			id: "FINDING_CENTROID",
			title: "階段一：計算正樣本質心",
			description: "確定決策邊界參考點",
			details: [
				"計算所有已知正樣本的質心座標",
				"質心將作為分類器的重要參考點",
				"為下一階段的可靠負樣本挖掘奠定基礎",
			],
		},
		{
			id: "MARKING_RN",
			title: "階段二：挖掘可靠負樣本",
			description: "識別遠離正樣本的資料點",
			details: [
				"計算未標記點與正樣本質心的距離",
				"標記距離較遠的點為可靠負樣本",
				"這些樣本很可能屬於負類別",
			],
		},
		{
			id: "TRAINING_SVM",
			title: "階段三：訓練 SVM 分類器",
			description: "基於正樣本和可靠負樣本訓練",
			details: [
				"使用正樣本和可靠負樣本構建訓練集",
				"訓練支持向量機分類器",
				"對剩餘未標記樣本進行預測分類",
			],
		},
	];

	const getStepStatus = (stepId: string): StepStatus => {
		const stepOrder = ["FINDING_CENTROID", "MARKING_RN", "TRAINING_SVM"];
		const currentIndex = stepOrder.indexOf(currentStep);
		const stepIndex = stepOrder.indexOf(stepId);

		if (currentStep === "DONE") {
			return "completed";
		}
		if (currentStep === "IDLE") {
			return "pending";
		}
		if (stepIndex < currentIndex) {
			return "completed";
		}
		if (stepIndex === currentIndex) {
			return "active";
		}
		return "pending";
	};

	return (
		<BaseAlgorithmStepsPanel
			title="PU 學習演算法步驟"
			steps={steps}
			getStepStatus={getStepStatus}
		/>
	);
}
