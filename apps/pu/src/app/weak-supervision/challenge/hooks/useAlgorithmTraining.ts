import { useCallback } from "react";
import { CLLLearningAlgorithm } from "../lib/CLLLearningAlgorithm";
import type { DataPoint } from "../lib/DatasetGenerator";
import { DatasetGenerator } from "../lib/DatasetGenerator";
import { PNULearningAlgorithm } from "../lib/PNULearningAlgorithm";
import { PULearningAlgorithm } from "../lib/PULearningAlgorithm";
import type { DashboardData } from "../lib/PULearningAlgorithm";
import type { CLLDashboardData } from "../lib/types/CLLDashboardData";
import type { PNUDashboardData } from "../lib/types/PNUDashboardData";
import type { ExperimentState } from "./useExperimentState";

interface UseAlgorithmTrainingProps {
	state: ExperimentState;
	actions: {
		setIsRunning: (value: boolean) => void;
		setCurrentStep: (value: any) => void;
		setAnimationProgress: (value: number) => void;
		setDataPoints: (value: DataPoint[]) => void;
		setAccuracy: (value: number) => void;
		setShowPredictionResult: (value: boolean) => void;
		setDashboardState: (value: any) => void;
		setPuAlgorithm: (value: any) => void;
		setPnuAlgorithm: (value: any) => void;
		setCllAlgorithm: (value: any) => void;
		setPuStats: (value: any) => void;
		setPnuStats: (value: any) => void;
		setCllStats: (value: any) => void;
		setPnuCurrentStep: (value: any) => void;
		setPnuIteration: (value: number) => void;
		setPnuConvergence: (value: number) => void;
		setCllCurrentStep: (value: any) => void;
		setCllCluesProcessed: (value: number) => void;
		setCllModelConfidence: (value: number) => void;
	};
}

