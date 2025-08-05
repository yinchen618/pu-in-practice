import { LaTeX } from "@/app/weak-supervision/challenge/components/LaTeX";
import { BaseMetricsDisplay } from "./base/BaseMetricsDisplay";
import type { MetricValue } from "../types/common";
import type { PNUAlgorithmStep } from "./PNUAlgorithmStepsPanel";

interface PNUFormulasAndValuesPanelProps {
	currentStep: PNUAlgorithmStep;
	iteration?: number;
	convergence?: number;
	totalNodes?: number;
	labeledNodes?: number;
}

export function PNUFormulasAndValuesPanel({
	currentStep,
	iteration = 0,
	convergence = 0,
	totalNodes = 0,
	labeledNodes = 0,
}: PNUFormulasAndValuesPanelProps) {
	const isActive = currentStep !== "IDLE" && currentStep !== "DONE";

	const metrics: MetricValue[] = [
		{
			label: "迭代次數",
			value: iteration,
			format: "number",
		},
		{
			label: "收斂值",
			value: convergence,
			format: "number",
			precision: 4,
		},
		{
			label: "總節點數",
			value: totalNodes,
			format: "number",
		},
		{
			label: "已標記節點",
			value: labeledNodes,
			format: "number",
		},
	];

	const formulaContent = (
		<div className="space-y-4">
			{/* 標籤傳播公式 */}
			<div className="bg-gray-50 p-4 rounded-lg border">
				<h5 className="font-medium text-sm mb-2">標籤傳播公式</h5>
				<div className="text-center">
					<LaTeX displayMode={true}>
						{"Y^{(t+1)} = \\alpha S Y^{(t)} + (1-\\alpha) Y^{(0)}"}
					</LaTeX>
				</div>
				<p className="text-xs text-gray-600 mt-2">
					其中 S 是正規化的相似度矩陣，α 是傳播權重
				</p>
			</div>

			{/* 收斂條件 */}
			<div className="bg-gray-50 p-4 rounded-lg border">
				<h5 className="font-medium text-sm mb-2">收斂條件</h5>
				<div className="text-center">
					<LaTeX displayMode={true}>
						{"\\|Y^{(t+1)} - Y^{(t)}\\|_F < \\epsilon"}
					</LaTeX>
				</div>
				<p className="text-xs text-gray-600 mt-2">
					當標籤變化小於閾值 ε 時，算法收斂
				</p>
			</div>
		</div>
	);

	return (
		<BaseMetricsDisplay
			title="PNU 學習演算法數值"
			metrics={metrics}
			isActive={isActive}
		>
			{formulaContent}
		</BaseMetricsDisplay>
	);
}
