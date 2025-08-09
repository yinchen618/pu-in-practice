"use client";

import { TrendingUp } from "lucide-react";
import dynamic from "next/dynamic";
import type { AnomalyEvent } from "../types";

// Dynamically import Plotly component, disable SSR
const Plot = dynamic(() => import("react-plotly.js"), {
	ssr: false,
	loading: () => (
		<div className="h-[400px] flex items-center justify-center">
			<div className="text-gray-500">Loading chart...</div>
		</div>
	),
});

interface TimeSeriesChartProps {
	selectedEvent: AnomalyEvent | null;
	isLoading?: boolean;
	className?: string;
}

export function TimeSeriesChart({
	selectedEvent,
	isLoading = false,
	className = "",
}: TimeSeriesChartProps) {
	// If no event is selected, show empty state
	if (!selectedEvent) {
		return (
			<div
				className={`h-full flex items-center justify-center border rounded-lg bg-white ${className}`}
			>
				<div className="text-center text-gray-500">
					<TrendingUp className="size-12 mx-auto mb-4 text-gray-300" />
					<p className="text-lg font-medium mb-2">
						Select Event to View Analysis
					</p>
					<p className="text-sm">
						Choose an event from the left panel to view its time
						series data analysis
					</p>
				</div>
			</div>
		);
	}

	// If loading, show loading state
	if (isLoading) {
		return (
			<div
				className={`h-full flex items-center justify-center border rounded-lg bg-white ${className}`}
			>
				<div className="text-center text-gray-500">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
					<p>Loading time series data...</p>
				</div>
			</div>
		);
	}

	// Prepare chart data with ±10 minutes window for display
	const fullWindow = selectedEvent.dataWindow || {
		timestamps: [],
		values: [],
	};
	const eventTime = new Date(selectedEvent.eventTimestamp);
	const windowed = (() => {
		if (!fullWindow.timestamps?.length || !fullWindow.values?.length) {
			return { timestamps: [], values: [] };
		}
		const tenMinMs = 10 * 60 * 1000;
		const start = new Date(eventTime.getTime() - tenMinMs);
		const end = new Date(eventTime.getTime() + tenMinMs);
		const filteredX: string[] = [];
		const filteredY: number[] = [];
		for (let i = 0; i < fullWindow.timestamps.length; i += 1) {
			const t = new Date(fullWindow.timestamps[i]);
			if (t >= start && t <= end) {
				filteredX.push(fullWindow.timestamps[i]);
				filteredY.push(fullWindow.values[i]);
			}
		}
		return filteredX.length > 0
			? { timestamps: filteredX, values: filteredY }
			: { timestamps: fullWindow.timestamps, values: fullWindow.values };
	})();
	const { timestamps, values } = windowed;

	const plotData = [
		{
			x: timestamps,
			y: values,
			type: "scatter" as const,
			mode: "lines+markers" as const,
			name: "Energy Consumption Data",
			line: { color: "#3b82f6", width: 2 },
			marker: { color: "#3b82f6", size: 4 },
		},
		{
			x: [selectedEvent.eventTimestamp],
			y: [
				(() => {
					// find y at event timestamp (or nearest)
					const idx = timestamps.findIndex(
						(t) => new Date(t).getTime() === eventTime.getTime(),
					);
					if (idx >= 0) return values[idx] ?? 0;
					// fallback to middle
					return values[Math.floor(timestamps.length / 2)] || 0;
				})(),
			],
			type: "scatter" as const,
			mode: "markers" as const,
			name: "Anomaly Event",
			marker: {
				color: "#ef4444",
				size: 12,
				symbol: "star",
				line: { color: "#dc2626", width: 2 },
			},
		},
	];

	const layout = {
		autosize: true,
		height: 400,
		margin: { l: 50, r: 50, t: 40, b: 50 },
		xaxis: {
			title: { text: "Time" },
			type: "date" as const,
		},
		yaxis: {
			title: { text: "Energy Consumption (kWh)" },
		},
		showlegend: true,
		legend: { x: 0, y: 1 },
		title: {
			text: `Event ${selectedEvent.id} - Time Series Analysis (±10 min)`,
			font: { size: 16 },
		},
	};

	const config = {
		displayModeBar: true,
		displaylogo: false,
		modeBarButtonsToRemove: ["lasso2d", "select2d"] as any,
		responsive: true,
	};

	return (
		<div className={`h-full border rounded-lg bg-white ${className}`}>
			<div className="h-full p-4">
				{/* Event Information Header */}
				<div className="mb-4">
					<h4 className="font-medium text-gray-700 mb-2">
						Energy Consumption Pattern Analysis - Meter{" "}
						{selectedEvent.meterId}
					</h4>
					<div className="flex flex-wrap gap-4 text-sm text-gray-600">
						<div>
							<span className="font-medium">Event Time:</span>{" "}
							{new Date(selectedEvent.eventTimestamp)
								.toISOString()
								.replace("T", " ")
								.substring(0, 16)}
						</div>
						<div>
							<span className="font-medium">
								Analysis Window:
							</span>{" "}
							Periods before and after event
						</div>
						<div>
							<span className="font-medium">Detection Rule:</span>{" "}
							<span className="text-orange-600">
								{selectedEvent.detectionRule}
							</span>
						</div>
						{selectedEvent.score && (
							<div>
								<span className="font-medium">
									Anomaly Score:
								</span>{" "}
								<span className="text-red-600 font-semibold">
									{selectedEvent.score.toFixed(3)}
								</span>
							</div>
						)}
					</div>
				</div>

				{/* Plotly Chart */}
				<div className="h-[calc(100%-8rem)]">
					<Plot
						data={plotData}
						layout={layout}
						config={config}
						useResizeHandler={true}
						style={{ width: "100%", height: "100%" }}
					/>
				</div>
			</div>
		</div>
	);
}
