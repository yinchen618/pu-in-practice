"use client";

import { Info, Target } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { Badge } from "../../../components/ui/badge";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../../../components/ui/card";
import { useCaseStudyData } from "../../../hooks/use-case-study-data";
import { DecisionPanel } from "./shared/DecisionPanel";
import { EventList } from "./shared/EventList";
import { StatsDashboard } from "./shared/StatsDashboard";
import { TimeSeriesChart } from "./shared/TimeSeriesChart";
import type { AnomalyEvent, AnomalyEventStats } from "./types";

interface FilterParams {
	startDate: Date;
	endDate: Date;
	zScoreThreshold: number;
	spikePercentage: number;
	minEventDuration: number;
	weekendHolidayDetection: boolean;
	maxTimeGap: number;
	peerAggWindow: number;
	peerExceedPercentage: number;
}

interface AnomalyLabelingSystemProps {
	candidateCount?: number;
	filterParams?: FilterParams;
	experimentRunId?: string;
	onLabelingProgress?: (positive: number, normal: number) => void;
}

export function AnomalyLabelingSystem({
	candidateCount = 0,
	filterParams,
	experimentRunId,
	onLabelingProgress,
}: AnomalyLabelingSystemProps) {
	const [selectedEvent, setSelectedEvent] = useState<AnomalyEvent | null>(
		null,
	);
	const [stats, setStats] = useState<AnomalyEventStats | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [currentFilters, setCurrentFilters] = useState({});
	const [chartLoading, setChartLoading] = useState(false);
	const [meterLabelMap, setMeterLabelMap] = useState<Record<string, string>>(
		{},
	);

	// use case study data hook
	const {
		events,
		eventsLoading,
		loadEvents,
		reviewEvent,
		loadStats,
		getEventDetail,
	} = useCaseStudyData();

	// handle event select
	const handleEventSelect = useCallback(
		async (event: AnomalyEvent) => {
			setSelectedEvent(event);
			setChartLoading(true);
			try {
				const full = await getEventDetail(event.id);
				setSelectedEvent(full);
			} finally {
				setChartLoading(false);
			}
		},
		[getEventDetail],
	);

	// handle stats update
	const handleStatsUpdate = useCallback((newStats: AnomalyEventStats) => {
		setStats(newStats);
	}, []);

	// handle label submit
	const handleLabelSubmit = useCallback(
		async (eventId: string, label: string, notes?: string) => {
			setIsSubmitting(true);
			try {
				await reviewEvent(eventId, {
					status: label,
					reviewerId: "demo-reviewer",
					justificationNotes: notes,
				});

				// 重新載入事件列表
				await loadEvents();

				// 更新選中的事件狀態
				if (selectedEvent?.id === eventId) {
					setSelectedEvent({
						...selectedEvent,
						status: label as
							| "CONFIRMED_POSITIVE"
							| "REJECTED_NORMAL"
							| "UNREVIEWED",
						justificationNotes: notes,
						reviewTimestamp: new Date().toISOString(),
						reviewerId: "demo-reviewer",
					});
				}
			} finally {
				setIsSubmitting(false);
			}
		},
		[reviewEvent, loadEvents, selectedEvent],
	);

	// handle filter changes
	const handleFiltersChange = useCallback(
		async (filters: any) => {
			const merged = experimentRunId
				? { ...filters, experimentRunId }
				: filters;
			setCurrentFilters(merged);
			await loadEvents(merged);
		},
		[loadEvents, experimentRunId],
	);

	// handle pagination
	const handlePageChange = useCallback(
		async (page: number) => {
			const merged = experimentRunId
				? { ...currentFilters, experimentRunId }
				: currentFilters;
			await loadEvents({ ...merged, page });
		},
		[loadEvents, currentFilters, experimentRunId],
	);

	// handle refresh
	const handleRefresh = useCallback(async () => {
		const merged = experimentRunId
			? { ...currentFilters, experimentRunId }
			: currentFilters;
		await loadEvents(merged);
		await loadStats(experimentRunId);
	}, [loadEvents, loadStats, currentFilters, experimentRunId]);

	// initial load; re-run when candidateCount changes
	useEffect(() => {
		const baseFilters = experimentRunId ? { experimentRunId } : {};
		if (candidateCount > 0) {
			setSelectedEvent(null);
			setStats(null);
			setTimeout(() => {
				setCurrentFilters(baseFilters);
				loadEvents(baseFilters as any);
				loadStats(experimentRunId);
			}, 1000);
		} else {
			setCurrentFilters(baseFilters);
			loadEvents(baseFilters as any);
			loadStats(experimentRunId);
		}
	}, [loadEvents, loadStats, candidateCount, experimentRunId]);

	// load meter label map (deviceNumber -> electricMeterName)
	useEffect(() => {
		async function loadAmmeterMap() {
			try {
				const res = await fetch("http://localhost:8000/api/ammeters", {
					method: "GET",
					headers: { "Content-Type": "application/json" },
				});
				if (!res.ok) return;
				const json = await res.json();
				if (json?.success && Array.isArray(json.data)) {
					const map: Record<string, string> = {};
					for (const item of json.data) {
						const info = item?.deviceInfo;
						if (info?.deviceNumber && info?.electricMeterName) {
							map[info.deviceNumber] =
								info.electricMeterName as string;
						}
					}
					setMeterLabelMap(map);
				}
			} catch {
				// ignore mapping errors
			}
		}

		loadAmmeterMap();
	}, []);

	// propagate stats & progress to parent
	useEffect(() => {
		if (events) {
			const statsData: AnomalyEventStats = {
				total: events.total,
				unreviewed: events.events.filter(
					(e) => e.status === "UNREVIEWED",
				).length,
				confirmed: events.events.filter(
					(e) => e.status === "CONFIRMED_POSITIVE",
				).length,
				rejected: events.events.filter(
					(e) => e.status === "REJECTED_NORMAL",
				).length,
				avgScore:
					events.events.reduce((sum, e) => sum + e.score, 0) /
						events.events.length || 0,
				maxScore: Math.max(...events.events.map((e) => e.score), 0),
				uniqueMeters: new Set(events.events.map((e) => e.meterId)).size,
			};
			setStats(statsData);

			// Update parent component with labeling progress
			if (onLabelingProgress) {
				onLabelingProgress(statsData.confirmed, statsData.rejected);
			}
		}
	}, [events, onLabelingProgress]);

	return (
		<div className="space-y-6">
			{/* Debug Panel removed as requested */}
			{/* System Introduction */}
			<div className="space-y-4">
				<div className="text-center">
					<h2 className="text-2xl font-bold text-gray-900 mb-2">
						Anomaly Event Labeling System
					</h2>
					<p className="text-gray-600 max-w-3xl mx-auto">
						This is a specialized labeling system designed for smart
						meter anomaly detection research. Researchers can review
						candidate anomaly events detected by algorithms and add
						labels to confirmed anomalies, creating high-quality
						training datasets for further machine learning research.
					</p>
				</div>

				<Alert>
					<Info className="size-4" />
					<AlertDescription>
						<strong>Workflow:</strong>
						1. Select events for review from the left panel → 2.
						View detailed time series analysis in the center → 3.
						Make review decisions and add labels on the right panel
					</AlertDescription>
				</Alert>

				{/* Candidate Data Information */}
				{candidateCount > 0 && (
					<Alert className="bg-blue-50 border-blue-200">
						<Target className="h-4 w-4 text-blue-600" />
						<AlertDescription>
							<strong>Candidate Data Source:</strong> This
							labeling system is working with{" "}
							<span className="font-semibold text-blue-700">
								{candidateCount.toLocaleString()}
							</span>{" "}
							candidate anomaly events identified from Stage 1
							multi-dimensional filtering.
							{filterParams && (
								<div className="mt-2 text-sm">
									<strong>Filter Configuration:</strong> Date
									range:{" "}
									{filterParams.startDate.toLocaleDateString()}{" "}
									-{" "}
									{filterParams.endDate.toLocaleDateString()},
									Z-Score threshold:{" "}
									{filterParams.zScoreThreshold}, Spike
									threshold: {filterParams.spikePercentage}%
								</div>
							)}
						</AlertDescription>
					</Alert>
				)}

				{/* Statistics Overview */}
				<StatsDashboard stats={stats} />
			</div>

			{/* Main Labeling Interface */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle className="text-lg">
							Anomaly Event Labeling Workbench
						</CardTitle>
						<div className="flex items-center gap-2">
							<Badge variant="outline">Real-time Data</Badge>
							<Badge variant="outline">Smart Labeling</Badge>
						</div>
					</div>
				</CardHeader>
				<CardContent className="p-0">
					<div className="h-[800px] flex">
						{/* Left: Anomaly Candidate Event List */}
						<div className="w-80 flex-shrink-0 p-4 border-r">
							<EventList
								events={events?.events || []}
								selectedEventId={selectedEvent?.id}
								isLoading={eventsLoading}
								onEventSelect={handleEventSelect}
								onRefresh={handleRefresh}
								showSearch={true}
								showStatusFilter={true}
								total={events?.total || 0}
								page={events?.page || 1}
								limit={events?.limit || 50}
								onPageChange={handlePageChange}
								onFiltersChange={handleFiltersChange}
								meterLabelMap={meterLabelMap}
							/>
						</div>

						{/* Center: Time Series Data Analysis */}
						<div className="flex-1 p-4">
							<TimeSeriesChart
								selectedEvent={selectedEvent}
								isLoading={chartLoading}
							/>
						</div>

						{/* Right: Review Decision Panel */}
						<div className="w-80 flex-shrink-0 p-4 border-l">
							<DecisionPanel
								selectedEvent={selectedEvent}
								onLabelSubmit={handleLabelSubmit}
								isSubmitting={isSubmitting}
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Technical Documentation */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">
						Technical Architecture Overview
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						<div>
							<h4 className="font-semibold text-gray-900 mb-2">
								Data Processing Pipeline
							</h4>
							<ul className="text-sm text-gray-600 space-y-1">
								<li>
									• Automated anomaly detection algorithms
								</li>
								<li>
									• Z-score and statistical deviation analysis
								</li>
								<li>• Time series pattern recognition</li>
								<li>• Candidate event auto-generation</li>
							</ul>
						</div>

						<div>
							<h4 className="font-semibold text-gray-900 mb-2">
								Labeling System Features
							</h4>
							<ul className="text-sm text-gray-600 space-y-1">
								<li>
									• Human-AI collaborative labeling interface
								</li>
								<li>
									• Multi-dimensional label classification
								</li>
								<li>• Review history tracking</li>
								<li>• Quality control mechanisms</li>
							</ul>
						</div>

						<div>
							<h4 className="font-semibold text-gray-900 mb-2">
								Research Application Value
							</h4>
							<ul className="text-sm text-gray-600 space-y-1">
								<li>• Training data quality improvement</li>
								<li>• PU Learning performance optimization</li>
								<li>• Domain knowledge integration</li>
								<li>• Explainability enhancement</li>
							</ul>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
