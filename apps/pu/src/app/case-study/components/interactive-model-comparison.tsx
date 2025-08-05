"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface ModelToggleState {
	uPU: boolean;
	nnPU: boolean;
	proposed: boolean;
}

interface InteractiveModelComparisonProps {
	activeModel: "upu" | "nnpu" | "proposed";
	confidenceThreshold: number;
}

export function InteractiveModelComparison({
	activeModel,
	confidenceThreshold,
}: InteractiveModelComparisonProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [modelVisibility, setModelVisibility] = useState<ModelToggleState>({
		uPU: activeModel === "upu",
		nnPU: activeModel === "nnpu",
		proposed: activeModel === "proposed",
	});

	// 當 activeModel 改變時更新可見性
	useEffect(() => {
		setModelVisibility({
			uPU: activeModel === "upu",
			nnPU: activeModel === "nnpu",
			proposed: activeModel === "proposed",
		});
	}, [activeModel]);

	// Generate sample data with a clear known anomaly - 使用 useMemo 穩定數據
	const data = useMemo(() => {
		const baseTime = new Date("2024-01-15T14:00:00");
		const dataPoints = 144; // 12 hours of 5-minute intervals
		const data = [];

		for (let i = 0; i < dataPoints; i++) {
			const time = new Date(baseTime.getTime() + i * 5 * 60 * 1000);

			// Base power consumption pattern
			let power = 150 + Math.sin((i / 24) * Math.PI) * 30;
			power += (Math.random() - 0.5) * 10;

			// Insert a clear anomaly from point 60-80 (around hour 5-6.5)
			let isGroundTruthAnomaly = false;
			if (i >= 60 && i <= 80) {
				power += 200; // Significant power spike
				isGroundTruthAnomaly = true;
			}

			// Model predictions (simulated) - 根據 confidenceThreshold 調整
			const thresholdFactor = confidenceThreshold;

			const uPUPrediction = isGroundTruthAnomaly
				? Math.random() > 1 - thresholdFactor * 0.7
				: Math.random() > thresholdFactor * 0.9; // 70% detection, 10% false positive

			const nnPUPrediction = isGroundTruthAnomaly
				? Math.random() > 1 - thresholdFactor * 0.8
				: Math.random() > thresholdFactor * 0.95; // 80% detection, 5% false positive

			const proposedPrediction = isGroundTruthAnomaly
				? Math.random() > 1 - thresholdFactor * 0.9
				: Math.random() > thresholdFactor * 0.97; // 90% detection, 3% false positive

			data.push({
				timestamp: time.toISOString(),
				time: time.toLocaleTimeString([], {
					hour: "2-digit",
					minute: "2-digit",
				}),
				power,
				isGroundTruthAnomaly,
				uPUPrediction,
				nnPUPrediction,
				proposedPrediction,
			});
		}

		return data;
	}, [confidenceThreshold]); // 只在 confidenceThreshold 改變時重新生成

	const drawChart = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) {
			return;
		}

		const ctx = canvas.getContext("2d");
		if (!ctx) {
			return;
		}

		// Clear canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		const margin = { top: 40, right: 40, bottom: 60, left: 60 };
		const width = canvas.width - margin.left - margin.right;
		const height = canvas.height - margin.top - margin.bottom;

		// Scale functions
		const xScale = (index: number) =>
			margin.left + (index / (data.length - 1)) * width;
		const yScale = (power: number) =>
			margin.top + height - ((power - 100) / 300) * height;

		// Draw ground truth anomaly background
		ctx.fillStyle = "rgba(255, 0, 0, 0.1)";
		const anomalyStart = data.findIndex((d) => d.isGroundTruthAnomaly);
		const anomalyEnd =
			data
				.map((d, i) => (d.isGroundTruthAnomaly ? i : -1))
				.filter((i) => i !== -1)
				.pop() || anomalyStart;

		if (anomalyStart !== -1 && anomalyEnd !== -1) {
			ctx.fillRect(
				xScale(anomalyStart),
				margin.top,
				xScale(anomalyEnd) - xScale(anomalyStart),
				height,
			);
		}

		// Draw grid lines
		ctx.strokeStyle = "#e5e7eb";
		ctx.lineWidth = 1;

		// Vertical grid lines
		for (let i = 0; i < 5; i++) {
			const x = margin.left + (i / 4) * width;
			ctx.beginPath();
			ctx.moveTo(x, margin.top);
			ctx.lineTo(x, margin.top + height);
			ctx.stroke();
		}

		// Horizontal grid lines
		for (let i = 0; i < 5; i++) {
			const y = margin.top + (i / 4) * height;
			ctx.beginPath();
			ctx.moveTo(margin.left, y);
			ctx.lineTo(margin.left + width, y);
			ctx.stroke();
		}

		// Draw power line
		ctx.strokeStyle = "#3b82f6";
		ctx.lineWidth = 2;
		ctx.beginPath();
		data.forEach((d, i) => {
			const x = xScale(i);
			const y = yScale(d.power);
			if (i === 0) {
				ctx.moveTo(x, y);
			} else {
				ctx.lineTo(x, y);
			}
		});
		ctx.stroke();

		// Draw model predictions
		data.forEach((d, i) => {
			const x = xScale(i);
			const y = yScale(d.power);

			// uPU predictions
			if (modelVisibility.uPU && d.uPUPrediction) {
				ctx.fillStyle = "#f59e0b";
				ctx.beginPath();
				ctx.arc(x, y - 10, 4, 0, 2 * Math.PI);
				ctx.fill();
			}

			// nnPU predictions
			if (modelVisibility.nnPU && d.nnPUPrediction) {
				ctx.fillStyle = "#10b981";
				ctx.beginPath();
				ctx.arc(x, y - 5, 4, 0, 2 * Math.PI);
				ctx.fill();
			}

			// Proposed model predictions
			if (modelVisibility.proposed && d.proposedPrediction) {
				ctx.fillStyle = "#ef4444";
				ctx.lineWidth = 2;
				ctx.strokeStyle = "#ffffff";
				ctx.beginPath();
				ctx.arc(x, y + 5, 5, 0, 2 * Math.PI);
				ctx.fill();
				ctx.stroke();
			}
		});

		// Draw axes
		ctx.strokeStyle = "#374151";
		ctx.lineWidth = 2;

		// X-axis
		ctx.beginPath();
		ctx.moveTo(margin.left, margin.top + height);
		ctx.lineTo(margin.left + width, margin.top + height);
		ctx.stroke();

		// Y-axis
		ctx.beginPath();
		ctx.moveTo(margin.left, margin.top);
		ctx.lineTo(margin.left, margin.top + height);
		ctx.stroke();

		// Labels
		ctx.fillStyle = "#374151";
		ctx.font = "12px sans-serif";
		ctx.textAlign = "center";

		// X-axis labels
		for (let i = 0; i < 5; i++) {
			const dataIndex = Math.floor((i / 4) * (data.length - 1));
			const x = xScale(dataIndex);
			ctx.fillText(data[dataIndex].time, x, margin.top + height + 20);
		}

		// Y-axis labels
		ctx.textAlign = "right";
		for (let i = 0; i < 5; i++) {
			const power = 400 - (i / 4) * 300;
			const y = margin.top + (i / 4) * height;
			ctx.fillText(`${Math.round(power)}W`, margin.left - 10, y + 4);
		}

		// Title
		ctx.fillStyle = "#1f2937";
		ctx.font = "16px sans-serif";
		ctx.textAlign = "center";
		ctx.fillText(
			"Model Performance on a Pre-selected Anomaly Event",
			canvas.width / 2,
			25,
		);

		// Axis titles
		ctx.font = "12px sans-serif";
		ctx.fillText("Time", canvas.width / 2, canvas.height - 10);

		ctx.save();
		ctx.translate(20, canvas.height / 2);
		ctx.rotate(-Math.PI / 2);
		ctx.fillText("Power (W)", 0, 0);
		ctx.restore();
	}, [data, modelVisibility]); // 依賴項包含 data 和 modelVisibility

	useEffect(() => {
		drawChart();
	}, [drawChart]);

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
			<CardContent className="space-y-4">
				<canvas
					ref={canvasRef}
					width={800}
					height={400}
					className="w-full border border-gray-200 rounded-lg bg-white"
				/>

				{/* Interactive Toggle Buttons */}
				<div className="flex gap-3 justify-center">
					<Button
						variant={modelVisibility.uPU ? "default" : "outline"}
						size="sm"
						onClick={() => toggleModel("uPU")}
						className="text-xs"
					>
						{modelVisibility.uPU ? "✓" : ""} Show uPU Prediction
					</Button>
					<Button
						variant={modelVisibility.nnPU ? "default" : "outline"}
						size="sm"
						onClick={() => toggleModel("nnPU")}
						className="text-xs"
					>
						{modelVisibility.nnPU ? "✓" : ""} Show nnPU Prediction
					</Button>
					<Button
						variant={
							modelVisibility.proposed ? "default" : "outline"
						}
						size="sm"
						onClick={() => toggleModel("proposed")}
						className="text-xs"
					>
						{modelVisibility.proposed ? "✓" : ""} Show Proposed
						Model Prediction
					</Button>
				</div>

				{/* Annotation */}
				<div className="bg-gray-50 p-4 rounded-lg border">
					<h5 className="font-medium text-sm mb-2">
						Interactive Comparison of Anomaly Detector Models
					</h5>
					<p className="text-xs text-gray-600">
						This chart displays model performance on a pre-selected
						anomaly event from the testbed. Toggle the buttons above
						to visually compare how each model performs against the
						ground truth (light red background indicates the actual
						anomaly period).
					</p>

					{/* Legend */}
					<div className="mt-3 flex flex-wrap gap-4 text-xs">
						<div className="flex items-center gap-2">
							<div className="w-4 h-0.5 bg-blue-500" />
							<span>Power Consumption</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="w-3 h-3 bg-red-100 border border-red-300" />
							<span>Ground Truth Anomaly</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="w-3 h-3 bg-yellow-500 rounded-full" />
							<span>uPU Detection</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="w-3 h-3 bg-green-500 rounded-full" />
							<span>nnPU Detection</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
							<span>Proposed Model Detection</span>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
