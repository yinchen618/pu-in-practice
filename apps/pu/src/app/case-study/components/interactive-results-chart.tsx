"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// 動態導入 Plotly 以避免 SSR 問題
let Plotly: any = null;
if (typeof window !== "undefined") {
	import("plotly.js").then((module) => {
		Plotly = module.default;
	});
}

interface ModelToggleState {
	uPU: boolean;
	nnPU: boolean;
	proposed: boolean;
}

export function InteractiveResultsChart() {
	const plotRef = useRef<HTMLDivElement>(null);
	const [modelVisibility, setModelVisibility] = useState<ModelToggleState>({
		uPU: true,
		nnPU: true,
		proposed: true,
	});

	// 模擬異常檢測結果數據
	const generateSampleData = () => {
		const baseTime = new Date("2024-01-15T14:00:00");
		const dataPoints = 144; // 12 hours of 5-minute intervals
		const timestamps: string[] = [];
		const actualPower: number[] = [];

		for (let i = 0; i < dataPoints; i++) {
			const time = new Date(baseTime.getTime() + i * 5 * 60 * 1000);
			timestamps.push(time.toISOString());

			// 基礎功率消耗模式（正常情況）
			let power = 150 + Math.sin((i / 24) * Math.PI) * 30; // 日常波動
			power += (Math.random() - 0.5) * 20; // 隨機噪音

			// 在特定時間段創建異常（例如：第 60-80 個數據點）
			if (i >= 60 && i <= 80) {
				power += 400 + Math.random() * 100; // 明顯的異常峰值
			}
			// 在另一個時間段創建較小的異常（第 100-110 個數據點）
			if (i >= 100 && i <= 110) {
				power += 200 + Math.random() * 50;
			}

			actualPower.push(Math.max(0, power));
		}

		return { timestamps, actualPower };
	};

	const { timestamps, actualPower } = generateSampleData();

	// 生成各模型的預測結果
	const generateModelPredictions = () => {
		const uPUPredictions = actualPower.map((_, i) => {
			// uPU模型：較簡單，可能錯過一些異常或有假陽性
			if (i >= 65 && i <= 75) {
				return 1; // 只檢測到部分異常
			}
			if (i >= 30 && i <= 35) {
				return 1; // 假陽性
			}
			return 0;
		});

		const nnPUPredictions = actualPower.map((_, i) => {
			// nnPU模型：較好但仍有假陽性
			if (i >= 60 && i <= 80) {
				return 1; // 檢測到主要異常
			}
			if (i >= 102 && i <= 108) {
				return 1; // 檢測到次要異常
			}
			if (i >= 25 && i <= 28) {
				return 1; // 一些假陽性
			}
			if (i >= 120 && i <= 125) {
				return 1; // 更多假陽性
			}
			return 0;
		});

		const proposedPredictions = actualPower.map((_, i) => {
			// 提出的模型：最準確
			if (i >= 60 && i <= 80) {
				return 1; // 準確檢測主要異常
			}
			if (i >= 100 && i <= 110) {
				return 1; // 準確檢測次要異常
			}
			return 0;
		});

		return { uPUPredictions, nnPUPredictions, proposedPredictions };
	};

	const { uPUPredictions, nnPUPredictions, proposedPredictions } =
		generateModelPredictions();

	useEffect(() => {
		if (!Plotly || !plotRef.current) {
			return;
		}

		const traces: any[] = [
			// 基礎功率消耗線
			{
				x: timestamps,
				y: actualPower,
				type: "scatter",
				mode: "lines",
				name: "Power Consumption",
				line: { color: "#3b82f6", width: 2 },
				hovertemplate:
					"<b>Power Consumption</b><br>" +
					"Time: %{x}<br>" +
					"Power: %{y:.1f}W<br>" +
					"<extra></extra>",
			},
			// 真實異常區域（陰影）
			{
				x: timestamps.slice(60, 81),
				y: Array(21).fill(800), // 頂部陰影
				type: "scatter",
				mode: "lines",
				fill: "tonexty",
				fillcolor: "rgba(239, 68, 68, 0.2)",
				line: { color: "transparent" },
				name: "Ground Truth Anomaly",
				showlegend: true,
			},
			{
				x: timestamps.slice(60, 81),
				y: Array(21).fill(0), // 底部陰影
				type: "scatter",
				mode: "lines",
				line: { color: "transparent" },
				showlegend: false,
			},
			// 第二個真實異常區域
			{
				x: timestamps.slice(100, 111),
				y: Array(11).fill(800),
				type: "scatter",
				mode: "lines",
				fill: "tonexty",
				fillcolor: "rgba(239, 68, 68, 0.2)",
				line: { color: "transparent" },
				name: "Ground Truth Anomaly 2",
				showlegend: false,
			},
			{
				x: timestamps.slice(100, 111),
				y: Array(11).fill(0),
				type: "scatter",
				mode: "lines",
				line: { color: "transparent" },
				showlegend: false,
			},
		];

		// 根據可見性狀態添加模型預測
		if (modelVisibility.uPU) {
			const uPUAnomalies = timestamps.filter(
				(_, i) => uPUPredictions[i] === 1,
			);
			const uPUAnomalyPowers = actualPower.filter(
				(_, i) => uPUPredictions[i] === 1,
			);
			if (uPUAnomalies.length > 0) {
				traces.push({
					x: uPUAnomalies,
					y: uPUAnomalyPowers,
					type: "scatter",
					mode: "markers",
					name: "uPU Prediction",
					marker: {
						color: "#f59e0b",
						size: 8,
						symbol: "circle",
					},
					hovertemplate:
						"<b>uPU Model</b><br>" +
						"Predicted Anomaly<br>" +
						"Time: %{x}<br>" +
						"Power: %{y:.1f}W<br>" +
						"<extra></extra>",
				});
			}
		}

		if (modelVisibility.nnPU) {
			const nnPUAnomalies = timestamps.filter(
				(_, i) => nnPUPredictions[i] === 1,
			);
			const nnPUAnomalyPowers = actualPower.filter(
				(_, i) => nnPUPredictions[i] === 1,
			);
			if (nnPUAnomalies.length > 0) {
				traces.push({
					x: nnPUAnomalies,
					y: nnPUAnomalyPowers,
					type: "scatter",
					mode: "markers",
					name: "nnPU Prediction",
					marker: {
						color: "#8b5cf6",
						size: 8,
						symbol: "square",
					},
					hovertemplate:
						"<b>nnPU Model</b><br>" +
						"Predicted Anomaly<br>" +
						"Time: %{x}<br>" +
						"Power: %{y:.1f}W<br>" +
						"<extra></extra>",
				});
			}
		}

		if (modelVisibility.proposed) {
			const proposedAnomalies = timestamps.filter(
				(_, i) => proposedPredictions[i] === 1,
			);
			const proposedAnomalyPowers = actualPower.filter(
				(_, i) => proposedPredictions[i] === 1,
			);
			if (proposedAnomalies.length > 0) {
				traces.push({
					x: proposedAnomalies,
					y: proposedAnomalyPowers,
					type: "scatter",
					mode: "markers",
					name: "Proposed Model",
					marker: {
						color: "#10b981",
						size: 10,
						symbol: "diamond",
					},
					hovertemplate:
						"<b>Proposed Model</b><br>" +
						"Predicted Anomaly<br>" +
						"Time: %{x}<br>" +
						"Power: %{y:.1f}W<br>" +
						"<extra></extra>",
				});
			}
		}

		const layout = {
			title: {
				text: "Model Performance on Pre-selected Anomaly Event",
				font: { size: 16 },
			},
			xaxis: {
				title: "Time",
				type: "date",
			},
			yaxis: {
				title: "Power (W)",
			},
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
	}, [modelVisibility]);

	const toggleModel = (model: keyof ModelToggleState) => {
		setModelVisibility((prev) => ({
			...prev,
			[model]: !prev[model],
		}));
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<BarChart3 className="h-5 w-5" />
					Model Performance on a Pre-selected Anomaly Event
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div ref={plotRef} className="w-full mb-4" />
				<div className="space-y-4">
					<div className="flex flex-wrap gap-2">
						<Button
							variant={
								modelVisibility.uPU ? "default" : "outline"
							}
							size="sm"
							onClick={() => toggleModel("uPU")}
							className="bg-amber-500 hover:bg-amber-600 text-white"
						>
							Show uPU Prediction
						</Button>
						<Button
							variant={
								modelVisibility.nnPU ? "default" : "outline"
							}
							size="sm"
							onClick={() => toggleModel("nnPU")}
							className="bg-violet-500 hover:bg-violet-600 text-white"
						>
							Show nnPU Prediction
						</Button>
						<Button
							variant={
								modelVisibility.proposed ? "default" : "outline"
							}
							size="sm"
							onClick={() => toggleModel("proposed")}
							className="bg-emerald-500 hover:bg-emerald-600 text-white"
						>
							Show Proposed Model Prediction
						</Button>
					</div>
					<div className="text-sm text-gray-600 space-y-1">
						<p>
							📊 Interactive comparison of anomaly detection
							models
						</p>
						<p>
							🔍 Red shaded areas represent ground-truth anomaly
							periods
						</p>
						<p>
							⚠️ Toggle model predictions to compare their
							performance
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
