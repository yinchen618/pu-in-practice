import { apiRequest } from "@/utils/global-api-manager";
import type { ExperimentConfig, TrainedModel } from "./types";

const API_BASE = "http://localhost:8000";

// API service for trained models
export const trainedModelsApi = {
	// 獲取所有已訓練的模型
	async getTrainedModels(): Promise<TrainedModel[]> {
		try {
			const response = await fetch(`${API_BASE}/api/v1/models/all`);
			if (!response.ok) {
				throw new Error(
					`Failed to fetch trained models: ${response.statusText}`,
				);
			}
			const data = await response.json();
			return data.models || [];
		} catch (error) {
			console.error("Error fetching trained models:", error);
			return [];
		}
	},

	// 根據experiment run ID獲取已訓練的模型
	async getTrainedModelsByExperiment(runId: string): Promise<TrainedModel[]> {
		try {
			console.log(
				"🌐 API: Fetching models for experiment run ID:",
				runId,
			);
			const url = `${API_BASE}/api/v1/models/experiment/${runId}`;

			const response = await fetch(url);

			if (!response.ok) {
				const errorText = await response.text();
				console.error("🌐 API: Error response:", errorText);
				throw new Error(
					`Failed to fetch trained models by experiment: ${response.statusText}`,
				);
			}

			const data = await response.json();

			return data.data?.models || [];
		} catch (error) {
			console.error(
				"🌐 API: Error fetching trained models by experiment:",
				error,
			);
			return [];
		}
	},

	// 根據scenario獲取已訓練的模型 (保留向後兼容)
	async getTrainedModelsByScenario(
		runId: string,
		scenario: string,
	): Promise<TrainedModel[]> {
		try {
			// 使用統一的 API 管理器，並修正端點路徑
			const response = await apiRequest.get(
				`${API_BASE}/api/v1/models/experiment/${runId}`,
			);

			if (!response?.data?.models) {
				return [];
			}

			// 過濾指定場景的模型
			const models = response.data.models.filter(
				(model: any) => model.scenario_type === scenario,
			);

			return models || [];
		} catch (error) {
			console.error("Error fetching trained models by scenario:", error);
			return [];
		}
	},

	// 獲取特定模型的詳細信息
	async getModelDetails(modelId: string): Promise<TrainedModel | null> {
		try {
			const response = await fetch(
				`${API_BASE}/api/v1/models/${modelId}`,
			);
			if (!response.ok) {
				throw new Error(
					`Failed to fetch model details: ${response.statusText}`,
				);
			}
			const data = await response.json();
			return data.model || null;
		} catch (error) {
			console.error("Error fetching model details:", error);
			return null;
		}
	},
};

// API service for experiment configuration
export const experimentConfigApi = {
	// 從實驗運行中獲取配置
	async getConfigFromRun(
		runId: string,
	): Promise<Partial<ExperimentConfig> | null> {
		try {
			const json = await apiRequest.get(
				`${API_BASE}/api/v1/experiment-runs/${runId}`,
				true, // 啟用緩存
				true, // 啟用去重
			);

			const params = json?.data?.filteringParameters;

			if (!params) {
				return null;
			}

			const originalStart = new Date(params.start_date);
			const originalEnd = new Date(params.end_date);

			const selectedFloorsByBuilding =
				params.selected_floors_by_building || {
					"Building A": ["1", "2"],
					"Building B": [],
				};

			return {
				positiveSource: {
					selectedFloorsByBuilding,
					timeRange: {
						startDate: originalStart.toISOString().split("T")[0],
						endDate: originalEnd.toISOString().split("T")[0],
						startTime: params.start_time || "00:00",
						endTime: params.end_time || "23:59",
					},
				},
			};
		} catch (error) {
			console.error("Error fetching experiment configuration:", error);
			return null;
		}
	},

	// 獲取默認配置
	async getDefaultConfig(): Promise<ExperimentConfig> {
		// 返回硬編碼的默認配置作為備選
		return {
			scenarioType: "ERM_BASELINE",
			positiveSource: {
				selectedFloorsByBuilding: {
					"Building A": ["1", "2"],
					"Building B": [],
				},
				timeRange: {
					startDate: "2025-08-10",
					endDate: "2025-08-11",
					startTime: "00:00",
					endTime: "23:59",
				},
			},
			unlabeledSource: {
				useSameAsPositive: true,
				selectedFloorsByBuilding: {
					"Building A": ["1", "2"],
					"Building B": [],
				},
				timeRange: {
					startDate: "2025-08-10",
					endDate: "2025-08-11",
					startTime: "00:00",
					endTime: "23:59",
				},
			},
			testSource: {
				useSameAsTraining: true,
				selectedFloorsByBuilding: {
					"Building A": ["1", "2"],
					"Building B": [],
				},
				timeRange: {
					startDate: "2025-08-10",
					endDate: "2025-08-11",
					startTime: "00:00",
					endTime: "23:59",
				},
			},
			splitStrategy: {
				trainRatio: 70,
				validationRatio: 15,
				testRatio: 15,
			},
			modelParams: {
				modelType: "nnPU",
				priorMethod: "median",
				classPrior: "",
				hiddenUnits: 100,
				activation: "relu",
				lambdaReg: 0.005,
				optimizer: "adam",
				learningRate: 0.005,
				epochs: 100,
				batchSize: 128,
				seed: 42,
			},
		};
	},

	// 保存配置到後端
	// async saveConfig(
	// 	config: ExperimentConfig,
	// 	runId?: string,
	// ): Promise<boolean> {
	// 	try {
	// 		const endpoint = runId
	// 			? `${API_BASE}/api/v1/experiment-runs/${runId}/config`
	// 			: `${API_BASE}/api/v1/config/save`;

	// 		const response = await fetch(endpoint, {
	// 			method: "POST",
	// 			headers: {
	// 				"Content-Type": "application/json",
	// 			},
	// 			body: JSON.stringify(config),
	// 		});

	// 		return response.ok;
	// 	} catch (error) {
	// 		console.error("Error saving configuration:", error);
	// 		return false;
	// 	}
	// },
};
