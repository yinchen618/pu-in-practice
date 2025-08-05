"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { useEffect, useRef } from "react";

export function CanvasPerformanceChart() {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	// Model performance data
	const modelData = {
		models: ["uPU", "nnPU", "Proposed"],
		precision: [0.45, 0.72, 0.94],
		recall: [0.83, 0.88, 0.91],
		f1Score: [0.58, 0.79, 0.92],
		accuracy: [0.76, 0.84, 0.95],
	};

	useEffect(() => {
		if (!canvasRef.current) {
			return;
		}

		const canvas = canvasRef.current;
		const ctx = canvas.getContext("2d");
		if (!ctx) {
			return;
		}

		// Set Canvas size
		const container = canvas.parentElement;
		if (container) {
			canvas.width = container.clientWidth;
			canvas.height = 400;
		}

		// Calculate margins
		const margin = { top: 40, right: 30, bottom: 60, left: 60 };
		const width = canvas.width - margin.left - margin.right;
		const height = canvas.height - margin.top - margin.bottom;

		// Clear canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Draw background
		ctx.fillStyle = "#f8fafc";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Define datasets
		const datasets = [
			{
				name: "Precision",
				values: modelData.precision,
				color: "#3b82f6",
			},
			{ name: "Recall", values: modelData.recall, color: "#10b981" },
			{ name: "F1-Score", values: modelData.f1Score, color: "#8b5cf6" },
			{ name: "Accuracy", values: modelData.accuracy, color: "#f59e0b" },
		];

		// Calculate width and spacing for each group
		const numModels = modelData.models.length;
		const numMetrics = datasets.length;
		const groupWidth = width / numModels;
		const barWidth = groupWidth / (numMetrics + 1); // +1 for spacing between bars
		const maxValue = Math.max(
			...datasets.flatMap((dataset) => dataset.values),
		);

		// Draw axes
		ctx.beginPath();
		ctx.strokeStyle = "#94a3b8";
		ctx.lineWidth = 2;
		ctx.moveTo(margin.left, margin.top);
		ctx.lineTo(margin.left, margin.top + height);
		ctx.lineTo(margin.left + width, margin.top + height);
		ctx.stroke();

		// Draw grid lines and Y-axis labels
		ctx.beginPath();
		ctx.strokeStyle = "#e2e8f0";
		ctx.lineWidth = 1;
		const numYLines = 5;
		for (let i = 0; i <= numYLines; i++) {
			const y = margin.top + height - (height / numYLines) * i;
			const value = (i / numYLines) * maxValue;

			ctx.moveTo(margin.left, y);
			ctx.lineTo(margin.left + width, y);

			// Y-axis label
			ctx.fillStyle = "#64748b";
			ctx.font = "12px Arial";
			ctx.textAlign = "right";
			ctx.fillText(value.toFixed(2), margin.left - 10, y + 4);
		}
		ctx.stroke();

		// Draw X-axis labels
		ctx.fillStyle = "#1e293b";
		ctx.font = "bold 13px Arial";
		ctx.textAlign = "center";
		modelData.models.forEach((model, i) => {
			const x = margin.left + groupWidth * (i + 0.5);
			const y = margin.top + height + 20;
			ctx.fillText(model, x, y);
		});

		// Draw chart title
		ctx.fillStyle = "#0f172a";
		ctx.font = "bold 16px Arial";
		ctx.textAlign = "center";
		ctx.fillText(
			"Performance Comparison across Models",
			canvas.width / 2,
			margin.top / 2,
		);

		// Draw data bars
		datasets.forEach((dataset, datasetIndex) => {
			dataset.values.forEach((value, modelIndex) => {
				const x =
					margin.left +
					groupWidth * modelIndex +
					barWidth * datasetIndex +
					barWidth / 2;
				const barHeight = (value / maxValue) * height;
				const y = margin.top + height - barHeight;

				// Draw bar
				ctx.fillStyle = dataset.color;
				ctx.fillRect(x, y, barWidth, barHeight);

				// Value label
				if (value >= 0.3) {
					// Only show labels on taller bars
					ctx.fillStyle = "#ffffff";
					ctx.font = "bold 12px Arial";
					ctx.textAlign = "center";
					ctx.fillText(
						value.toFixed(2),
						x + barWidth / 2,
						y + barHeight / 2 + 4,
					);
				}
			});
		});

		// Draw legend
		const legendX = margin.left;
		const legendY = margin.top + height + 35;
		const legendItemWidth = width / datasets.length;

		datasets.forEach((dataset, i) => {
			const x = legendX + legendItemWidth * i + 10;
			const y = legendY;

			// Legend color square
			ctx.fillStyle = dataset.color;
			ctx.fillRect(x, y, 15, 15);

			// Legend text
			ctx.fillStyle = "#334155";
			ctx.font = "12px Arial";
			ctx.textAlign = "left";
			ctx.fillText(dataset.name, x + 20, y + 12);
		});
	}, [modelData]);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<TrendingUp className="h-5 w-5" />
					Performance Metrics Comparison
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="w-full">
					<canvas ref={canvasRef} className="w-full" />
				</div>
				<div className="mt-4 text-sm text-gray-600">
					<p>
						📊 The proposed model achieves 94% precision and 91%
						recall, outperforming traditional approaches.
					</p>
				</div>
			</CardContent>
		</Card>
	);
}