export function useAlgorithmTraining({
	state,
	actions,
}: UseAlgorithmTrainingProps) {
	const { currentMode, dataPoints, isRunning, uiController, renderer } =
		state;

	// PU 演算法 dashboard 更新回調
	const handleDashboardUpdate = useCallback(
		(data: DashboardData) => {
			actions.setDashboardState((prev: any) => ({
				...prev,
				currentStep: data.currentStep || prev.currentStep,
				pCentroid: data.pCentroid || prev.pCentroid,
				rnCount: data.rnCount || prev.rnCount,
				iteration: data.iteration || prev.iteration,
				margin: data.margin || prev.margin,
				logs: data.logs || prev.logs,
				phase1Status: data.phase1Status || prev.phase1Status,
				phase2Status: data.phase2Status || prev.phase2Status,
			}));

			// 更新PU統計數據
			actions.setPuStats(data);
		},
		[actions],
	);

	// PNU 演算法 dashboard 更新回調
	const handlePNUDashboardUpdate = useCallback(
		(data: PNUDashboardData) => {
			// 更新PNU統計數據
			actions.setPnuStats(data);
		},
		[actions],
	);

	// CLL 演算法 dashboard 更新回調
	const handleCLLDashboardUpdate = useCallback(
		(data: CLLDashboardData) => {
			if (data.currentPhase === "learning") {
				actions.setCllCurrentStep("CLUE_PROCESSING");
			} else if (data.currentPhase === "initial") {
				actions.setCllCurrentStep("POSSIBILITY_INITIALIZATION");
			}

			actions.setCllCluesProcessed(
				data.complementaryLabelsProcessed || 0,
			);

			const confidence = Math.min(
				90,
				33.3 + (data.complementaryLabelsProcessed || 0) * 7,
			);
			actions.setCllModelConfidence(confidence);

			// 更新CLL統計數據
			actions.setCllStats(data);
		},
		[actions],
	);

	// 啟動模型訓練
	const startTraining = useCallback(async () => {
		if (!dataPoints.length || isRunning) {
			return;
		}

		actions.setIsRunning(true);
		actions.setCurrentStep("start");

		if (uiController) {
			uiController.setStep("start");
		}

		await new Promise((resolve) => setTimeout(resolve, 500));

		actions.setCurrentStep("learning");
		if (uiController) {
			uiController.setStep("learning");
		}

		try {
			const generator = DatasetGenerator.getInstance();
			const freshBaseDataPoints = generator.generateDataset();
			const freshTrainingDataPoints = generator.initializeLabelsForMode(
				freshBaseDataPoints,
				currentMode,
			);

			let algorithm: any;

			switch (currentMode) {
				case "PU": {
					const puAlg = new PULearningAlgorithm(
						freshTrainingDataPoints,
						{
							onProgressUpdate: (progress: number) => {
								actions.setAnimationProgress(progress * 100);
								if (uiController) {
									uiController.setAnimationProgress(progress);
								}
							},
							onStageComplete: (
								_stage: string,
								points: DataPoint[],
							) => {
								actions.setDataPoints([...points]);
								if (renderer) {
									renderer.renderDataPoints(
										points,
										currentMode,
									);
								}
							},
							onDashboardUpdate: handleDashboardUpdate,
						},
					);
					algorithm = puAlg;
					// 注意：不要在這裡保存算法實例，等到執行完成後再保存
					break;
				}
				case "PNU": {
					const labeledData = freshTrainingDataPoints.filter(
						(point) => point.isLabeled,
					);
					const unlabeledData = freshTrainingDataPoints.filter(
						(point) => !point.isLabeled,
					);

					actions.setPnuCurrentStep("GRAPH_CONSTRUCTION");

					const pnuAlg = new PNULearningAlgorithm(
						labeledData,
						unlabeledData,
						(progress) => {
							actions.setAnimationProgress(progress * 100);
							if (uiController) {
								uiController.setAnimationProgress(progress);
							}

							if (progress < 0.2) {
								actions.setPnuCurrentStep("GRAPH_CONSTRUCTION");
							} else {
								actions.setPnuCurrentStep("LABEL_PROPAGATION");
								const iteration = Math.floor(progress * 20);
								const convergence = Math.max(
									0.001,
									(1 - progress) * 0.1,
								);
								actions.setPnuIteration(iteration);
								actions.setPnuConvergence(convergence);
							}
						},
						(_iteration, points) => {
							actions.setDataPoints([...points]);
							if (renderer) {
								renderer.renderDataPoints(points, currentMode);
							}
						},
						handlePNUDashboardUpdate,
					);
					algorithm = pnuAlg;
					// 注意：不要在這裡保存算法實例，等到執行完成後再保存
					break;
				}
				case "CLL": {
					actions.setCllCurrentStep("POSSIBILITY_INITIALIZATION");
					actions.setCllCluesProcessed(0);
					actions.setCllModelConfidence(33.3);

					const cllAlg = new CLLLearningAlgorithm(
						freshTrainingDataPoints,
						{
							onProgressUpdate: (progress) => {
								actions.setAnimationProgress(progress * 100);
								if (uiController) {
									uiController.setAnimationProgress(progress);
								}
							},
							onComplementaryLabelReceived: (
								_pointIndex,
								_excludeLabel,
								points,
							) => {
								actions.setDataPoints([...points]);
								if (renderer) {
									renderer.renderDataPoints(
										points,
										currentMode,
									);
								}
							},
							onDashboardUpdate: handleCLLDashboardUpdate,
						},
					);
					algorithm = cllAlg;
					// 注意：不要在這裡保存算法實例，等到執行完成後再保存
					break;
				}
			}

			const resultPoints = await algorithm.execute();
			actions.setDataPoints(resultPoints);

			if (currentMode === "PU") {
				console.log(
					"[useAlgorithmTraining] PU training completed, setting up prediction result state",
				);
				console.log(
					"[useAlgorithmTraining] Result points count:",
					resultPoints.length,
				);
				console.log(
					"[useAlgorithmTraining] Algorithm type:",
					algorithm.constructor.name,
				);

				// 保存 PU 算法實例到狀態中 (在執行完成後，predictionComplete已設置)
				actions.setPuAlgorithm(algorithm);
				console.log(
					"[useAlgorithmTraining] PU algorithm saved to state",
				);

				actions.setCurrentStep("result");
				if (uiController) {
					uiController.setStep("result");
				}

				if (renderer && algorithm.getDecisionBoundary) {
					const boundary = algorithm.getDecisionBoundary();
					console.log(
						"[useAlgorithmTraining] Decision boundary:",
						boundary ? "exists" : "none",
					);
					if (boundary) {
						renderer.renderDecisionBoundary(boundary);
					}
				}

				actions.setShowPredictionResult(true);
				console.log(
					"[useAlgorithmTraining] showPredictionResult set to true",
				);
			} else {
				// 保存對應的算法實例到狀態中
				if (currentMode === "PNU") {
					actions.setPnuAlgorithm(algorithm);
				} else if (currentMode === "CLL") {
					actions.setCllAlgorithm(algorithm);
				}

				const accuracy = algorithm.calculateAccuracy();
				actions.setAccuracy(accuracy);
				actions.setCurrentStep("result");
				if (uiController) {
					uiController.setStep("result");
				}
			}

			if (renderer) {
				// 在結果階段顯示錯誤分類標記
				const misclassifiedPoints = algorithm.getMisclassifiedPoints
					? algorithm.getMisclassifiedPoints()
					: [];
				// 對於所有模式，在結果階段都不顯示錯誤標記，只在分析階段顯示
				const showErrors = false;
				renderer.renderDataPoints(
					resultPoints,
					currentMode,
					showErrors,
					misclassifiedPoints,
				);
			}
		} catch (error) {
			console.error("Training failed:", error);
		} finally {
			actions.setIsRunning(false);
		}
	}, [
		dataPoints,
		isRunning,
		currentMode,
		uiController,
		renderer,
		actions,
		handleDashboardUpdate,
		handleCLLDashboardUpdate,
	]);

	return {
		startTraining,
	};
}
