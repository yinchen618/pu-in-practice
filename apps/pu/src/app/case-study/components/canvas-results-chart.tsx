"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ModelToggleState {
	uPU: boolean;
	nnPU: boolean;
	proposed: boolean;
}

export function CanvasResultsChart() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [modelVisibility, setModelVisibility] = useState<ModelToggleState>({
		uPU: true,
		nnPU: true,
		proposed: true,
	});
	const tooltipRef = useRef<HTMLDivElement>(null);
	const [tooltipData, setTooltipData] = useState<{
		visible: boolean;
		x: number;
		y: number;
		time: string;
		power: number;
		model?: string;
	}>({
		visible: false,
		x: 0,
		y: 0,
		time: "",
		power: 0,
	});

	// Simulated anomaly detection result data
	const generateSampleData = () => {
		const baseTime = new Date("2024-01-15T14:00:00");
		const dataPoints = 144; // 12 hours of 5-minute intervals
		const timestamps: string[] = [];
		const actualPower: number[] = [];

		for (let i = 0; i < dataPoints; i++) {
			const time = new Date(baseTime.getTime() + i * 5 * 60 * 1000);
			timestamps.push(time.toISOString());

			// Base power consumption pattern (normal situation)
			let power = 150 + Math.sin((i / 24) * Math.PI) * 30; // Daily fluctuation
			power += (Math.random() - 0.5) * 20; // Random noise

			// Create anomalies in specific time periods (e.g., data points 60-80)
			if (i >= 60 && i <= 80) {
				power += 400 + Math.random() * 100; // Obvious anomaly peak
			}
			// Create smaller anomalies in another time period (data points 100-110)
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

		// Process data
		const timestampDates = timestamps.map((ts) => new Date(ts));

		// Calculate margins and drawing area
		const margin = { top: 40, right: 30, bottom: 60, left: 60 };
		const width = canvas.width - margin.left - margin.right;
		const height = canvas.height - margin.top - margin.bottom;

		// Clear canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Draw background
		ctx.fillStyle = "#f8fafc";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Determine data range
		const minPower = 0;
		const maxPower = Math.max(...actualPower) * 1.1; // Add 10% padding at the top
		const startTime = timestampDates[0];
		const endTime = timestampDates[timestampDates.length - 1];

		// Scale functions
		const xScale = (time: Date) =>
			margin.left +
			((time.getTime() - startTime.getTime()) /
				(endTime.getTime() - startTime.getTime())) *
				width;

		const yScale = (value: number) =>
			margin.top +
			height -
			((value - minPower) / (maxPower - minPower)) * height;

		// Draw axes
		ctx.beginPath();
		ctx.strokeStyle = "#94a3b8";
		ctx.lineWidth = 2;
		ctx.moveTo(margin.left, margin.top);
		ctx.lineTo(margin.left, margin.top + height);
		ctx.lineTo(margin.left + width, margin.top + height);
		ctx.stroke();

		// Draw grid lines and axis labels
		ctx.beginPath();
		ctx.strokeStyle = "#e2e8f0";
		ctx.lineWidth = 1;

		// Y-axis grid and labels
		const numYLines = 5;
		for (let i = 0; i <= numYLines; i++) {
			const y = margin.top + height - (height / numYLines) * i;
			const powerValue = (i / numYLines) * maxPower;

			ctx.moveTo(margin.left, y);
			ctx.lineTo(margin.left + width, y);

			ctx.fillStyle = "#64748b";
			ctx.font = "12px Arial";
			ctx.textAlign = "right";
			ctx.fillText(`${Math.round(powerValue)}W`, margin.left - 10, y + 4);
		}

		// X-axis grid and labels
		const numXLines = 6;
		for (let i = 0; i <= numXLines; i++) {
			const x = margin.left + (width / numXLines) * i;
			const timeIndex = Math.floor(
				(i / numXLines) * (timestampDates.length - 1),
			);
			const time = timestampDates[timeIndex];

			ctx.moveTo(x, margin.top);
			ctx.lineTo(x, margin.top + height);

			ctx.fillStyle = "#64748b";
			ctx.font = "10px Arial";
			ctx.textAlign = "center";
			ctx.save();
			ctx.translate(x, margin.top + height + 10);
			ctx.rotate(Math.PI / 6); // 旋轉標籤
			ctx.fillText(
				time.toLocaleTimeString([], {
					hour: "2-digit",
					minute: "2-digit",
				}),
				0,
				0,
			);
			ctx.restore();
		}
		ctx.stroke();

		// 繪製軸標題
		ctx.fillStyle = "#334155";
		ctx.font = "bold 12px Arial";
		ctx.textAlign = "center";
		ctx.fillText("Time", margin.left + width / 2, canvas.height - 5);
		ctx.save();
		ctx.translate(15, margin.top + height / 2);
		ctx.rotate(-Math.PI / 2);
		ctx.fillText("Power (W)", 0, 0);
		ctx.restore();

		// 繪製圖表標題
		ctx.fillStyle = "#0f172a";
		ctx.font = "bold 16px Arial";
		ctx.textAlign = "center";
		ctx.fillText(
			"Model Performance on a Pre-selected Anomaly Event",
			canvas.width / 2,
			margin.top / 2,
		);

		// 繪製實際功率曲線
		ctx.beginPath();
		ctx.strokeStyle = "#3b82f6"; // 藍色
		ctx.lineWidth = 2;
		ctx.moveTo(xScale(timestampDates[0]), yScale(actualPower[0]));
		for (let i = 1; i < timestampDates.length; i++) {
			ctx.lineTo(xScale(timestampDates[i]), yScale(actualPower[i]));
		}
		ctx.stroke();

		// 繪製真實異常區域（半透明填充）
		// 第一個異常區域（60-80）
		ctx.fillStyle = "rgba(239, 68, 68, 0.2)"; // Red, semi-transparent
		ctx.beginPath();
		ctx.moveTo(xScale(timestampDates[60]), yScale(0));
		for (let i = 60; i <= 80; i++) {
			ctx.lineTo(xScale(timestampDates[i]), yScale(0));
		}
		for (let i = 80; i >= 60; i--) {
			ctx.lineTo(xScale(timestampDates[i]), yScale(maxPower));
		}
		ctx.closePath();
		ctx.fill();

		// 第二個異常區域（100-110）
		ctx.fillStyle = "rgba(239, 68, 68, 0.2)"; // 紅色，半透明
		ctx.beginPath();
		ctx.moveTo(xScale(timestampDates[100]), yScale(0));
		for (let i = 100; i <= 110; i++) {
			ctx.lineTo(xScale(timestampDates[i]), yScale(0));
		}
		for (let i = 110; i >= 100; i--) {
			ctx.lineTo(xScale(timestampDates[i]), yScale(maxPower));
		}
		ctx.closePath();
		ctx.fill();

		// 根據可見性繪製模型預測點
		// uPU 預測
		if (modelVisibility.uPU) {
			ctx.fillStyle = "#f59e0b"; // 琥珀色
			for (let i = 0; i < uPUPredictions.length; i++) {
				if (uPUPredictions[i] === 1) {
					const x = xScale(timestampDates[i]);
					const y = yScale(actualPower[i]);
					ctx.beginPath();
					ctx.arc(x, y, 6, 0, Math.PI * 2);
					ctx.fill();
				}
			}
		}

		// nnPU 預測
		if (modelVisibility.nnPU) {
			ctx.fillStyle = "#8b5cf6"; // 紫色
			for (let i = 0; i < nnPUPredictions.length; i++) {
				if (nnPUPredictions[i] === 1) {
					const x = xScale(timestampDates[i]);
					const y = yScale(actualPower[i]);

					// 繪製正方形
					ctx.beginPath();
					ctx.rect(x - 5, y - 5, 10, 10);
					ctx.fill();
				}
			}
		}

		// 提出的模型預測
		if (modelVisibility.proposed) {
			ctx.fillStyle = "#10b981"; // 綠色
			for (let i = 0; i < proposedPredictions.length; i++) {
				if (proposedPredictions[i] === 1) {
					const x = xScale(timestampDates[i]);
					const y = yScale(actualPower[i]);

					// 繪製菱形
					ctx.beginPath();
					ctx.moveTo(x, y - 7); // 上
					ctx.lineTo(x + 7, y); // 右
					ctx.lineTo(x, y + 7); // 下
					ctx.lineTo(x - 7, y); // 左
					ctx.closePath();
					ctx.fill();
				}
			}
		}

		// 繪製圖例
		const legendY = margin.top + 15;
		let legendX = margin.left + 10;

		// 功率線圖例
		ctx.strokeStyle = "#3b82f6";
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(legendX, legendY);
		ctx.lineTo(legendX + 20, legendY);
		ctx.stroke();

		ctx.fillStyle = "#334155";
		ctx.font = "12px Arial";
		ctx.textAlign = "left";
		ctx.fillText("Power Consumption", legendX + 25, legendY + 4);
		legendX += 150;

		// 真實異常區域圖例
		ctx.fillStyle = "rgba(239, 68, 68, 0.2)";
		ctx.fillRect(legendX, legendY - 5, 20, 10);
		ctx.fillStyle = "#334155";
		ctx.fillText("Ground Truth Anomaly", legendX + 25, legendY + 4);
		legendX += 150;

		// 模型預測圖例
		if (modelVisibility.uPU) {
			ctx.fillStyle = "#f59e0b";
			ctx.beginPath();
			ctx.arc(legendX + 10, legendY, 5, 0, Math.PI * 2);
			ctx.fill();

			ctx.fillStyle = "#334155";
			ctx.fillText("uPU Model", legendX + 20, legendY + 4);
			legendX += 100;
		}

		if (modelVisibility.nnPU) {
			ctx.fillStyle = "#8b5cf6";
			ctx.fillRect(legendX + 5, legendY - 5, 10, 10);

			ctx.fillStyle = "#334155";
			ctx.fillText("nnPU Model", legendX + 20, legendY + 4);
			legendX += 100;
		}

		if (modelVisibility.proposed) {
			ctx.fillStyle = "#10b981";
			ctx.beginPath();
			ctx.moveTo(legendX + 10, legendY - 5);
			ctx.lineTo(legendX + 15, legendY);
			ctx.lineTo(legendX + 10, legendY + 5);
			ctx.lineTo(legendX + 5, legendY);
			ctx.closePath();
			ctx.fill();

			ctx.fillStyle = "#334155";
			ctx.fillText("Proposed Model", legendX + 20, legendY + 4);
		}

		// 滑鼠互動
		const handleMouseMove = (e: MouseEvent) => {
			const rect = canvas.getBoundingClientRect();
			const mouseX = e.clientX - rect.left;

			// 如果滑鼠在繪圖區域外
			if (mouseX < margin.left || mouseX > margin.left + width) {
				setTooltipData((prev) => ({ ...prev, visible: false }));
				return;
			}

			// 找出最接近的數據點
			const timePosition =
				((mouseX - margin.left) / width) *
					(endTime.getTime() - startTime.getTime()) +
				startTime.getTime();

			let closestIndex = 0;
			let minDistance = Number.MAX_VALUE;

			for (let i = 0; i < timestampDates.length; i++) {
				const distance = Math.abs(
					timestampDates[i].getTime() - timePosition,
				);
				if (distance < minDistance) {
					minDistance = distance;
					closestIndex = i;
				}
			}

			// 確定懸停的是哪個模型的預測點
			let modelName = "";
			if (
				modelVisibility.proposed &&
				proposedPredictions[closestIndex] === 1
			) {
				modelName = "Proposed Model";
			} else if (
				modelVisibility.nnPU &&
				nnPUPredictions[closestIndex] === 1
			) {
				modelName = "nnPU Model";
			} else if (
				modelVisibility.uPU &&
				uPUPredictions[closestIndex] === 1
			) {
				modelName = "uPU Model";
			}

			const point = {
				x: xScale(timestampDates[closestIndex]),
				y: yScale(actualPower[closestIndex]),
				time: timestampDates[closestIndex].toLocaleString(),
				power: actualPower[closestIndex],
				model: modelName || undefined,
			};

			setTooltipData({
				visible: true,
				x: point.x + rect.left,
				y: point.y + rect.top,
				time: point.time,
				power: point.power,
				model: point.model,
			});
		};

		const handleMouseLeave = () => {
			setTooltipData((prev) => ({ ...prev, visible: false }));
		};

		canvas.addEventListener("mousemove", handleMouseMove);
		canvas.addEventListener("mouseleave", handleMouseLeave);

		return () => {
			canvas.removeEventListener("mousemove", handleMouseMove);
			canvas.removeEventListener("mouseleave", handleMouseLeave);
		};
	}, [
		modelVisibility,
		timestamps,
		actualPower,
		uPUPredictions,
		nnPUPredictions,
		proposedPredictions,
	]);

	useEffect(() => {
		// 定位提示框
		if (tooltipRef.current && tooltipData.visible) {
			tooltipRef.current.style.left = `${tooltipData.x + 15}px`;
			tooltipRef.current.style.top = `${tooltipData.y - 15}px`;
		}
	}, [tooltipData]);

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
				<div className="relative w-full">
					<canvas ref={canvasRef} className="w-full" />

					{tooltipData.visible && (
						<div
							ref={tooltipRef}
							className="absolute z-10 bg-white p-2 rounded shadow-lg border border-gray-200 pointer-events-none text-sm"
							style={{
								position: "fixed",
								left: 0,
								top: 0,
								transform: "translateY(-100%)",
							}}
						>
							{tooltipData.model && (
								<p className="font-semibold">
									{tooltipData.model}
								</p>
							)}
							<p>Time: {tooltipData.time}</p>
							<p>Power: {tooltipData.power.toFixed(1)}W</p>
						</div>
					)}
				</div>
				<div className="space-y-4 mt-4">
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
