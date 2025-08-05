"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MeterData } from "@/hooks/use-testbed-data";
import type { PlotlyAPI } from "@/types/plotly";
import { AlertCircle, BarChart3 } from "lucide-react";
import type { Config, Data, Layout } from "plotly.js-basic-dist";
import { useEffect, useRef, useState } from "react";

interface TimeSeriesChartProps {
	chartLoading: boolean;
	error: string | null;
	meterData: MeterData | null;
	selectedMeter: string;
}

export function TimeSeriesChart({
	chartLoading,
	error,
	meterData,
	selectedMeter,
}: TimeSeriesChartProps) {
	const plotRef = useRef<HTMLDivElement>(null);
	const [plotlyLoaded, setPlotlyLoaded] = useState(false);
	const [Plotly, setPlotly] = useState<PlotlyAPI | null>(null);

	// 在客戶端導入 Plotly
	useEffect(() => {
		if (typeof window !== "undefined" && !Plotly) {
			import("plotly.js-basic-dist")
				.then((module) => {
					setPlotly(module.default);
					setPlotlyLoaded(true);
				})
				.catch((err) => {
					console.error("Failed to load Plotly:", err);
				});
		}
	}, [Plotly]);

	useEffect(() => {
		if (!plotlyLoaded || !meterData || !plotRef.current) {
			console.log("Plotly chart not ready:", {
				plotlyLoaded,
				hasMeterData: !!meterData,
				hasPlotRef: !!plotRef.current,
			});
			return;
		}

		console.log("Rendering chart with data:", meterData);

		const timestamps = meterData.timeSeries?.map((d) => d.timestamp) || [];
		const powers = meterData.timeSeries?.map((d) => d.power) || [];

		// 識別異常值 (功率超過平均值 + 2 * 標準差)
		const avgPower = meterData.statistics.averagePower;
		const stdDev = Math.sqrt(
			powers.reduce((sum, p) => sum + (p - avgPower) ** 2, 0) /
				powers.length,
		);
		const threshold = avgPower + 2 * stdDev;

		const anomalyIndices = powers
			.map((power, index) => (power > threshold ? index : -1))
			.filter((index) => index !== -1);

		let traces: Data[] = [
			{
				x: timestamps,
				y: powers,
				type: "scatter",
				mode: "lines",
				name: `${selectedMeter === "main" ? "Main" : "Appliance"} Meter`,
				line: {
					color: "#3b82f6",
					width: 2,
				},
				hovertemplate:
					"<b>%{fullData.name}</b><br>" +
					"Time: %{x}<br>" +
					"Power: %{y:.1f}W<br>" +
					"<extra></extra>",
			},
		];

		// 添加異常點標記
		if (anomalyIndices.length > 0) {
			const anomalyTrace: Data = {
				x: anomalyIndices.map((i) => timestamps[i]),
				y: anomalyIndices.map((i) => powers[i]),
				type: "scatter",
				mode: "markers",
				name: "Anomalies",
				marker: {
					color: "#ef4444",
					size: 8,
					symbol: "diamond",
				},
				hovertemplate:
					"<b>Anomaly Detected</b><br>" +
					"Time: %{x}<br>" +
					"Power: %{y:.1f}W<br>" +
					"<extra></extra>",
			};
			traces = [...traces, anomalyTrace];
		}

		const layout: Partial<Layout> = {
			title: {
				text: `Power Consumption - ${
					selectedMeter === "main" ? "Main Meter" : "Appliance Meter"
				}`,
				font: { size: 16 },
			},
			xaxis: {
				title: { text: "Time" },
				type: "date" as const,
			},
			yaxis: {
				title: { text: "Power (W)" },
			},
			hovermode: "closest" as const,
			showlegend: true,
			legend: {
				x: 0,
				y: 1,
				bgcolor: "rgba(255,255,255,0.8)",
			},
			margin: { l: 60, r: 20, t: 60, b: 60 },
			height: 350,
		};

		const config: Partial<Config> = {
			responsive: true,
			displayModeBar: true,
			modeBarButtonsToRemove: [
				"lasso2d" as const,
				"select2d" as const,
				"toggleSpikelines" as const,
				"hoverClosestCartesian" as const,
				"hoverCompareCartesian" as const,
			],
			displaylogo: false,
		};

		Plotly?.newPlot(plotRef.current, traces, layout, config);

		// 清理函數
		return () => {
			if (plotRef.current && Plotly) {
				Plotly.purge(plotRef.current);
			}
		};
	}, [meterData, selectedMeter, Plotly, plotlyLoaded]);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<BarChart3 className="h-5 w-5" />
					Time Series Visualization
				</CardTitle>
			</CardHeader>
			<CardContent>
				{chartLoading ? (
					<div className="flex items-center justify-center h-96">
						<div className="text-center">
							<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto" />
							<p className="mt-4 text-slate-600">
								Loading meter data...
							</p>
						</div>
					</div>
				) : error ? (
					<div className="flex items-center justify-center h-96">
						<div className="text-center text-red-600">
							<AlertCircle className="h-12 w-12 mx-auto mb-4" />
							<p>{error}</p>
						</div>
					</div>
				) : meterData ? (
					<div>
						<div ref={plotRef} className="w-full" />
						<div className="mt-4 text-sm text-slate-600 space-y-1">
							<p>
								📊 Interactive chart with zoom/pan capabilities
								and anomaly detection
							</p>
							<p>
								🔍 Hover over data points for detailed
								information
							</p>
							<p>
								⚠️ Red diamonds indicate anomalous power
								consumption events
							</p>
							<p className="text-xs text-slate-500">
								Debug: Data points:{" "}
								{meterData.timeSeries?.length || 0}, Plotly
								loaded: {Plotly ? "Yes" : "No"}
							</p>
						</div>
					</div>
				) : (
					<div className="flex items-center justify-center h-96">
						<p className="text-slate-500">
							Select a unit and date range to view data
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
