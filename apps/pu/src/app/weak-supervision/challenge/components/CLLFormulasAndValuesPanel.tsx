import { LaTeX } from "@/app/weak-supervision/challenge/components/LaTeX";
import { BaseMetricsDisplay } from "./base/BaseMetricsDisplay";
import type { MetricValue } from "../types/common";

interface CLLFormulasAndValuesPanelProps {
	cluesProcessed: number;
	modelConfidence: number;
	isActive?: boolean;
}

export function CLLFormulasAndValuesPanel({
	cluesProcessed,
	modelConfidence,
	isActive = false,
}: CLLFormulasAndValuesPanelProps) {
	const metrics: MetricValue[] = [
		{
			label: "已處理線索數",
			value: cluesProcessed,
			format: "number",
		},
		{
			label: "模型信心度",
			value: modelConfidence,
			format: "percentage",
			precision: 1,
		},
		{
			label: "排除類別數",
			value: Math.floor(cluesProcessed / 3), // 假設每個點平均排除1個類別
			format: "number",
		},
	];

	const formulaContent = (
		<div className="space-y-4">
			{/* 互補標籤公式 */}
			<div className="bg-gray-50 p-4 rounded-lg border">
				<h5 className="font-medium text-sm mb-2">互補標籤推理</h5>
				<div className="text-center">
					<LaTeX displayMode={true}>
						{"P(Y=k|X, \\bar{Y} \\neq k) = 0"}
					</LaTeX>
				</div>
				<p className="text-xs text-gray-600 mt-2">
					當獲得「不是類別k」的線索時，設定該類別機率為0
				</p>
			</div>

			{/* 機率正規化 */}
			<div className="bg-gray-50 p-4 rounded-lg border">
				<h5 className="font-medium text-sm mb-2">機率正規化</h5>
				<div className="text-center">
					<LaTeX displayMode={true}>
						{"P(Y=j|X) = \\frac{P'(Y=j|X)}{\\sum_{i \\neq k} P'(Y=i|X)}"}
					</LaTeX>
				</div>
				<p className="text-xs text-gray-600 mt-2">
					排除類別k後，重新正規化剩餘類別的機率分佈
				</p>
			</div>
		</div>
	);

	return (
		<BaseMetricsDisplay
			title="CLL 學習演算法數值"
			metrics={metrics}
			isActive={isActive}
		>
			{formulaContent}
		</BaseMetricsDisplay>
	);
}
