"use client";

import {
	ArrowRight,
	Brain,
	CheckCircle,
	Play,
	RotateCcw,
	Settings,
	Target,
	TrendingUp,
	Zap,
} from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../../../components/ui/card";
import { Progress } from "../../../components/ui/progress";
import { ResultsPhase } from "./ResultsPhase";

type TrainingStage = "ready" | "training" | "completed";

export function ModelTrainingPhase() {
	const [trainingStage, setTrainingStage] = useState<TrainingStage>("ready");
	const [trainingProgress, setTrainingProgress] = useState(0);
	const [viewMode, setViewMode] = useState<"training" | "results">(
		"training",
	);

	const handleStartTraining = () => {
		setTrainingStage("training");
		setTrainingProgress(0);

		// Simulate training progress
		const interval = setInterval(() => {
			setTrainingProgress((prev) => {
				if (prev >= 100) {
					clearInterval(interval);
					setTrainingStage("completed");
					return 100;
				}
				return prev + Math.random() * 15;
			});
		}, 500);
	};

	const handleResetTraining = () => {
		setTrainingStage("ready");
		setTrainingProgress(0);
	};

	return (
		<div className="space-y-6">
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
								Stage 1: PU Learning Model Training
							</CardTitle>
							<p className="text-blue-600 text-sm">
								Train the Positive-Unlabeled learning model
								using your carefully curated positive samples
							</p>
						</CardHeader>
						<CardContent className="space-y-6">
							{/* Training Data Summary */}
							<div className="bg-blue-50 p-4 rounded-lg">
								<h4 className="font-semibold text-blue-800 mb-3 flex items-center">
									<Target className="h-4 w-4 mr-2" />
									Training Data Summary
								</h4>
								<div className="grid md:grid-cols-3 gap-4">
									<div className="text-center">
										<div className="text-2xl font-bold text-green-600">
											205
										</div>
										<div className="text-sm text-blue-700">
											Positive Samples
										</div>
										<div className="text-xs text-gray-600">
											(Labeled Anomalies)
										</div>
									</div>
									<div className="text-center">
										<div className="text-2xl font-bold text-blue-600">
											42.8M
										</div>
										<div className="text-sm text-blue-700">
											Unlabeled Samples
										</div>
										<div className="text-xs text-gray-600">
											(Contains hidden anomalies)
										</div>
									</div>
									<div className="text-center">
										<div className="text-2xl font-bold text-purple-600">
											PU Learning
										</div>
										<div className="text-sm text-blue-700">
											Training Method
										</div>
										<div className="text-xs text-gray-600">
											(Non-negative risk estimator)
										</div>
									</div>
								</div>
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
												System detected{" "}
												<Badge className="mx-1 bg-green-100 text-green-800">
													205 labeled positive samples
												</Badge>
												ready for training the PU
												Learning model.
											</p>
											<Button
												onClick={handleStartTraining}
												size="lg"
												className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg"
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
													The PU Learning model is
													being trained using the
													non-negative risk estimator.
													This process may take
													several minutes depending on
													data size.
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
												Training Completed Successfully!
											</h4>
											<p className="text-green-700">
												The PU Learning model has been
												trained and is ready for
												evaluation on validation data.
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
									performance on validation dataset
								</p>
							</CardHeader>
							<CardContent>
								<Alert>
									<Target className="h-4 w-4" />
									<AlertDescription>
										<strong>Ready for Evaluation:</strong>{" "}
										The trained model will now be evaluated
										on the validation dataset to measure its
										performance in detecting anomalies. View
										detailed metrics, comparisons, and
										insights.
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
						</CardContent>
					</Card>
				</>
			)}
		</div>
	);
}
