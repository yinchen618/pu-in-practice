"use client";

import { TrendingUp } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
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
	const [windowMinutes, setWindowMinutes] = useState<number>(10);
	const [dynamicWindow, setDynamicWindow] = useState<{
		timestamps: string[];
		values: number[];
	} | null>(null);
	const [loadingWindow, setLoadingWindow] = useState(false);
	// keep hooks order consistent; defer conditional rendering to end

	// Prepare chart data (base from event's dataWindow)
	const fullWindow = selectedEvent?.dataWindow || {
		timestamps: [],
		values: [],
	};
	const localWindow = useMemo(() => {
		if (!selectedEvent) return { timestamps: [], values: [] };
		if (!fullWindow.timestamps?.length || !fullWindow.values?.length) {
			return { timestamps: [], values: [] };
		}
		const ms = windowMinutes * 60 * 1000;
		const eventTimeMs = new Date(selectedEvent.eventTimestamp).getTime();
		const startMs = eventTimeMs - ms;
		const endMs = eventTimeMs + ms;
		const filteredX: string[] = [];
		const filteredY: number[] = [];
		for (let i = 0; i < fullWindow.timestamps.length; i += 1) {
			const tMs = new Date(fullWindow.timestamps[i]).getTime();
			if (tMs >= startMs && tMs <= endMs) {
				filteredX.push(fullWindow.timestamps[i]);
				filteredY.push(fullWindow.values[i]);
			}
		}
		return filteredX.length > 0
			? { timestamps: filteredX, values: filteredY }
			: { timestamps: fullWindow.timestamps, values: fullWindow.values };
	}, [
		selectedEvent?.eventTimestamp,
		fullWindow.timestamps,
		fullWindow.values,
		windowMinutes,
	]);

	const fetchRemoteWindow = useCallback(
		async (minutes: number) => {
			if (!selectedEvent) return;
			setLoadingWindow(true);
			try {
				const res = await fetch(
					`http://localhost:8000/api/v1/events/${selectedEvent.id}/window?minutes=${minutes}`,
				);
				if (res.ok) {
					const json = await res.json();
					const dw = json?.data?.dataWindow;
					if (
						dw &&
						Array.isArray(dw.timestamps) &&
						Array.isArray(dw.values)
					) {
						setDynamicWindow({
							timestamps: dw.timestamps,
							values: dw.values,
						});
					} else {
						setDynamicWindow(null);
					}
				}
			} catch {
				setDynamicWindow(null);
			} finally {
				setLoadingWindow(false);
			}
		},
		[selectedEvent],
	);

	useEffect(() => {
		setDynamicWindow(null);
		setWindowMinutes(10);
	}, [selectedEvent?.id]);

	useEffect(() => {
		if (!selectedEvent) return;
		// decide based on whether base fullWindow covers requested ±windowMinutes
		const ts = fullWindow.timestamps;
		let needRemote = false;
		if (!ts || ts.length === 0) {
			needRemote = true;
		} else {
			let minMs = Number.POSITIVE_INFINITY;
			let maxMs = Number.NEGATIVE_INFINITY;
			for (const t of ts) {
				const v = new Date(t).getTime();
				if (v < minMs) minMs = v;
				if (v > maxMs) maxMs = v;
			}
			const eventMs = new Date(selectedEvent.eventTimestamp).getTime();
			const rangeMs = windowMinutes * 60 * 1000;
			if (minMs > eventMs - rangeMs || maxMs < eventMs + rangeMs) {
				needRemote = true;
			}
		}
		if (needRemote) {
			void fetchRemoteWindow(windowMinutes);
		} else {
			setDynamicWindow(null);
		}
	}, [
		windowMinutes,
		selectedEvent?.id,
		fetchRemoteWindow,
		fullWindow.timestamps,
	]);

	const finalWindow = dynamicWindow ?? localWindow;
	const { timestamps, values } = finalWindow;

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
			x: selectedEvent ? [selectedEvent.eventTimestamp] : [],
			y: selectedEvent
				? [
						(() => {
							const tsMs = new Date(
								selectedEvent.eventTimestamp,
							).getTime();
							const idx = timestamps.findIndex(
								(t) => new Date(t).getTime() === tsMs,
							);
							if (idx >= 0) return values[idx] ?? 0;
							return (
								values[Math.floor(timestamps.length / 2)] || 0
							);
						})(),
					]
				: [],
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
			text: selectedEvent
				? (() => {
						const label =
							windowMinutes < 60
								? `±${windowMinutes} min`
								: `±${Math.round(windowMinutes / 60)} hr`;
						return `Event ${selectedEvent.id} - Time Series Analysis (${label})`;
					})()
				: "Time Series Analysis",
			font: { size: 16 },
		},
	};

	const config = {
		displayModeBar: true,
		displaylogo: false,
		modeBarButtonsToRemove: ["lasso2d", "select2d"] as any,
		responsive: true,
	};

	// Conditional rendering after hooks to maintain consistent hook order
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
					<div className="flex items-center gap-2 mb-2">
						<span className="text-sm text-gray-600">
							Analysis window:
						</span>
						<div className="flex gap-2">
							{[10, 30, 60, 180, 360].map((m) => (
								<button
									key={m}
									type="button"
									onClick={() => setWindowMinutes(m)}
									className={`px-2 py-1 text-xs rounded border ${
										windowMinutes === m
											? "bg-blue-600 text-white border-blue-600"
											: "bg-white text-gray-700 border-gray-300"
									}`}
								>
									{m < 60 ? `${m} mins` : `${m / 60} hrs`}
								</button>
							))}
						</div>
						{loadingWindow && (
							<span className="text-xs text-gray-500 ml-2">
								Loading window…
							</span>
						)}
					</div>
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
