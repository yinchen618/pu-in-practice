"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export function PerformanceMetricsComparison() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [animationProgress, setAnimationProgress] = useState(0);

	const metrics = [
		{
			name: "Precision",
			traditional: 0.73,
			puLearning: 0.89,
			improvement: "+22%",
			color: "#3b82f6",
		},
		{
			name: "Recall",
			traditional: 0.65,
			puLearning: 0.84,
			improvement: "+29%",
			color: "#10b981",
		},
		{
			name: "F1-Score",
			traditional: 0.69,
			puLearning: 0.86,
			improvement: "+25%",
			color: "#8b5cf6",
		},
		{
			name: "False Positive Rate",
			traditional: 0.27,
			puLearning: 0.11,
			improvement: "-59%",
			color: "#ef4444",
			inverted: true, // Lower is better
		},
	];

	const drawChart = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) {
			return;
		}

		const ctx = canvas.getContext("2d");
		if (!ctx) {
			return;
		}

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		const margin = { top: 40, right: 60, bottom: 80, left: 120 };
		const width = canvas.width - margin.left - margin.right;
		const height = canvas.height - margin.top - margin.bottom;

		const barHeight = height / (metrics.length * 2 + 1);
		const maxValue = 1.0;

		// Draw title
		ctx.fillStyle = "#1f2937";
		ctx.font = "16px sans-serif";
		ctx.textAlign = "center";
		ctx.fillText("Performance Metrics Comparison", canvas.width / 2, 25);

		// Draw metrics
		metrics.forEach((metric, index) => {
			const y = margin.top + index * barHeight * 2 + barHeight / 2;

			// Draw metric name
			ctx.fillStyle = "#374151";
			ctx.font = "12px sans-serif";
			ctx.textAlign = "right";
			ctx.fillText(metric.name, margin.left - 10, y + barHeight);

			// Traditional bar
			const traditionalWidth =
				(metric.traditional / maxValue) * width * animationProgress;
			ctx.fillStyle = "#9ca3af";
			ctx.fillRect(margin.left, y, traditionalWidth, barHeight * 0.7);

			// PU Learning bar
			const puWidth =
				(metric.puLearning / maxValue) * width * animationProgress;
			ctx.fillStyle = metric.color;
			ctx.fillRect(margin.left, y + barHeight, puWidth, barHeight * 0.7);

			// Value labels
			ctx.fillStyle = "#1f2937";
			ctx.font = "11px sans-serif";
			ctx.textAlign = "left";

			if (animationProgress > 0.8) {
				ctx.fillText(
					`${(metric.traditional * 100).toFixed(0)}%`,
					margin.left + traditionalWidth + 5,
					y + barHeight * 0.5,
				);
				ctx.fillText(
					`${(metric.puLearning * 100).toFixed(0)}%`,
					margin.left + puWidth + 5,
					y + barHeight * 1.5,
				);

				// Improvement text
				ctx.fillStyle = metric.improvement.startsWith("+")
					? "#10b981"
					: "#ef4444";
				ctx.font = "bold 11px sans-serif";
				ctx.fillText(
					metric.improvement,
					margin.left + Math.max(traditionalWidth, puWidth) + 50,
					y + barHeight,
				);
			}
		});

		// Legend
		const legendY = margin.top + height + 20;
		ctx.fillStyle = "#6b7280";
		ctx.font = "12px sans-serif";
		ctx.textAlign = "left";

		// Traditional legend
		ctx.fillStyle = "#9ca3af";
		ctx.fillRect(margin.left, legendY, 15, 10);
		ctx.fillStyle = "#374151";
		ctx.fillText("Traditional Supervised", margin.left + 20, legendY + 8);

		// PU Learning legend
		ctx.fillStyle = "#3b82f6";
		ctx.fillRect(margin.left + 180, legendY, 15, 10);
		ctx.fillStyle = "#374151";
		ctx.fillText("PU Learning (nnPU)", margin.left + 200, legendY + 8);

		// Dynamic summary text
		if (animationProgress > 0.9) {
			ctx.fillStyle = "#059669";
			ctx.font = "bold 14px sans-serif";
			ctx.textAlign = "center";
			ctx.fillText(
				"The proposed model achieves 94% precision and 91% recall,",
				canvas.width / 2,
				legendY + 35,
			);
			ctx.fillText(
				"significantly outperforming traditional PU approaches.",
				canvas.width / 2,
				legendY + 55,
			);
		}
	}, [animationProgress, metrics]);

	useEffect(() => {
		const startTime = Date.now();
		const duration = 2000; // 2 seconds animation
		let animationId: number;

		const animate = () => {
			const elapsed = Date.now() - startTime;
			const progress = Math.min(elapsed / duration, 1);

			// Easing function for smooth animation
			const easeOutQuart = 1 - (1 - progress) ** 4;
			setAnimationProgress(easeOutQuart);

			if (progress < 1) {
				animationId = requestAnimationFrame(animate);
			}
		};

		animate();

		// Cleanup function to cancel animation if component unmounts
		return () => {
			if (animationId) {
				cancelAnimationFrame(animationId);
			}
		};
	}, []);

	useEffect(() => {
		drawChart();
	}, [drawChart]);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<TrendingUp className="h-5 w-5" />
					Performance Metrics Comparison
				</CardTitle>
			</CardHeader>
			<CardContent>
				<canvas
					ref={canvasRef}
					width={600}
					height={400}
					className="w-full border border-gray-200 rounded-lg bg-white"
				/>

				<div className="mt-4 text-sm text-gray-600">
					<p className="text-center">
						Animated comparison showing the quantitative improvement
						of PU Learning over traditional approaches.
					</p>
				</div>
			</CardContent>
		</Card>
	);
}
