"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { useEffect, useRef } from "react";

// 動態導入 Plotly 以避免 SSR 問題
let Plotly: any = null;
if (typeof window !== "undefined") {
	import("plotly.js").then((module) => {
		Plotly = module.default;
	});
}

export function PerformanceMetricsChart() {
	const plotRef = useRef<HTMLDivElement>(null);

	// 模型性能數據
	const modelData = {
		models: ["uPU", "nnPU", "Proposed"],
		precision: [0.45, 0.72, 0.94],
		recall: [0.83, 0.88, 0.91],
		f1Score: [0.58, 0.79, 0.92],
		accuracy: [0.76, 0.84, 0.95],
	};

	useEffect(() => {
		if (!Plotly || !plotRef.current) {
			return;
		}

		const traces = [
			{
				x: modelData.models,
				y: modelData.precision,
				type: "bar",
				name: "Precision",
				marker: { color: "#3b82f6" },
				hovertemplate:
					"<b>%{fullData.name}</b><br>" +
					"Model: %{x}<br>" +
					"Score: %{y:.2f}<br>" +
					"<extra></extra>",
			},
			{
				x: modelData.models,
				y: modelData.recall,
				type: "bar",
				name: "Recall",
				marker: { color: "#10b981" },
				hovertemplate:
					"<b>%{fullData.name}</b><br>" +
					"Model: %{x}<br>" +
					"Score: %{y:.2f}<br>" +
					"<extra></extra>",
			},
			{
				x: modelData.models,
				y: modelData.f1Score,
				type: "bar",
				name: "F1-Score",
				marker: { color: "#f59e0b" },
				hovertemplate:
					"<b>%{fullData.name}</b><br>" +
					"Model: %{x}<br>" +
					"Score: %{y:.2f}<br>" +
					"<extra></extra>",
			},
			{
				x: modelData.models,
				y: modelData.accuracy,
				type: "bar",
				name: "Accuracy",
				marker: { color: "#8b5cf6" },
				hovertemplate:
					"<b>%{fullData.name}</b><br>" +
					"Model: %{x}<br>" +
					"Score: %{y:.2f}<br>" +
					"<extra></extra>",
			},
		];

		const layout = {
			title: {
				text: "Model Performance Comparison",
				font: { size: 16 },
			},
			xaxis: {
				title: "Models",
			},
			yaxis: {
				title: "Score",
				range: [0, 1],
			},
			barmode: "group",
			hovermode: "closest",
			showlegend: true,
			legend: {
				x: 0,
				y: 1,
				bgcolor: "rgba(255,255,255,0.8)",
			},
			margin: { l: 60, r: 20, t: 60, b: 60 },
			height: 400,
		};

		const config = {
			responsive: true,
			displayModeBar: true,
			modeBarButtonsToRemove: [
				"lasso2d",
				"select2d",
				"zoom2d",
				"pan2d",
				"autoScale2d",
				"resetScale2d",
				"toggleSpikelines",
				"hoverClosestCartesian",
				"hoverCompareCartesian",
			],
			displaylogo: false,
		};

		Plotly.newPlot(plotRef.current, traces, layout, config);

		// 清理函數
		return () => {
			if (plotRef.current && Plotly) {
				Plotly.purge(plotRef.current);
			}
		};
	}, []);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<TrendingUp className="h-5 w-5" />
					Performance Metrics Comparison
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div ref={plotRef} className="w-full mb-4" />
				<div className="text-sm text-gray-600 space-y-1">
					<p>
						📈 Comprehensive comparison of model performance metrics
					</p>
					<p>
						🎯 Proposed model achieves 94% precision and 91% recall
					</p>
					<p>
						⚡ 58% improvement in F1-score over baseline uPU method
					</p>
				</div>
			</CardContent>
		</Card>
	);
}
