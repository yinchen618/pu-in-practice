"use client";

import ModelConfigurationControls from "@/app/pu-learning/components/ModelConfigurationControls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronRight, HelpCircle, Info } from "lucide-react";
import React, { useState } from "react";
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

// 交通號誌燈號組件
function TrafficLight({
	value,
	thresholds,
	type,
}: {
	value: number;
	thresholds: { green: number; yellow: number };
	type: "prior" | "error";
}) {
	let light = "🔴"; // 預設紅燈

	if (type === "prior") {
		const diff = Math.abs(value - 0.3); // 假設真實先驗為0.3
		if (diff <= thresholds.green) light = "🟢";
		else if (diff <= thresholds.yellow) light = "🟡";
	} else if (type === "error") {
		if (value <= thresholds.green) light = "🟢";
		else if (value <= thresholds.yellow) light = "🟡";
	}

	return <span className="ml-2">{light}</span>;
}

// 統一的指標顯示組件
function MetricDisplay({
	label,
	value,
	tooltip,
	trafficLight,
	subText,
}: {
	label: string;
	value: string | number;
	tooltip: string;
	trafficLight?: React.ReactNode;
	subText?: string;
}) {
	return (
		<div className="flex justify-between items-start">
			<span>{label}</span>
			<div className="flex flex-col items-end gap-1">
				<div className="flex items-center gap-1">
					<span className="font-medium">{value}</span>
					<span className="inline-block cursor-help" title={tooltip}>
						<HelpCircle className="h-3 w-3 text-slate-400" />
					</span>
					{trafficLight}
				</div>
				{subText && (
					<span className="text-xs text-slate-600">{subText}</span>
				)}
			</div>
		</div>
	);
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
			{/* C2: 專案標題與摘要 */}
			<div className="text-center space-y-4">
				<h1 className="text-4xl font-bold text-slate-900">
					Interactive PU Learning in Practice
				</h1>
				<h3 className="text-xl text-slate-600">
					An Application for Prof. Sugiyama's Lab
				</h3>
				<p className="text-lg text-slate-700 max-w-3xl mx-auto">
					This project demonstrates the practical implementation and
					comparison of
					<strong> uPU</strong> and <strong>nnPU</strong> algorithms,
					showcasing key insights from debugging real-world challenges
					in positive-unlabeled learning scenarios.
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
							</div>
						</CardContent>
					</Card>
				</div>

				{/* C3.2: 右欄 - 視覺化與結果 (70%) */}
				<div className="lg:col-span-2 space-y-6">
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
													<span>Sample Size:</span>
													<span className="font-medium">
														{
															currentConfig.sampleSize
														}
													</span>
												</div>
												<div className="flex justify-between">
													<span>Positive Ratio:</span>
													<span className="font-medium">
														{(
															currentConfig.positiveRatio *
															100
														).toFixed(1)}
														%
													</span>
												</div>
												<div className="flex justify-between">
													<span>Label Freq:</span>
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
													Results
												</div>
												<div className="space-y-1">
													{/* Est. Prior */}
													<div className="flex justify-between">
														<span>Est. Prior:</span>
														<span className="font-medium">
															{(
																results.metrics
																	.estimatedPrior *
																100
															).toFixed(2)}
															%
														</span>
													</div>

													{/* Error Rate */}
													<div className="flex justify-between">
														<span>Error Rate:</span>
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
															Training Error:
														</span>
														<span className="font-medium">
															{results.metrics.trainingErrorRate.toFixed(
																2,
															)}
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

			{/* C5: 署名 */}
			<div className="text-center py-8">
				<p className="text-lg text-slate-600 italic">
					Developed and presented by Yin-Chen, Chen for the
					Sugiyama-Sato Lab application.
				</p>
			</div>
		</div>
	);
}
