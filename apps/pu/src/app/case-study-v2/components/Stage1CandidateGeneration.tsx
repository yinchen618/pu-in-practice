"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {} from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Building, Database, Loader2, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { D3ParameterChart } from "../../case-study/components/D3ParameterChart";
import type { ExperimentRun } from "../types";

interface AnalysisDataset {
	id: string;
	name: string;
	description?: string;
	building: string;
	floor: string;
	room: string;
	startDate: string;
	endDate: string;
	occupantType: string;
	totalRecords: number;
	positiveLabels: number;
}

interface FilterParams {
	// Direct dataset selection
	selectedDatasetIds: string[];

	// Value-based anomaly rules
	zScoreThreshold: number;
	spikeThreshold: number;

	// Time-based anomaly rules
	minEventDuration: number;
	weekendPatternEnabled: boolean;
	holidayPatternEnabled: boolean;

	// Data integrity rules
	maxTimeGap: number;

	// Peer comparison rules
	aggregationWindow: number;
	peerExceedThreshold: number;

	// Time range
	startDate: string;
	startTime: string;
	endDate: string;
	endTime: string;

	// Building selection
	buildingA: Record<string, boolean>;
	buildingB: Record<string, boolean>;
}

interface Stage1CandidateGenerationProps {
	experimentRun?: ExperimentRun;
	onComplete: (newExperimentRunId?: string) => void;
}

