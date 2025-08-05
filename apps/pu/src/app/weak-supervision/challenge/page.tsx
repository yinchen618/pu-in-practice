"use client";

import { TrainingStatsPanel } from "@/app/weak-supervision/challenge/components/TrainingStatsPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";
import { useCallback, useRef } from "react";
import { AcademicReference } from "./components/AcademicReference";
import { AlgorithmComparisonTabs } from "./components/AlgorithmComparisonTabs";
import { AlgorithmStory } from "./components/AlgorithmStory";
import { CLLAlgorithmStepsPanel } from "./components/CLLAlgorithmStepsPanel";
import { CLLExperimentLog } from "./components/CLLExperimentLog";
import { CLLFormulasAndValuesPanel } from "./components/CLLFormulasAndValuesPanel";
import { DataPointLegend } from "./components/DataPointLegend";
import { ExperimentContext } from "./components/ExperimentContext";
import { ExperimentControl } from "./components/ExperimentControl";
import { ModeSelection } from "./components/ModeSelection";
import { PNUAlgorithmStepsPanel } from "./components/PNUAlgorithmStepsPanel";
import { PNUExperimentLog } from "./components/PNUExperimentLog";
import { PNUFormulasAndValuesPanel } from "./components/PNUFormulasAndValuesPanel";
import { PUAlgorithmStepsPanel } from "./components/PUAlgorithmStepsPanel";
import { PUExperimentLog } from "./components/PUExperimentLog";
import { PUFormulasAndValuesPanel } from "./components/PUFormulasAndValuesPanel";
import { useAlgorithmTraining } from "./hooks/useAlgorithmTraining";
import { useExperimentState } from "./hooks/useExperimentState";
import type { DataPoint } from "./lib/DatasetGenerator";
import type {
	CLLAlgorithmStep,
	PNUAlgorithmStep,
	PUAlgorithmStep,
} from "./types/common";

export default function WeakSupervisionChallenge() {
	const svgRef = useRef<SVGSVGElement | null>(null);
	return (
		<Suspense fallback={<div>載入中...</div>}>
			<WeakSupervisionChallengeContent svgRef={svgRef} />
		</Suspense>
	);
}

