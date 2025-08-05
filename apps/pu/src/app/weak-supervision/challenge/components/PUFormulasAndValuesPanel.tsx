import { LaTeX } from "@/app/weak-supervision/challenge/components/LaTeX";
import type { MetricValue } from "../types/common";
import type { PUAlgorithmStep } from "./PUAlgorithmStepsPanel";
import { BaseMetricsDisplay } from "./base/BaseMetricsDisplay";

interface PUFormulasAndValuesPanelProps {
	currentStep: PUAlgorithmStep;
	pCentroid?: { x: number; y: number } | null;
	rnCount?: number;
	iteration?: number;
	margin?: number;
}

export function PUFormulasAndValuesPanel({
	currentStep,
	pCentroid = null,
	rnCount = 0,
	iteration = 0,
	margin = 0,
}: PUFormulasAndValuesPanelProps) {
	const isActive = currentStep !== "IDLE" && currentStep !== "DONE";

	const metrics: MetricValue[] = [
		{
			label: "正樣本質心",
			value: pCentroid
				? `(${pCentroid.x.toFixed(2)}, ${pCentroid.y.toFixed(2)})`
				: "未計算",
			format: "text",
		},
		{
			label: "可靠負樣本數量",
			value: rnCount,
			format: "number",
		},
		{
			label: "訓練迭代次數",
			value: iteration,
			format: "number",
		},
		{
			label: "決策邊界寬度",
			value: margin,
			format: "number",
			precision: 3,
		},
	];

	const formulaContent = (
		<div className="space-y-4">
			{/* 可靠負樣本挖掘公式 */}
			<div className="bg-gray-50 p-4 rounded-lg border">
				<h5 className="font-medium text-sm mb-2">
					Reliable Negative Mining
				</h5>
				<div className="text-center">
					<LaTeX displayMode={true}>
						{"d(x_u, \\mu_P) = \\|x_u - \\mu_P\\|_2"}
					</LaTeX>
				</div>
				<div className="text-xs text-gray-600 mt-2 text-center">
					<LaTeX displayMode={false}>
						{
							"Where $\\mu_P$ is the centroid of positive samples, $x_u$ is an unlabeled sample."
						}
					</LaTeX>
				</div>
			</div>

			{/* SVM 目標函數 */}
			<div className="bg-gray-50 p-4 rounded-lg border">
				<h5 className="font-medium text-sm mb-2">
					SVM Objective Function
				</h5>
				<div className="text-center">
					<LaTeX displayMode={true}>
						{
							"\\min_{w,b} \\frac{1}{2}\\|w\\|^2 + C\\sum_{i} \\xi_i"
						}
					</LaTeX>
				</div>
				<div className="text-xs text-gray-600 mt-2 text-center">
					<LaTeX displayMode={false}>
						{
							"Train SVM using positive and reliable negative samples."
						}
					</LaTeX>
				</div>
			</div>
		</div>
	);

	return (
		<BaseMetricsDisplay
			title="PU 學習演算法數值"
			metrics={metrics}
			isActive={isActive}
		>
			{formulaContent}
		</BaseMetricsDisplay>
	);
}
