"use client";

import dynamic from "next/dynamic";

// 動態導入 Plotly 組件，禁用 SSR
const Plot = dynamic(() => import("react-plotly.js"), {
	ssr: false,
	loading: () => (
		<div className="h-[300px] flex items-center justify-center">
			<div className="text-slate-500">Loading chart...</div>
		</div>
	),
});

export function PerformanceMetricsComparison() {
	const metricsData = [
		{
			x: ["Precision", "Recall", "F1-Score"],
			y: [0.73, 0.65, 0.69],
			name: "Traditional",
			type: "bar" as const,
			marker: { color: "#6b7280" },
		},
		{
			x: ["Precision", "Recall", "F1-Score"],
			y: [0.89, 0.84, 0.86],
			name: "nnPU",
			type: "bar" as const,
			marker: { color: "#3b82f6" },
		},
		{
			x: ["Precision", "Recall", "F1-Score"],
			y: [0.94, 0.91, 0.92],
			name: "Proposed",
			type: "bar" as const,
			marker: { color: "#10b981" },
		},
	];

	return (
		<div className="h-full">
			<Plot
				data={metricsData}
				layout={{
					autosize: true,
					height: 300,
					margin: { l: 50, r: 30, t: 30, b: 50 },
					xaxis: {
						title: { text: "評估指標" },
					},
					yaxis: {
						title: { text: "數值" },
						range: [0, 1],
						tickformat: ".0%",
					},
					barmode: "group",
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
		</div>
	);
}
