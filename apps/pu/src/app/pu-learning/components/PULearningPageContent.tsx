"use client";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import ApplicationsTab from "./ApplicationsTab";
import DemoTab from "./DemoTab";
import ReferencesTab from "./ReferencesTab";
import TabNavigation from "./TabNavigation";
import type { TabKey } from "./TabNavigation";
import TheoryTab from "./TheoryTab";

import type { DataParams, ModelParams, SimulationResult } from "./types";

export default function PULearningPageContent() {
	const searchParams = useSearchParams();
	const tabParam = searchParams.get("tab") as TabKey;
	// 分頁狀態
	const [activeTab, setActiveTab] = useState<TabKey>(tabParam || "demo");

	// Sync activeTab with URL parameters
	useEffect(() => {
		const tab = searchParams.get("tab") as TabKey;
		if (
			tab &&
			["demo", "theory", "applications", "references"].includes(tab)
		) {
			setActiveTab(tab);
		}
	}, [searchParams]);

	// Accordion 狀態
	const [generalOpen, setGeneralOpen] = useState(true);
	const [dataOpen, setDataOpen] = useState(false);
	const [modelOpen, setModelOpen] = useState(false);

	// 狀態管理
	const [algorithm, setAlgorithm] = useState<"uPU" | "nnPU">("uPU"); // 預設為 uPU

	// 🎯 新增：三個關鍵 UI 功能的狀態
	const [priorEstimationMethod, setPriorEstimationMethod] = useState<
		"mean" | "median"
	>("median"); // 預設為 median
	const [hiddenSize, setHiddenSize] = useState<number>(200); // 更新為最佳配置
	const [lambdaRegularization, setLambdaRegularization] =
		useState<number>(0.005); // 更新為最佳配置：最佳正規化強度
	const [learningRate, setLearningRate] = useState<number>(0.005); // 新增：學習率，預設為中等
	const [activationFunction, setActivationFunction] =
		useState<string>("relu"); // 新增：激活函數
	const [randomSeed, setRandomSeed] = useState<number>(42); // 新增：隨機種子，預設為 42
	const [epochs, setEpochs] = useState<number>(100); // 新增：訓練輪數，預設為 100

	const [dataParams, setDataParams] = useState<DataParams>({
		distribution: "gaussian", // 高斯分布
		dimensions: 8, // 使用8維（最佳平衡點）
		nPositive: 50,
		nUnlabeled: 300,
		prior: 0.3,
	});
	const [modelParams, setModelParams] = useState<ModelParams>({
		activation: "relu",
		learning_rate: 0.005, // 新增：學習率
		weight_decay: 0.005, // 新增：最佳正規化係數
	});
	const [isTraining, setIsTraining] = useState(false);
	const [results, setResults] = useState<SimulationResult | null>(null);
	const [error, setError] = useState<string | null>(null);

	// 處理訓練
	const handleTrain = useCallback(async () => {
		setIsTraining(true);
		setError(null);

		try {
			// 參數驗證 - 匹配後端驗證範圍
			if (hiddenSize < 1 || hiddenSize > 500) {
				throw new Error(
					`Hidden size must be between 1 and 500, got ${hiddenSize}`,
				);
			}
			if (lambdaRegularization < 0 || lambdaRegularization > 0.1) {
				throw new Error(
					`Weight decay must be between 0.0 and 0.1, got ${lambdaRegularization}`,
				);
			}
			if (dataParams.dimensions < 2 || dataParams.dimensions > 100) {
				throw new Error(
					`Dimensions must be between 2 and 100, got ${dataParams.dimensions}`,
				);
			}
			if (dataParams.prior <= 0.05 || dataParams.prior >= 0.95) {
				throw new Error(
					`Prior must be between 0.05 and 0.95, got ${dataParams.prior}`,
				);
			}

			// 構建 API 請求 - 根據演算法動態調整參數
			const apiRequest = {
				algorithm,
				seed: randomSeed, // 新增：傳遞隨機種子
				prior_estimation_method: priorEstimationMethod, // 新增：傳遞先驗估計方法
				epochs: epochs, // 新增：傳遞訓練輪數
				data_params: {
					distribution: dataParams.distribution,
					dims: dataParams.dimensions,
					n_p: dataParams.nPositive,
					n_u: dataParams.nUnlabeled,
					prior: dataParams.prior,
				},
				model_params:
					algorithm === "nnPU"
						? {
								// nnPU 使用神經網路參數
								activation: activationFunction,
								n_epochs: epochs, // 使用用戶設定的訓練輪數
								learning_rate: learningRate,
								hidden_dim: hiddenSize,
								weight_decay: lambdaRegularization,
							}
						: {
								// uPU 使用核方法參數
								model_type: "gauss",
								use_bias: true,
								n_basis: hiddenSize, // 使用 hiddenSize 控制基函數數量
							},
			};
			console.log("apiRequest", apiRequest);

			// Create AbortController for timeout control
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

			const API_URL = "https://python.yinchen.tw";
			// Call backend API with timeout control
			const response = await fetch(
				`${API_URL}/api/pu-learning/run-simulation`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Accept: "application/json",
					},
					body: JSON.stringify(apiRequest),
					signal: controller.signal,
					// Add connection timeout settings
					keepalive: false,
				},
			);

			clearTimeout(timeoutId);

			if (!response.ok) {
				const errorData = await response.json();
				console.error("Backend error details:", errorData);

				let errorMessage = `HTTP error! status: ${response.status}`;

				if (response.status === 422) {
					// 處理參數驗證錯誤
					if (errorData.detail && Array.isArray(errorData.detail)) {
						const validationErrors = errorData.detail
							.map(
								(err: any) =>
									`${err.loc?.join(".")} - ${err.msg}`,
							)
							.join("; ");
						errorMessage = `Parameter validation failed: ${validationErrors}`;
					} else if (errorData.detail?.message) {
						errorMessage = `Validation error: ${errorData.detail.message}`;
					} else {
						errorMessage =
							"Parameter validation failed - please check your input values";
					}
				} else if (errorData.detail?.message) {
					errorMessage = errorData.detail.message;
				}

				throw new Error(errorMessage);
			}

			const backendResult = await response.json();
			console.log("Received response from backend:", backendResult);

			// Convert backend response format to frontend expected format
			const result: SimulationResult = {
				visualization: {
					pSamples: backendResult.visualization.p_samples.map(
						(point: number[]) => ({
							x: point[0],
							y: point[1],
							label: "P" as const,
						}),
					),
					uSamples: backendResult.visualization.u_samples.map(
						(point: number[]) => ({
							x: point[0],
							y: point[1],
							label: "U" as const,
						}),
					),
					decisionBoundary:
						backendResult.visualization.decision_boundary,
				},
				metrics: {
					estimatedPrior: backendResult.metrics.estimated_prior,
					errorRate: backendResult.metrics.error_rate,
					trainingErrorRate:
						backendResult.metrics.training_error_rate,
					riskCurve: backendResult.metrics.risk_curve,
				},
			};

			setResults(result);
		} catch (err) {
			console.error("Training error:", err);

			// Improve error handling
			let errorMessage: string;
			if (err instanceof Error) {
				if (err.name === "AbortError") {
					errorMessage =
						"Request timeout - Please check network connection or retry";
				} else if (err.message.includes("fetch")) {
					errorMessage =
						"Cannot connect to backend service - Please ensure service is running";
				} else {
					errorMessage = err.message;
				}
			} else {
				errorMessage = "Unknown error occurred during training";
			}

			setError(errorMessage);

			// ⚠️ Mock data fallback has been commented out to ensure only real backend results are used
			console.log(
				"Backend error occurred, mock data fallback is disabled:",
				errorMessage,
			);
			console.warn(
				"⚠️ Mock data has been disabled, please check backend service status",
			);
		} finally {
			setIsTraining(false);
		}
	}, [
		algorithm,
		dataParams,
		modelParams,
		priorEstimationMethod,
		hiddenSize,
		lambdaRegularization,
		activationFunction,
		learningRate,
		randomSeed, // 新增：依賴隨機種子
		epochs, // 新增：依賴訓練輪數
	]);

	// 快速設定處理函數
	const handleOptimalSetup = () => {
		setHiddenSize(200); // 更新為最佳配置的隱藏層大小
		setLambdaRegularization(0.005); // 更新為最佳配置的正規化強度
	};

	const handleBlindsEffectSetup = () => {
		setHiddenSize(500); // 調整為符合後端限制
		setLambdaRegularization(0.01);
	};

	// 隨機種子處理函數
	const handleRandomizeSeed = () => {
		const newSeed = Math.floor(Math.random() * 100000); // 生成 0-99999 之間的隨機整數
		setRandomSeed(newSeed);
	};

	// 準備當前配置用於 ResultsDisplay
	const currentConfig = {
		distribution: dataParams.distribution,
		dimensions: dataParams.dimensions,
		sampleSize: dataParams.nPositive + dataParams.nUnlabeled,
		positiveRatio:
			dataParams.nPositive /
			(dataParams.nPositive + dataParams.nUnlabeled),
		labelFrequency: dataParams.prior,
		hiddenSize,
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
			{/* C1: TabNavigation */}
			<TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

			{/* 主要內容區域 */}
			<div className="container mx-auto px-4 py-8">
				{/* Demo 分頁 */}
				{activeTab === "demo" && (
					<DemoTab
						algorithm={algorithm}
						setAlgorithm={setAlgorithm}
						priorEstimationMethod={priorEstimationMethod}
						setPriorEstimationMethod={setPriorEstimationMethod}
						hiddenSize={hiddenSize}
						setHiddenSize={setHiddenSize}
						lambdaRegularization={lambdaRegularization}
						setLambdaRegularization={setLambdaRegularization}
						learningRate={learningRate}
						setLearningRate={setLearningRate}
						activationFunction={activationFunction}
						setActivationFunction={setActivationFunction}
						epochs={epochs}
						setEpochs={setEpochs}
						randomSeed={randomSeed}
						setRandomSeed={setRandomSeed}
						handleRandomizeSeed={handleRandomizeSeed}
						dataParams={dataParams}
						setDataParams={setDataParams}
						isTraining={isTraining}
						handleTrain={handleTrain}
						error={error}
						results={results}
						currentConfig={currentConfig}
						handleOptimalSetup={handleOptimalSetup}
						handleBlindsEffectSetup={handleBlindsEffectSetup}
					/>
				)}

				{/* 理論背景分頁 */}
				{activeTab === "theory" && <TheoryTab />}

				{/* 實務應用分頁 */}
				{activeTab === "applications" && <ApplicationsTab />}

				{/* 參考文獻分頁 */}
				{activeTab === "references" && <ReferencesTab />}
			</div>

			{/* C6: 頁尾 */}
			<footer className="bg-white border-t mt-16">
				<div className="container mx-auto px-4 py-6 text-center">
					<p className="text-sm text-slate-500">
						Interactive PU Learning Demonstrator •
						<a
							href="mailto:your.email@example.com"
							className="text-blue-600 hover:underline ml-1"
						>
							Contact
						</a>{" "}
						•
						<a
							href="https://github.com/yourusername"
							className="text-blue-600 hover:underline ml-1"
						>
							GitHub
						</a>
					</p>
				</div>
			</footer>
		</div>
	);
}
