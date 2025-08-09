"use client";

import {
	ArrowRight,
	Calendar,
	Database,
	Filter,
	Info,
	Loader2,
	Play,
	Settings,
	Target,
	Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../../../components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import { Label } from "../../../components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../../components/ui/select";
import { Slider } from "../../../components/ui/slider";
import { AnomalyLabelingSystem } from "./AnomalyLabelingSystem";

type ViewMode = "overview" | "labeling";

interface FilterParams {
	// Top-level filter
	startDate: Date;
	endDate: Date;
	// Time (Taiwan timezone, default 00:00)
	startTime: string; // HH:MM
	endTime: string; // HH:MM

	// Value-based rules
	zScoreThreshold: number;
	spikePercentage: number;

	// Time-based rules
	minEventDuration: number;
	weekendHolidayDetection: boolean;

	// Data integrity rules
	maxTimeGap: number;

	// Peer comparison rules
	peerAggWindow: number;
	peerExceedPercentage: number;
}

export function DataExplorationPhase() {
	// temporary any cast for props compatibility
	const AnomalyLabelingSystemAny = AnomalyLabelingSystem as any;
	const [viewMode, setViewMode] = useState<ViewMode>("overview");
	const [candidateCount, setCandidateCount] = useState(0);
	const [candidateStats, setCandidateStats] = useState<any | null>(null);
	const [lastCalculatedParams, setLastCalculatedParams] =
		useState<FilterParams | null>(null);
	const [isCalculating, setIsCalculating] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);
	const [isInitialized, setIsInitialized] = useState(false);
	const [isLoadingRuns, setIsLoadingRuns] = useState(false);
	const [isCreatingRun, setIsCreatingRun] = useState(false);
	const [experimentRuns, setExperimentRuns] = useState<
		{ id: string; name: string; status: string }[]
	>([]);
	const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

	// Labeling progress state
	const [labeledPositive, setLabeledPositive] = useState(0);
	const [labeledNormal, setLabeledNormal] = useState(0);
	const [savedParams, setSavedParams] = useState<FilterParams | null>(null);

	// Filter parameters state
	const [filterParams, setFilterParams] = useState<FilterParams>({
		// Default date range: last 3 days for better performance with real data
		startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
		endDate: new Date(),
		startTime: "00:00",
		endTime: "00:00",

		// Value-based rules
		zScoreThreshold: 3.0,
		spikePercentage: 200,

		// Time-based rules
		minEventDuration: 30,
		weekendHolidayDetection: true,

		// Data integrity rules
		maxTimeGap: 60,

		// Peer comparison rules
		peerAggWindow: 5,
		peerExceedPercentage: 150,
	});

	// Device label map (deviceNumber -> room/electricMeterName)
	const [meterLabelMap, setMeterLabelMap] = useState<Record<string, string>>(
		{},
	);

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

	function pad2(n: number): string {
		return n < 10 ? `0${n}` : `${n}`;
	}

	function formatTaipeiISO(dateObj: Date, hhmm: string): string {
		const y = dateObj.getFullYear();
		const m = pad2(dateObj.getMonth() + 1);
		const d = pad2(dateObj.getDate());
		const time = hhmm && /^\d{2}:\d{2}$/.test(hhmm) ? hhmm : "00:00";
		return `${y}-${m}-${d}T${time}:00+08:00`;
	}

	// initialization
	useEffect(() => {
		setIsInitialized(true);
		// load experiment run list
		void (async () => {
			setIsLoadingRuns(true);
			try {
				const res = await fetch(
					"http://localhost:8000/api/v1/experiment-runs",
				);
				if (res.ok) {
					const json = await res.json();
					setExperimentRuns(json.data ?? []);
				}
			} catch (e) {
				console.error("Failed to load experiment runs", e);
			} finally {
				setIsLoadingRuns(false);
			}
		})();
	}, []);

	// manual control only

	// manual calculate handler
	const calculateCandidates = useCallback(async () => {
		if (isCalculating) {
			return;
		}

		setIsCalculating(true);
		try {
			const response = await fetch(
				"http://localhost:8000/api/v1/candidates/calculate",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						start_date: filterParams.startDate
							.toISOString()
							.split("T")[0],
						end_date: filterParams.endDate
							.toISOString()
							.split("T")[0],
						start_datetime: formatTaipeiISO(
							filterParams.startDate,
							filterParams.startTime,
						),
						end_datetime: formatTaipeiISO(
							filterParams.endDate,
							filterParams.endTime,
						),
						z_score_threshold: filterParams.zScoreThreshold,
						spike_percentage: filterParams.spikePercentage,
						min_event_duration_minutes:
							filterParams.minEventDuration,
						detect_holiday_pattern:
							filterParams.weekendHolidayDetection,
						max_time_gap_minutes: filterParams.maxTimeGap,
						peer_agg_window_minutes: filterParams.peerAggWindow,
						peer_exceed_percentage:
							filterParams.peerExceedPercentage,
					}),
				},
			);

			if (response.ok) {
				const data = await response.json();
				setCandidateCount(data.candidate_count || 0);
				setCandidateStats(
					data.stats || data.processing_details || null,
				);
				setLastCalculatedParams({ ...filterParams });
			} else {
				console.error("Failed to calculate candidates");
				setCandidateCount(0);
				setCandidateStats(null);
				setLastCalculatedParams(null);
			}
		} catch (error) {
			console.error("Error calculating candidates:", error);
			setCandidateCount(0);
		} finally {
			setIsCalculating(false);
		}
	}, [
		filterParams.startDate,
		filterParams.endDate,
		filterParams.zScoreThreshold,
		filterParams.spikePercentage,
		filterParams.minEventDuration,
		filterParams.weekendHolidayDetection,
		filterParams.maxTimeGap,
		filterParams.peerAggWindow,
		filterParams.peerExceedPercentage,
		// keep deps minimal
	]);

	// no auto calc hook

	const updateFilterParam = <K extends keyof FilterParams>(
		key: K,
		value: FilterParams[K],
	) => {
		setFilterParams((prev) => ({
			...prev,
			[key]: value,
		}));
	};

	// backfill params upon run selection
	useEffect(() => {
		if (!selectedRunId) return;
		void (async () => {
			try {
				const res = await fetch(
					`http://localhost:8000/api/v1/experiment-runs/${selectedRunId}`,
				);
				if (!res.ok) return;
				const json = await res.json();
				const params = json?.data?.filteringParameters as Record<
					string,
					any
				> | null;
				// update live labeled counts
				const pos = json?.data?.positiveLabelCount ?? 0;
				const neg = json?.data?.negativeLabelCount ?? 0;
				setLabeledPositive(pos);
				setLabeledNormal(neg);
				// 更新當前資料集的候選數量（若後端有提供）
				if (typeof json?.data?.candidateCount === "number") {
					setCandidateCount(json.data.candidateCount);
				}
				if (params) {
					const parsed: FilterParams = {
						startDate: new Date(params.start_date),
						endDate: new Date(params.end_date),
						zScoreThreshold: params.z_score_threshold ?? 3.0,
						spikePercentage: params.spike_percentage ?? 200,
						minEventDuration:
							params.min_event_duration_minutes ?? 30,
						weekendHolidayDetection:
							params.detect_holiday_pattern ?? true,
						maxTimeGap: params.max_time_gap_minutes ?? 60,
						peerAggWindow: params.peer_agg_window_minutes ?? 5,
						peerExceedPercentage:
							params.peer_exceed_percentage ?? 150,
					};
					setFilterParams(parsed);
					setSavedParams(parsed);
				}
			} catch (e) {
				console.error("Failed to load experiment run parameters", e);
			}
		})();
	}, [selectedRunId]);

	// save parameters to selected dataset
	const saveCurrentParameters = useCallback(async () => {
		if (!selectedRunId) {
			alert("Please select or create a dataset first");
			return;
		}
		const payload = {
			filtering_parameters: {
				start_date: filterParams.startDate.toISOString().split("T")[0],
				end_date: filterParams.endDate.toISOString().split("T")[0],
				start_datetime: formatTaipeiISO(
					filterParams.startDate,
					filterParams.startTime,
				),
				end_datetime: formatTaipeiISO(
					filterParams.endDate,
					filterParams.endTime,
				),
				z_score_threshold: filterParams.zScoreThreshold,
				spike_percentage: filterParams.spikePercentage,
				min_event_duration_minutes: filterParams.minEventDuration,
				detect_holiday_pattern: filterParams.weekendHolidayDetection,
				max_time_gap_minutes: filterParams.maxTimeGap,
				peer_agg_window_minutes: filterParams.peerAggWindow,
				peer_exceed_percentage: filterParams.peerExceedPercentage,
			},
		};
		try {
			const res = await fetch(
				`http://localhost:8000/api/v1/experiment-runs/${selectedRunId}/parameters`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				},
			);
			if (!res.ok) {
				alert("Failed to save parameters");
				return;
			}
			const json = await res.json();
			// 回填標記數
			setLabeledPositive(json?.data?.positiveLabelCount ?? 0);
			setLabeledNormal(json?.data?.negativeLabelCount ?? 0);
			// 將目前表單作為已儲存基準，清空 Pending Changes
			setSavedParams(filterParams);
		} catch (e) {
			console.error("Failed to save parameters", e);
			alert("An error occurred while saving parameters");
		}
	}, [selectedRunId, filterParams]);

	async function createNewExperimentRun() {
		setIsCreatingRun(true);
		try {
			const now = new Date();
			const name = `Dataset ${now.toISOString().replace("T", " ").slice(0, 16)}`;
			const res = await fetch(
				"http://localhost:8000/api/v1/experiment-runs",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ name }),
				},
			);
			if (res.ok) {
				const json = await res.json();
				const run = json.data;
				setExperimentRuns((prev) => [run, ...prev]);
				setSelectedRunId(run.id);
				// When creating a new run, treat current form as saved baseline
				setSavedParams(filterParams);
			} else {
				alert("Failed to create dataset. Please try again.");
			}
		} catch (e) {
			console.error("Failed to create dataset", e);
			alert("An error occurred while creating dataset");
		} finally {
			setIsCreatingRun(false);
		}
	}

	// generate candidates
	const generateCandidateEvents = useCallback(async () => {
		if (isGenerating || candidateCount === 0) {
			return;
		}
		if (!selectedRunId) {
			alert("Please select or create a dataset first");
			return;
		}

		setIsGenerating(true);
		try {
			const payload = {
				filtering_parameters: {
					start_date: filterParams.startDate
						.toISOString()
						.split("T")[0],
					end_date: filterParams.endDate.toISOString().split("T")[0],
					start_datetime: formatTaipeiISO(
						filterParams.startDate,
						filterParams.startTime,
					),
					end_datetime: formatTaipeiISO(
						filterParams.endDate,
						filterParams.endTime,
					),
					z_score_threshold: filterParams.zScoreThreshold,
					spike_percentage: filterParams.spikePercentage,
					min_event_duration_minutes: filterParams.minEventDuration,
					detect_holiday_pattern:
						filterParams.weekendHolidayDetection,
					max_time_gap_minutes: filterParams.maxTimeGap,
					peer_agg_window_minutes: filterParams.peerAggWindow,
					peer_exceed_percentage: filterParams.peerExceedPercentage,
				},
			};

			const response = await fetch(
				`http://localhost:8000/api/v1/experiment-runs/${selectedRunId}/candidates/generate?allow_overwrite=true`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(payload),
				},
			);

			if (response.ok) {
				const data = await response.json();
				console.log("Candidate generation task started:", data);

				// poll status until completion
				const taskId: string = data.task_id;
				let finished = false;
				while (!finished) {
					await new Promise((r) => setTimeout(r, 1500));
					const statusRes = await fetch(
						`http://localhost:8000/api/v1/experiment-runs/${selectedRunId}/candidates/status/${taskId}`,
					);
					if (!statusRes.ok) continue;
					const statusJson = await statusRes.json();
					if (statusJson.status === "completed") {
						const total = statusJson.result?.total_candidates ?? 0;
						setCandidateCount(total);
						finished = true;
					} else if (statusJson.status === "failed") {
						alert(
							`Generation failed: ${statusJson.error || "Please try again later"}`,
						);
						finished = true;
					}
				}

				setViewMode("labeling");
			} else {
				console.error("Failed to generate candidate events");
				alert("Failed to generate candidate events. Please try again.");
			}
		} catch (error) {
			console.error("Error generating candidate events:", error);
			alert(
				"An error occurred while generating candidate events. Please try again.",
			);
		} finally {
			setIsGenerating(false);
		}
	}, [filterParams, candidateCount, isGenerating, selectedRunId]);

	// rename dataset
	const renameCurrentRun = useCallback(async () => {
		if (!selectedRunId) return;
		const newName = prompt("Rename dataset", "");
		if (!newName) return;
		try {
			const res = await fetch(
				`http://localhost:8000/api/v1/experiment-runs/${selectedRunId}`,
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ name: newName }),
				},
			);
			if (!res.ok) {
				alert("Failed to rename dataset");
				return;
			}
			const json = await res.json();
			const updated = json.data;
			setExperimentRuns((prev) =>
				prev.map((r) =>
					r.id === updated.id ? { ...r, name: updated.name } : r,
				),
			);
		} catch (e) {
			console.error("Failed to rename dataset", e);
			alert("An error occurred while renaming dataset");
		}
	}, [selectedRunId]);

	// delete dataset
	const deleteCurrentRun = useCallback(async () => {
		if (!selectedRunId) return;
		const ok = confirm("Delete this dataset? This cannot be undone.");
		if (!ok) return;
		try {
			const res = await fetch(
				`http://localhost:8000/api/v1/experiment-runs/${selectedRunId}`,
				{
					method: "DELETE",
				},
			);
			if (!res.ok) {
				alert("Failed to delete dataset");
				return;
			}
			setExperimentRuns((prev) =>
				prev.filter((r) => r.id !== selectedRunId),
			);
			setSelectedRunId(null);
			setSavedParams(null);
			setCandidateCount(0);
			setLabeledPositive(0);
			setLabeledNormal(0);
		} catch (e) {
			console.error("Failed to delete dataset", e);
			alert("An error occurred while deleting dataset");
		}
	}, [selectedRunId]);

	// Build diffs between savedParams (baseline) and current form state
	function formatParamValue(key: keyof FilterParams, value: any): string {
		switch (key) {
			case "startDate":
			case "endDate":
				return (value as Date).toLocaleDateString();
			case "spikePercentage":
			case "peerExceedPercentage":
				return `${value}%`;
			case "minEventDuration":
			case "maxTimeGap":
			case "peerAggWindow":
				return `${value} minutes`;
			case "weekendHolidayDetection":
				return value ? "Enabled" : "Disabled";
			default:
				return String(value);
		}
	}

	const paramLabels: Record<keyof FilterParams, string> = {
		startDate: "Start Date",
		endDate: "End Date",
		zScoreThreshold: "Z-Score Threshold",
		spikePercentage: "Spike Threshold",
		minEventDuration: "Min Event Duration",
		weekendHolidayDetection: "Weekend/Holiday Detection",
		maxTimeGap: "Max Time Gap",
		peerAggWindow: "Peer Aggregation Window",
		peerExceedPercentage: "Peer Exceed Threshold",
	};

	const pendingDiffs = (() => {
		if (!savedParams)
			return [] as { label: string; from: string; to: string }[];
		const diffs: { label: string; from: string; to: string }[] = [];
		(Object.keys(paramLabels) as (keyof FilterParams)[]).forEach((k) => {
			const a = savedParams[k];
			const b = filterParams[k];
			const isDate = k === "startDate" || k === "endDate";
			const changed = isDate
				? (a as Date).getTime() !== (b as Date).getTime()
				: a !== b;
			if (changed) {
				diffs.push({
					label: paramLabels[k],
					from: formatParamValue(k, a),
					to: formatParamValue(k, b),
				});
			}
		});
		return diffs;
	})();
	return (
		<div className="space-y-6">
			{/* Top Tabs for Stage 1 / Stage 2 */}
			<div className="flex items-center gap-2 border-b">
				<button
					type="button"
					onClick={() => setViewMode("overview")}
					className={`px-4 py-2 -mb-px border-b-2 ${
						viewMode === "overview"
							? "border-blue-600 text-blue-700"
							: "border-transparent text-gray-600 hover:text-gray-800"
					}`}
				>
					Stage 1
				</button>
				<button
					type="button"
					onClick={() => setViewMode("labeling")}
					className={`px-4 py-2 -mb-px border-b-2 ${
						viewMode === "labeling"
							? "border-purple-600 text-purple-700"
							: "border-transparent text-gray-600 hover:text-gray-800"
					}`}
				>
					Stage 2
				</button>
			</div>
			{viewMode === "overview" ? (
				<>
					{/* Page Header */}
					<Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
						<CardHeader>
							<CardTitle className="flex items-center text-2xl text-blue-900">
								<Database className="h-6 w-6 mr-3" />
								Data Exploration & Labeling
							</CardTitle>
							<p className="text-blue-700 mt-2">
								Execute the two-stage funnel labeling approach
								to generate high-quality positive samples for
								model training
							</p>
						</CardHeader>
					</Card>

					{/* Stage 1: Automated Candidate Generation */}
					<Card className="border-orange-200">
						<CardHeader>
							<CardTitle className="flex items-center text-xl text-orange-800">
								<Filter className="h-5 w-5 mr-2" />
								Stage 1: Automated Candidate Generation
							</CardTitle>
							<p className="text-orange-600 text-sm">
								Apply multi-dimensional filtering rules to
								extract candidate anomaly events from massive
								raw data
							</p>
						</CardHeader>
						<CardContent className="space-y-6">
							{/* Dataset (Experiment Run) Selection */}
							<div className="bg-indigo-50 p-4 rounded-lg border-l-4 border-indigo-400">
								<h4 className="font-semibold text-indigo-800 mb-3">
									Dataset (Experiment Run)
								</h4>
								<div className="flex flex-col md:flex-row gap-3 md:items-center">
									<div className="w-full md:w-80">
										<Select
											value={selectedRunId ?? ""}
											onValueChange={(val) =>
												setSelectedRunId(val || null)
											}
										>
											<SelectTrigger>
												<SelectValue
													placeholder={
														isLoadingRuns
															? "Loading datasets..."
															: "Select dataset"
													}
												/>
											</SelectTrigger>
											<SelectContent>
												{experimentRuns.map((r) => (
													<SelectItem
														key={r.id}
														value={r.id}
													>
														{r.name} ({r.status})
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="outline"
												disabled={isLoadingRuns}
												className="gap-2"
											>
												Manage dataset
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent>
											<DropdownMenuItem
												onClick={createNewExperimentRun}
												disabled={isCreatingRun}
											>
												{isCreatingRun ? (
													<span className="flex items-center gap-2">
														<Loader2 className="h-4 w-4 animate-spin" />
														Creating...
													</span>
												) : (
													<span>Create dataset</span>
												)}
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={saveCurrentParameters}
												disabled={!selectedRunId}
											>
												Save parameters
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											<DropdownMenuItem
												onClick={renameCurrentRun}
												disabled={!selectedRunId}
											>
												Rename dataset...
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={deleteCurrentRun}
												disabled={!selectedRunId}
												className="text-red-600"
											>
												Delete dataset...
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
								{selectedRunId && (
									<div className="mt-3 text-sm text-indigo-900 grid md:grid-cols-2 gap-3">
										<div className="space-y-1">
											<div className="font-medium">
												Current Dataset Parameters
											</div>
											<div>
												日期:{" "}
												{filterParams.startDate.toLocaleDateString()}{" "}
												-{" "}
												{filterParams.endDate.toLocaleDateString()}
											</div>
											<div>
												Z-Score:{" "}
												{filterParams.zScoreThreshold},
												Spike:{" "}
												{filterParams.spikePercentage}%
											</div>
											<div>
												Duration:{" "}
												{filterParams.minEventDuration}{" "}
												minutes, Gap:{" "}
												{filterParams.maxTimeGap}{" "}
												minutes
											</div>
										</div>
										<div className="space-y-1">
											<div className="font-medium">
												Labeled Statistics
											</div>
											<div>
												Confirmed: {labeledPositive}
											</div>
											<div>Rejected: {labeledNormal}</div>
										</div>
									</div>
								)}
								{pendingDiffs.length > 0 && (
									<Alert className="mt-4 bg-yellow-50 border-yellow-200">
										<Info className="h-4 w-4 text-yellow-600" />
										<AlertDescription>
											<strong className="text-yellow-800">
												Pending Changes (not saved):
											</strong>
											<ul className="list-disc list-inside mt-1 text-yellow-700">
												{pendingDiffs.map(
													(diff, index) => (
														<li key={index}>
															{diff.label}:{" "}
															{diff.from}{" "}
															<span className="mx-1">
																→
															</span>{" "}
															{diff.to}
														</li>
													),
												)}
											</ul>
											<Button
												onClick={saveCurrentParameters}
												size="sm"
												className="mt-2 bg-yellow-600 hover:bg-yellow-700 text-white"
											>
												Save Pending Changes
											</Button>
										</AlertDescription>
									</Alert>
								)}
							</div>
							{/* Top-Level Date/Time Range Filter */}
							<div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
								<h4 className="font-semibold text-blue-800 mb-3 flex items-center">
									<Calendar className="h-4 w-4 mr-2" />
									Primary Time Range Filter
								</h4>
								<p className="text-blue-700 text-sm mb-4">
									Set the analysis time window to limit
									computational scope and enable focused
									analysis
								</p>
								<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
									<div className="space-y-2">
										<Label className="text-sm font-medium text-blue-800">
											Start Date
										</Label>
										<input
											type="date"
											value={
												filterParams.startDate
													.toISOString()
													.split("T")[0]
											}
											onChange={(e) =>
												updateFilterParam(
													"startDate",
													new Date(e.target.value),
												)
											}
											className="w-full px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
										/>
									</div>
									<div className="space-y-2">
										<Label className="text-sm font-medium text-blue-800">
											Start Time (TW)
										</Label>
										<input
											type="time"
											value={filterParams.startTime}
											onChange={(e) =>
												updateFilterParam(
													"startTime",
													e.target.value,
												)
											}
											className="w-full px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
										/>
									</div>
									<div className="space-y-2">
										<Label className="text-sm font-medium text-blue-800">
											End Date
										</Label>
										<input
											type="date"
											value={
												filterParams.endDate
													.toISOString()
													.split("T")[0]
											}
											onChange={(e) =>
												updateFilterParam(
													"endDate",
													new Date(e.target.value),
												)
											}
											className="w-full px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
										/>
									</div>
									<div className="space-y-2">
										<Label className="text-sm font-medium text-blue-800">
											End Time (TW)
										</Label>
										<input
											type="time"
											value={filterParams.endTime}
											onChange={(e) =>
												updateFilterParam(
													"endTime",
													e.target.value,
												)
											}
											className="w-full px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
										/>
									</div>
								</div>
							</div>

							{/* Filtering Rules Configuration */}
							<div className="bg-orange-50 p-4 rounded-lg">
								<h4 className="font-semibold text-orange-800 mb-4 flex items-center">
									<Settings className="h-4 w-4 mr-2" />
									Multi-Dimensional Filtering Rules
								</h4>

								{/* A. Value-based Rules */}
								<div className="mb-6">
									<h5 className="font-medium text-orange-700 mb-3">
										A. Value-based Anomaly Rules
									</h5>
									<p className="text-sm text-orange-600 mb-3">
										Focus on numerical value anomalies such
										as sudden power consumption spikes
									</p>
									<div className="grid md:grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label className="text-sm font-medium">
												Z-Score Threshold:{" "}
												{filterParams.zScoreThreshold}
											</Label>
											<Slider
												min={0}
												max={5.0}
												step={0.1}
												value={[
													filterParams.zScoreThreshold,
												]}
												onValueChange={(value) =>
													updateFilterParam(
														"zScoreThreshold",
														value[0],
													)
												}
												className="w-full"
											/>
											<p className="text-xs text-gray-600">
												Individual comparison - detect
												values far from historical
												average
											</p>
										</div>
										<div className="space-y-2">
											<Label className="text-sm font-medium">
												Spike Threshold:{" "}
												{filterParams.spikePercentage}%
												of baseline
											</Label>
											<Slider
												min={0}
												max={500}
												step={25}
												value={[
													filterParams.spikePercentage,
												]}
												onValueChange={(value) =>
													updateFilterParam(
														"spikePercentage",
														value[0],
													)
												}
												className="w-full"
											/>
											<p className="text-xs text-gray-600">
												Sudden consumption spike
												detection
											</p>
										</div>
									</div>
								</div>

								{/* B. Time-based Rules */}
								<div className="mb-6">
									<h5 className="font-medium text-orange-700 mb-3">
										B. Time-based Anomaly Rules
									</h5>
									<p className="text-sm text-orange-600 mb-3">
										Focus on temporal pattern anomalies
									</p>
									<div className="grid md:grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label className="text-sm font-medium">
												Min Event Duration:{" "}
												{filterParams.minEventDuration}{" "}
												minutes
											</Label>
											<Slider
												min={0}
												max={120}
												step={15}
												value={[
													filterParams.minEventDuration,
												]}
												onValueChange={(value) =>
													updateFilterParam(
														"minEventDuration",
														value[0],
													)
												}
												className="w-full"
											/>
											<p className="text-xs text-gray-600">
												Capture events with excessive
												duration
											</p>
										</div>
										<div className="space-y-2">
											<Label className="text-sm font-medium">
												Weekend/Holiday Pattern
												Detection
											</Label>
											<div className="flex items-center space-x-2">
												<input
													type="checkbox"
													checked={
														filterParams.weekendHolidayDetection
													}
													onChange={(e) =>
														updateFilterParam(
															"weekendHolidayDetection",
															e.target.checked,
														)
													}
													className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
												/>
												<span className="text-sm text-gray-700">
													{filterParams.weekendHolidayDetection
														? "Enabled"
														: "Disabled"}
												</span>
											</div>
											<p className="text-xs text-gray-600">
												Detect activity during
												unexpected times
											</p>
										</div>
									</div>
								</div>

								{/* C. Data Integrity Rules */}
								<div className="mb-6">
									<h5 className="font-medium text-orange-700 mb-3">
										C. Data Integrity Rules (New)
									</h5>
									<p className="text-sm text-orange-600 mb-3">
										Focus on data continuity anomalies,
										capturing communication failures or
										power outages
									</p>
									<div className="space-y-2">
										<Label className="text-sm font-medium">
											Max Time Gap Between Records:{" "}
											{filterParams.maxTimeGap} minutes
										</Label>
										<Slider
											min={0}
											max={180}
											step={15}
											value={[filterParams.maxTimeGap]}
											onValueChange={(value) =>
												updateFilterParam(
													"maxTimeGap",
													value[0],
												)
											}
											className="w-full"
										/>
										<p className="text-xs text-gray-600">
											Identify excessive gaps between data
											records
										</p>
									</div>
								</div>

								{/* D. Peer Comparison Rules */}
								<div className="mb-6">
									<h5 className="font-medium text-orange-700 mb-3">
										D. Peer Comparison Rules (New)
									</h5>
									<p className="text-sm text-orange-600 mb-3">
										Focus on group-based comparisons to find
										user behavior anomalies relative to peer
										groups
									</p>
									<div className="grid md:grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label className="text-sm font-medium">
												Aggregation Window:{" "}
												{filterParams.peerAggWindow}{" "}
												minutes
											</Label>
											<Slider
												min={0}
												max={60}
												step={5}
												value={[
													filterParams.peerAggWindow,
												]}
												onValueChange={(value) =>
													updateFilterParam(
														"peerAggWindow",
														value[0],
													)
												}
												className="w-full"
											/>
											<p className="text-xs text-gray-600">
												Time window for calculating
												average consumption
											</p>
										</div>
										<div className="space-y-2">
											<Label className="text-sm font-medium">
												Peer Exceed Threshold:{" "}
												{
													filterParams.peerExceedPercentage
												}
												% above peer average
											</Label>
											<Slider
												min={0}
												max={300}
												step={10}
												value={[
													filterParams.peerExceedPercentage,
												]}
												onValueChange={(value) =>
													updateFilterParam(
														"peerExceedPercentage",
														value[0],
													)
												}
												className="w-full"
											/>
											<p className="text-xs text-gray-600">
												Threshold for triggering peer
												comparison anomaly
											</p>
										</div>
									</div>
								</div>
							</div>

							{/* Results Summary */}
							<Card className="bg-green-50 border-green-200">
								<CardContent className="p-6">
									<div className="flex items-center justify-between">
										<div>
											<h4 className="text-lg font-bold text-green-800 mb-2">
												Stage 1 Results
											</h4>
											<p className="text-green-700">
												Based on the above rules and
												date range, the system will
												filter{" "}
												<Badge
													variant="secondary"
													className="mx-1 bg-green-100 text-green-800"
												>
													{isCalculating ? (
														<span className="flex items-center gap-1">
															<Loader2 className="h-3 w-3 animate-spin" />
															Calculating...
														</span>
													) : (
														candidateCount.toLocaleString()
													)}
												</Badge>
												candidate events from the
												specified data range.
											</p>
											{/* 搜尋條件（使用最近一次計算的參數快照） */}
											{lastCalculatedParams &&
												!isCalculating && (
													<div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-green-900">
														<div className="space-y-1 p-3 rounded-md bg-green-50 border border-green-200">
															<div className="font-medium">
																Search
																Conditions
															</div>
															<div>
																Time (TW):{" "}
																{
																	lastCalculatedParams.startTime
																}{" "}
																-{" "}
																{
																	lastCalculatedParams.endTime
																}
															</div>
															<div>
																Date:{" "}
																{lastCalculatedParams.startDate.toLocaleDateString()}{" "}
																-{" "}
																{lastCalculatedParams.endDate.toLocaleDateString()}
															</div>
															<div>
																Z-Score:{" "}
																{
																	lastCalculatedParams.zScoreThreshold
																}
															</div>
															<div>
																Spike:{" "}
																{
																	lastCalculatedParams.spikePercentage
																}
																%
															</div>
															<div>
																Min duration:{" "}
																{
																	lastCalculatedParams.minEventDuration
																}{" "}
																minutes
															</div>
															<div>
																Weekend/Holiday:{" "}
																{lastCalculatedParams.weekendHolidayDetection
																	? "Enabled"
																	: "Disabled"}
															</div>
															<div>
																Max time gap:{" "}
																{
																	lastCalculatedParams.maxTimeGap
																}{" "}
																minutes
															</div>
															<div>
																Peer window:{" "}
																{
																	lastCalculatedParams.peerAggWindow
																}{" "}
																minutes
															</div>
															<div>
																Peer exceed:{" "}
																{
																	lastCalculatedParams.peerExceedPercentage
																}
																%
															</div>
														</div>
													</div>
												)}
											{candidateStats &&
												!isCalculating && (
													<div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-green-900">
														<div className="space-y-1 p-3 rounded-md bg-green-50 border border-green-200">
															<div className="font-medium">
																Data Overview
															</div>
															<div>
																Total records:{" "}
																{candidateStats.total_records?.toLocaleString?.() ??
																	candidateStats
																		.data_range
																		?.total_records ??
																	"-"}
															</div>
															<div>
																Devices:{" "}
																{candidateStats.unique_devices ??
																	"-"}
															</div>
															{typeof candidateStats.insufficient_data_devices ===
																"number" && (
																<div>
																	Devices
																	skipped
																	(insufficient
																	data):{" "}
																	{
																		candidateStats.insufficient_data_devices
																	}
																</div>
															)}
															{candidateStats
																.time_range
																?.start && (
																<div>
																	Range:{" "}
																	{new Date(
																		candidateStats
																			.time_range
																			.start,
																	).toLocaleString()}{" "}
																	-{" "}
																	{new Date(
																		candidateStats
																			.time_range
																			.end,
																	).toLocaleString()}
																</div>
															)}
															{Array.isArray(
																candidateStats.records_by_date,
															) &&
																candidateStats
																	.records_by_date
																	.length >
																	0 && (
																	<div className="pt-2">
																		<div className="font-medium mb-1">
																			Records
																			by
																			Day
																		</div>
																		<ul className="list-disc list-inside max-h-40 overflow-auto">
																			{candidateStats.records_by_date.map(
																				(
																					r: any,
																				) => (
																					<li
																						key={
																							r.date
																						}
																					>
																						{
																							r.date
																						}
																						:{" "}
																						{
																							r.count
																						}
																					</li>
																				),
																			)}
																		</ul>
																	</div>
																)}
														</div>
														<div className="space-y-1 p-3 rounded-md bg-green-50 border border-green-200">
															<div className="font-medium">
																Rule
																Contributions
															</div>
															<div>
																Z-Score:{" "}
																{candidateStats
																	.per_rule
																	?.zscore_estimate ??
																	"-"}
															</div>
															<div>
																Spike:{" "}
																{candidateStats
																	.per_rule
																	?.spike_estimate ??
																	"-"}
															</div>
															<div>
																Time:{" "}
																{candidateStats
																	.per_rule
																	?.time_estimate ??
																	"-"}
															</div>
															<div>
																Gap:{" "}
																{candidateStats
																	.per_rule
																	?.gap_estimate ??
																	"-"}
															</div>
															<div>
																Peer:{" "}
																{candidateStats
																	.per_rule
																	?.peer_estimate ??
																	"-"}
															</div>
														</div>
														<div className="space-y-1 p-3 rounded-md bg-green-50 border border-green-200">
															<div className="font-medium">
																Estimation
																Summary
															</div>
															<div>
																Before overlap:{" "}
																{candidateStats.total_estimated_before_overlap ??
																	"-"}
															</div>
															<div>
																Overlap factor:{" "}
																{candidateStats.overlap_reduction_factor ??
																	"-"}
															</div>
															<div>
																Adjusted total:{" "}
																{candidateStats.overlap_adjusted_total ??
																	"-"}
															</div>
														</div>
														{Array.isArray(
															candidateStats.top_devices_by_estimated_anomalies,
														) &&
															candidateStats
																.top_devices_by_estimated_anomalies
																.length > 0 && (
																<div className="md:col-span-3 p-3 rounded-md bg-green-50 border border-green-200">
																	<div className="font-medium mb-1">
																		Top
																		devices
																		by
																		estimated
																		anomalies
																	</div>
																	<ul className="list-disc list-inside">
																		{candidateStats.top_devices_by_estimated_anomalies.map(
																			(
																				d: any,
																			) => (
																				<li
																					key={
																						d.deviceNumber
																					}
																				>
																					Device{" "}
																					{
																						d.deviceNumber
																					}
																					{meterLabelMap[
																						d
																							.deviceNumber
																					]
																						? ` (${meterLabelMap[d.deviceNumber]})`
																						: ""}
																					:{" "}
																					{
																						d.estimated_anomalies
																					}
																				</li>
																			),
																		)}
																	</ul>
																</div>
															)}
													</div>
												)}
											{/* 手動計算按鈕 */}
											<div className="mt-3">
												<Button
													onClick={() =>
														calculateCandidates()
													}
													disabled={isCalculating}
													size="sm"
													variant="outline"
													className="text-green-700 border-green-300 hover:bg-green-100"
												>
													{isCalculating ? (
														<>
															<Loader2 className="h-4 w-4 mr-2 animate-spin" />
															Calculating...
														</>
													) : (
														<>
															<Play className="h-4 w-4 mr-2" />
															Calculate Candidates
														</>
													)}
												</Button>
											</div>
										</div>
										<div className="text-right">
											<div className="text-3xl font-bold text-green-600">
												{isCalculating ? (
													<Loader2 className="h-8 w-8 animate-spin mx-auto" />
												) : (
													candidateCount.toLocaleString()
												)}
											</div>
											<div className="text-sm text-green-600">
												Candidates
											</div>
										</div>
									</div>
								</CardContent>
							</Card>

							{/* Progress to Stage 2 */}
							<div className="flex justify-center pt-4">
								<Button
									onClick={generateCandidateEvents}
									size="lg"
									disabled={
										isGenerating || candidateCount === 0
									}
									className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
								>
									{isGenerating ? (
										<>
											<Loader2 className="h-5 w-5 mr-2 animate-spin" />
											Generating Events...
										</>
									) : (
										<>
											<ArrowRight className="h-5 w-5 mr-2" />
											Proceed to Manual Verification &
											Labeling
										</>
									)}
								</Button>
							</div>
						</CardContent>
					</Card>

					{/* Stage 2 Preview */}
					<Card className="border-purple-200">
						<CardHeader>
							<CardTitle className="flex items-center text-xl text-purple-800">
								<Users className="h-5 w-5 mr-2" />
								Stage 2: Expert Manual Verification & Labeling
							</CardTitle>
							<p className="text-purple-600 text-sm">
								Manual review and annotation of candidate events
								by domain experts
							</p>
						</CardHeader>
						<CardContent>
							<Alert>
								<Target className="h-4 w-4" />
								<AlertDescription>
									<strong>Next Step:</strong> You will review
									and label the{" "}
									{candidateCount.toLocaleString()} candidate
									events to create high-quality positive
									samples for model training. This step is
									crucial for the success of the PU Learning
									approach.
								</AlertDescription>
							</Alert>
						</CardContent>
					</Card>
				</>
			) : (
				<>
					{/* Stage 2: Manual Labeling Interface */}
					<Card className="border-purple-200">
						<CardHeader>
							<CardTitle className="flex items-center justify-between gap-3">
								<div className="flex items-center text-xl text-purple-800">
									<Users className="h-5 w-5 mr-2" />
									Stage 2: Expert Manual Verification &
									Labeling
								</div>
								<div className="flex items-center gap-3">
									<div className="w-72">
										<Select
											value={selectedRunId ?? ""}
											onValueChange={(val) =>
												setSelectedRunId(val || null)
											}
										>
											<SelectTrigger>
												<SelectValue
													placeholder={
														isLoadingRuns
															? "Loading datasets..."
															: "Select dataset"
													}
												/>
											</SelectTrigger>
											<SelectContent>
												{experimentRuns.map((r) => (
													<SelectItem
														key={r.id}
														value={r.id}
													>
														{r.name} ({r.status})
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<Button
										variant="outline"
										onClick={() => setViewMode("overview")}
										className="flex items-center gap-2"
									>
										<ArrowRight className="h-4 w-4 rotate-180" />
										Back to Overview
									</Button>
								</div>
							</CardTitle>
							<div className="bg-purple-50 p-4 rounded-lg mt-4">
								<p className="text-purple-700">
									<strong>Task:</strong> Please review and
									label the following{" "}
									{candidateCount.toLocaleString()} candidate
									events. Your expert annotations will create
									high-quality positive samples for training
									the PU Learning model.
								</p>
							</div>
						</CardHeader>
						<CardContent>
							{/* Labeling Interface */}
							<div className="space-y-4">
								{/* Integrated Labeling System */}
								<AnomalyLabelingSystemAny
									candidateCount={candidateCount}
									filterParams={filterParams}
									experimentRunId={selectedRunId ?? undefined}
									onLabelingProgress={(
										positive: number,
										normal: number,
									) => {
										setLabeledPositive(positive);
										setLabeledNormal(normal);
									}}
								/>
							</div>
						</CardContent>
					</Card>

					{/* Completion Summary */}
					<Card className="bg-green-50 border-green-200">
						<CardHeader>
							<CardTitle className="text-green-800">
								Labeling Progress
							</CardTitle>
							<p className="text-green-600 text-sm mt-2">
								Showing candidate anomalies identified from
								Stage 1 filtering for manual labeling
							</p>
						</CardHeader>
						<CardContent>
							{candidateCount > 0 ? (
								<>
									<div className="grid grid-cols-4 gap-4 text-center mb-6">
										<div>
											<div className="text-2xl font-bold text-orange-600">
												{candidateCount.toLocaleString()}
											</div>
											<div className="text-sm text-gray-600">
												Total Candidates
											</div>
										</div>
										<div>
											<div className="text-2xl font-bold text-blue-600">
												{labeledPositive.toLocaleString()}
											</div>
											<div className="text-sm text-gray-600">
												Labeled Positive
											</div>
										</div>
										<div>
											<div className="text-2xl font-bold text-gray-600">
												{labeledNormal.toLocaleString()}
											</div>
											<div className="text-sm text-gray-600">
												Labeled Normal
											</div>
										</div>
										<div>
											<div className="text-2xl font-bold text-green-600">
												{candidateCount > 0
													? Math.round(
															((labeledPositive +
																labeledNormal) /
																candidateCount) *
																100,
														)
													: 0}
												%
											</div>
											<div className="text-sm text-gray-600">
												Completion
											</div>
										</div>
									</div>
									{labeledPositive + labeledNormal === 0 ? (
										<Alert className="bg-orange-50 border-orange-200">
											<Target className="h-4 w-4 text-orange-600" />
											<AlertDescription>
												<strong>
													Ready for Labeling:
												</strong>{" "}
												{candidateCount.toLocaleString()}{" "}
												candidate anomaly events have
												been identified from Stage 1
												filtering. These candidates are
												now ready for expert review and
												manual labeling to create
												high-quality positive samples
												for PU Learning model training.
											</AlertDescription>
										</Alert>
									) : labeledPositive + labeledNormal ===
										candidateCount ? (
										<Alert className="bg-green-50 border-green-200">
											<Play className="h-4 w-4 text-green-600" />
											<AlertDescription>
												<strong>
													Labeling Complete!
												</strong>{" "}
												You have successfully labeled{" "}
												{labeledPositive.toLocaleString()}{" "}
												positive samples (anomalies) and{" "}
												{labeledNormal.toLocaleString()}{" "}
												normal samples from{" "}
												{candidateCount.toLocaleString()}{" "}
												candidates. These high-quality
												positive samples are now ready
												for model training.
											</AlertDescription>
										</Alert>
									) : (
										<Alert className="bg-blue-50 border-blue-200">
											<Target className="h-4 w-4 text-blue-600" />
											<AlertDescription>
												<strong>
													Labeling in Progress:
												</strong>{" "}
												{(
													labeledPositive +
													labeledNormal
												).toLocaleString()}{" "}
												of{" "}
												{candidateCount.toLocaleString()}{" "}
												candidates have been labeled.
												Continue labeling to complete
												the dataset preparation for
												model training.
											</AlertDescription>
										</Alert>
									)}
								</>
							) : (
								<Alert>
									<Target className="h-4 w-4" />
									<AlertDescription>
										<strong>No Candidates Found:</strong>{" "}
										Please run Stage 1 candidate calculation
										first to identify anomaly candidates for
										labeling.
									</AlertDescription>
								</Alert>
							)}
							<div className="flex justify-center mt-6">
								<Button
									size="lg"
									className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
								>
									<ArrowRight className="h-5 w-5 mr-2" />
									Proceed to Model Training & Results
								</Button>
							</div>
						</CardContent>
					</Card>
				</>
			)}
		</div>
	);
}
