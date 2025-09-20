"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { BarChart, ChevronRight, Loader2, Play, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useExperimentHistory } from "../hooks/useExperimentHistory";
import { useExperimentRun } from "../hooks/useExperimentRun";
import { ExperimentRunSelector } from "./ExperimentRunSelector";
import { Stage1CandidateGeneration } from "./Stage1CandidateGeneration";
import { Stage2ExpertLabeling } from "./Stage2ExpertLabeling";
import { Stage3TrainingWorkbench } from "./Stage3TrainingWorkbench";
import Stage4ResultsAnalysis from "./Stage4ResultsAnalysis";

export function CaseStudyV2WorkbenchComponent() {
	const router = useRouter();

	// State management with URL query parameters
	const [selectedRunId, setSelectedRunId] = useState<string>("new");
	const [activeStage, setActiveStage] = useState<string>("stage-1");

	// Data fetching
	const {
		data: selectedRun,
		isLoading: runLoading,
		error: runError,
		refetch: refetchExperimentRun,
	} = useExperimentRun(selectedRunId !== "new" ? selectedRunId : undefined);
	const { data: history, isLoading: historyLoading } = useExperimentHistory(
		selectedRunId !== "new" ? selectedRunId : undefined,
	);

	// Update URL when selections change using query parameters
	const updateURL = (newRunId: string, newStage: string) => {
		const params = new URLSearchParams();
		if (newRunId !== "new") {
			params.set("run", newRunId);
		}
		params.set("stage", newStage);

		const newURL = `/case-study-v2?${params.toString()}`;
		router.push(newURL);
	};

	// Handle experiment run selection
	const handleRunSelection = (runId: string) => {
		setSelectedRunId(runId);
		// updateURL(runId, activeStage);
	};

	// Handle stage navigation
	const handleStageChange = (newStage: string) => {
		setActiveStage(newStage);
		// updateURL(selectedRunId, newStage);

		// Refetch experiment data to ensure UI reflects latest status
		if (selectedRunId !== "new" && refetchExperimentRun) {
			refetchExperimentRun();
		}
	};

	// Auto-navigate based on experiment status
	useEffect(() => {
		if (selectedRun && selectedRunId !== "new") {
			// Auto-navigate to appropriate stage based on experiment status
			if (
				selectedRun.status === "CONFIGURING" &&
				activeStage !== "stage-1"
			) {
				setActiveStage("stage-1");
				// updateURL(selectedRunId, "stage-1");
			} else if (
				selectedRun.status === "LABELING" &&
				activeStage === "stage-1"
			) {
				setActiveStage("stage-2");
				// updateURL(selectedRunId, "stage-2");
			}
		}
	}, [selectedRun, selectedRunId, activeStage]);

	// Stage configuration
	const stages = [
		{
			id: "stage-1",
			title: "Candidate Generation",
			description: "Generate anomaly candidates (time-ordered)",
			icon: Settings,
			enabled: true,
		},
		{
			id: "stage-2",
			title: "Expert Labeling",
			description: "Confirm positives (P); keep others as Unlabeled (U)",
			icon: Play,
			enabled: selectedRun?.status !== "CONFIGURING",
		},
		{
			id: "stage-3",
			title: "Training Workbench",
			description: "Train/evaluate nnPU; estimate πₚ on train only",
			icon: BarChart,
			enabled:
				selectedRun?.status === "COMPLETED" ||
				(selectedRun?.positive_label_count &&
					selectedRun.positive_label_count > 0),
		},
		{
			id: "stage-4",
			title: "Results Analysis",
			description: "Compare runs with PU-aware metrics & target-risk",
			icon: BarChart,
			enabled: (history?.trained_models?.length || 0) > 0,
		},
	];

	// Loading state
	if (runLoading && selectedRunId !== "new") {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	// Error state
	if (runError) {
		return (
			<div className="container mx-auto px-4 py-8">
				<Alert variant="destructive">
					<AlertDescription>
						Error loading experiment run: {runError.message}
					</AlertDescription>
				</Alert>
			</div>
		);
	}

	return (
		<div className="space-y-8">
			<div className="text-center mb-8">
				<h2 className="text-4xl font-bold text-slate-800 mb-4">
					Data Workbench
				</h2>
				<p className="text-lg text-slate-600 max-w-3xl mx-auto">
					Advanced, risk-estimation–driven workbench for LSTM + PU
					Learning (nnPU) with a four-stage, leakage-safe workflow
				</p>
			</div>

			{/* Experiment Run Selector */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Settings className="h-5 w-5" />
						Experiment Configuration
					</CardTitle>
					<CardDescription>
						Select or create an experiment run to start a
						chronological, leakage-safe pipeline.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<ExperimentRunSelector
						selectedRunId={selectedRunId}
						onRunSelect={handleRunSelection}
						selectedRun={selectedRun}
					/>
				</CardContent>
			</Card>

			{/* Workflow Progress */}
			{selectedRunId !== "new" && selectedRun && (
				<Card>
					<CardHeader>
						<CardTitle>Workflow Progress</CardTitle>
						<CardDescription>
							Track your progress through the four-stage research
							workflow
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex items-center space-x-4 overflow-x-auto pb-2">
							{stages.map((stage, index) => {
								const Icon = stage.icon;
								const isActive = stage.id === activeStage;
								const isCompleted =
									stages.findIndex(
										(s) => s.id === activeStage,
									) > index;

								return (
									<div
										key={stage.id}
										className="flex items-center"
									>
										<Button
											variant={
												isActive
													? "default"
													: isCompleted
														? "secondary"
														: "outline"
											}
											className={`flex-col h-auto p-4 min-w-[140px] ${
												!stage.enabled
													? "opacity-50 cursor-not-allowed"
													: ""
											}`}
											onClick={() =>
												stage.enabled &&
												handleStageChange(stage.id)
											}
											disabled={!stage.enabled}
										>
											<Icon className="h-5 w-5 mb-2" />
											<span className="text-sm font-medium">
												{stage.title}
											</span>
											<span className="text-xs text-muted-foreground mt-1 text-center">
												{stage.description}
											</span>
										</Button>
										{index < stages.length - 1 && (
											<ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />
										)}
									</div>
								);
							})}
						</div>

						{/* Status Indicators */}
						<Separator className="my-4" />
						<div className="flex items-center gap-4 text-sm">
							<div className="flex items-center gap-2">
								<Badge
									variant={
										selectedRun.status === "CONFIGURING"
											? "default"
											: "secondary"
									}
								>
									{selectedRun.status}
								</Badge>
								<span className="text-muted-foreground">
									Status
								</span>
							</div>
							{selectedRun.candidate_count !== null && (
								<div className="flex items-center gap-2">
									<Badge variant="outline">
										{selectedRun.candidate_count}
									</Badge>
									<span className="text-muted-foreground">
										Candidates
									</span>
								</div>
							)}
							{selectedRun.positive_label_count !== null && (
								<div className="flex items-center gap-2">
									<Badge variant="outline">
										{selectedRun.positive_label_count}/
										{selectedRun.candidate_count} labeled
									</Badge>
									<span className="text-muted-foreground">
										Progress
									</span>
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Main Content Area */}
			{selectedRunId !== "new" ? (
				<Tabs
					value={activeStage}
					onValueChange={handleStageChange}
					className="space-y-4"
				>
					<TabsContent value="stage-1" className="space-y-4">
						<Stage1CandidateGeneration
							experimentRun={selectedRun || undefined}
							onComplete={(newExperimentRunId) => {
								if (newExperimentRunId) {
									// Switch to the new experiment run and move to stage 2
									setSelectedRunId(newExperimentRunId);
									handleStageChange("stage-2");
								} else {
									// Just move to stage 2 with current run
									handleStageChange("stage-2");
								}
							}}
						/>
					</TabsContent>

					<TabsContent value="stage-2" className="space-y-4">
						{selectedRun && (
							<Stage2ExpertLabeling
								experimentRun={selectedRun}
								onComplete={() => handleStageChange("stage-3")}
							/>
						)}
					</TabsContent>

					<TabsContent value="stage-3" className="space-y-4">
						{selectedRun && (
							<Stage3TrainingWorkbench
								experimentRun={selectedRun}
							/>
						)}
					</TabsContent>

					<TabsContent value="stage-4" className="space-y-4">
						{selectedRun && history && (
							<Stage4ResultsAnalysis experiments={[history]} />
						)}
					</TabsContent>
				</Tabs>
			) : (
				<>
					<Card>
						<CardHeader>
							<CardTitle>Welcome to Data Workbench</CardTitle>
							<CardDescription>
								Create a new experiment or select an existing
								one to begin.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-muted-foreground">
								This workbench follows a structured, PU-aware
								four-stage flow:
							</p>
							<ul className="mt-4 space-y-2 text-sm text-muted-foreground">
								<li>
									•{" "}
									<strong>
										Stage 1 — Candidate Generation:
									</strong>{" "}
									derive anomaly candidates from raw streams
									via configurable filters (time-ordered).
								</li>
								<li>
									• <strong>Stage 2 — Label Review:</strong>{" "}
									confirm positives (P); keep the rest as
									Unlabeled (U).
								</li>
								<li>
									• <strong>Stage 3 — Model Training:</strong>{" "}
									train/evaluate nnPU with real-time
									monitoring; estimate class prior πp on train
									only.
								</li>
								<li>
									• <strong>Stage 4 — Analysis:</strong>{" "}
									compare runs, inspect PU-aware metrics, and
									validate target-domain risk.
								</li>
							</ul>
							<p className="mt-4 text-sm text-muted-foreground">
								<strong>Note:</strong> All preprocessing is
								split-first, process-later to prevent time
								leakage.
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-3">
								<span className="text-2xl">🏢</span>
								Dataset Overview: Room A-310 (R029)
							</CardTitle>
							<CardDescription>
								Comprehensive, PU-aware view of dataset
								distribution and characteristics
							</CardDescription>
						</CardHeader>
						<CardContent>
							{/* 視覺化圖表 */}
							<div className="bg-white p-6 rounded-lg border border-slate-200">
								<div className="text-center mb-6">
									<div className="grid grid-cols-2 gap-4 text-sm text-slate-600 mb-4">
										<div>
											<strong>Location:</strong>{" "}
											Building-A - 3F - Room-10
										</div>
										<div>
											<strong>Type:</strong> Student
											Activity Room
										</div>
										<div>
											<strong>Period:</strong> 2025/7/21 -
											2025/8/17 (28 days)
										</div>
										<div>
											<strong>Total Records:</strong>{" "}
											16,078 data points
										</div>
										<div className="text-sm text-slate-600 mt-2">
											Estimated class prior (window): πp ≈
											0.100 (1,607 P / 16,078 processed);
											note: prior may drift over time.
										</div>
									</div>
								</div>

								{/* 數據比例視覺化 */}
								<div className="space-y-4">
									{/* 理論筆數 */}
									<div className="flex items-center gap-4">
										<div className="w-32 text-sm text-slate-700 font-medium">
											Theoretical Maximum
										</div>
										<div className="flex-1 bg-gray-200 rounded-full h-8 relative overflow-hidden">
											<div
												className="bg-gray-400 h-full rounded-full"
												style={{
													width: "100%",
												}}
											/>
											<div className="absolute inset-0 flex items-center justify-center text-white text-sm font-bold">
												40,320 points (100%)
											</div>
										</div>
									</div>

									{/* 實際收集到的數據 */}
									<div className="flex items-center gap-4">
										<div className="w-32 text-sm text-slate-700 font-medium">
											Processed Dataset
										</div>
										<div className="flex-1 bg-gray-200 rounded-full h-8 relative overflow-hidden">
											<div
												className="bg-blue-500 h-full rounded-full"
												style={{
													width: "39.9%",
												}}
											/>
											<div className="absolute inset-0 flex items-center justify-center pl-24 text-slate-700 text-sm font-bold">
												16,078 points (39.9% of
												theoretical)
											</div>
										</div>
									</div>

									{/* Expert 標註的異常 - 使用實際處理數據作為基準 */}
									<div className="flex items-center gap-4">
										<div className="w-32 text-sm text-slate-700 font-medium">
											Positive (P) — Confirmed Anomalies
										</div>
										<div className="flex-1 bg-gray-200 rounded-full h-8 relative overflow-hidden">
											<div
												className="bg-red-400 h-full rounded-full"
												style={{
													width: "3.9%",
												}}
											/>
											<div className="absolute inset-0 flex items-center justify-start pl-10 text-slate-700 text-sm font-bold">
												1,607 points (10.0% of Processed
												Dataset)
											</div>
										</div>
									</div>

									{/* 未標註數據 - 使用實際處理數據作為基準 */}
									<div className="flex items-center gap-4">
										<div className="w-32 text-sm text-slate-700 font-medium">
											Unlabeled (U) — Unknown Status
										</div>
										<div className="flex-1 bg-gray-200 rounded-full h-8 relative overflow-hidden">
											<div
												className="bg-amber-400 h-full rounded-full"
												style={{
													width: "35.9%",
												}}
											/>
											<div className="absolute inset-0 flex items-center justify-center pl-22 text-slate-700 text-sm font-bold">
												14,471 points (90.0% of
												Processed Dataset)
											</div>
										</div>
									</div>
								</div>

								{/* 說明文字 */}
								<div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
									<div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
										<div className="text-gray-800 font-semibold text-sm">
											Theoretical Maximum
										</div>
										<div className="text-gray-700 text-xs mt-1">
											Expected 1 point/minute over 28 days
										</div>
									</div>
									<div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
										<div className="text-blue-800 font-semibold text-sm">
											Processed Dataset
										</div>
										<div className="text-blue-700 text-xs mt-1">
											Post-ETL, leak-safe after Golden
											Window selection
										</div>
									</div>
									<div className="bg-red-50 p-3 rounded-lg border border-red-200">
										<div className="text-red-800 font-semibold text-sm">
											Positive (P)
										</div>
										<div className="text-red-700 text-xs mt-1">
											Expert-verified anomaly samples
										</div>
									</div>
									<div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
										<div className="text-amber-800 font-semibold text-sm">
											Unlabeled (U)
										</div>
										<div className="text-amber-700 text-xs mt-1">
											Unconfirmed samples (may contain
											hidden positives)
										</div>
									</div>
								</div>
							</div>

							{/* Room A-310 特性分析 */}
							<div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200 mt-6">
								<h6 className="font-semibold text-indigo-800 mb-3">
									Room A-310 (R029) Characteristics
								</h6>
								<div className="grid md:grid-cols-3 gap-4 text-sm">
									<div>
										<div className="font-medium text-indigo-700">
											PU Prior (Window)
										</div>
										<div className="text-slate-600">
											πp ≈ 10% (vs. typical &lt;0.1%);
											expect drift by season
										</div>
									</div>
									<div>
										<div className="font-medium text-indigo-700">
											Domain Notes
										</div>
										<div className="text-slate-600">
											Student activity room; usage differs
											from office-worker domain
										</div>
									</div>
									<div>
										<div className="font-medium text-indigo-700">
											ETL Recovery (Leak-Safe)
										</div>
										<div className="text-slate-600">
											39.9% kept after Golden Window
											selection
										</div>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</>
			)}
		</div>
	);
}
