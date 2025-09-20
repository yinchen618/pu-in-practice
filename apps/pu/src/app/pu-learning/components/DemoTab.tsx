"use client";

import ModelConfigurationControls from "@/app/pu-learning/components/ModelConfigurationControls";
import { LaTeX } from "@/components/LaTeX";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronRight, Info } from "lucide-react";
import type React from "react";
import { useState } from "react";
import DataVisualization from "./DataVisualization";
import ExperimentSetupControls from "./ExperimentSetupControls";
import KeyInsightsSection from "./KeyInsightsSection";
import RiskCurveChart from "./RiskCurveChart";
import RunSimulationControls from "./RunSimulationControls";
import type { DataParams, SimulationResult } from "./types";

interface DemoTabProps {
	algorithm: "uPU" | "nnPU";
	setAlgorithm: (alg: "uPU" | "nnPU") => void;
	priorEstimationMethod: "mean" | "median";
	setPriorEstimationMethod: (m: "mean" | "median") => void;
	hiddenSize: number;
	setHiddenSize: (s: number) => void;
	lambdaRegularization: number;
	setLambdaRegularization: (l: number) => void;
	learningRate: number;
	setLearningRate: (r: number) => void;
	activationFunction: string;
	setActivationFunction: (a: string) => void;
	epochs: number;
	setEpochs: (e: number) => void;
	randomSeed: number;
	setRandomSeed: (s: number) => void;
	handleRandomizeSeed: () => void;
	dataParams: DataParams;
	setDataParams: (p: DataParams) => void;
	isTraining: boolean;
	handleTrain: () => void;
	error: string | null;
	results: SimulationResult | null;
	currentConfig: {
		distribution: string;
		dimensions: number;
		sampleSize: number;
		positiveRatio: number;
		labelFrequency: number;
		hiddenSize: number;
	};
	handleOptimalSetup: () => void;
	handleBlindsEffectSetup: () => void;
}

