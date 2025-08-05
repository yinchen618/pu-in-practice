// DataVisualization.tsx
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

interface DataVisualizationProps {
	results: SimulationResult | null;
}

export default function DataVisualization({ results }: DataVisualizationProps) {
	const svgRef = useRef<SVGSVGElement>(null);

	useEffect(() => {
		if (!results || !svgRef.current) {
			return;
		}
		const svg = d3.select(svgRef.current);
		svg.selectAll("*").remove();

		// SVG dimensions and margins
		const svgWidth = 800;
		const svgHeight = 400;
		const margin = { top: 20, right: 20, bottom: 20, left: 20 };
		const width = svgWidth - margin.left - margin.right;
		const height = svgHeight - margin.top - margin.bottom;

		// Create main drawing area
		const g = svg
			.append("g")
			.attr("transform", `translate(${margin.left},${margin.top})`);

		const { pSamples, uSamples, decisionBoundary } = results.visualization;

		// Console.log 前10個紅色點和灰色點
		// console.log("🔴 紅色點 (P samples) 前10個:", pSamples.slice(0, 10));
		// console.log("⚫ 灰色點 (U samples) 前10個:", uSamples.slice(0, 10));

		// Calculate data extent and create scales
		const allPoints = [...pSamples, ...uSamples];
		const xExtent = d3.extent(allPoints, (d) => d.x) as [number, number];
		const yExtent = d3.extent(allPoints, (d) => d.y) as [number, number];

		// Add padding to avoid edge clipping
		const xPadding = (xExtent[1] - xExtent[0]) * 0.1;
		const yPadding = (yExtent[1] - yExtent[0]) * 0.1;

		const xScale = d3
			.scaleLinear()
			.domain([xExtent[0] - xPadding, xExtent[1] + xPadding])
			.range([0, width]);

		const yScale = d3
			.scaleLinear()
			.domain([yExtent[0] - yPadding, yExtent[1] + yPadding])
			.range([height, 0]);

		// Draw P samples (positive samples)
		g.selectAll(".p-point")
			.data(pSamples)
			.enter()
			.append("circle")
			.attr("class", "p-point")
			.attr("cx", (d) => xScale(d.x))
			.attr("cy", (d) => yScale(d.y))
			.attr("r", 5)
			.attr("fill", "#ef4444")
			.attr("stroke", "#dc2626")
			.attr("stroke-width", 1)
			.attr("opacity", 0.8);

		// Draw U samples (unlabeled samples)
		g.selectAll(".u-point")
			.data(uSamples)
			.enter()
			.append("circle")
			.attr("class", "u-point")
			.attr("cx", (d) => xScale(d.x))
			.attr("cy", (d) => yScale(d.y))
			.attr("r", 3)
			.attr("fill", "#6b7280")
			.attr("stroke", "#4b5563")
			.attr("stroke-width", 0.5)
			.attr("opacity", 0.6);

		// Draw decision boundary
		if (decisionBoundary && decisionBoundary.length > 0) {
			const validBoundaryPoints = decisionBoundary
				.filter(
					(point) =>
						point.length === 2 &&
						!Number.isNaN(point[0]) &&
						!Number.isNaN(point[1]),
				)
				.map(
					(point) =>
						[xScale(point[0]), yScale(point[1])] as [
							number,
							number,
						],
				);

			if (validBoundaryPoints.length > 1) {
				const line = d3
					.line<[number, number]>()
					.x((d) => d[0])
					.y((d) => d[1])
					.curve(d3.curveCardinal.tension(0.5));

				g.append("path")
					.datum(validBoundaryPoints)
					.attr("d", line)
					.attr("stroke", "#3b82f6")
					.attr("stroke-width", 2.5)
					.attr("fill", "none")
					.attr("opacity", 0.8);
			}
		}

		// Draw coordinate axes if they intersect the plot area
		if (xScale(0) >= 0 && xScale(0) <= width) {
			g.append("line")
				.attr("x1", xScale(0))
				.attr("x2", xScale(0))
				.attr("y1", 0)
				.attr("y2", height)
				.attr("stroke", "#e5e7eb")
				.attr("stroke-dasharray", "2,2")
				.attr("opacity", 0.5);
		}

		if (yScale(0) >= 0 && yScale(0) <= height) {
			g.append("line")
				.attr("x1", 0)
				.attr("x2", width)
				.attr("y1", yScale(0))
				.attr("y2", yScale(0))
				.attr("stroke", "#e5e7eb")
				.attr("stroke-dasharray", "2,2")
				.attr("opacity", 0.5);
		}

		// Add legend
		const legend = g
			.append("g")
			.attr("transform", `translate(${width - 120}, 20)`);

		// Positive samples legend
		legend
			.append("circle")
			.attr("cx", 0)
			.attr("cy", 0)
			.attr("r", 5)
			.attr("fill", "#ef4444")
			.attr("stroke", "#dc2626");

		legend
			.append("text")
			.attr("x", 15)
			.attr("y", 0)
			.attr("dy", "0.35em")
			.text("Positive (P)")
			.attr("font-size", "12px")
			.attr("fill", "#374151");

		// Unlabeled samples legend
		legend
			.append("circle")
			.attr("cx", 0)
			.attr("cy", 20)
			.attr("r", 3)
			.attr("fill", "#6b7280")
			.attr("stroke", "#4b5563");

		legend
			.append("text")
			.attr("x", 15)
			.attr("y", 20)
			.attr("dy", "0.35em")
			.text("Unlabeled (U)")
			.attr("font-size", "12px")
			.attr("fill", "#374151");

		// Decision boundary legend
		legend
			.append("line")
			.attr("x1", -5)
			.attr("x2", 10)
			.attr("y1", 40)
			.attr("y2", 40)
			.attr("stroke", "#3b82f6")
			.attr("stroke-width", 2.5);

		legend
			.append("text")
			.attr("x", 15)
			.attr("y", 40)
			.attr("dy", "0.35em")
			.text("Decision Boundary")
			.attr("font-size", "12px")
			.attr("fill", "#374151");
	}, [results]);

	return (
		<Card data-component="data-visualization">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<TrendingUp className="h-5 w-5" />
					Data Visualization
				</CardTitle>
				<CardDescription>
					Scatter plot showing positive samples (P), unlabeled samples
					(U), and decision boundary
				</CardDescription>
			</CardHeader>
			<CardContent>
				{results ? (
					<svg
						ref={svgRef}
						width="100%"
						height="400"
						viewBox="0 0 800 400"
						className="border rounded-lg bg-white"
					/>
				) : (
					<div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
						<div className="text-center">
							<TrendingUp className="h-12 w-12 mx-auto text-gray-400 mb-4" />
							<p className="text-gray-500">
								Run simulation to see data visualization
							</p>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