export function Stage1CandidateGeneration({
	experimentRun: initialExperimentRun,
	onComplete,
}: Stage1CandidateGenerationProps) {
	const router = useRouter();
	const queryClient = useQueryClient();

	const [filterParams, setFilterParams] = useState<FilterParams>({
		// Direct dataset selection
		selectedDatasetIds: [],

		// Value-based anomaly rules
		zScoreThreshold: 2.8,
		spikeThreshold: 250,

		// Time-based anomaly rules
		minEventDuration: 45,
		weekendPatternEnabled: true,
		holidayPatternEnabled: true,

		// Data integrity rules
		maxTimeGap: 120,

		// Peer comparison rules
		aggregationWindow: 60,
		peerExceedThreshold: 150,

		// Time range (default to last week)
		startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
			.toISOString()
			.split("T")[0],
		startTime: "00:00",
		endDate: new Date().toISOString().split("T")[0],
		endTime: "23:59",

		// Building selection
		buildingA: {
			"1F": true,
			"2F": true,
			"3F": true,
			"5F": true,
		},
		buildingB: {
			"1F": true,
			"2F": true,
			"3F": true,
			"5F": true,
			"6F": true,
		},
	});

	const [isGenerating, setIsGenerating] = useState(false);
	const [candidateCount, setCandidateCount] = useState(0);
	const [experimentRun, setExperimentRun] = useState<ExperimentRun | null>(
		initialExperimentRun || null,
	);
	const [availableDatasets, setAvailableDatasets] = useState<
		AnalysisDataset[]
	>([]);
	const [isLoadingDatasets, setIsLoadingDatasets] = useState(false);
	const [isContinuingLabeling, setIsContinuingLabeling] = useState(false);
	const [labelingReady, setLabelingReady] = useState(false);
	const [labelingInfo, setLabelingInfo] = useState<{
		anomaly_events_created: number;
		experiment_run_id: string;
		status: string;
	} | null>(null);

	// Selected datasets based on direct selection
	const selectedDatasets = useMemo(() => {
		return availableDatasets.filter((dataset) =>
			filterParams.selectedDatasetIds.includes(dataset.id),
		);
	}, [availableDatasets, filterParams.selectedDatasetIds]);

	// Fetch available datasets on component mount
	useEffect(() => {
		fetchAvailableDatasets();
	}, []);

	// Load filtering parameters from ExperimentRun if available
	// This runs AFTER availableDatasets is loaded to avoid being overwritten
	useEffect(() => {
		// Only proceed if I have both filteringParameters and availableDatasets
		const filteringParamsData = (initialExperimentRun as any)
			?.filteringParameters;

		if (filteringParamsData && availableDatasets.length > 0) {
			try {
				// Handle both string and object formats for compatibility
				let savedParams: any;
				if (typeof filteringParamsData === "string") {
					savedParams = JSON.parse(filteringParamsData);
				} else {
					savedParams = filteringParamsData;
				}

				console.log(
					"🔍 Loading saved filtering parameters:",
					savedParams,
				);
				console.log(
					"📊 Available datasets for reference:",
					availableDatasets.map((d) => ({
						id: d.id,
						building: d.building,
						floor: d.floor,
						room: d.room,
						occupantType: d.occupantType,
					})),
				);

				// Set the filter parameters from saved data
				setFilterParams((prev) => {
					const newParams = {
						...prev,
						// Selected datasets - primary filter mechanism
						selectedDatasetIds:
							savedParams.selectedDatasetIds || [],

						// Value-based anomaly rules
						zScoreThreshold:
							savedParams.zScoreThreshold || prev.zScoreThreshold,
						spikeThreshold:
							savedParams.spikeThreshold || prev.spikeThreshold,

						// Time-based anomaly rules
						minEventDuration:
							savedParams.minEventDuration ||
							prev.minEventDuration,
						weekendPatternEnabled:
							savedParams.weekendPatternEnabled !== undefined
								? savedParams.weekendPatternEnabled
								: prev.weekendPatternEnabled,
						holidayPatternEnabled:
							savedParams.holidayPatternEnabled !== undefined
								? savedParams.holidayPatternEnabled
								: prev.holidayPatternEnabled,

						// Data integrity rules
						maxTimeGap: savedParams.maxTimeGap || prev.maxTimeGap,

						// Peer comparison rules
						aggregationWindow:
							savedParams.aggregationWindow ||
							prev.aggregationWindow,
						peerExceedThreshold:
							savedParams.peerExceedThreshold ||
							prev.peerExceedThreshold,

						// Time range
						startDate: savedParams.startDate || prev.startDate,
						startTime: savedParams.startTime || prev.startTime,
						endDate: savedParams.endDate || prev.endDate,
						endTime: savedParams.endTime || prev.endTime,

						// Building selection
						buildingA: savedParams.buildingA || prev.buildingA,
						buildingB: savedParams.buildingB || prev.buildingB,
					};

					console.log(
						"✅ Filter parameters loaded from saved data:",
						{
							selectedDatasetIds: newParams.selectedDatasetIds,
							previous: prev.selectedDatasetIds,
						},
					);

					return newParams;
				});
			} catch (error) {
				console.error(
					"❌ Failed to load saved filtering parameters:",
					error,
				);
			}
		} else {
			// console.log("⚠️ Skipping filter parameter loading:", {
			// 	hasFilteringParams: !!filteringParamsData,
			// 	availableDatasetsCount: availableDatasets.length,
			// 	filteringParamsData,
			// });
		}
	}, [initialExperimentRun, availableDatasets]); // Include availableDatasets as dependency

	const fetchAvailableDatasets = async () => {
		setIsLoadingDatasets(true);
		try {
			const response = await fetch(
				"https://weakrisk.yinchen.tw/api/v2/analysis-datasets",
			);
			if (response.ok) {
				const datasets = await response.json();
				setAvailableDatasets(datasets);

				// Only auto-select first dataset if:
				// 1. No initial experiment run with filtering parameters
				// 2. No filtering criteria currently set
				// 3. Datasets are available
				const hasInitialFilteringParams = (initialExperimentRun as any)
					?.filteringParameters;

				if (
					!hasInitialFilteringParams &&
					datasets.length > 0 &&
					filterParams.selectedDatasetIds.length === 0
				) {
					const firstDataset = datasets[0];
					setFilterParams((prev) => ({
						...prev,
						selectedDatasetIds: [firstDataset.id],
					}));
				}
			}
		} catch (error) {
			console.error("Error fetching datasets:", error);
		} finally {
			setIsLoadingDatasets(false);
		}
	};

	const onFilterParamChange = useCallback(
		(key: keyof FilterParams, value: any) => {
			setFilterParams((prev) => ({
				...prev,
				[key]: value,
			}));
		},
		[],
	);

	const handleGenerateCandidates = async () => {
		if (!experimentRun) {
			console.error("No experiment run available");
			return;
		}

		setIsGenerating(true);

		try {
			const response = await fetch(
				"https://weakrisk.yinchen.tw/api/v2/generate-candidates",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						filter_params: filterParams,
					}),
				},
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			setCandidateCount(data.candidate_count || 0);

			// Update existing experiment run with preview results
			const updatedExperimentRun: ExperimentRun = {
				...experimentRun,
				name: `Preview - ${data.candidate_count || 0} candidates from ${data.total_data_pool_size || 0} records`,
				status: "COMPLETED",
				candidate_count: data.candidate_count || 0,
				total_data_pool_size: data.total_data_pool_size || 0,
				positive_label_count: data.positive_label_count || 0,
				negative_label_count: data.negative_label_count || 0,
				updated_at: new Date().toISOString(),
			};

			setExperimentRun(updatedExperimentRun);
		} catch (error) {
			console.error("Error generating candidates:", error);

			// Update experiment run to show error state
			const errorExperimentRun: ExperimentRun = {
				...experimentRun,
				name: "Failed Generation",
				status: "CONFIGURING", // Reset to configuring on failure
				candidate_count: 0,
				updated_at: new Date().toISOString(),
			};

			setExperimentRun(errorExperimentRun);
		} finally {
			setIsGenerating(false);
		}
	};

	const handleContinueLabeling = async () => {
		if (!experimentRun) {
			console.error("No experiment run available");
			return;
		}

		setIsContinuingLabeling(true);

		try {
			// 使用修改後的 generate-candidates API，並設置 save_labels: true
			// 設置較長的 timeout，不使用 polling，耐心等待完成
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 分鐘 timeout

			const requestBody = {
				experiment_run_id: experimentRun.id, // 傳遞現有的實驗ID
				filter_params: filterParams,
				save_labels: true, // 新增參數：直接保存為標籤
			};

			const response = await fetch(
				"https://weakrisk.yinchen.tw/api/v2/generate-candidates",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(requestBody),
					signal: controller.signal,
				},
			);

			clearTimeout(timeoutId);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();

			// Update experiment run with new labeling experiment - use backend status
			const updatedExperimentRun: ExperimentRun = {
				...experimentRun,
				status: data.status as "CONFIGURING" | "LABELING" | "COMPLETED", // Use backend returned status
				candidate_count: data.candidate_count,
				total_data_pool_size: data.total_data_pool_size || 0,
				positive_label_count: data.positive_label_count || 0,
				negative_label_count: data.negative_label_count || 0,
				updated_at: new Date().toISOString(),
			};

			setExperimentRun(updatedExperimentRun);

			// 手動更新 React Query 緩存，確保主頁面也能看到狀態更新
			queryClient.invalidateQueries({
				queryKey: ["experiment-run", experimentRun.id],
			});

			// Update candidate count with the returned data
			setCandidateCount(data.candidate_count);

			// Set labeling ready state
			setLabelingReady(true);
			setLabelingInfo({
				anomaly_events_created: data.anomaly_events_created,
				experiment_run_id: data.experiment_run_id,
				status: data.status,
			});

			// Show success message with detailed information
			const eventsCreated =
				data.anomaly_events_created || data.candidate_count;
			const dataPoolInfo = data.data_pool_summary
				? `\n📊 Total Data Pool: ${data.data_pool_summary.total_pool_size.toLocaleString()} records\n🟢 Positive Labels: ${data.data_pool_summary.positive_labels}\n🔴 Negative Labels: ${data.data_pool_summary.negative_labels}\n📈 Positive Ratio: ${data.data_pool_summary.positive_ratio}%`
				: "";

			alert(
				`✅ Successfully created ${eventsCreated} anomaly event labels!${dataPoolInfo}\n\n🎯 Candidates: ${data.candidate_count}\n🆔 Experiment ID: ${data.experiment_run_id}\n📍 Datasets processed: ${data.filtered_datasets_count}\n\n📍 Status: ${data.status} - Ready for labeling phase (Stage 2)`,
			);

			// Call onComplete to navigate to Stage 2 when status is LABELING
			if (data.status === "LABELING") {
				onComplete(); // 不需要傳遞ID，因為是更新現有實驗
			}
		} catch (error) {
			console.error("Error continuing to labeling:", error);

			// 檢查是否是 timeout 錯誤
			if (error instanceof Error && error.name === "AbortError") {
				alert(
					`⏰ 創建標籤操作超時（5分鐘）。

這可能是因為資料量較大或服務器處理時間較長。
您可以稍後檢查實驗狀態，或重新嘗試操作。`,
				);
			} else {
				alert(
					`❌ 創建標籤階段時發生錯誤。

請稍後重試，或檢查後端服務是否正常運行。
錯誤詳情：${error instanceof Error ? error.message : String(error)}`,
				);
			}
		} finally {
			setIsContinuingLabeling(false);
		}
	};

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<Card>
				<CardHeader>
					<CardTitle>
						Stage 1: Anomaly Candidate Generation Framework
					</CardTitle>
					<p className="text-sm text-muted-foreground">
						Multi-dimensional filtering methodology for systematic
						anomaly detection in occupancy sensing data
					</p>
				</CardHeader>
			</Card>

			{/* Direct Dataset Selection */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Database className="h-5 w-5" />
						Analysis Dataset Selection
					</CardTitle>
					<p className="text-sm text-muted-foreground">
						Select specific analysis datasets for anomaly candidate
						generation
					</p>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Selection Summary */}
					<div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
						<div className="space-y-1">
							<h4 className="text-sm font-medium text-blue-800">
								Total Data Pool Configuration
							</h4>
							<p className="text-xs text-blue-600">
								{selectedDatasets.length > 0 ? (
									<>
										Combined {selectedDatasets.length}{" "}
										dataset(s) into total data pool of{" "}
										{selectedDatasets
											.reduce(
												(sum, d) =>
													sum + d.totalRecords,
												0,
											)
											.toLocaleString()}{" "}
										records (
										{selectedDatasets.reduce(
											(sum, d) => sum + d.positiveLabels,
											0,
										)}{" "}
										positive labels,{" "}
										{(
											selectedDatasets.reduce(
												(sum, d) =>
													sum + d.totalRecords,
												0,
											) -
											selectedDatasets.reduce(
												(sum, d) =>
													sum + d.positiveLabels,
												0,
											)
										).toLocaleString()}{" "}
										negative labels)
									</>
								) : (
									<>
										No datasets selected. Choose from{" "}
										{availableDatasets.length} available
										datasets to form your total data pool.
									</>
								)}
							</p>
						</div>
						<div className="flex items-center gap-2">
							<Badge
								variant={
									selectedDatasets.length > 0
										? "default"
										: "outline"
								}
							>
								{selectedDatasets.length} dataset(s)
							</Badge>
							{selectedDatasets.length > 0 && (
								<>
									<Badge variant="secondary">
										{selectedDatasets
											.reduce(
												(sum, d) =>
													sum + d.totalRecords,
												0,
											)
											.toLocaleString()}{" "}
										total pool
									</Badge>
									<Badge
										variant="outline"
										className="text-orange-600 border-orange-300"
									>
										{selectedDatasets.reduce(
											(sum, d) => sum + d.positiveLabels,
											0,
										)}{" "}
										positive
									</Badge>
									<Badge
										variant="outline"
										className="text-red-600 border-red-300"
									>
										{(
											selectedDatasets.reduce(
												(sum, d) =>
													sum + d.totalRecords,
												0,
											) -
											selectedDatasets.reduce(
												(sum, d) =>
													sum + d.positiveLabels,
												0,
											)
										).toLocaleString()}{" "}
										negative
									</Badge>
								</>
							)}
						</div>
					</div>

					{/* Bulk Selection Controls */}
					{availableDatasets.length > 0 && (
						<div className="flex items-center gap-2 pb-2 border-b">
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									const allIds = availableDatasets.map(
										(d) => d.id,
									);
									setFilterParams((prev) => ({
										...prev,
										selectedDatasetIds: allIds,
									}));
								}}
								disabled={
									selectedDatasets.length ===
									availableDatasets.length
								}
							>
								Select All
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									setFilterParams((prev) => ({
										...prev,
										selectedDatasetIds: [],
									}));
								}}
								disabled={selectedDatasets.length === 0}
							>
								Clear All
							</Button>
							<div className="text-xs text-gray-500 ml-4">
								Click individual datasets below to
								select/deselect
							</div>
						</div>
					)}

					{/* Dataset Grid */}
					{isLoadingDatasets ? (
						<div className="text-center py-8">
							<Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
							<p className="text-sm text-gray-600">
								Loading available datasets...
							</p>
						</div>
					) : availableDatasets.length === 0 ? (
						<div className="text-center py-8 text-gray-500">
							<Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
							<div className="space-y-2">
								<p className="font-medium">
									No Analysis Datasets Available
								</p>
								<p className="text-sm">
									Please ensure analysis datasets are created
									and available in the system.
								</p>
							</div>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
							{availableDatasets.map((dataset) => {
								const isSelected =
									filterParams.selectedDatasetIds.includes(
										dataset.id,
									);
								return (
									<Card
										key={dataset.id}
										className={`cursor-pointer transition-all hover:shadow-md ${
											isSelected
												? "border-blue-500 bg-blue-50 shadow-sm"
												: "border-gray-200 bg-white hover:border-gray-300"
										}`}
										onClick={() => {
											const newSelectedIds = isSelected
												? filterParams.selectedDatasetIds.filter(
														(id) =>
															id !== dataset.id,
													)
												: [
														...filterParams.selectedDatasetIds,
														dataset.id,
													];
											setFilterParams((prev) => ({
												...prev,
												selectedDatasetIds:
													newSelectedIds,
											}));
										}}
									>
										<CardContent className="p-4">
											<div className="space-y-3">
												{/* Header with checkbox */}
												<div className="flex items-start justify-between">
													<div className="flex items-center space-x-2">
														<Checkbox
															checked={isSelected}
															className="pointer-events-none"
														/>
														<div className="text-sm font-medium">
															{dataset.name}
														</div>
													</div>
													{isSelected && (
														<span className="text-green-600 text-sm">
															✓
														</span>
													)}
												</div>

												{/* Dataset Details */}
												<div className="text-xs text-gray-600 space-y-1">
													<div className="flex items-center gap-1">
														<Building className="h-3 w-3" />
														<span className="font-medium">
															Location:
														</span>
														<span>
															{dataset.building} -{" "}
															{dataset.floor} -{" "}
															{dataset.room}
														</span>
													</div>
													<div className="flex items-center gap-1">
														<MapPin className="h-3 w-3" />
														<span className="font-medium">
															Type:
														</span>
														<span>
															{
																dataset.occupantType
															}
														</span>
													</div>
													<div className="flex items-center gap-1">
														<span className="font-medium">
															Period:
														</span>
														<span>
															{new Date(
																dataset.startDate,
															).toLocaleDateString()}{" "}
															-{" "}
															{new Date(
																dataset.endDate,
															).toLocaleDateString()}
														</span>
													</div>
													<div className="flex items-center gap-1">
														<span className="font-medium">
															Records:
														</span>
														<span className="text-blue-600">
															{dataset.totalRecords.toLocaleString()}
														</span>
													</div>
													<div className="flex items-center gap-1">
														<span className="font-medium">
															Known Anomalies:
														</span>
														<span className="text-orange-600">
															{
																dataset.positiveLabels
															}
														</span>
													</div>
												</div>

												{/* Additional Info */}
												{dataset.description && (
													<div className="text-xs text-gray-500 italic">
														{dataset.description}
													</div>
												)}
											</div>
										</CardContent>
									</Card>
								);
							})}
						</div>
					)}

					{/* Selected Datasets Summary */}
					{selectedDatasets.length > 0 && (
						<div className="mt-4 p-4 bg-gray-50 rounded-lg border">
							<h5 className="text-sm font-medium text-gray-800 mb-3">
								Total Data Pool Summary (
								{selectedDatasets.length} datasets selected)
							</h5>
							<div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
								<div className="text-center">
									<div className="font-medium text-blue-600">
										{selectedDatasets
											.reduce(
												(sum, d) =>
													sum + d.totalRecords,
												0,
											)
											.toLocaleString()}
									</div>
									<div className="text-gray-600">
										Total Data Pool Size
									</div>
								</div>
								<div className="text-center">
									<div className="font-medium text-orange-600">
										{selectedDatasets.reduce(
											(sum, d) => sum + d.positiveLabels,
											0,
										)}
									</div>
									<div className="text-gray-600">
										Positive Labels
									</div>
								</div>
								<div className="text-center">
									<div className="font-medium text-red-600">
										{(
											selectedDatasets.reduce(
												(sum, d) =>
													sum + d.totalRecords,
												0,
											) -
											selectedDatasets.reduce(
												(sum, d) =>
													sum + d.positiveLabels,
												0,
											)
										).toLocaleString()}
									</div>
									<div className="text-gray-600">
										Unlabeled Labels
									</div>
								</div>
								<div className="text-center">
									<div className="font-medium text-green-600">
										{
											[
												...new Set(
													selectedDatasets.map(
														(d) => d.building,
													),
												),
											].length
										}
									</div>
									<div className="text-gray-600">
										Buildings
									</div>
								</div>
								<div className="text-center">
									<div className="font-medium text-purple-600">
										{
											[
												...new Set(
													selectedDatasets.map(
														(d) => d.occupantType,
													),
												),
											].length
										}
									</div>
									<div className="text-gray-600">
										Occupant Types
									</div>
								</div>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Statistical Anomaly Detection Configuration */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<ArrowRight className="h-5 w-5" />
						Statistical Anomaly Detection Parameters
					</CardTitle>
					<p className="text-sm text-muted-foreground">
						Configure statistical thresholds and temporal
						constraints for anomaly identification
					</p>

					{/* Filtering Logic Explanation */}
					<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
						<h6 className="font-medium text-blue-800 mb-2">
							Anomaly Detection Methodology
						</h6>
						<div className="text-sm text-blue-700 space-y-1">
							<p>
								• <strong>Z-Score Threshold:</strong>{" "}
								Statistical outlier detection for data points
								deviating from mean (σ {">"}&#8194;
								{filterParams.zScoreThreshold})
							</p>
							<p>
								• <strong>Power Spike Detection:</strong>{" "}
								Identifies consumption patterns exceeding{" "}
								{filterParams.spikeThreshold}% above baseline
								average
							</p>
							<p>
								• <strong>Temporal Duration Filter:</strong>{" "}
								Excludes transient events lasting less than{" "}
								{filterParams.minEventDuration} minutes
							</p>
							<p>
								• <strong>Power Jump Analysis:</strong> Detects
								rapid consumption changes exceeding 50% between
								adjacent time points
							</p>
						</div>

						{/* Intelligent Parameter Recommendation */}
						<div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded">
							<div className="text-xs text-amber-800">
								<strong>
									💡 Adaptive Parameter Recommendations:
								</strong>
								{selectedDatasets.length === 0 &&
									" Please select spatial domains for analysis"}
								{selectedDatasets.length === 1 &&
									" Single-room analysis: Recommend 'Balanced Detection' mode (Expected: 50-100 candidates)"}
								{selectedDatasets.length >= 2 &&
									selectedDatasets.length <= 5 &&
									" Multi-room analysis: Recommend 'Balanced' or 'Conservative Detection' modes"}
								{selectedDatasets.length > 5 &&
									" Large-scale analysis: Strongly recommend 'Conservative Detection' to manage candidate volume"}
								{selectedDatasets.length > 10 &&
									" ⚠️ Extensive dataset scope: Consider batch processing or most restrictive parameters"}
							</div>
							{selectedDatasets.length > 0 && (
								<div className="text-xs text-amber-700 mt-1">
									Expected candidate range:{" "}
									{selectedDatasets.length * 30} -{" "}
									{selectedDatasets.length * 150} candidates
								</div>
							)}
						</div>
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Parameter Preset Configuration */}
					<div className="space-y-3">
						{/* Auto-optimization button */}
						{selectedDatasets.length > 0 && (
							<div className="mb-3">
								<Button
									variant="outline"
									className="w-full bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
									onClick={() => {
										let recommendedParams: {
											zScoreThreshold: number;
											spikeThreshold: number;
											minEventDuration: number;
										};
										if (selectedDatasets.length === 1) {
											// Single room - balanced
											recommendedParams = {
												zScoreThreshold: 2.8,
												spikeThreshold: 250,
												minEventDuration: 45,
											};
										} else if (
											selectedDatasets.length <= 5
										) {
											// Multiple rooms - more strict
											recommendedParams = {
												zScoreThreshold: 3.2,
												spikeThreshold: 350,
												minEventDuration: 60,
											};
										} else {
											// Many rooms - very strict
											recommendedParams = {
												zScoreThreshold: 3.8,
												spikeThreshold: 450,
												minEventDuration: 90,
											};
										}
										setFilterParams((prev) => ({
											...prev,
											...recommendedParams,
										}));
									}}
								>
									🎯 Apply Adaptive Parameter Optimization (
									{selectedDatasets.length} spatial domains)
								</Button>
							</div>
						)}

						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<Button
								variant="outline"
								onClick={() =>
									setFilterParams((prev) => ({
										...prev,
										zScoreThreshold: 2.0,
										spikeThreshold: 150,
										minEventDuration: 20,
									}))
								}
							>
								Sensitive Detection (High Recall)
							</Button>
							<Button
								variant="outline"
								onClick={() =>
									setFilterParams((prev) => ({
										...prev,
										zScoreThreshold: 2.8,
										spikeThreshold: 250,
										minEventDuration: 45,
									}))
								}
							>
								Balanced Detection (Recommended)
							</Button>
							<Button
								variant="outline"
								onClick={() =>
									setFilterParams((prev) => ({
										...prev,
										zScoreThreshold: 3.5,
										spikeThreshold: 400,
										minEventDuration: 90,
									}))
								}
							>
								Conservative Detection (High Precision)
							</Button>
						</div>
					</div>

					{/* Statistical Parameter Configuration and Visualization */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div className="space-y-4">
							<h5 className="font-medium text-slate-600">
								Active Detection Parameters
							</h5>
							<div className="grid grid-cols-2 gap-4">
								<div className="text-center p-3 bg-gray-50 rounded">
									<div className="text-sm font-medium">
										Z-Score Threshold
									</div>
									<div className="text-lg">
										{filterParams.zScoreThreshold}σ
									</div>
								</div>
								<div className="text-center p-3 bg-gray-50 rounded">
									<div className="text-sm font-medium">
										Spike Threshold
									</div>
									<div className="text-lg">
										{filterParams.spikeThreshold}%
									</div>
								</div>
								<div className="text-center p-3 bg-gray-50 rounded">
									<div className="text-sm font-medium">
										Min Duration
									</div>
									<div className="text-lg">
										{filterParams.minEventDuration}min
									</div>
								</div>
								<div className="text-center p-3 bg-gray-50 rounded">
									<div className="text-sm font-medium">
										Max Time Gap
									</div>
									<div className="text-lg">
										{filterParams.maxTimeGap}min
									</div>
								</div>
							</div>
						</div>

						<div className="space-y-4">
							<h5 className="font-medium text-slate-600">
								Parameter Visualization
							</h5>
							<div className="grid grid-cols-2 gap-4">
								{/* Z-Score Chart */}
								<div className="flex flex-col items-center p-3 bg-white border rounded">
									<div className="text-xs font-medium mb-2">
										Z-Score Threshold
									</div>
									<D3ParameterChart
										parameterType="zscore"
										threshold={filterParams.zScoreThreshold}
										width={120}
										height={60}
									/>
									<div className="text-xs text-gray-500 mt-1">
										{filterParams.zScoreThreshold}σ
									</div>
								</div>

								{/* Spike Chart */}
								<div className="flex flex-col items-center p-3 bg-white border rounded">
									<div className="text-xs font-medium mb-2">
										Power Spike Analysis
									</div>
									<D3ParameterChart
										parameterType="spike"
										threshold={filterParams.spikeThreshold}
										width={120}
										height={60}
									/>
									<div className="text-xs text-gray-500 mt-1">
										{filterParams.spikeThreshold}% above
										baseline
									</div>
								</div>

								{/* Duration Chart */}
								<div className="flex flex-col items-center p-3 bg-white border rounded">
									<div className="text-xs font-medium mb-2">
										Temporal Duration
									</div>
									<D3ParameterChart
										parameterType="duration"
										threshold={
											filterParams.minEventDuration
										}
										width={120}
										height={60}
									/>
									<div className="text-xs text-gray-500 mt-1">
										{filterParams.minEventDuration} minutes
										minimum
									</div>
								</div>

								{/* Time Gap Chart */}
								<div className="flex flex-col items-center p-3 bg-white border rounded">
									<div className="text-xs font-medium mb-2">
										Temporal Continuity
									</div>
									<D3ParameterChart
										parameterType="timegap"
										threshold={filterParams.maxTimeGap}
										width={120}
										height={60}
									/>
									<div className="text-xs text-gray-500 mt-1">
										{filterParams.maxTimeGap} minutes
										maximum gap
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Generate Button */}
					<div className="pt-4 border-t">
						<Button
							onClick={handleGenerateCandidates}
							size="lg"
							disabled={
								isGenerating ||
								selectedDatasets.length === 0 ||
								!experimentRun
							}
							className="min-w-[200px]"
						>
							{isGenerating ? (
								<>
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									Generating Candidates...
								</>
							) : (
								"Execute Candidate Generation"
							)}
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Experimental Results Analysis */}
			{experimentRun && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<ArrowRight className="h-5 w-5" />
							Anomaly Detection Results
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{candidateCount === 0 ? (
								// No candidates detected - academic warning message
								<div className="text-center py-8">
									<div className="text-4xl font-bold text-orange-500 mb-2">
										∅
									</div>
									<div className="text-lg font-medium text-orange-700 mb-4">
										No Anomaly Candidates Detected
									</div>
									<div className="bg-orange-50 border border-orange-200 rounded-lg p-4 max-w-md mx-auto">
										<p className="text-sm text-orange-800 mb-3">
											Current statistical parameters
											yielded zero anomaly candidates.
											Parameter adjustment
											recommendations:
										</p>
										<ul className="text-sm text-orange-700 list-disc list-inside space-y-1 text-left">
											<li>
												Reduce Z-Score threshold
												(current: σ ≥{" "}
												{filterParams.zScoreThreshold})
											</li>
											<li>
												Lower power spike threshold
												(current: ≥{" "}
												{filterParams.spikeThreshold}%
												above baseline)
											</li>
											<li>
												Decrease minimum temporal
												duration (current: ≥{" "}
												{filterParams.minEventDuration}{" "}
												minutes)
											</li>
											<li>
												Expand temporal or spatial scope
												for analysis
											</li>
										</ul>
									</div>
									{experimentRun && (
										<div className="text-sm text-gray-600 mt-4">
											<span>Generated at:</span>
											<span className="ml-2">
												{new Date(
													experimentRun.created_at,
												).toLocaleString()}
											</span>
										</div>
									)}
								</div>
							) : (
								// Normal results display when candidates > 0
								<>
									<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
										<div className="text-center">
											<div className="text-2xl font-bold text-blue-600">
												{candidateCount}
											</div>
											<div className="text-sm text-gray-600">
												Detected Candidates
											</div>
										</div>
										{experimentRun && (
											<div className="text-center">
												<Badge
													variant={
														labelingReady
															? "default"
															: experimentRun.status ===
																	"COMPLETED"
																? "default"
																: "destructive"
													}
													className={
														labelingReady
															? "bg-green-600"
															: ""
													}
												>
													{labelingReady
														? "ANNOTATION READY"
														: experimentRun.status}
												</Badge>
												<div className="text-sm text-gray-600 mt-1">
													Processing Status
												</div>
											</div>
										)}
										{selectedDatasets.length > 0 && (
											<div className="text-center">
												<div className="text-lg font-semibold text-green-600">
													{selectedDatasets.length ===
													1
														? selectedDatasets[0]
																.room
														: `${selectedDatasets.length} spatial domains`}
												</div>
												<div className="text-sm text-gray-600">
													Analysis Scope
												</div>
											</div>
										)}
										{selectedDatasets.length > 0 && (
											<div className="text-center">
												<div className="text-lg font-semibold text-purple-600">
													{selectedDatasets
														.reduce(
															(sum, d) =>
																sum +
																d.totalRecords,
															0,
														)
														.toLocaleString()}
												</div>
												<div className="text-sm text-gray-600">
													Sensor Records
												</div>
											</div>
										)}
									</div>

									{experimentRun && (
										<div className="text-sm text-gray-600">
											<span>Generated at:</span>
											<span className="ml-2">
												{new Date(
													experimentRun.created_at,
												).toLocaleString()}
											</span>
										</div>
									)}

									{/* Labeling Ready Info */}
									{labelingReady && labelingInfo && (
										<div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
											<div className="flex items-center gap-2 mb-3">
												<div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
												<span className="font-medium text-green-800">
													🎯 Anomaly Event Labels
													Successfully Generated
												</span>
											</div>
											<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
												<div className="bg-white p-3 rounded border">
													<div className="font-medium text-green-700">
														Event Count
													</div>
													<div className="text-lg font-bold text-green-600">
														{
															labelingInfo.anomaly_events_created
														}
													</div>
												</div>
												<div className="bg-white p-3 rounded border">
													<div className="font-medium text-blue-700">
														Experiment ID
													</div>
													<div className="text-xs font-mono text-blue-600 break-all">
														{
															labelingInfo.experiment_run_id
														}
													</div>
												</div>
												<div className="bg-white p-3 rounded border">
													<div className="font-medium text-purple-700">
														Pipeline Status
													</div>
													<div className="text-sm font-bold text-purple-600">
														{labelingInfo.status}
													</div>
												</div>
											</div>
											<p className="text-sm text-green-700 mt-3">
												✅ All anomaly candidates
												successfully converted to
												annotation events and persisted
												to database. Ready to proceed to
												Stage 2 for expert validation
												and ground truth establishment.
											</p>
										</div>
									)}

									{/* Continue Labeling Button */}
									{candidateCount > 0 &&
										experimentRun &&
										experimentRun.status ===
											"COMPLETED" && (
											<div className="pt-4 border-t">
												{labelingReady ? (
													// Ready for Stage 2 - anomaly events created
													<>
														<div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
															<div className="flex items-center gap-2 mb-2">
																<div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
																<span className="font-medium text-blue-800">
																	Ready to
																	Enter Manual
																	Labeling
																	Phase
																</span>
															</div>
															<p className="text-sm text-blue-700">
																Anomaly events
																are prepared.
																Click the button
																below to proceed
																to Stage 2 for
																manual labeling
																review.
															</p>
														</div>
														<Button
															onClick={() => {
																// Navigate to Stage 2 with current URL parameters
																const currentUrl =
																	new URL(
																		window
																			.location
																			.href,
																	);
																currentUrl.searchParams.set(
																	"stage",
																	"stage-2",
																);
																router.push(
																	`${currentUrl.pathname}?${currentUrl.searchParams.toString()}`,
																);
															}}
															className="w-full bg-blue-600 hover:bg-blue-700 text-white"
														>
															<ArrowRight className="mr-2 h-4 w-4" />
															🏷️ Proceed to Stage 2
															(Expert Labeling)
														</Button>
														<p className="text-xs text-gray-500 mt-2 text-center">
															Will begin manual
															review and labeling
															of {candidateCount}{" "}
															anomaly events
														</p>
													</>
												) : (
													// Not yet created anomaly events - show create button
													<>
														<div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
															<div className="flex items-center gap-2 mb-2">
																<div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
																<span className="font-medium text-green-800">
																	Ready to
																	Create
																	Anomaly
																	Event Labels
																</span>
															</div>
															<p className="text-sm text-green-700">
																Candidate
																generation
																complete. Click
																the button below
																to convert{" "}
																{candidateCount}{" "}
																candidates into
																anomaly event
																labels.
																<br />
																<span className="text-xs text-green-600">
																	⏱️ This
																	operation
																	may take
																	several
																	minutes,
																	please be
																	patient
																</span>
															</p>
														</div>
														<Button
															onClick={
																handleContinueLabeling
															}
															disabled={
																isContinuingLabeling
															}
															className="w-full bg-green-600 hover:bg-green-700 text-white"
														>
															{isContinuingLabeling ? (
																<>
																	<Loader2 className="mr-2 h-4 w-4 animate-spin" />
																	Creating
																	anomaly
																	event
																	labels...
																	Please wait
																</>
															) : (
																<>
																	<ArrowRight className="mr-2 h-4 w-4" />
																	📝 Create
																	Anomaly
																	Event Labels
																</>
															)}
														</Button>
														<p className="text-xs text-gray-500 mt-2 text-center">
															Will create{" "}
															{candidateCount}{" "}
															anomaly events in
															database ready for
															labeling
															<br />
															⚠️ Operation takes up
															to 5 minutes, no
															retry mechanism
														</p>
													</>
												)}
											</div>
										)}
								</>
							)}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

export default Stage1CandidateGeneration;
