// RiskCurveChart.tsx
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import * as d3 from "d3";
import { TrendingUp } from "lucide-react";
import { useEffect, useRef } from "react";
import type { SimulationResult } from "./types";

interface RiskCurveChartProps {
	results: SimulationResult | null;
	algorithm: "uPU" | "nnPU";
}

export default function RiskCurveChart({
	results,
	algorithm,
}: RiskCurveChartProps) {
	const chartRef = useRef<SVGSVGElement>(null);

	useEffect(() => {
		if (!results || !chartRef.current) {
			return;
		}

		const svg = d3.select(chartRef.current);
		svg.selectAll("*").remove();

		const margin = { top: 20, right: 30, bottom: 50, left: 70 };
		const width = 400 - margin.left - margin.right;
		const height = 200 - margin.bottom - margin.top;

		const g = svg
			.append("g")
			.attr("transform", `translate(${margin.left},${margin.top})`);

		const { riskCurve } = results.metrics;

		// Create scales
		const xScale = d3
			.scaleLinear()
			.domain(d3.extent(riskCurve, (d) => d.epoch) as [number, number])
			.range([0, width]);

		const yExtent = d3.extent(riskCurve, (d) => d.risk) as [number, number];
		const yPadding = Math.abs(yExtent[1] - yExtent[0]) * 0.1;
		const yScale = d3
			.scaleLinear()
			.domain([yExtent[0] - yPadding, yExtent[1] + yPadding])
			.range([height, 0]);

		// Draw grid lines
		const yTicks = yScale.ticks(6);
		g.selectAll(".y-grid")
			.data(yTicks)
			.enter()
			.append("line")
			.attr("class", "y-grid")
			.attr("x1", 0)
			.attr("x2", width)
			.attr("y1", (d) => yScale(d))
			.attr("y2", (d) => yScale(d))
			.attr("stroke", "#f1f5f9")
			.attr("stroke-width", 1);

		const xTicks = xScale.ticks(8);
		g.selectAll(".x-grid")
			.data(xTicks)
			.enter()
			.append("line")
			.attr("class", "x-grid")
			.attr("x1", (d) => xScale(d))
			.attr("x2", (d) => xScale(d))
			.attr("y1", 0)
			.attr("y2", height)
			.attr("stroke", "#f1f5f9")
			.attr("stroke-width", 1);

		// Highlight zero line
		if (yScale(0) >= 0 && yScale(0) <= height) {
			g.append("line")
				.attr("x1", 0)
				.attr("x2", width)
				.attr("y1", yScale(0))
				.attr("y2", yScale(0))
				.attr("stroke", "#dc2626")
				.attr("stroke-width", 2)
				.attr("stroke-dasharray", "5,5")
				.attr("opacity", 0.8);

			g.append("text")
				.attr("x", width - 5)
				.attr("y", yScale(0) - 5)
				.attr("text-anchor", "end")
				.text("Risk = 0")
				.attr("font-size", "11px")
				.attr("fill", "#dc2626")
				.attr("font-weight", "bold");
		}

		// Draw risk curve, separating positive and negative risk
		const line = d3
			.line<{ epoch: number; risk: number }>()
			.x((d) => xScale(d.epoch))
			.y((d) => yScale(d.risk))
			.curve(d3.curveMonotoneX);

		const positiveRisk = riskCurve.filter((d) => d.risk >= 0);
		const negativeRisk = riskCurve.filter((d) => d.risk < 0);

		// Draw positive risk curve
		if (positiveRisk.length > 0) {
			g.append("path")
				.datum(positiveRisk)
				.attr("d", line)
				.attr("stroke", algorithm === "uPU" ? "#f59e0b" : "#10b981")
				.attr("stroke-width", 2.5)
				.attr("fill", "none")
				.attr("opacity", 0.9);
		}

		// Draw negative risk curve (if any)
		if (negativeRisk.length > 0) {
			g.append("path")
				.datum(negativeRisk)
				.attr("d", line)
				.attr("stroke", "#dc2626")
				.attr("stroke-width", 3)
				.attr("fill", "none")
				.attr("stroke-dasharray", "4,2")
				.attr("opacity", 0.9);

			// Warning for negative risk
			g.append("text")
				.attr("x", 10)
				.attr("y", 15)
				.text("⚠️ Negative Risk Detected")
				.attr("font-size", "12px")
				.attr("fill", "#dc2626")
				.attr("font-weight", "bold");
		}

		// Draw axes
		g.append("g")
			.attr("transform", `translate(0,${height})`)
			.call(d3.axisBottom(xScale).tickFormat(d3.format("d")));

		g.append("g").call(d3.axisLeft(yScale).tickFormat(d3.format(".3f")));

		// Axis labels
		g.append("text")
			.attr("x", width / 2)
			.attr("y", height + 40)
			.attr("text-anchor", "middle")
			.text("Training Epoch")
			.attr("font-size", "12px")
			.attr("fill", "#374151");

		g.append("text")
			.attr("transform", "rotate(-90)")
			.attr("x", -height / 2)
			.attr("y", -50)
			.attr("text-anchor", "middle")
			.text(`${algorithm} Risk Value`)
			.attr("font-size", "12px")
			.attr("fill", "#374151");

		// Legend
		const legend = g
			.append("g")
			.attr("transform", `translate(${width - 150}, 25)`);

		legend
			.append("text")
			.attr("x", 0)
			.attr("y", 0)
			.text(`${algorithm} Algorithm`)
			.attr("font-size", "11px")
			.attr("font-weight", "bold")
			.attr("fill", "#1f2937");

		// Positive risk legend
		legend
			.append("line")
			.attr("x1", 0)
			.attr("x2", 20)
			.attr("y1", 15)
			.attr("y2", 15)
			.attr("stroke", algorithm === "uPU" ? "#f59e0b" : "#10b981")
			.attr("stroke-width", 2.5);

		legend
			.append("text")
			.attr("x", 25)
			.attr("y", 15)
			.attr("dy", "0.35em")
			.text("Positive Risk")
			.attr("font-size", "10px")
			.attr("fill", "#374151");

		// Negative risk legend (if applicable)
		if (negativeRisk.length > 0) {
			legend
				.append("line")
				.attr("x1", 0)
				.attr("x2", 20)
				.attr("y1", 30)
				.attr("y2", 30)
				.attr("stroke", "#dc2626")
				.attr("stroke-width", 3)
				.attr("stroke-dasharray", "4,2");

			legend
				.append("text")
				.attr("x", 25)
				.attr("y", 30)
				.attr("dy", "0.35em")
				.text("Negative Risk")
				.attr("font-size", "10px")
				.attr("fill", "#374151");
		}
	}, [results, algorithm]);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<TrendingUp className="h-5 w-5" />
					Risk Curve Analysis
				</CardTitle>
				<CardDescription>
					Training risk evolution over epochs ({algorithm} algorithm)
				</CardDescription>
			</CardHeader>
			<CardContent>
				{results ? (
					<svg
						ref={chartRef}
						width="100%"
						height="200"
						viewBox="0 0 400 200"
						className="border rounded-lg bg-white"
					/>
				) : (
					<div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
						<div className="text-center">
							<TrendingUp className="h-8 w-8 mx-auto text-gray-400 mb-2" />
							<p className="text-sm text-gray-500">
								Run simulation to see risk curve
							</p>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
