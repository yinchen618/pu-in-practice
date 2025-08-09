"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

// 動態導入 Plotly 組件，禁用 SSR
const Plot = dynamic(() => import("react-plotly.js"), {
	ssr: false,
	loading: () => (
		<div className="h-[300px] flex items-center justify-center">
			<div className="text-slate-500">Loading chart...</div>
		</div>
	),
});

interface InteractiveModelComparisonProps {
	activeModel: "upu" | "nnpu" | "proposed";
	confidenceThreshold: number;
}

export function InteractiveModelComparison({
	activeModel,
	confidenceThreshold,
}: InteractiveModelComparisonProps) {
	// 生成模擬時序資料
	const plotData = useMemo(() => {
		const timePoints: string[] = [];
		const actualValues: number[] = [];
		const predictions: number[] = [];

		// 使用固定的偽隨機數，確保 SSR 和客戶端渲染一致
		const seededRandom = (seed: number) => {
			const x = Math.sin(seed) * 10000;
			return x - Math.floor(x);
		};

		// 生成48小時的資料點（每小時一個點）
		for (let i = 0; i < 48; i++) {
			const timestamp = new Date(2025, 0, 1, i % 24).toISOString();
			timePoints.push(timestamp);

			// 模擬實際能耗值（有日夜週期和一些雜訊）
			const baseValue =
				50 +
				Math.sin((i * Math.PI) / 12) * 20 +
				seededRandom(i * 123) * 10;
			actualValues.push(baseValue);

			// 根據不同模型生成預測值
			let prediction = baseValue;
			switch (activeModel) {
				case "upu":
					prediction += (seededRandom(i * 456) - 0.5) * 15; // 較大誤差
					break;
				case "nnpu":
					prediction += (seededRandom(i * 789) - 0.5) * 8; // 中等誤差
					break;
				case "proposed":
					prediction += (seededRandom(i * 987) - 0.5) * 4; // 較小誤差
					break;
			}
			predictions.push(Math.max(0, prediction));
		}

		// 在某些點添加異常檢測標記
		const anomalyIndices = [15, 28, 35]; // 異常點的索引
		const anomalyTimes = anomalyIndices.map((i) => timePoints[i]);
		const anomalyValues = anomalyIndices.map((i) => actualValues[i] * 1.5); // 異常值更高

		return [
			{
				x: timePoints,
				y: actualValues,
				type: "scatter" as const,
				mode: "lines" as const,
				name: "實際值",
				line: { color: "#374151", width: 2 },
			},
			{
				x: timePoints,
				y: predictions,
				type: "scatter" as const,
				mode: "lines" as const,
				name: `${activeModel.toUpperCase()} 預測`,
				line: {
					color:
						activeModel === "proposed"
							? "#10b981"
							: activeModel === "nnpu"
								? "#3b82f6"
								: "#f59e0b",
					width: 2,
					dash: "dot" as const,
				},
			},
			{
				x: anomalyTimes,
				y: anomalyValues,
				type: "scatter" as const,
				mode: "markers" as const,
				name: "檢測到的異常",
				marker: {
					color: "#ef4444",
					size: 10,
					symbol: "diamond",
				},
			},
		];
	}, [activeModel]);

	// 根據模型和閾值計算性能指標
	const modelPerformance = useMemo(() => {
		const baseMetrics = {
			upu: { precision: 0.73, recall: 0.65 },
			nnpu: { precision: 0.89, recall: 0.84 },
			proposed: { precision: 0.94, recall: 0.91 },
		};

		// 閾值調整對指標的影響
		const thresholdEffect = (confidenceThreshold - 0.5) * 0.2;
		const metrics = baseMetrics[activeModel];

		return {
			precision: Math.min(
				0.99,
				Math.max(0.5, metrics.precision + thresholdEffect),
			),
			recall: Math.min(
				0.99,
				Math.max(0.5, metrics.recall - thresholdEffect),
			),
		};
	}, [activeModel, confidenceThreshold]);

	return (
		<div className="space-y-4">
			<Plot
				data={plotData}
				layout={{
					autosize: true,
					height: 300,
					margin: { l: 50, r: 30, t: 30, b: 50 },
					xaxis: {
						title: { text: "時間" },
						type: "date",
						showgrid: true,
						gridcolor: "#f1f5f9",
					},
					yaxis: {
						title: { text: "能耗 (kWh)" },
						showgrid: true,
						gridcolor: "#f1f5f9",
					},
					showlegend: true,
					legend: { x: 0, y: 1 },
					plot_bgcolor: "white",
					paper_bgcolor: "white",
					font: { family: "system-ui, sans-serif", size: 11 },
				}}
				config={{
					displayModeBar: false,
					responsive: true,
				}}
				useResizeHandler={true}
				style={{ width: "100%", height: "100%" }}
			/>

			{/* 即時性能指標 */}
			<div className="grid grid-cols-2 gap-3 text-xs">
				<div className="bg-blue-50 p-2 rounded">
					<div className="font-medium text-blue-800">Precision</div>
					<div className="text-xl font-bold text-blue-600">
						{(modelPerformance.precision * 100).toFixed(1)}%
					</div>
				</div>
				<div className="bg-green-50 p-2 rounded">
					<div className="font-medium text-green-800">Recall</div>
					<div className="text-xl font-bold text-green-600">
						{(modelPerformance.recall * 100).toFixed(1)}%
					</div>
				</div>
			</div>
		</div>
	);
}