function WeakSupervisionChallengeContent({
	svgRef,
}: {
	svgRef: React.RefObject<SVGSVGElement | null>;
}) {
	const { state, actions } = useExperimentState(svgRef);
	const { startTraining } = useAlgorithmTraining({ state, actions });

	// 模式切換處理
	const handleModeChange = (mode: typeof state.currentMode) => {
		if (state.isRunning) {
			return;
		}
		actions.resetExperiment(mode);
	};

	// 獲取PU演算法步驟
	const getPUCurrentStep = (): PUAlgorithmStep => {
		if (state.currentStep === "learning") {
			return state.dashboardState.currentStep;
		}
		if (
			state.currentStep === "result" ||
			state.currentStep === "analysis"
		) {
			return "DONE";
		}
		return "IDLE";
	};

	// 獲取PNU演算法步驟
	const getPNUCurrentStep = (): PNUAlgorithmStep => {
		if (state.currentStep === "learning") {
			return state.pnuCurrentStep;
		}
		if (
			state.currentStep === "result" ||
			state.currentStep === "analysis"
		) {
			return "DONE";
		}
		return "IDLE";
	};

	// 獲取CLL演算法步驟
	const getCLLCurrentStep = (): CLLAlgorithmStep => {
		if (state.currentStep === "learning") {
			return state.cllCurrentStep;
		}
		if (
			state.currentStep === "result" ||
			state.currentStep === "analysis"
		) {
			return "DONE";
		}
		return "IDLE";
	};

	// 重新渲染結果的輔助函數
	const rerenderResults = useCallback(() => {
		if (!state.renderer || state.dataPoints.length === 0) {
			return;
		}

		const misclassifiedPoints = state.dataPoints.filter((point) => {
			if (state.currentMode === "PU") {
				// PU 模式：預測為正但實際為負，或預測為負但實際為正
				const predictedIsPositive =
					point.currentLabel === "P" || point.currentLabel === "PP";
				const actuallyIsPositive = point.trueLabel === "α";
				return predictedIsPositive !== actuallyIsPositive;
			}
			if (state.currentMode === "PNU") {
				// PNU 模式：根據最高概率預測 vs 真實標籤
				const probs = point.probabilities;
				const predictedLabel =
					probs.α > probs.β && probs.α > probs.γ
						? "α"
						: probs.β > probs.γ
							? "β"
							: "γ";
				return predictedLabel !== point.trueLabel;
			}
			if (state.currentMode === "CLL") {
				// CLL 模式：類似 PNU
				const probs = point.probabilities;
				const predictedLabel =
					probs.α > probs.β && probs.α > probs.γ
						? "α"
						: probs.β > probs.γ
							? "β"
							: "γ";
				return predictedLabel !== point.trueLabel;
			}
			return false;
		});

		// 重新渲染數據點，在分析階段顯示錯誤標記
		const showErrors = state.currentStep === "analysis";
		state.renderer.renderDataPoints(
			state.dataPoints,
			state.currentMode,
			showErrors,
			misclassifiedPoints,
		);

		// 如果是 PU 模式，嘗試重新渲染決策邊界
		if (state.currentMode === "PU" && state.showPredictionResult) {
			// 使用現有數據點重新計算決策邊界
			const positivePoints = state.dataPoints.filter(
				(point) => point.currentLabel === "P",
			);
			const reliableNegativePoints = state.dataPoints.filter(
				(point) => point.currentLabel === "RN",
			);

			if (
				positivePoints.length > 0 &&
				reliableNegativePoints.length > 0
			) {
				// 簡化的決策邊界計算
				const posCentroid = {
					x:
						positivePoints.reduce((sum, p) => sum + p.x, 0) /
						positivePoints.length,
					y:
						positivePoints.reduce((sum, p) => sum + p.y, 0) /
						positivePoints.length,
				};
				const negCentroid = {
					x:
						reliableNegativePoints.reduce(
							(sum, p) => sum + p.x,
							0,
						) / reliableNegativePoints.length,
					y:
						reliableNegativePoints.reduce(
							(sum, p) => sum + p.y,
							0,
						) / reliableNegativePoints.length,
				};

				// 計算中點和垂直平分線
				const midX = (posCentroid.x + negCentroid.x) / 2;
				const midY = (posCentroid.y + negCentroid.y) / 2;

				// 計算垂直向量
				const dx = negCentroid.x - posCentroid.x;
				const dy = negCentroid.y - posCentroid.y;
				const length = Math.sqrt(dx * dx + dy * dy);

				if (length > 0) {
					const perpX = -dy / length;
					const perpY = dx / length;
					const lineLength = 300; // 線的長度

					const boundary = {
						x1: midX - perpX * lineLength,
						y1: midY - perpY * lineLength,
						x2: midX + perpX * lineLength,
						y2: midY + perpY * lineLength,
					};

					state.renderer.renderDecisionBoundary(boundary);
				}
			}
		}
	}, [
		state.renderer,
		state.dataPoints,
		state.currentMode,
		state.showPredictionResult,
	]);

	// 分析結果邏輯
	const analyzeResults = async () => {
		if (state.isRunning) {
			return;
		}

		actions.setIsRunning(true);
		actions.setCurrentStep("analysis");

		// 立即設置分析進行中的狀態
		if (state.currentMode === "PU") {
			const initialPuStats = {
				accuracy: 0,
				totalSamples: state.dataPoints.length,
				misclassifiedSamples: 0,
				averageEntropy: 0,
				positiveSamples: state.dataPoints.filter(
					(p) => p.currentLabel === "P",
				).length,
				unlabeledSamples: state.dataPoints.filter(
					(p) => p.currentLabel === "U",
				).length,
				rnCount: state.dataPoints.filter((p) => p.currentLabel === "RN")
					.length,
				analysisComplete: false,
				currentPhase: "analysis" as const,
				logs: ["開始分析樣本數據..."],
			};
			actions.setPuStats(initialPuStats);
		} else if (state.currentMode === "PNU") {
			const initialPnuStats = {
				accuracy: 0,
				totalSamples: state.dataPoints.length,
				misclassifiedSamples: 0,
				averageEntropy: 0,
				iterationsCompleted: state.pnuIteration,
				analysisComplete: false,
				currentPhase: "analysis" as const,
				logs: ["開始分析樣本數據..."],
			};
			actions.setPnuStats(initialPnuStats);
		} else if (state.currentMode === "CLL") {
			const initialCllStats = {
				accuracy: 0,
				totalSamples: state.dataPoints.length,
				misclassifiedSamples: 0,
				averageEntropy: 0,
				complementaryLabelsProcessed: state.cllCluesProcessed,
				analysisComplete: false,
				currentPhase: "analysis" as const,
				logs: ["開始分析樣本數據..."],
			};
			actions.setCllStats(initialCllStats);
		}

		try {
			let analysisPoints: DataPoint[] = [];
			let accuracy = 0;

			if (state.currentMode === "PU" && state.puAlgorithm) {
				// 使用真正的 PU 算法分析
				if (state.puAlgorithm.canAnalyzeResults()) {
					analysisPoints = await state.puAlgorithm.analyzeResults();

					const stats = state.puAlgorithm.getAnalysisStats();
					if (stats) {
						accuracy = stats.accuracy;

						// 詳細計算各類數據點
						console.log("🔍 [PU Analysis] 開始詳細分析...");
						console.log(
							"📊 [PU Analysis] 總數據點:",
							analysisPoints.length,
						);

						// 計算 True Positives (TP) - 正確識別的正樣本
						const truePositives = analysisPoints.filter((point) => {
							const predictedPositive =
								point.currentLabel === "PP" ||
								point.currentLabel === "P";
							const actuallyPositive = point.trueLabel === "α";
							return predictedPositive && actuallyPositive;
						});

						// 計算 False Positives (FP) - 誤識別為正樣本的負樣本
						const falsePositives = analysisPoints.filter(
							(point) => {
								const predictedPositive =
									point.currentLabel === "PP" ||
									point.currentLabel === "P";
								const actuallyPositive =
									point.trueLabel === "α";
								return predictedPositive && !actuallyPositive;
							},
						);

						// 計算 True Negatives (TN) - 正確識別的負樣本
						const trueNegatives = analysisPoints.filter((point) => {
							const predictedNegative =
								point.currentLabel === "PN" ||
								point.currentLabel === "U" ||
								point.currentLabel === "RN";
							const actuallyNegative = point.trueLabel !== "α";
							return predictedNegative && actuallyNegative;
						});

						// 計算 False Negatives (FN) - 誤識別為負樣本的正樣本
						const falseNegatives = analysisPoints.filter(
							(point) => {
								const predictedNegative =
									point.currentLabel === "PN" ||
									point.currentLabel === "U" ||
									point.currentLabel === "RN";
								const actuallyPositive =
									point.trueLabel === "α";
								return predictedNegative && actuallyPositive;
							},
						);

						console.log(
							"✅ [PU Analysis] True Positives (TP):",
							truePositives.length,
						);
						console.log(
							"❌ [PU Analysis] False Positives (FP):",
							falsePositives.length,
						);
						console.log(
							"✅ [PU Analysis] True Negatives (TN):",
							trueNegatives.length,
						);
						console.log(
							"❌ [PU Analysis] False Negatives (FN):",
							falseNegatives.length,
						);

						// 驗證總數
						const total =
							truePositives.length +
							falsePositives.length +
							trueNegatives.length +
							falseNegatives.length;
						console.log(
							"🔢 [PU Analysis] 驗證總數:",
							total,
							"vs",
							analysisPoints.length,
						);

						// 計算準確率
						const correctPredictions =
							truePositives.length + trueNegatives.length;
						const calculatedAccuracy =
							correctPredictions / analysisPoints.length;
						console.log(
							"📈 [PU Analysis] 計算準確率:",
							calculatedAccuracy,
							"vs API準確率:",
							accuracy,
						);

						// 計算平均熵值
						const averageEntropy =
							analysisPoints.length > 0
								? analysisPoints.reduce((sum, point) => {
										const probs = [
											point.probabilities.α,
											point.probabilities.β,
											point.probabilities.γ,
										];
										const entropy = -probs.reduce(
											(acc, p) =>
												p > 0
													? acc + p * Math.log2(p)
													: acc,
											0,
										);
										return sum + entropy;
									}, 0) / analysisPoints.length
								: 0;

						// 更新 PU 統計數據
						const puStatsData = {
							accuracy: calculatedAccuracy, // 使用計算出的準確率
							totalSamples: analysisPoints.length,
							misclassifiedSamples:
								falsePositives.length + falseNegatives.length,
							averageEntropy: averageEntropy,
							positiveSamples:
								truePositives.length + falsePositives.length, // 預測為正的總數
							unlabeledSamples: analysisPoints.filter(
								(p) => p.currentLabel === "U",
							).length,
							rnCount: analysisPoints.filter(
								(p) => p.currentLabel === "RN",
							).length,
							analysisComplete: true,
							currentPhase: "analysis" as const,
							logs: [
								`分析完成，準確率: ${(calculatedAccuracy * 100).toFixed(0)}%`,
								`正確預測: ${correctPredictions} 個，錯誤預測: ${falsePositives.length + falseNegatives.length} 個`,
							],
						};
						actions.setPuStats(puStatsData);

						// 保存詳細統計數據到 state 中，供實驗日誌使用
						actions.setPuAnalysisStats({
							totalPoints: analysisPoints.length,
							truePositives: truePositives.length,
							falsePositives: falsePositives.length,
							trueNegatives: trueNegatives.length,
							falseNegatives: falseNegatives.length,
							accuracy: calculatedAccuracy,
						});
					}
				}
			} else if (state.currentMode === "PNU" && state.pnuAlgorithm) {
				// 使用真正的 PNU 算法分析
				if (state.pnuAlgorithm.canAnalyzeResults()) {
					analysisPoints = await state.pnuAlgorithm.analyzeResults();
					const stats = state.pnuAlgorithm.getAnalysisStats();
					if (stats) {
						accuracy = stats.accuracy;

						// 計算平均熵值
						const averageEntropy =
							analysisPoints.length > 0
								? analysisPoints.reduce((sum, point) => {
										const probs = [
											point.probabilities.α,
											point.probabilities.β,
											point.probabilities.γ,
										];
										const entropy = -probs.reduce(
											(acc, p) =>
												p > 0
													? acc + p * Math.log2(p)
													: acc,
											0,
										);
										return sum + entropy;
									}, 0) / analysisPoints.length
								: 0;

						// 更新 PNU 統計數據
						const pnuStatsData = {
							accuracy: stats.accuracy,
							totalSamples: analysisPoints.length,
							misclassifiedSamples: analysisPoints.filter(
								(point) => {
									const probs = point.probabilities;
									const predictedLabel =
										probs.α > probs.β && probs.α > probs.γ
											? "α"
											: probs.β > probs.γ
												? "β"
												: "γ";
									return predictedLabel !== point.trueLabel;
								},
							).length,
							averageEntropy: averageEntropy,
							iterationsCompleted: state.pnuIteration,
							analysisComplete: true,
							currentPhase: "analysis" as const,
							logs: [
								`分析完成，準確率: ${(stats.accuracy * 100).toFixed(1)}%`,
							],
						};
						actions.setPnuStats(pnuStatsData);
					}
				}
			} else if (state.currentMode === "CLL" && state.cllAlgorithm) {
				// 使用真正的 CLL 算法分析
				if (state.cllAlgorithm.canAnalyzeResults()) {
					analysisPoints = await state.cllAlgorithm.analyzeResults();
					accuracy = state.cllAlgorithm.calculateAccuracy();

					// 更新 CLL 統計數據
					const cllStatsData = {
						accuracy: accuracy,
						totalSamples: analysisPoints.length,
						misclassifiedSamples: analysisPoints.filter((point) => {
							const probs = point.probabilities;
							const predictedLabel =
								probs.α > probs.β && probs.α > probs.γ
									? "α"
									: probs.β > probs.γ
										? "β"
										: "γ";
							return predictedLabel !== point.trueLabel;
						}).length,
						averageEntropy:
							analysisPoints.reduce((sum, point) => {
								const probs = [
									point.probabilities.α,
									point.probabilities.β,
									point.probabilities.γ,
								];
								const entropy = -probs.reduce(
									(acc, p) =>
										p > 0 ? acc + p * Math.log2(p) : acc,
									0,
								);
								return sum + entropy;
							}, 0) / analysisPoints.length,
						complementaryLabelsProcessed: state.cllCluesProcessed,
						analysisComplete: true,
						currentPhase: "analysis" as const,
						logs: [
							`分析完成，準確率: ${(accuracy * 100).toFixed(1)}%`,
						],
					};
					actions.setCllStats(cllStatsData);
				}
			}

			// 更新數據點和準確率
			if (analysisPoints.length > 0) {
				// 檢查有多少預測錯誤的點
				const wrongPredictions = analysisPoints.filter((point) => {
					if (state.currentMode === "PU") {
						// PU模式：檢查PP/PN標籤 vs 真實標籤
						const predictedPositive = point.currentLabel === "PP";
						const actuallyPositive = point.trueLabel === "α"; // α 是正例
						return predictedPositive !== actuallyPositive;
					}
					return false;
				});

				actions.setDataPoints(analysisPoints);
			}
			actions.setAccuracy(accuracy);

			// 立即重新渲染，顯示錯誤標記
			if (state.renderer) {
				// 計算錯誤分類的點
				const misclassifiedPoints = analysisPoints.filter((point) => {
					if (state.currentMode === "PU") {
						const predictedPositive = point.currentLabel === "PP";
						const actuallyPositive = point.trueLabel === "α";
						return predictedPositive !== actuallyPositive;
					}
					// 其他模式的邏輯...
					return false;
				});

				// 在分析階段顯示錯誤標記
				state.renderer.renderDataPoints(
					analysisPoints,
					state.currentMode,
					true, // showErrors = true，因為我們在 analysis 階段
					misclassifiedPoints,
				);
			}
		} catch (error) {
			console.error("Analysis failed:", error);
		} finally {
			actions.setIsRunning(false);
		}
	};

	// 檢查是否可以分析結果
	const canAnalyzeResults = () => {
		// 只有在 result 階段且不在運行中才能分析
		if (state.currentStep !== "result" || state.isRunning) {
			return false;
		}

		// 檢查是否有對應的算法實例且可以分析
		switch (state.currentMode) {
			case "PU": {
				const puCanAnalyze =
					state.puAlgorithm?.canAnalyzeResults() ?? false;
				return puCanAnalyze;
			}
			case "PNU": {
				const pnuCanAnalyze =
					state.pnuAlgorithm?.canAnalyzeResults() ?? false;
				return pnuCanAnalyze;
			}
			case "CLL": {
				const cllCanAnalyze =
					state.cllAlgorithm?.canAnalyzeResults() ?? false;
				return cllCanAnalyze;
			}
			default:
				return false;
		}
	};

	return (
		<div className="min-h-screen bg-gray-50 p-4">
			{/* 頁面標題 */}
			<div className="max-w-7xl mx-auto mb-6">
				<h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
					杉山教授的弱監督學習挑戰
				</h1>
				<p className="text-center text-gray-600">
					Professor Sugiyama's Weak Supervision Challenge
				</p>
			</div>

			<div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* 左側控制面板 */}
				<div className="lg:col-span-1 space-y-4">
					{/* 故事情境 */}
					<AlgorithmStory mode={state.currentMode} />

					{/* 模式選擇 */}
					<ModeSelection
						currentMode={state.currentMode}
						onModeChange={handleModeChange}
						isDisabled={state.isRunning}
					/>

					{/* 實驗控制 */}
					<ExperimentControl
						currentStep={state.currentStep}
						currentMode={state.currentMode}
						animationProgress={state.animationProgress}
						accuracy={state.accuracy}
						isRunning={state.isRunning}
						showPredictionResult={state.showPredictionResult}
						canAnalyzeResults={canAnalyzeResults()}
						onStartTraining={startTraining}
						onAnalyzeResults={analyzeResults}
						onResetExperiment={() =>
							actions.resetExperiment(state.currentMode)
						}
					/>

					{/* 實驗日誌 */}
					<Card>
						<CardHeader>
							<CardTitle>實驗日誌</CardTitle>
						</CardHeader>
						<CardContent>
							{state.currentMode === "PU" && (
								<PUExperimentLog
									currentStep={state.currentStep}
									phase1Status={
										state.dashboardState.phase1Status
									}
									phase2Status={
										state.dashboardState.phase2Status
									}
									className="min-h-[300px]"
									analysisStats={
										state.puAnalysisStats || undefined
									}
								/>
							)}
							{state.currentMode === "PNU" && (
								<PNUExperimentLog
									currentStep={state.currentStep}
									iteration={state.pnuIteration}
									convergence={state.pnuConvergence}
									className="min-h-[300px]"
								/>
							)}
							{state.currentMode === "CLL" && (
								<CLLExperimentLog
									currentStep={state.currentStep}
									cluesProcessed={state.cllCluesProcessed}
									className="min-h-[300px]"
								/>
							)}

							{/* 數據點說明 */}
							<DataPointLegend mode={state.currentMode} />
						</CardContent>
					</Card>
				</div>

				{/* 右側主視覺和演算法面板 */}
				<div className="lg:col-span-2 space-y-4">
					{/* 主視覺畫布 */}
					<Card>
						<CardHeader>
							<CardTitle>實驗工作台</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="border border-gray-200 rounded-lg bg-white">
								<svg
									ref={svgRef}
									width="800"
									height="600"
									className="w-full h-auto"
								/>
							</div>
						</CardContent>
					</Card>

					{/* 實驗情境說明 */}
					<ExperimentContext mode={state.currentMode} />

					{/* 演算法步驟與公式面板 */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{state.currentMode === "PU" && (
							<>
								<PUAlgorithmStepsPanel
									currentStep={getPUCurrentStep()}
								/>
								<PUFormulasAndValuesPanel
									currentStep={getPUCurrentStep()}
									pCentroid={state.dashboardState.pCentroid}
									rnCount={state.dashboardState.rnCount}
									iteration={state.dashboardState.iteration}
									margin={state.dashboardState.margin}
								/>
							</>
						)}
						{state.currentMode === "PNU" && (
							<>
								<PNUAlgorithmStepsPanel
									currentStep={getPNUCurrentStep()}
								/>
								<PNUFormulasAndValuesPanel
									currentStep={getPNUCurrentStep()}
									iteration={state.pnuIteration}
									convergence={state.pnuConvergence}
									totalNodes={state.pnuTotalNodes}
									labeledNodes={state.pnuLabeledNodes}
								/>
							</>
						)}
						{state.currentMode === "CLL" && (
							<>
								<CLLAlgorithmStepsPanel
									currentStep={getCLLCurrentStep()}
								/>
								<CLLFormulasAndValuesPanel
									cluesProcessed={state.cllCluesProcessed}
									modelConfidence={state.cllModelConfidence}
									isActive={state.currentStep === "learning"}
								/>
							</>
						)}
					</div>
				</div>
			</div>

			{/* 深度比較分析區塊 */}
			<div className="max-w-7xl mx-auto mt-8">
				{/* 統計面板 */}
				<TrainingStatsPanel
					currentMode={state.currentMode}
					puStats={state.puStats || undefined}
					pnuStats={state.pnuStats || undefined}
					cllStats={state.cllStats || undefined}
					isRunning={state.isRunning}
					currentStep={state.currentStep}
				/>

				<AlgorithmComparisonTabs mode={state.currentMode} />
			</div>

			{/* 學術參考區塊 */}
			<div className="max-w-7xl mx-auto mt-8">
				<AcademicReference />
			</div>
		</div>
	);
}
