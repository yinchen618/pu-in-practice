"use client";

import {
	ArrowRight,
	Brain,
	Calendar,
	CheckCircle,
	ListChecks,
	Play,
	RotateCcw,
	Settings,
	Target,
	TrendingUp,
	Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Progress } from "../../../components/ui/progress";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../../components/ui/select";
import { ResultsPhase } from "./ResultsPhase";

type TrainingStage = "ready" | "training" | "completed";

export function ModelTrainingPhase() {
	const [trainingStage, setTrainingStage] = useState<TrainingStage>("ready");
	const [trainingProgress, setTrainingProgress] = useState(0);
	const [viewMode, setViewMode] = useState<"training" | "results">(
		"training",
	);

	// Console state
	const [experimentRuns, setExperimentRuns] = useState<
		Array<{ id: string; name: string }>
	>([]);
	const [selectedRunId, setSelectedRunId] = useState<string>("");
	const [predictionStart, setPredictionStart] = useState<string>("");
	const [predictionEnd, setPredictionEnd] = useState<string>("");

	const [modelType, setModelType] = useState<"uPU" | "nnPU">("nnPU");
	const [priorMethod, setPriorMethod] = useState<"mean" | "median">("median");
	const [classPrior, setClassPrior] = useState<string>("");
	const [hiddenUnits, setHiddenUnits] = useState<number>(100);
	const [activation, setActivation] = useState<"relu" | "tanh">("relu");
	const [lambdaReg, setLambdaReg] = useState<number>(0.005);
	const [optimizer, setOptimizer] = useState<"adam" | "sgd">("adam");
	const [learningRate, setLearningRate] = useState<number>(0.005);
	const [epochs, setEpochs] = useState<number>(100);
	const [batchSize, setBatchSize] = useState<number>(128);
	const [seed, setSeed] = useState<number>(42);

	// Job tracking
	const [jobId, setJobId] = useState<string>("");
	const [jobStatus, setJobStatus] = useState<string>("");
	const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

	// Results
	const [modelId, setModelId] = useState<string>("");
	const [resultsMeta, setResultsMeta] = useState<any>(null);
	const [metrics, setMetrics] = useState<any>(null);
	const [topPredictions, setTopPredictions] = useState<Array<any>>([]);
	const [errorMessage, setErrorMessage] = useState<string>("");

	const API_BASE = "http://localhost:8000";

	useEffect(() => {
		let cancelled = false;
		async function loadRuns() {
			try {
				const resp = await fetch(
					`${API_BASE}/api/v1/experiment-runs?status=COMPLETED`,
					{ cache: "no-store" },
				);
				if (!resp.ok) {
					return;
				}
				const data = await resp.json();
				if (!cancelled) {
					const runs = (data?.data || []).map((r: any) => ({
						id: r.id,
						name: r.name,
					}));
					setExperimentRuns(runs);
				}
			} catch {
				// no-op
			}
		}
		loadRuns();
		return () => {
			cancelled = true;
		};
	}, []);

	const isConfigValid = useMemo(() => {
		if (!selectedRunId) {
			return false;
		}
		if (!predictionStart || !predictionEnd) {
			return false;
		}
		return new Date(predictionStart) <= new Date(predictionEnd);
	}, [selectedRunId, predictionStart, predictionEnd]);

	function applyGoldenConfig() {
		setModelType("nnPU");
		setPriorMethod("median");
		setHiddenUnits(100);
		setActivation("relu");
		setLambdaReg(0.005);
		setOptimizer("adam");
		setLearningRate(0.005);
		setEpochs(100);
		setBatchSize(128);
		setSeed(42);
	}

	function stopPolling() {
		if (pollTimerRef.current) {
			clearTimeout(pollTimerRef.current);
			pollTimerRef.current = null;
		}
	}

	async function fetchModelResults(mid: string) {
		try {
			const r = await fetch(`${API_BASE}/api/v1/models/${mid}/results`, {
				cache: "no-store",
			});
			if (!r.ok) {
				return;
			}
			const data = await r.json();
			setResultsMeta(data.meta);
			setMetrics(data.metrics);
		} catch {
			// no-op
		}
	}

	async function pollJobOnce(jid: string) {
		try {
			const r = await fetch(`${API_BASE}/api/v1/models/jobs/${jid}`, {
				cache: "no-store",
			});
			if (!r.ok) {
				throw new Error(`Status ${r.status}`);
			}
			const s = await r.json();
			setJobStatus(s.status);
			const progressNumber = Math.round((s.progress || 0) * 100);
			setTrainingProgress(progressNumber);
			if (s.status === "SUCCEEDED") {
				stopPolling();
				setTrainingStage("completed");
				const mid = s.model_id as string;
				setModelId(mid);
				setTopPredictions(s.result?.predictions_topk || []);
				fetchModelResults(mid);
				return true;
			}
			if (s.status === "FAILED") {
				stopPolling();
				setTrainingStage("ready");
				setErrorMessage(s.error || "Job failed");
				return true;
			}
			return false;
		} catch (err: any) {
			stopPolling();
			setTrainingStage("ready");
			setErrorMessage(err?.message || "Polling failed");
			return true;
		}
	}

	function pollJobUntilDone(jid: string) {
		stopPolling();
		const tick = async () => {
			const done = await pollJobOnce(jid);
			if (!done) {
				pollTimerRef.current = setTimeout(tick, 1200);
			}
		};
		tick();
	}

	// cleanup on unmount
	useEffect(() => {
		return () => {
			stopPolling();
		};
	}, []);

	async function startTrainAndPredict() {
		setErrorMessage("");
		setResultsMeta(null);
		setMetrics(null);
		setTopPredictions([]);
		setModelId("");
		setJobId("");
		setJobStatus("");
		setTrainingStage("training");
		setTrainingProgress(0);

		const payload = {
			experiment_run_id: selectedRunId,
			model_params: {
				model_type: modelType,
				prior_method: priorMethod,
				class_prior: classPrior ? Number(classPrior) : null,
				hidden_units: hiddenUnits,
				activation,
				lambda_reg: lambdaReg,
				optimizer,
				learning_rate: learningRate,
				epochs,
				batch_size: batchSize,
				seed,
				feature_version: "fe_v1",
			},
			prediction_start_date: predictionStart,
			prediction_end_date: predictionEnd,
		};

		try {
			const resp = await fetch(
				`${API_BASE}/api/v1/models/train-and-predict`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				},
			);
			if (!resp.ok) {
				const txt = await resp.text();
				throw new Error(txt || "Failed to start job");
			}
			const data = await resp.json();
			const jid = data.job_id as string;
			setJobId(jid);
			setJobStatus("QUEUED");
			pollJobUntilDone(jid);
		} catch (err: any) {
			setTrainingStage("ready");
			setErrorMessage(err?.message || "Failed to start job");
		}
	}

	const handleResetTraining = () => {
		stopPolling();
		setTrainingStage("ready");
		setTrainingProgress(0);
		setJobId("");
		setJobStatus("");
		setModelId("");
		setResultsMeta(null);
		setMetrics(null);
		setTopPredictions([]);
		setErrorMessage("");
	};

	return (
		<div className="space-y-6" id="stage-3">
			{viewMode === "training" ? (
				<>
					{/* Page Header */}
					<Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
						<CardHeader>
							<CardTitle className="flex items-center text-2xl text-purple-900">
								<Brain className="h-6 w-6 mr-3" />
								Model Training & Results
							</CardTitle>
							<p className="text-purple-700 mt-2">
								Use high-quality labeled samples to train PU
								Learning models and evaluate their performance
								on real-world data
							</p>
						</CardHeader>
					</Card>

					{/* Stage 1: Model Training */}
					<Card className="border-blue-200">
						<CardHeader>
							<CardTitle className="flex items-center text-xl text-blue-800">
								<Zap className="h-5 w-5 mr-2" />
								Stage 1: PU Training & Interval Prediction
							</CardTitle>
							<div className="text-blue-700 text-sm space-y-1">
								<p className="flex items-center gap-2">
									<ListChecks className="h-4 w-4" /> Training
									set = ExperimentRun labeled events (P/U,
									optional RN). Prediction = ammeter_log in
									date range. Leakage guarded.
								</p>
								<p className="flex items-center gap-2">
									<Calendar className="h-4 w-4" /> Make sure
									training windows do not overlap with
									prediction range.
								</p>
							</div>
						</CardHeader>
						<CardContent className="space-y-6">
							{/* Console */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div className="space-y-4">
									<h4 className="font-semibold text-blue-800">
										Dataset
									</h4>
									<div className="space-y-2">
										<Label>ExperimentRun</Label>
										<Select
											value={selectedRunId}
											onValueChange={setSelectedRunId}
										>
											<SelectTrigger>
												<SelectValue placeholder="Select completed run" />
											</SelectTrigger>
											<SelectContent>
												{experimentRuns.map((r) => (
													<SelectItem
														key={r.id}
														value={r.id}
													>
														{r.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className="grid grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label>Prediction start</Label>
											<Input
												type="date"
												value={predictionStart}
												onChange={(e) =>
													setPredictionStart(
														e.target.value,
													)
												}
											/>
										</div>
										<div className="space-y-2">
											<Label>Prediction end</Label>
											<Input
												type="date"
												value={predictionEnd}
												onChange={(e) =>
													setPredictionEnd(
														e.target.value,
													)
												}
											/>
										</div>
									</div>
								</div>
								<div className="space-y-4">
									<h4 className="font-semibold text-blue-800">
										Model Config
									</h4>
									<div className="grid grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label>Model Type</Label>
											<Select
												value={modelType}
												onValueChange={(v) =>
													setModelType(v as any)
												}
											>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="uPU">
														uPU
													</SelectItem>
													<SelectItem value="nnPU">
														nnPU
													</SelectItem>
												</SelectContent>
											</Select>
										</div>
										<div className="space-y-2">
											<Label>Prior Method</Label>
											<Select
												value={priorMethod}
												onValueChange={(v) =>
													setPriorMethod(v as any)
												}
											>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="mean">
														Mean
													</SelectItem>
													<SelectItem value="median">
														Median
													</SelectItem>
												</SelectContent>
											</Select>
										</div>
										<div className="space-y-2">
											<Label>
												Class Prior (optional)
											</Label>
											<Input
												type="number"
												min={0}
												max={1}
												step={0.01}
												value={classPrior}
												onChange={(e) =>
													setClassPrior(
														e.target.value,
													)
												}
											/>
										</div>
										<div className="space-y-2">
											<Label>Hidden Units</Label>
											<Input
												type="number"
												min={4}
												max={500}
												value={hiddenUnits}
												onChange={(e) =>
													setHiddenUnits(
														Number(
															e.target.value || 0,
														),
													)
												}
											/>
										</div>
										<div className="space-y-2">
											<Label>Activation</Label>
											<Select
												value={activation}
												onValueChange={(v) =>
													setActivation(v as any)
												}
											>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="relu">
														ReLU
													</SelectItem>
													<SelectItem value="tanh">
														Tanh
													</SelectItem>
												</SelectContent>
											</Select>
										</div>
										<div className="space-y-2">
											<Label>Lambda (L2)</Label>
											<Input
												type="number"
												min={0}
												max={0.1}
												step={0.001}
												value={lambdaReg}
												onChange={(e) =>
													setLambdaReg(
														Number(
															e.target.value || 0,
														),
													)
												}
											/>
										</div>
										<div className="space-y-2">
											<Label>Optimizer</Label>
											<Select
												value={optimizer}
												onValueChange={(v) =>
													setOptimizer(v as any)
												}
											>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="adam">
														Adam
													</SelectItem>
													<SelectItem value="sgd">
														SGD
													</SelectItem>
												</SelectContent>
											</Select>
										</div>
										<div className="space-y-2">
											<Label>Learning Rate</Label>
											<Input
												type="number"
												min={0.00001}
												step={0.001}
												value={learningRate}
												onChange={(e) =>
													setLearningRate(
														Number(
															e.target.value || 0,
														),
													)
												}
											/>
										</div>
										<div className="space-y-2">
											<Label>Epochs</Label>
											<Input
												type="number"
												min={10}
												max={1000}
												value={epochs}
												onChange={(e) =>
													setEpochs(
														Number(
															e.target.value || 0,
														),
													)
												}
											/>
										</div>
										<div className="space-y-2">
											<Label>Batch Size</Label>
											<Input
												type="number"
												min={16}
												step={16}
												value={batchSize}
												onChange={(e) =>
													setBatchSize(
														Number(
															e.target.value || 0,
														),
													)
												}
											/>
										</div>
										<div className="space-y-2">
											<Label>Seed</Label>
											<Input
												type="number"
												min={0}
												max={999999}
												value={seed}
												onChange={(e) =>
													setSeed(
														Number(
															e.target.value || 0,
														),
													)
												}
											/>
										</div>
									</div>
								</div>
							</div>

							<div className="flex items-center gap-3">
								<Button
									onClick={applyGoldenConfig}
									variant="secondary"
								>
									Apply Golden Configuration
								</Button>
								<Button
									onClick={startTrainAndPredict}
									disabled={
										!isConfigValid ||
										trainingStage === "training"
									}
									className="bg-blue-600 hover:bg-blue-700 text-white"
								>
									<Play className="h-5 w-5 mr-2" />
									Start Training & Prediction
								</Button>
								<Button
									onClick={handleResetTraining}
									variant="outline"
								>
									<RotateCcw className="h-5 w-5 mr-2" />
									Reset
								</Button>
							</div>

							{/* Training Status */}
							{trainingStage === "ready" && (
								<Card className="bg-green-50 border-green-200">
									<CardContent className="p-6">
										<div className="text-center space-y-4">
											<CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
											<h4 className="text-lg font-bold text-green-800">
												Ready to Train Model
											</h4>
											<p className="text-green-700">
												Select dataset and date range,
												then run training & prediction.
											</p>
											<Button
												onClick={startTrainAndPredict}
												size="lg"
												className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg"
												disabled={!isConfigValid}
											>
												<Play className="h-6 w-6 mr-3" />
												Start Model Training
											</Button>
										</div>
									</CardContent>
								</Card>
							)}

							{trainingStage === "training" && (
								<Card className="bg-blue-50 border-blue-200">
									<CardContent className="p-6">
										<div className="space-y-4">
											<div className="flex items-center justify-between">
												<h4 className="text-lg font-bold text-blue-800">
													Training in Progress...
												</h4>
												<Badge
													variant="secondary"
													className="bg-blue-100 text-blue-800"
												>
													{Math.round(
														trainingProgress,
													)}
													%
												</Badge>
											</div>
											<Progress
												value={trainingProgress}
												className="w-full"
											/>
											<div className="grid grid-cols-2 gap-4 text-sm">
												<div>
													<strong>
														Current Stage:
													</strong>
													<div className="text-blue-700">
														{trainingProgress < 25
															? "Data preprocessing"
															: trainingProgress <
																	50
																? "Feature extraction"
																: trainingProgress <
																		75
																	? "Model training"
																	: "Validation"}
													</div>
												</div>
												<div>
													<strong>
														Estimated Time:
													</strong>
													<div className="text-blue-700">
														~
														{Math.max(
															0,
															Math.round(
																(100 -
																	trainingProgress) /
																	10,
															),
														)}{" "}
														minutes remaining
													</div>
												</div>
											</div>
											<Alert>
												<Settings className="h-4 w-4" />
												<AlertDescription>
													Async job with server-side
													progress. Please keep this
													page open. Results will load
													when finished.
												</AlertDescription>
											</Alert>
										</div>
									</CardContent>
								</Card>
							)}

							{trainingStage === "completed" && (
								<Card className="bg-green-50 border-green-200">
									<CardContent className="p-6">
										<div className="text-center space-y-4">
											<CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
											<h4 className="text-lg font-bold text-green-800">
												Training & Prediction Completed!
											</h4>
											<p className="text-green-700">
												Model and top-K predictions are
												ready. Explore results and
												insights below.
											</p>
											<div className="flex gap-4 justify-center">
												<Button
													onClick={() =>
														setViewMode("results")
													}
													size="lg"
													className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3"
												>
													<TrendingUp className="h-5 w-5 mr-2" />
													View Results & Insights
												</Button>
												<Button
													onClick={
														handleResetTraining
													}
													variant="outline"
													size="lg"
													className="px-6 py-3"
												>
													<RotateCcw className="h-5 w-5 mr-2" />
													Retrain Model
												</Button>
											</div>
											{errorMessage && (
												<p className="text-red-600 mt-2">
													{errorMessage}
												</p>
											)}
										</div>
									</CardContent>
								</Card>
							)}
						</CardContent>
					</Card>

					{/* Stage 2 Preview */}
					{trainingStage === "completed" && (
						<Card className="border-purple-200">
							<CardHeader>
								<CardTitle className="flex items-center text-xl text-purple-800">
									<TrendingUp className="h-5 w-5 mr-2" />
									Stage 2: Model Evaluation & Performance
									Analysis
								</CardTitle>
								<p className="text-purple-600 text-sm">
									Comprehensive evaluation of model
									performance and predicted anomalies
								</p>
							</CardHeader>
							<CardContent>
								<Alert>
									<Target className="h-4 w-4" />
									<AlertDescription>
										<strong>Ready for Evaluation:</strong>{" "}
										Below shows metrics and top-ranked
										predicted anomalies from the specified
										interval. You can reproduce by
										re-applying the configuration.
									</AlertDescription>
								</Alert>
								<div className="flex justify-center mt-4">
									<Button
										onClick={() => setViewMode("results")}
										size="lg"
										className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3"
									>
										<ArrowRight className="h-5 w-5 mr-2" />
										View Detailed Results & Insights
									</Button>
								</div>
							</CardContent>
						</Card>
					)}
				</>
			) : (
				<>
					{/* Stage 2: Results and Insights */}
					<Card className="border-purple-200">
						<CardHeader>
							<CardTitle className="flex items-center justify-between">
								<div className="flex items-center text-xl text-purple-800">
									<TrendingUp className="h-5 w-5 mr-2" />
									Stage 2: Model Evaluation & Performance
									Analysis
								</div>
								<Button
									variant="outline"
									onClick={() => setViewMode("training")}
									className="flex items-center gap-2"
								>
									<ArrowRight className="h-4 w-4 rotate-180" />
									Back to Training
								</Button>
							</CardTitle>
							<div className="bg-purple-50 p-4 rounded-lg mt-4">
								<p className="text-purple-700">
									<strong>Evaluation Results:</strong> The
									following metrics and insights are based on
									the model's performance on the{" "}
									<strong>validation dataset</strong>,
									ensuring unbiased evaluation.
								</p>
							</div>
						</CardHeader>
						<CardContent>
							{/* Integrated Results Component */}
							<ResultsPhase />
							{resultsMeta && (
								<div className="mt-6 text-sm text-slate-700">
									<div>
										Model ID:{" "}
										<span className="font-mono">
											{modelId}
										</span>
									</div>
									<div>Type: {resultsMeta.model_type}</div>
									<div>
										Created at: {resultsMeta.created_at}
									</div>
								</div>
							)}
						</CardContent>
					</Card>
				</>
			)}
		</div>
	);
}