export default function DemoTab({
	algorithm,
	setAlgorithm,
	priorEstimationMethod,
	setPriorEstimationMethod,
	hiddenSize,
	setHiddenSize,
	lambdaRegularization,
	setLambdaRegularization,
	learningRate,
	setLearningRate,
	activationFunction,
	setActivationFunction,
	epochs,
	setEpochs,
	randomSeed,
	setRandomSeed,
	handleRandomizeSeed,
	dataParams,
	setDataParams,
	isTraining,
	handleTrain,
	error,
	results,
	currentConfig,
	handleOptimalSetup,
	handleBlindsEffectSetup,
}: DemoTabProps) {
	// Accordion 狀態
	const [experimentOpen, setExperimentOpen] = useState(true);
	const [modelOpen, setModelOpen] = useState(true);
	const [simulationOpen, setSimulationOpen] = useState(true);

	return (
		<div className="space-y-12">
			<div className="text-center space-y-4">
				<h1 className="text-4xl font-bold text-slate-800 mb-4">
					Risk Demo
				</h1>
				<h2 className="text-2xl font-semibold text-slate-700">
					Interactive Risk Estimation with uPU & nnPU
				</h2>
				<p className="text-lg text-slate-700 max-w-3xl mx-auto">
					A lightweight sandbox validating{" "}
					<strong>unbiased risk estimation</strong> under controllable
					settings. Adjust data and model knobs, then observe how the
					estimated risk{" "}
					<LaTeX displayMode={false}>{"\\hat{R}"}</LaTeX> relates to
					the true risk <LaTeX displayMode={false}>{"R"}</LaTeX>, and
					how prior estimation{" "}
					<LaTeX displayMode={false}>{"\\hat{\\pi}_p"}</LaTeX> impacts
					stability.
				</p>
			</div>

			{/* C3: 互動 Demo 主區域 */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				{/* C3.1: 左欄 - 參數設定面板 (30%) */}
				<div className="lg:col-span-1">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								Control Panel
								<Info className="h-4 w-4 text-slate-500" />
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-6">
							{/* 第一區塊：Experiment Setup */}
							<div>
								<button
									type="button"
									onClick={() =>
										setExperimentOpen(!experimentOpen)
									}
									className="flex items-center gap-2 w-full text-left py-2 font-medium hover:bg-gray-50 rounded"
								>
									{experimentOpen ? (
										<ChevronDown className="h-4 w-4" />
									) : (
										<ChevronRight className="h-4 w-4" />
									)}
									<span>1. Experiment Setup</span>
								</button>
								{experimentOpen && (
									<div className="pl-6 space-y-4 pt-2">
										<ExperimentSetupControls
											dataParams={dataParams}
											onDataParamsChange={setDataParams}
											randomSeed={randomSeed}
											setRandomSeed={setRandomSeed}
											handleRandomizeSeed={
												handleRandomizeSeed
											}
										/>
									</div>
								)}
								{experimentOpen && (
									<hr className="my-4 border-gray-200" />
								)}
							</div>

							{/* 第二區塊：Model Configuration */}
							<div>
								<button
									type="button"
									onClick={() => setModelOpen(!modelOpen)}
									className="flex items-center gap-2 w-full text-left py-2 font-medium hover:bg-gray-50 rounded"
								>
									{modelOpen ? (
										<ChevronDown className="h-4 w-4" />
									) : (
										<ChevronRight className="h-4 w-4" />
									)}
									<span>2. Model Configuration</span>
								</button>
								{modelOpen && (
									<div className="pl-6 space-y-4 pt-1">
										<ModelConfigurationControls
											algorithm={algorithm}
											onAlgorithmChange={setAlgorithm}
											priorEstimationMethod={
												priorEstimationMethod
											}
											onMethodChange={
												setPriorEstimationMethod
											}
											hiddenSize={hiddenSize}
											setHiddenSize={setHiddenSize}
											lambdaRegularization={
												lambdaRegularization
											}
											setLambdaRegularization={
												setLambdaRegularization
											}
											learningRate={learningRate}
											setLearningRate={setLearningRate}
											activationFunction={
												activationFunction
											}
											setActivationFunction={
												setActivationFunction
											}
											epochs={epochs}
											setEpochs={setEpochs}
											onOptimalSetup={handleOptimalSetup}
											onBlindsEffectSetup={
												handleBlindsEffectSetup
											}
										/>
									</div>
								)}
								{modelOpen && (
									<hr className="my-4 border-gray-200" />
								)}
							</div>

							{/* 第三區塊：Run Simulation */}
							<div className="pl-6 space-y-4">
								<RunSimulationControls
									isTraining={isTraining}
									onTrain={handleTrain}
									error={error}
								/>
								<div className="pt-2">
									<a
										href="/case-study?tab=model-training"
										className="text-sm text-blue-700 hover:underline"
									>
										Use this configuration on real testbed
										data →
									</a>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* C3.2: 右欄 - 視覺化與結果 (70%) */}
				<div className="lg:col-span-2 space-y-6">
					{/* Ground Truth Reference */}
					<div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-center">
						<p className="text-sm text-blue-800">
							<strong>Ground Truth Reference:</strong> Class prior{" "}
							<LaTeX displayMode={false}>{"\\pi_p = 0.30"}</LaTeX>{" "}
							(30%) - Use this as baseline for{" "}
							<LaTeX displayMode={false}>{"\\hat{\\pi}_p"}</LaTeX>{" "}
							accuracy evaluation
						</p>
					</div>

					{/* 視覺化圖表 */}
					<DataVisualization results={results} />

					{/* Risk Curve Analysis 和 Current Configuration 左右排列 */}
					{results && (
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							{/* 左邊：Risk Curve Analysis */}
							<RiskCurveChart
								results={results}
								algorithm={algorithm}
							/>

							{/* 右邊：Current Configuration */}
							<Card className="bg-slate-50 border border-slate-200">
								<CardHeader className="pb-2">
									<CardTitle className="text-sm text-slate-700">
										Current Configuration
									</CardTitle>
								</CardHeader>
								<CardContent className="text-xs space-y-1">
									<div className="grid grid-cols-2 gap-6">
										{/* 左邊：輸入的數值 */}
										<div className="space-y-2">
											<div className="font-medium text-slate-800 mb-2">
												Input Parameters
											</div>
											<div className="space-y-1">
												<div className="flex justify-between">
													<span>Algorithm:</span>
													<span className="font-medium">
														{algorithm}
													</span>
												</div>
												<div className="flex justify-between">
													<span>Distribution:</span>
													<span className="font-medium">
														{
															currentConfig.distribution
														}
													</span>
												</div>
												<div className="flex justify-between">
													<span>Dimensions:</span>
													<span className="font-medium">
														{
															currentConfig.dimensions
														}
														D
													</span>
												</div>
												<div className="flex justify-between">
													<span>
														Positive Samples (
														<LaTeX
															displayMode={false}
														>
															{"n_p"}
														</LaTeX>
														):
													</span>
													<span className="font-medium">
														{
															currentConfig.sampleSize
														}
													</span>
												</div>
												<div className="flex justify-between">
													<span>
														Class Prior (
														<LaTeX
															displayMode={false}
														>
															{"\\pi_p"}
														</LaTeX>
														):
													</span>
													<span className="font-medium">
														{(
															currentConfig.positiveRatio *
															100
														).toFixed(1)}
														%
													</span>
												</div>
												<div className="flex justify-between">
													<span title="Probability a positive is labeled">
														Labeling Rate:
													</span>
													<span className="font-medium">
														{(
															currentConfig.labelFrequency *
															100
														).toFixed(1)}
														%
													</span>
												</div>
												<div className="flex justify-between">
													<span>Hidden Size:</span>
													<span className="font-medium">
														{
															currentConfig.hiddenSize
														}
													</span>
												</div>
											</div>
										</div>

										{/* 右邊：統計結果 */}
										{results.metrics && (
											<div className="space-y-2">
												<div className="font-medium text-slate-800 mb-2">
													Risk Metrics
												</div>
												<div className="space-y-1">
													{/* Prior Estimate */}
													<div className="flex justify-between">
														<span>
															Prior Estimate (
															<LaTeX
																displayMode={
																	false
																}
															>
																{
																	"\\hat{\\pi}_p"
																}
															</LaTeX>
															):
														</span>
														<span className="font-medium">
															{(
																results.metrics
																	.estimatedPrior *
																100
															).toFixed(2)}
															%
														</span>
													</div>

													{/* Empirical Risk */}
													<div className="flex justify-between">
														<span>
															Empirical Risk (
															<LaTeX
																displayMode={
																	false
																}
															>
																{"\\hat{R}"}
															</LaTeX>
															):
														</span>
														<span className="font-medium">
															{(
																results.metrics
																	.errorRate *
																100
															).toFixed(2)}
															%
														</span>
													</div>

													{/* Training Error */}
													<div className="flex justify-between">
														<span>
															Training{" "}
															<LaTeX
																displayMode={
																	false
																}
															>
																{"\\hat{R}"}
															</LaTeX>
															:
														</span>
														<span className="font-medium">
															{results.metrics.trainingErrorRate.toFixed(
																2,
															)}
															%
														</span>
													</div>

													{/* Model Status */}
													{(() => {
														const {
															errorRate,
															trainingErrorRate,
															estimatedPrior,
														} = results.metrics;

														// 計算先驗估計誤差（假設真實先驗為0.3）
														const truePrior = 0.3;
														const priorError =
															Math.abs(
																estimatedPrior -
																	truePrior,
															);

														// 優先特赦條款：如果核心指標很棒，直接判定為健康
														const hasExcellentCoreMetrics =
															priorError < 0.05 &&
															errorRate < 0.05;

														// 次要判斷：過擬合檢測
														const isSevereOverfitting =
															!hasExcellentCoreMetrics &&
															errorRate >
																trainingErrorRate *
																	3 &&
															trainingErrorRate <
																0.05;

														let statusIcon: string;
														let statusText: string;

														if (
															hasExcellentCoreMetrics
														) {
															statusIcon = "🟢";
															statusText =
																"Healthy";
														} else if (
															isSevereOverfitting
														) {
															statusIcon = "🔴";
															statusText =
																"Severe Overfitting";
														} else {
															statusIcon = "🟢";
															statusText =
																"Healthy";
														}

														return (
															<div className="flex justify-between">
																<span>
																	Model
																	Status:
																</span>
																<span className="font-medium">
																	{statusIcon}{" "}
																	{statusText}
																</span>
															</div>
														);
													})()}
												</div>
											</div>
										)}
									</div>
								</CardContent>
							</Card>
						</div>
					)}
				</div>
			</div>

			{/* C4: 關鍵洞見卡片區域 */}
			<KeyInsightsSection
				setAlgorithm={setAlgorithm}
				setPriorEstimationMethod={setPriorEstimationMethod}
				setDataParams={setDataParams}
				setHiddenSize={setHiddenSize}
				setLambdaRegularization={setLambdaRegularization}
				setEpochs={setEpochs}
				handleTrain={handleTrain}
			/>
		</div>
	);
}
