"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
	Activity,
	AlertCircle,
	BarChart,
	BarChart3,
	Brain,
	CheckCircle,
	Clock,
	Database,
	Edit3,
	HelpCircle,
	Loader2,
	Play,
	RefreshCw,
	Settings,
	Trash2,
	TrendingUp,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type {
	EvaluationRun,
	ExperimentRun,
	TrainedModel,
} from "../types/index";

// ==================== REUSABLE COMPONENTS ====================

// 狀態圖標組件 - 統一的狀態顯示
function StatusIcon({ status }: { status: string }) {
	switch (status) {
		case "COMPLETED":
			return <CheckCircle className="h-4 w-4 text-green-500" />;
		case "RUNNING":
			return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
		case "FAILED":
			return <AlertCircle className="h-4 w-4 text-red-500" />;
		default:
			return <Clock className="h-4 w-4 text-gray-500" />;
	}
}

// 操作按鈕組件 - 統一的刪除按鈕樣式
function DeleteButton({
	onClick,
	title,
}: {
	onClick: (e: React.MouseEvent) => void;
	title: string;
}) {
	return (
		<Button
			variant="outline"
			size="sm"
			className="h-7 w-7 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
			onClick={onClick}
			title={title}
		>
			<Trash2 className="h-3 w-3" />
		</Button>
	);
}

// 操作按鈕組件 - 統一的重命名按鈕樣式
function RenameButton({
	onClick,
	title,
}: {
	onClick: (e: React.MouseEvent) => void;
	title: string;
}) {
	return (
		<Button
			variant="outline"
			size="sm"
			className="h-7 w-7 p-0 text-blue-500 hover:bg-blue-50 hover:text-blue-600"
			onClick={onClick}
			title={title}
		>
			<Edit3 className="h-3 w-3" />
		</Button>
	);
}

// 指標解釋常數定義
const METRIC_EXPLANATIONS = {
	// Test Set Performance Metrics
	"Test F1":
		"F1-Score 是精確率(Precision)和召回率(Recall)的調和平均數，綜合評估模型在測試集上的分類效果。範圍 0-100%，越高越好。",
	"Test Precision":
		"精確率表示在模型預測為正例的樣本中，實際為正例的比例。衡量模型預測正例的準確性。範圍 0-100%，越高越好。",
	"Test Recall":
		"召回率表示在所有實際正例中，被模型正確識別出的比例。衡量模型發現正例的能力。範圍 0-100%，越高越好。",
	"nnPU Risk":
		"非負 PU 學習的風險函數值，用於衡量模型在僅有正樣本和未標記樣本情況下的學習效果。數值越小表示模型效果越好。",

	// PU Learning Specific Metrics
	"True Pos Recall":
		"在測試集中真實正例的召回率，專門針對 PU 學習場景設計的指標，衡量模型識別真正異常的能力。",
	"Est. Pos in U":
		"估計未標記樣本集合中正例的比例，反映 PU 學習算法對數據分布的理解程度。",
	"Class Prior (π)":
		"類別先驗機率，表示正例在整個數據集中的真實比例。這是 PU 學習的重要參數，通常需要領域專家估計。",

	// Training Process Information
	"Total Epochs":
		"模型完成的總訓練輪數，每個 epoch 表示模型看過完整數據集一次。",
	"Early Stop":
		"是否觸發早停機制。早停可防止過擬合，當驗證性能不再改善時自動停止訓練。",
	"Converged @": "模型收斂的訓練輪數，即達到最佳驗證性能的 epoch。",
	"Training Time": "模型訓練的總耗時，包括數據處理和梯度更新的時間。",

	// Validation Performance
	"Best Val F1": "驗證集上達到的最佳 F1-Score，用於模型選擇和早停判斷。",
	"Best Val Prec":
		"驗證集上達到的最佳精確率，反映模型在驗證階段的預測準確性。",
	"Best Val Recall":
		"驗證集上達到的最佳召回率，反映模型在驗證階段的發現能力。",
	"Best Epoch": "在驗證集上取得最佳性能的訓練輪數，通常用於選擇最終模型。",
};

// 簡單的 Tooltip 組件
function MetricTooltip({
	children,
	explanation,
	className = "",
}: {
	children: React.ReactNode;
	explanation: string;
	className?: string;
}) {
	return (
		<div className={`inline-flex items-center gap-1 ${className}`}>
			{children}
			<span className="inline-block cursor-help" title={explanation}>
				<HelpCircle className="h-3 w-3 text-gray-400 hover:text-gray-600" />
			</span>
		</div>
	);
}

// Training Metrics 組件 - 訓練性能指標顯示
function TrainingMetrics({
	trainingMetrics,
}: { trainingMetrics: string | object }) {
	return (
		<div className="border-t bg-indigo-50 p-3">
			<div className="text-sm font-medium mb-2 text-indigo-700">
				Training Performance Metrics
			</div>{" "}
			{(() => {
				try {
					const metrics =
						typeof trainingMetrics === "string"
							? JSON.parse(trainingMetrics)
							: trainingMetrics;
					console.log("model.training_metrics", trainingMetrics);
					return (
						<div className="bg-white border border-indigo-200 rounded p-3 text-xs space-y-4">
							{/* nnPU Learning Algorithm Information */}
							{(metrics.nnpu_method ||
								metrics.training_method) && (
								<div className="flex items-center justify-between pb-2 border-b border-gray-200">
									<span className="font-semibold text-gray-700">
										Algorithm:
									</span>
									<span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
										{metrics.nnpu_method ||
											metrics.training_method ||
											"nnPU Learning"}
									</span>
								</div>
							)}

							{/* Test Set Performance - Most Important for PU Learning */}
							{(metrics.final_test_f1_score !== undefined ||
								metrics.final_test_precision !== undefined ||
								metrics.final_test_recall !== undefined) && (
								<div>
									<div className="font-medium text-gray-700 mb-2">
										🧪 Test Set Performance:
									</div>
									<div className="grid grid-cols-2 md:grid-cols-4 gap-2">
										{metrics.final_test_f1_score !==
											undefined && (
											<div className="bg-green-50 p-2 rounded border border-green-200">
												<MetricTooltip
													explanation={
														METRIC_EXPLANATIONS[
															"Test F1"
														]
													}
													className="text-green-700 font-medium text-xs"
												>
													<span>Test F1</span>
												</MetricTooltip>
												<div className="text-lg font-bold text-green-800">
													{(
														metrics.final_test_f1_score *
														100
													).toFixed(1)}
													%
												</div>
											</div>
										)}
										{metrics.final_test_precision !==
											undefined && (
											<div className="bg-blue-50 p-2 rounded border border-blue-200">
												<MetricTooltip
													explanation={
														METRIC_EXPLANATIONS[
															"Test Precision"
														]
													}
													className="text-blue-700 font-medium text-xs"
												>
													<span>Test Precision</span>
												</MetricTooltip>
												<div className="text-lg font-bold text-blue-800">
													{(
														metrics.final_test_precision *
														100
													).toFixed(1)}
													%
												</div>
											</div>
										)}
										{metrics.final_test_recall !==
											undefined && (
											<div className="bg-pink-50 p-2 rounded border border-pink-200">
												<MetricTooltip
													explanation={
														METRIC_EXPLANATIONS[
															"Test Recall"
														]
													}
													className="text-pink-700 font-medium text-xs"
												>
													<span>Test Recall</span>
												</MetricTooltip>
												<div className="text-lg font-bold text-pink-800">
													{(
														metrics.final_test_recall *
														100
													).toFixed(1)}
													%
												</div>
											</div>
										)}
										{metrics.final_test_nnpu_risk !==
											undefined && (
											<div className="bg-orange-50 p-2 rounded border border-orange-200">
												<MetricTooltip
													explanation={
														METRIC_EXPLANATIONS[
															"nnPU Risk"
														]
													}
													className="text-orange-700 font-medium text-xs"
												>
													<span>nnPU Risk</span>
												</MetricTooltip>
												<div className="text-lg font-bold text-orange-800">
													{Number(
														metrics.final_test_nnpu_risk,
													).toFixed(4)}
												</div>
											</div>
										)}
									</div>
								</div>
							)}

							{/* PU Learning Specific Metrics */}
							{(metrics.true_positive_recall_test !== undefined ||
								metrics.estimated_positive_rate_in_unlabeled !==
									undefined ||
								metrics.class_prior_used !== undefined) && (
								<div>
									<div className="font-medium text-gray-700 mb-2">
										🧬 PU Learning Specifics:
									</div>
									<div className="grid grid-cols-1 md:grid-cols-3 gap-2">
										{metrics.true_positive_recall_test !==
											undefined && (
											<div className="bg-teal-50 p-2 rounded border border-teal-200">
												<MetricTooltip
													explanation={
														METRIC_EXPLANATIONS[
															"True Pos Recall"
														]
													}
													className="text-teal-700 font-medium text-xs"
												>
													<span>True Pos Recall</span>
												</MetricTooltip>
												<div className="text-lg font-bold text-teal-800">
													{(
														metrics.true_positive_recall_test *
														100
													).toFixed(1)}
													%
												</div>
											</div>
										)}
										{metrics.estimated_positive_rate_in_unlabeled !==
											undefined && (
											<div className="bg-cyan-50 p-2 rounded border border-cyan-200">
												<MetricTooltip
													explanation={
														METRIC_EXPLANATIONS[
															"Est. Pos in U"
														]
													}
													className="text-cyan-700 font-medium text-xs"
												>
													<span>Est. Pos in U</span>
												</MetricTooltip>
												<div className="text-lg font-bold text-cyan-800">
													{(
														metrics.estimated_positive_rate_in_unlabeled *
														100
													).toFixed(1)}
													%
												</div>
											</div>
										)}
										{metrics.class_prior_used !==
											undefined && (
											<div className="bg-indigo-50 p-2 rounded border border-indigo-200">
												<MetricTooltip
													explanation={
														METRIC_EXPLANATIONS[
															"Class Prior (π)"
														]
													}
													className="text-indigo-700 font-medium text-xs"
												>
													<span>Class Prior (π)</span>
												</MetricTooltip>
												<div className="text-lg font-bold text-indigo-800">
													{(
														metrics.class_prior_used *
														100
													).toFixed(1)}
													%
												</div>
											</div>
										)}
									</div>
								</div>
							)}

							{/* Training Process Information */}
							{(metrics.total_epochs_trained !== undefined ||
								metrics.early_stopped !== undefined ||
								metrics.training_time_seconds !== undefined ||
								metrics.convergence_epoch !== undefined) && (
								<div>
									<div className="font-medium text-gray-700 mb-2">
										⚙️ Training Process:
									</div>
									<div className="grid grid-cols-2 md:grid-cols-4 gap-2">
										{metrics.total_epochs_trained !==
											undefined && (
											<div className="bg-purple-50 p-2 rounded border border-purple-200">
												<MetricTooltip
													explanation={
														METRIC_EXPLANATIONS[
															"Total Epochs"
														]
													}
													className="text-purple-700 font-medium text-xs"
												>
													<span>Total Epochs</span>
												</MetricTooltip>
												<div className="text-lg font-bold text-purple-800">
													{
														metrics.total_epochs_trained
													}
												</div>
											</div>
										)}
										{metrics.early_stopped !==
											undefined && (
											<div
												className={`p-2 rounded border ${
													metrics.early_stopped
														? "bg-orange-50 border-orange-200"
														: "bg-gray-50 border-gray-200"
												}`}
											>
												<MetricTooltip
													explanation={
														METRIC_EXPLANATIONS[
															"Early Stop"
														]
													}
													className={`font-medium text-xs ${
														metrics.early_stopped
															? "text-orange-700"
															: "text-gray-700"
													}`}
												>
													<span>Early Stop</span>
												</MetricTooltip>
												<div
													className={`text-lg font-bold ${
														metrics.early_stopped
															? "text-orange-800"
															: "text-gray-800"
													}`}
												>
													{metrics.early_stopped
														? "✓ Yes"
														: "✗ No"}
												</div>
											</div>
										)}
										{metrics.convergence_epoch !==
											undefined && (
											<div className="bg-green-50 p-2 rounded border border-green-200">
												<MetricTooltip
													explanation={
														METRIC_EXPLANATIONS[
															"Converged @"
														]
													}
													className="text-green-700 font-medium text-xs"
												>
													<span>Converged @</span>
												</MetricTooltip>
												<div className="text-lg font-bold text-green-800">
													Epoch{" "}
													{metrics.convergence_epoch}
												</div>
											</div>
										)}
										{metrics.training_time_seconds !==
											undefined && (
											<div className="bg-gray-50 p-2 rounded border border-gray-200">
												<MetricTooltip
													explanation={
														METRIC_EXPLANATIONS[
															"Training Time"
														]
													}
													className="text-gray-700 font-medium text-xs"
												>
													<span>Training Time</span>
												</MetricTooltip>
												<div className="text-lg font-bold text-gray-800">
													{metrics.training_time_seconds <
													1
														? "<1s"
														: `${metrics.training_time_seconds.toFixed(1)}s`}
												</div>
											</div>
										)}
									</div>
								</div>
							)}

							{/* Validation Performance */}
							{(metrics.best_val_f1_score !== undefined ||
								metrics.best_val_precision !== undefined ||
								metrics.best_val_recall !== undefined) && (
								<div>
									<div className="font-medium text-gray-700 mb-2">
										🎯 Validation Performance (Best):
									</div>
									<div className="grid grid-cols-2 md:grid-cols-4 gap-2">
										{metrics.best_val_f1_score !==
											undefined && (
											<div className="bg-emerald-50 p-2 rounded border border-emerald-200">
												<MetricTooltip
													explanation={
														METRIC_EXPLANATIONS[
															"Best Val F1"
														]
													}
													className="text-emerald-700 font-medium text-xs"
												>
													<span>Best Val F1</span>
												</MetricTooltip>
												<div className="text-lg font-bold text-emerald-800">
													{(
														metrics.best_val_f1_score *
														100
													).toFixed(1)}
													%
												</div>
											</div>
										)}
										{metrics.best_val_precision !==
											undefined && (
											<div className="bg-sky-50 p-2 rounded border border-sky-200">
												<MetricTooltip
													explanation={
														METRIC_EXPLANATIONS[
															"Best Val Prec"
														]
													}
													className="text-sky-700 font-medium text-xs"
												>
													<span>Best Val Prec</span>
												</MetricTooltip>
												<div className="text-lg font-bold text-sky-800">
													{(
														metrics.best_val_precision *
														100
													).toFixed(1)}
													%
												</div>
											</div>
										)}
										{metrics.best_val_recall !==
											undefined && (
											<div className="bg-rose-50 p-2 rounded border border-rose-200">
												<MetricTooltip
													explanation={
														METRIC_EXPLANATIONS[
															"Best Val Recall"
														]
													}
													className="text-rose-700 font-medium text-xs"
												>
													<span>Best Val Recall</span>
												</MetricTooltip>
												<div className="text-lg font-bold text-rose-800">
													{(
														metrics.best_val_recall *
														100
													).toFixed(1)}
													%
												</div>
											</div>
										)}
										{metrics.best_epoch !== undefined && (
											<div className="bg-violet-50 p-2 rounded border border-violet-200">
												<MetricTooltip
													explanation={
														METRIC_EXPLANATIONS[
															"Best Epoch"
														]
													}
													className="text-violet-700 font-medium text-xs"
												>
													<span>Best Epoch</span>
												</MetricTooltip>
												<div className="text-lg font-bold text-violet-800">
													{metrics.best_epoch}
												</div>
											</div>
										)}
									</div>
								</div>
							)}
						</div>
					);
				} catch (error) {
					return (
						<div className="bg-red-50 border border-red-200 rounded p-2 text-red-700 text-xs">
							Error parsing training metrics:{" "}
							{error instanceof Error
								? error.message
								: "Unknown error"}
						</div>
					);
				}
			})()}
		</div>
	);
}

// Training Model Configuration 組件 - 訓練模型配置顯示
function TrainingModelConfiguration({
	modelConfig,
}: { modelConfig: string | object }) {
	return (
		<div className="border-t bg-blue-50 p-3">
			<div className="text-sm font-medium mb-2 text-blue-700">
				Model Configuration
			</div>

			{(() => {
				try {
					const config =
						typeof modelConfig === "string"
							? JSON.parse(modelConfig)
							: modelConfig;
					return (
						<div className="bg-white border border-blue-200 rounded p-3 text-xs space-y-3">
							{/* Model & Algorithm Configuration */}
							{(config.modelType ||
								config.classPrior !== undefined) && (
								<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
									{config.modelType && (
										<div className="bg-indigo-50 p-2 rounded border border-indigo-200">
											<div className="text-indigo-700 font-medium">
												Model Type
											</div>
											<div className="font-bold text-indigo-800">
												{config.modelType}
											</div>
										</div>
									)}

									{config.classPrior !== undefined && (
										<div className="bg-green-50 p-2 rounded border border-green-200">
											<div className="text-green-700 font-medium">
												Class Prior
											</div>
											<div className="font-bold text-green-800">
												{Number(
													config.classPrior,
												).toFixed(4)}
											</div>
										</div>
									)}
								</div>
							)}

							{/* Training Parameters */}
							{(config.epochs ||
								config.batchSize ||
								config.learningRate ||
								config.earlyStopping ||
								config.patience) && (
								<div className="space-y-2">
									<div className="font-medium text-gray-700 text-xs">
										Training Parameters:
									</div>
									<div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
										{config.epochs && (
											<div className="bg-purple-50 p-2 rounded text-center border border-purple-200">
												<div className="text-purple-700 font-medium">
													Epochs
												</div>
												<div className="font-bold text-purple-800">
													{config.epochs}
												</div>
											</div>
										)}

										{config.batchSize && (
											<div className="bg-orange-50 p-2 rounded text-center border border-orange-200">
												<div className="text-orange-700 font-medium">
													Batch Size
												</div>
												<div className="font-bold text-orange-800">
													{config.batchSize}
												</div>
											</div>
										)}

										{config.learningRate && (
											<div className="bg-teal-50 p-2 rounded text-center border border-teal-200">
												<div className="text-teal-700 font-medium">
													Learning Rate
												</div>
												<div className="font-bold text-teal-800">
													{Number(
														config.learningRate,
													).toExponential(2)}
												</div>
											</div>
										)}

										{config.earlyStopping !== undefined && (
											<div className="bg-red-50 p-2 rounded text-center border border-red-200">
												<div className="text-red-700 font-medium">
													Early Stopping
												</div>
												<div className="font-bold text-red-800">
													{config.earlyStopping
														? "Enabled"
														: "Disabled"}
												</div>
											</div>
										)}

										{config.patience && (
											<div className="bg-pink-50 p-2 rounded text-center border border-pink-200">
												<div className="text-pink-700 font-medium">
													Patience
												</div>
												<div className="font-bold text-pink-800">
													{config.patience}
												</div>
											</div>
										)}
									</div>
								</div>
							)}

							{/* Raw Configuration JSON - Collapsible for debugging */}
							<details className="pt-2 border-t border-gray-200">
								<summary className="cursor-pointer text-xs text-gray-600 hover:text-gray-800">
									📋 Complete Configuration (Raw JSON)
								</summary>
								<div className="mt-2 p-2 bg-gray-50 rounded text-xs">
									<pre className="text-gray-700 overflow-x-auto">
										{JSON.stringify(config, null, 2)}
									</pre>
								</div>
							</details>
						</div>
					);
				} catch (error) {
					return (
						<div className="bg-red-50 border border-red-200 rounded p-2 text-red-700 text-xs">
							Error parsing model configuration:{" "}
							{error instanceof Error
								? error.message
								: "Unknown error"}
						</div>
					);
				}
			})()}
		</div>
	);
}

// Training Model Evaluations 組件 - 訓練模型評估結果顯示
function TrainingModelEvaluations({
	modelEvaluations,
}: { modelEvaluations: EvaluationRun[] }) {
	return (
		<div className="border-t bg-gray-50 p-3">
			<div className="text-sm font-medium mb-2 text-gray-700">
				Evaluation Results ({modelEvaluations.length} runs)
			</div>
			<div className="space-y-2">
				{modelEvaluations.map((evaluation) => (
					<div
						key={evaluation.id}
						className="bg-white border rounded p-2 text-xs"
					>
						<div className="flex items-center justify-between mb-1">
							<span className="font-medium">
								{evaluation.name}
							</span>
							<Badge
								variant={
									evaluation.status === "COMPLETED"
										? "default"
										: "secondary"
								}
								className="text-xs"
							>
								{evaluation.status}
							</Badge>
						</div>
						<div className="text-gray-600">
							Created:{" "}
							{new Date(evaluation.createdAt).toLocaleString(
								"zh-TW",
								{
									timeZone: "Asia/Taipei",
								},
							)}
						</div>
						{evaluation.evaluationMetrics && (
							<div className="mt-1 p-1 bg-gray-50 rounded">
								<pre className="text-xs text-gray-700">
									{JSON.stringify(
										typeof evaluation.evaluationMetrics ===
											"string"
											? JSON.parse(
													evaluation.evaluationMetrics,
												)
											: evaluation.evaluationMetrics,
										null,
										2,
									)}
								</pre>
							</div>
						)}
					</div>
				))}
			</div>
		</div>
	);
}

// Training Data Information 組件 - 訓練數據來源與統計顯示
function TrainingDataInformation({
	trainingDataInfo,
}: { trainingDataInfo: any }) {
	return (
		<div className="border-t bg-gray-50 p-3">
			<div className="text-sm font-medium mb-2 text-gray-700">
				📊 Training Data Sources & Statistics
			</div>

			{/* Unified format display */}
			<div className="bg-white border border-gray-200 rounded p-3 text-xs space-y-4">
				{/* P/U Data Sources Summary (if available) */}
				{trainingDataInfo?.p_data_sources &&
					trainingDataInfo?.u_data_sources && (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
							{/* P Data Sources */}
							<div>
								<div className="font-semibold text-orange-700 mb-1">
									Positive (P) Data Sources:
								</div>
								{trainingDataInfo?.p_data_sources?.dataset_ids?.map(
									(datasetId: string) => {
										const datasetName =
											trainingDataInfo?.p_data_sources
												?.dataset_names?.[datasetId] ||
											`Dataset ${datasetId}`;
										const datasetInfo =
											trainingDataInfo?.p_data_sources
												?.dataset_info?.[datasetId];
										return (
											<div
												key={datasetId}
												className="mb-1 pl-2 border-l-2 border-orange-200"
											>
												<div className="font-medium text-gray-700">
													{datasetName}
												</div>
												{datasetInfo && (
													<div className="text-gray-600">
														Total:{" "}
														{
															datasetInfo.total_samples
														}{" "}
														samples
														<br />
														Train:{" "}
														{
															datasetInfo.train_samples
														}{" "}
														| Val:{" "}
														{
															datasetInfo.validation_samples
														}{" "}
														| Test:{" "}
														{
															datasetInfo.test_samples
														}
													</div>
												)}
											</div>
										);
									},
								)}
								<div className="mt-2 pt-2 border-t border-orange-200 font-medium text-orange-800">
									Total P:{" "}
									{trainingDataInfo?.p_data_sources
										?.total_samples ||
										trainingDataInfo?.train_p_count ||
										0}{" "}
									samples
								</div>
							</div>

							{/* U Data Sources */}
							<div>
								<div className="font-semibold text-blue-700 mb-1">
									Unlabeled (U) Data Sources:
								</div>
								{trainingDataInfo?.u_data_sources?.dataset_ids?.map(
									(datasetId: string) => {
										const datasetName =
											trainingDataInfo?.u_data_sources
												?.dataset_names?.[datasetId] ||
											`Dataset ${datasetId}`;
										const datasetInfo =
											trainingDataInfo?.u_data_sources
												?.dataset_info?.[datasetId];
										return (
											<div
												key={datasetId}
												className="mb-1 pl-2 border-l-2 border-blue-200"
											>
												<div className="font-medium text-gray-700">
													{datasetName}
												</div>
												{datasetInfo && (
													<div className="text-gray-600">
														Total:{" "}
														{
															datasetInfo.total_samples
														}{" "}
														samples
														<br />
														Train:{" "}
														{
															datasetInfo.train_samples
														}{" "}
														| Val:{" "}
														{
															datasetInfo.validation_samples
														}{" "}
														| Test:{" "}
														{
															datasetInfo.test_samples
														}
													</div>
												)}
											</div>
										);
									},
								)}
								<div className="mt-2 pt-2 border-t border-blue-200 font-medium text-blue-800">
									Total U:{" "}
									{trainingDataInfo?.u_data_sources
										?.total_samples || 0}{" "}
									samples
								</div>
							</div>
						</div>
					)}

				{/* Core Training Statistics */}
				{trainingDataInfo.total_samples && (
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
						<div className="bg-white p-2 rounded border">
							<div className="text-gray-500 text-xs">
								Total Samples
							</div>
							<div className="font-semibold text-gray-800">
								{trainingDataInfo.total_samples}
							</div>
						</div>
						{trainingDataInfo.train_p_count !== undefined && (
							<div className="bg-orange-50 p-2 rounded border border-orange-200">
								<div className="text-orange-600 text-xs">
									Training P Samples
								</div>
								<div className="font-semibold text-orange-800">
									{trainingDataInfo.actual_train_p_samples ||
										trainingDataInfo.train_p_count}
								</div>
							</div>
						)}
						{trainingDataInfo.train_u_sampled_count !==
							undefined && (
							<div className="bg-blue-50 p-2 rounded border border-blue-200">
								<div className="text-blue-600 text-xs">
									Training U Samples
								</div>
								<div className="font-semibold text-blue-800">
									{trainingDataInfo.actual_train_u_samples ||
										trainingDataInfo.train_u_sampled_count}
									{trainingDataInfo.train_u_full_count &&
										` / ${trainingDataInfo.train_u_full_count}`}
								</div>
							</div>
						)}
					</div>
				)}

				{/* Data Pools Information */}
				{(trainingDataInfo.train_pool_size ||
					trainingDataInfo.validation_pool_size ||
					trainingDataInfo.test_pool_size) && (
					<div className="text-xs text-gray-600 pt-2 border-t border-gray-200">
						<span className="font-medium">Data Pools:</span>{" "}
						{trainingDataInfo.train_pool_size &&
							`Train: ${trainingDataInfo.train_pool_size}`}
						{trainingDataInfo.validation_pool_size &&
							` | Val: ${trainingDataInfo.validation_pool_size}`}
						{trainingDataInfo.test_pool_size &&
							` | Test: ${trainingDataInfo.test_pool_size}`}
						{trainingDataInfo.sampling_method ===
							"static_subset" && (
							<span className="ml-2 px-1 py-0.5 bg-green-100 text-green-800 rounded text-xs">
								Static Subset Method
							</span>
						)}
						{trainingDataInfo.u_sample_ratio && (
							<span className="ml-2 px-1 py-0.5 bg-purple-100 text-purple-800 rounded text-xs">
								U Ratio:{" "}
								{(
									trainingDataInfo.u_sample_ratio * 100
								).toFixed(0)}
								%
							</span>
						)}
						{trainingDataInfo.random_seed && (
							<span className="ml-2 px-1 py-0.5 bg-gray-100 text-gray-800 rounded text-xs">
								Seed: {trainingDataInfo.random_seed}
							</span>
						)}
					</div>
				)}

				{/* Split Ratios */}
				{(trainingDataInfo.split_ratios ||
					trainingDataInfo.data_split_ratios) && (
					<div className="text-xs text-gray-600">
						<span className="font-medium">Split Ratios:</span>{" "}
						{trainingDataInfo.split_ratios ? (
							<>
								Train{" "}
								{(
									trainingDataInfo.split_ratios.train * 100
								).toFixed(0)}
								% | Val{" "}
								{(
									trainingDataInfo.split_ratios.validation *
									100
								).toFixed(0)}
								% | Test{" "}
								{(
									trainingDataInfo.split_ratios.test * 100
								).toFixed(0)}
								%
							</>
						) : (
							<>
								Train{" "}
								{(
									trainingDataInfo.data_split_ratios
										.train_ratio * 100
								).toFixed(0)}
								% | Val{" "}
								{(
									trainingDataInfo.data_split_ratios
										.validation_ratio * 100
								).toFixed(0)}
								% | Test{" "}
								{(
									trainingDataInfo.data_split_ratios
										.test_ratio * 100
								).toFixed(0)}
								%
							</>
						)}
					</div>
				)}

				{/* Processing Flags */}
				{(trainingDataInfo?.overlap_removal ||
					trainingDataInfo?.u_sampling_applied) && (
					<div className="pt-2 border-t border-gray-200">
						<div className="text-xs text-gray-600">
							<span className="font-medium">Processing:</span>{" "}
							{trainingDataInfo?.overlap_removal && (
								<span className="ml-2 px-1 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs">
									P/U Overlap Removed
								</span>
							)}
							{trainingDataInfo?.u_sampling_applied && (
								<span className="ml-2 px-1 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
									U Subsampled
								</span>
							)}
						</div>
					</div>
				)}

				{/* Final Training Set Size */}
				{trainingDataInfo.final_training_samples && (
					<div className="pt-2 border-t border-gray-200 bg-green-50 p-2 rounded">
						<div className="text-xs font-medium text-green-800">
							Final Training Set:{" "}
							{trainingDataInfo.final_training_samples} samples
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

// Trained Model Item 組件 - 單個模型顯示項目（包含展開/摺疊邏輯）
function TrainedModelItem({
	model,
	evaluationCount,
	modelEvaluations,
	onRename,
	onDelete,
}: {
	model: TrainedModel;
	evaluationCount: number;
	modelEvaluations: EvaluationRun[];
	onRename: (
		modelId: string,
		currentName: string,
		e: React.MouseEvent,
	) => void;
	onDelete: (modelId: string, modelName: string, e: React.MouseEvent) => void;
}) {
	// 內部狀態管理 - 展開詳細資訊
	const [isExpanded, setIsExpanded] = useState(false);

	// 內部函數 - 處理詳細資訊的展開/摺疊
	const handleToggle = () => {
		setIsExpanded(!isExpanded);
	};

	// 內部函數 - 處理鍵盤事件
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			handleToggle();
		}
	};

	return (
		<div className="border rounded-lg">
			<div
				className={`p-3 cursor-pointer transition-colors hover:bg-gray-50 ${
					isExpanded ? "bg-blue-50 border-blue-200" : ""
				}`}
				onClick={handleToggle}
				onKeyDown={handleKeyDown}
				role="button"
				tabIndex={0}
				aria-expanded={isExpanded}
			>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<StatusIcon status={model.status} />
						<span className="font-medium">{model.name}</span>
						<Badge variant="outline">{model.scenarioType}</Badge>
						{evaluationCount > 0 && (
							<Badge
								variant="secondary"
								className="bg-green-100 text-green-800"
							>
								{evaluationCount} evaluations
							</Badge>
						)}
					</div>
					<div className="flex items-center gap-2">
						<RenameButton
							onClick={(e) => onRename(model.id, model.name, e)}
							title="Rename model"
						/>
						<DeleteButton
							onClick={(e) => onDelete(model.id, model.name, e)}
							title="Delete model and related evaluations"
						/>
						<Badge
							variant={
								model.status === "COMPLETED"
									? "default"
									: "secondary"
							}
						>
							{model.status}
						</Badge>
						{evaluationCount > 0 && (
							<div className="text-xs text-muted-foreground">
								{isExpanded ? "▼" : "▶"}
							</div>
						)}
					</div>
				</div>

				{/* Model Performance Metrics - Compact Display */}
				{model.training_metrics &&
					(() => {
						try {
							const metrics =
								typeof model.training_metrics === "string"
									? JSON.parse(model.training_metrics)
									: model.training_metrics;

							return (
								<div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
									{metrics.final_test_f1_score !==
										undefined && (
										<div className="bg-green-50 p-2 rounded border border-green-200 text-center">
											<MetricTooltip
												explanation={
													METRIC_EXPLANATIONS[
														"Test F1"
													]
												}
												className="text-green-700 font-medium"
											>
												<span>F1-Score</span>
											</MetricTooltip>
											<div className="text-sm font-bold text-green-800">
												{(
													metrics.final_test_f1_score *
													100
												).toFixed(1)}
												%
											</div>
										</div>
									)}
									{metrics.final_test_precision !==
										undefined && (
										<div className="bg-blue-50 p-2 rounded border border-blue-200 text-center">
											<MetricTooltip
												explanation={
													METRIC_EXPLANATIONS[
														"Test Precision"
													]
												}
												className="text-blue-700 font-medium"
											>
												<span>Precision</span>
											</MetricTooltip>
											<div className="text-sm font-bold text-blue-800">
												{(
													metrics.final_test_precision *
													100
												).toFixed(1)}
												%
											</div>
										</div>
									)}
									{metrics.final_test_recall !==
										undefined && (
										<div className="bg-pink-50 p-2 rounded border border-pink-200 text-center">
											<MetricTooltip
												explanation={
													METRIC_EXPLANATIONS[
														"Test Recall"
													]
												}
												className="text-pink-700 font-medium"
											>
												<span>Recall</span>
											</MetricTooltip>
											<div className="text-sm font-bold text-pink-800">
												{(
													metrics.final_test_recall *
													100
												).toFixed(1)}
												%
											</div>
										</div>
									)}
									{metrics.confusion_matrix?.true_negative !==
										undefined && (
										<div className="bg-gray-50 p-2 rounded border border-gray-200 text-center">
											<div className="text-gray-700 font-medium">
												True Negative
											</div>
											<div className="text-sm font-bold text-gray-800">
												{
													metrics.confusion_matrix
														.true_negative
												}
											</div>
										</div>
									)}
								</div>
							);
						} catch (error) {
							return null;
						}
					})()}

				{/* Training and Test Set Information */}
				{(() => {
					// 解析數據源配置的輔助函數
					const getDataSourceInfo = () => {
						try {
							const dataSourceConfig =
								typeof model.data_source_config === "string"
									? JSON.parse(model.data_source_config)
									: model.data_source_config;

							// 獲取訓練集信息
							let trainingSetInfo = "Unknown Training Set";
							if (
								dataSourceConfig.pDataSources?.datasetIds ||
								dataSourceConfig.uDataSources?.datasetIds
							) {
								const pDatasets =
									dataSourceConfig.pDataSources?.datasetIds ||
									[];
								const uDatasets =
									dataSourceConfig.uDataSources?.datasetIds ||
									[];
								const totalDatasets = [
									...new Set([...pDatasets, ...uDatasets]),
								];
								trainingSetInfo = `${totalDatasets.length} Dataset${totalDatasets.length > 1 ? "s" : ""}`;
							} else if (dataSourceConfig.selectedDatasets) {
								trainingSetInfo = `${dataSourceConfig.selectedDatasets.length} Dataset${dataSourceConfig.selectedDatasets.length > 1 ? "s" : ""}`;
							}

							// 獲取測試集信息 (基於split ratio)
							let testSetInfo = "Training Holdout";
							const splitRatios =
								dataSourceConfig.splitRatios ||
								dataSourceConfig.split_ratios;
							if (splitRatios?.test || splitRatios?.testRatio) {
								const testRatio =
									(splitRatios.test ||
										splitRatios.testRatio ||
										0.1) * 100;
								testSetInfo = `Holdout (${testRatio.toFixed(0)}%)`;
							}

							return { trainingSetInfo, testSetInfo };
						} catch (error) {
							return {
								trainingSetInfo: "Unknown Training Set",
								testSetInfo: "Unknown Test Set",
							};
						}
					};

					const { trainingSetInfo, testSetInfo } =
						getDataSourceInfo();

					return (
						<div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
							{/* <div className="flex items-center gap-1 bg-purple-50 px-2 py-1 rounded border border-purple-200">
								<Database className="h-3 w-3 text-purple-600" />
								<span className="font-medium text-purple-700">
									Training:
								</span>
								<span>{trainingSetInfo}</span>
							</div> */}
							<div className="flex items-center gap-1 bg-orange-50 px-2 py-1 rounded border border-orange-200">
								<BarChart className="h-3 w-3 text-orange-600" />
								<span className="font-medium text-orange-700">
									Test Set:
								</span>
								<span>{testSetInfo}</span>
							</div>
							<div className="text-xs text-muted-foreground">
								Metrics reported on PU mixture; focus on
								Recall(P) & target-risk
							</div>
						</div>
					);
				})()}

				<div className="text-sm text-muted-foreground mt-1">
					Created:{" "}
					{new Date(model.created_at).toLocaleString("zh-TW", {
						timeZone: "Asia/Taipei",
					})}
				</div>
			</div>

			{/* Training Data Information - Only show when expanded and data info exists */}
			{isExpanded && model.training_data_info && (
				<TrainingDataInformation
					trainingDataInfo={model.training_data_info}
				/>
			)}

			{/* Training Metrics - Only show when expanded and metrics exist */}
			{isExpanded && model.training_metrics && (
				<TrainingMetrics trainingMetrics={model.training_metrics} />
			)}

			{/* Model Configuration - Only show when expanded and config exists */}
			{isExpanded && model.model_config && (
				<TrainingModelConfiguration modelConfig={model.model_config} />
			)}

			{/* Model Evaluations - Only show when expanded */}
			{isExpanded && modelEvaluations.length > 0 && (
				<TrainingModelEvaluations modelEvaluations={modelEvaluations} />
			)}
		</div>
	);
}

// Trained Models 組件 - 完整的模型管理組件
function TrainedModels({
	trainedModels,
	getEvaluationCount,
	getModelEvaluations,
	handleDeleteModel,
	handleRenameModel,
}: {
	trainedModels: TrainedModel[];
	getEvaluationCount: (modelId: string) => number;
	getModelEvaluations: (modelId: string) => EvaluationRun[];
	handleDeleteModel: (
		modelId: string,
		modelName: string,
		e: React.MouseEvent,
	) => void;
	handleRenameModel: (
		modelId: string,
		currentName: string,
		e: React.MouseEvent,
	) => void;
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Database className="h-4 w-4" />
					Trained Models
				</CardTitle>
			</CardHeader>
			<CardContent>
				{trainedModels.length === 0 ? (
					<div className="text-center text-muted-foreground py-8">
						No trained models yet. Start your first training job
						above.
					</div>
				) : (
					<div className="space-y-3">
						{trainedModels.map((model) => {
							const evaluationCount = getEvaluationCount(
								model.id,
							);
							const modelEvaluations = getModelEvaluations(
								model.id,
							);

							return (
								<TrainedModelItem
									key={model.id}
									model={model}
									evaluationCount={evaluationCount}
									modelEvaluations={modelEvaluations}
									onRename={handleRenameModel}
									onDelete={handleDeleteModel}
								/>
							);
						})}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

interface Stage3TrainingWorkbenchProps {
	experimentRun: ExperimentRun;
	onComplete?: () => void;
}

interface ModelConfig {
	// PU Learning Strategy
	classPrior: number; // π_p

	// Data Preparation
	windowSize: number;

	// Model Architecture
	modelType: string;
	hiddenSize: number;
	numLayers: number;
	activationFunction: string;
	dropout: number;

	// Training Process
	epochs: number;
	batchSize: number;
	optimizer: string;
	learningRate: number;
	l2Regularization: number;

	// Training Stability
	earlyStopping: boolean;
	patience: number;
	learningRateScheduler: string;
}

interface DataSourceConfig {
	selectedDatasets: string[];
	positiveDataSourceIds: string[]; // P data: AnalysisDataset IDs for positive samples
	unlabeledDataSourceIds: string[]; // U data: AnalysisDataset IDs for unlabeled samples
	trainRatio: number;
	validationRatio: number;
	testRatio: number;
	uSampleRatio: number; // 🆕 U樣本抽樣比例 (0.0 - 1.0)
	timeRange: {
		startDate: string;
		endDate: string;
	};
}

interface EvaluationDataConfig {
	testDataSource: string;
	customDataRatio: number;
	timeRange: {
		startDate: string;
		endDate: string;
	};
}

// Evaluation Results 組件 - 評估結果顯示和管理
function EvaluationResults({
	evaluationRuns,
	trainedModels,
	handleDeleteEvaluation,
	handleRenameEvaluation,
}: {
	evaluationRuns: EvaluationRun[];
	trainedModels: TrainedModel[];
	handleDeleteEvaluation: (
		evaluationId: string,
		evaluationName: string,
		event: React.MouseEvent,
	) => void;
	handleRenameEvaluation: (
		evaluationId: string,
		currentName: string,
		event: React.MouseEvent,
	) => void;
}) {
	// 內部狀態管理 - 展開/摺疊的評估結果
	const [expandedEvaluations, setExpandedEvaluations] = useState<Set<string>>(
		new Set(),
	);

	// 獲取模型名稱的輔助函數
	const getModelName = (trainedModelId: string): string => {
		const model = trainedModels.find((m) => m.id === trainedModelId);
		return model ? model.name : `Model ID: ${trainedModelId}`;
	};

	// 解析測試集來源信息的輔助函數
	const getTestSetInfo = (testSetSource: string): string => {
		try {
			const testSetConfig = JSON.parse(testSetSource);

			// 檢查是否有目標數據集信息 (用於 Domain Adaptation 或 Generalization Challenge)
			if (testSetConfig.targetDataset) {
				const { building, floor, room } = testSetConfig.targetDataset;
				return `${building} ${floor} ${room}`;
			}

			// 檢查測試數據來源類型
			if (testSetConfig.testDataSource === "training_holdout") {
				return "Training Holdout";
			}
			if (testSetConfig.testDataSource === "target_dataset") {
				return "Target Dataset";
			}
			return "Custom Test Set";
		} catch (error) {
			return "Unknown Test Set";
		}
	};

	// 內部函數 - 處理評估結果的展開/摺疊
	const handleEvaluationToggle = (evaluationId: string) => {
		setExpandedEvaluations((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(evaluationId)) {
				newSet.delete(evaluationId);
			} else {
				newSet.add(evaluationId);
			}
			return newSet;
		});
	};

	// 內部函數 - 處理鍵盤事件
	const handleKeyDown = (e: React.KeyboardEvent, evaluationId: string) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			handleEvaluationToggle(evaluationId);
		}
	};
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<BarChart className="h-4 w-4" />
					Evaluation Results
				</CardTitle>
			</CardHeader>
			<CardContent>
				{evaluationRuns.length === 0 ? (
					<div className="text-center text-muted-foreground py-8">
						No evaluation runs yet. Select a trained model and start
						evaluation.
					</div>
				) : (
					<div className="space-y-3">
						{evaluationRuns.map((run) => {
							const isExpanded = expandedEvaluations.has(run.id);

							return (
								<div key={run.id} className="border rounded-lg">
									<div
										className={`p-3 cursor-pointer transition-colors hover:bg-gray-50 ${
											isExpanded
												? "bg-blue-50 border-blue-200"
												: ""
										}`}
										onClick={() =>
											handleEvaluationToggle(run.id)
										}
										onKeyDown={(e) =>
											handleKeyDown(e, run.id)
										}
										role="button"
										tabIndex={0}
										aria-expanded={isExpanded}
									>
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<StatusIcon
													status={run.status}
												/>
												<span className="font-medium">
													{run.name}
												</span>
												<Badge variant="outline">
													{run.scenarioType}
												</Badge>
											</div>
											<div className="flex items-center gap-2">
												<RenameButton
													onClick={(e) =>
														handleRenameEvaluation(
															run.id,
															run.name,
															e,
														)
													}
													title="Rename evaluation"
												/>
												<DeleteButton
													onClick={(e) =>
														handleDeleteEvaluation(
															run.id,
															run.name,
															e,
														)
													}
													title="Delete evaluation"
												/>
												<Badge
													variant={
														run.status ===
														"COMPLETED"
															? "default"
															: "secondary"
													}
												>
													{run.status}
												</Badge>
												<div className="text-xs text-muted-foreground">
													{run.evaluationMetrics
														? isExpanded
															? "▼"
															: "▶"
														: ""}
												</div>
											</div>
										</div>

										{/* Model and Test Set Information */}
										<div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
											<div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded border border-blue-200">
												<Brain className="h-3 w-3 text-blue-600" />
												<span className="font-medium text-blue-700">
													Model:
												</span>
												<span>
													{getModelName(
														run.trainedModelId,
													)}
												</span>
											</div>
											<div className="flex items-center gap-1 bg-orange-50 px-2 py-1 rounded border border-orange-200">
												<Database className="h-3 w-3 text-orange-600" />
												<span className="font-medium text-orange-700">
													Test Set:
												</span>
												<span>
													{getTestSetInfo(
														run.testSetSource,
													)}
												</span>
											</div>
										</div>
										<div className="text-xs text-muted-foreground mt-1">
											Zero-shot transfer (no adaptation)
										</div>

										{/* Evaluation Performance Metrics - Compact Display */}
										{run.evaluationMetrics &&
											(() => {
												try {
													const metrics =
														typeof run.evaluationMetrics ===
														"string"
															? JSON.parse(
																	run.evaluationMetrics,
																)
															: run.evaluationMetrics;

													if (
														!metrics ||
														!metrics.precision ||
														!metrics.recall
													) {
														return null;
													}

													return (
														<div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
															{metrics.f1_score !==
																undefined && (
																<div className="bg-green-50 p-2 rounded border border-green-200 text-center">
																	<MetricTooltip
																		explanation={
																			METRIC_EXPLANATIONS[
																				"Test F1"
																			]
																		}
																		className="text-green-700 font-medium"
																	>
																		<span>
																			F1-Score
																		</span>
																	</MetricTooltip>
																	<div className="text-sm font-bold text-green-800">
																		{(
																			metrics.f1_score *
																			100
																		).toFixed(
																			1,
																		)}
																		%
																	</div>
																</div>
															)}
															{metrics.precision !==
																undefined && (
																<div className="bg-blue-50 p-2 rounded border border-blue-200 text-center">
																	<MetricTooltip
																		explanation={
																			METRIC_EXPLANATIONS[
																				"Test Precision"
																			]
																		}
																		className="text-blue-700 font-medium"
																	>
																		<span>
																			Precision
																		</span>
																	</MetricTooltip>
																	<div className="text-sm font-bold text-blue-800">
																		{(
																			metrics.precision *
																			100
																		).toFixed(
																			1,
																		)}
																		%
																	</div>
																</div>
															)}
															{metrics.recall !==
																undefined && (
																<div className="bg-pink-50 p-2 rounded border border-pink-200 text-center">
																	<MetricTooltip
																		explanation={
																			METRIC_EXPLANATIONS[
																				"Test Recall"
																			]
																		}
																		className="text-pink-700 font-medium"
																	>
																		<span>
																			Recall
																		</span>
																	</MetricTooltip>
																	<div className="text-sm font-bold text-pink-800">
																		{(
																			metrics.recall *
																			100
																		).toFixed(
																			1,
																		)}
																		%
																	</div>
																</div>
															)}
														</div>
													);
												} catch (error) {
													return null;
												}
											})()}

										<div className="text-sm text-muted-foreground mt-1">
											Created:{" "}
											{new Date(
												run.createdAt,
											).toLocaleString("zh-TW", {
												timeZone: "Asia/Taipei",
											})}
										</div>
									</div>

									{/* Expandable Content - Only show when expanded and has metrics */}
									{isExpanded && run.evaluationMetrics && (
										<div className="border-t bg-gray-50 p-3">
											{/* Original JSON Data - Collapsible */}
											<details className="mb-4">
												<summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 mb-2">
													📄 Raw JSON Data (Click to
													expand)
												</summary>
												<div className="mt-2 p-2 bg-gray-100 rounded text-xs">
													<pre>
														{JSON.stringify(
															typeof run.evaluationMetrics ===
																"string"
																? JSON.parse(
																		run.evaluationMetrics,
																	)
																: run.evaluationMetrics,
															null,
															2,
														)}
													</pre>
												</div>
											</details>

											{/* Visualized Evaluation Results */}
											{(() => {
												const metrics =
													typeof run.evaluationMetrics ===
													"string"
														? JSON.parse(
																run.evaluationMetrics,
															)
														: run.evaluationMetrics;

												// Ensure necessary metric data is available
												if (
													!metrics ||
													!metrics.precision ||
													!metrics.recall
												) {
													return (
														<div className="text-center text-gray-500 py-4">
															⚠️ Incomplete
															evaluation metrics
															data
														</div>
													);
												}

												// Debug: Output confusion_matrix structure (for development viewing)
												// console.log(
												// 	"Confusion Matrix structure:",
												// 	metrics.confusion_matrix,
												// );

												const confusionMatrix =
													metrics.confusion_matrix;

												// Safely extract confusion matrix data
												let tp: number;
												let fp: number;
												let fn: number;
												let tn: number;

												if (!confusionMatrix) {
													// If no confusion matrix, try to calculate from other metrics
													tp = fp = fn = tn = 0;
												} else if (
													Array.isArray(
														confusionMatrix,
													) &&
													confusionMatrix.length >= 2
												) {
													// 2D array format: [[tn, fp], [fn, tp]]
													if (
														Array.isArray(
															confusionMatrix[0],
														) &&
														Array.isArray(
															confusionMatrix[1],
														)
													) {
														tn =
															confusionMatrix[0][0] ||
															0;
														fp =
															confusionMatrix[0][1] ||
															0;
														fn =
															confusionMatrix[1][0] ||
															0;
														tp =
															confusionMatrix[1][1] ||
															0;
													} else {
														// 1D array format: [tn, fp, fn, tp]
														tn =
															confusionMatrix[0] ||
															0;
														fp =
															confusionMatrix[1] ||
															0;
														fn =
															confusionMatrix[2] ||
															0;
														tp =
															confusionMatrix[3] ||
															0;
													}
												} else if (
													typeof confusionMatrix ===
													"object"
												) {
													// Object format: {tp: x, fp: x, fn: x, tn: x}
													tp =
														confusionMatrix.tp ||
														confusionMatrix.true_positive ||
														0;
													fp =
														confusionMatrix.fp ||
														confusionMatrix.false_positive ||
														0;
													fn =
														confusionMatrix.fn ||
														confusionMatrix.false_negative ||
														0;
													tn =
														confusionMatrix.tn ||
														confusionMatrix.true_negative ||
														0;
												} else {
													// If format is unknown, use default values
													tp = fp = fn = tn = 0;
												}

												const precision = (
													metrics.precision * 100
												).toFixed(2);
												const recall = (
													metrics.recall * 100
												).toFixed(2);
												const f1Score = (
													metrics.f1_score * 100
												).toFixed(2);
												const accuracy = (
													metrics.accuracy * 100
												).toFixed(2);
												const aucRoc = (
													metrics.auc_roc * 100
												).toFixed(1);

												return (
													<div className="mt-4 space-y-6">
														{/* Confusion Matrix - Only show when data is available */}
														{(tp > 0 ||
															fp > 0 ||
															fn > 0 ||
															tn > 0) && (
															<div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
																<div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
																	<h4 className="text-lg font-semibold text-gray-800">
																		Confusion
																		Matrix
																	</h4>
																	<p className="text-sm text-gray-600 mt-1">
																		2×2
																		contingency
																		table
																		for
																		binary
																		classification
																		evaluation
																	</p>
																</div>
																<div className="p-6">
																	<div className="flex justify-center">
																		<div className="border border-gray-300 rounded-lg overflow-hidden">
																			<table className="table-fixed">
																				<thead>
																					<tr>
																						<td className="w-32 h-16 bg-gray-100 border-r border-b border-gray-300" />
																						<td className="w-32 h-16 bg-gray-100 border-r border-b border-gray-300 text-center font-semibold text-sm text-gray-700 px-2">
																							<div className="flex flex-col justify-center h-full">
																								<div>
																									Predicted
																								</div>
																								<div>
																									Positive
																								</div>
																							</div>
																						</td>
																						<td className="w-32 h-16 bg-gray-100 border-b border-gray-300 text-center font-semibold text-sm text-gray-700 px-2">
																							<div className="flex flex-col justify-center h-full">
																								<div>
																									Predicted
																								</div>
																								<div>
																									Negative
																								</div>
																							</div>
																						</td>
																					</tr>
																				</thead>
																				<tbody>
																					<tr>
																						<td className="w-32 h-20 bg-gray-100 border-r border-b border-gray-300 text-center font-semibold text-sm text-gray-700 px-2">
																							<div className="flex flex-col justify-center h-full">
																								<div>
																									Actual
																								</div>
																								<div>
																									Positive
																								</div>
																							</div>
																						</td>
																						<td className="w-32 h-20 border-r border-b border-gray-300 text-center bg-green-50">
																							<div className="flex flex-col justify-center h-full">
																								<div className="text-2xl font-bold text-green-700">
																									{
																										tp
																									}
																								</div>
																								<div className="text-xs text-gray-600 mt-1">
																									True
																									Positive
																								</div>
																							</div>
																						</td>
																						<td className="w-32 h-20 border-b border-gray-300 text-center bg-red-50">
																							<div className="flex flex-col justify-center h-full">
																								<div className="text-2xl font-bold text-red-700">
																									{
																										fn
																									}
																								</div>
																								<div className="text-xs text-gray-600 mt-1">
																									False
																									Negative
																								</div>
																							</div>
																						</td>
																					</tr>
																					<tr>
																						<td className="w-32 h-20 bg-gray-100 border-r border-gray-300 text-center font-semibold text-sm text-gray-700 px-2">
																							<div className="flex flex-col justify-center h-full">
																								<div>
																									Actual
																								</div>
																								<div>
																									Negative
																								</div>
																							</div>
																						</td>
																						<td className="w-32 h-20 border-r border-gray-300 text-center bg-yellow-50">
																							<div className="flex flex-col justify-center h-full">
																								<div className="text-2xl font-bold text-yellow-700">
																									{
																										fp
																									}
																								</div>
																								<div className="text-xs text-gray-600 mt-1">
																									False
																									Positive
																								</div>
																							</div>
																						</td>
																						<td className="w-32 h-20 border-gray-300 text-center bg-blue-50">
																							<div className="flex flex-col justify-center h-full">
																								<div className="text-2xl font-bold text-blue-700">
																									{
																										tn
																									}
																								</div>
																								<div className="text-xs text-gray-600 mt-1">
																									True
																									Negative
																								</div>
																							</div>
																						</td>
																					</tr>
																				</tbody>
																			</table>
																		</div>
																	</div>
																	<div className="mt-4 text-center text-sm text-gray-600">
																		<p className="mb-2">
																			<strong>
																				Classification
																				Accuracy:
																			</strong>{" "}
																			{(
																				((tp +
																					tn) /
																					(tp +
																						fp +
																						fn +
																						tn)) *
																				100
																			).toFixed(
																				1,
																			)}
																			%
																		</p>
																		<p>
																			<strong>
																				Error
																				Rate:
																			</strong>{" "}
																			{(
																				((fp +
																					fn) /
																					(tp +
																						fp +
																						fn +
																						tn)) *
																				100
																			).toFixed(
																				1,
																			)}
																			%
																		</p>
																	</div>
																</div>
															</div>
														)}
														{/* Business Impact Assessment */}
														<div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
															<div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
																<h4 className="text-lg font-semibold text-gray-800">
																	Business
																	Impact
																	Assessment
																</h4>
																<p className="text-sm text-gray-600 mt-1">
																	Economic and
																	operational
																	risk
																	analysis
																	based on
																	classification
																	errors
																</p>
															</div>
															<div className="p-6">
																<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
																	<div className="bg-red-50 border border-red-200 rounded-lg p-4">
																		<div className="flex items-center mb-3">
																			<div className="w-3 h-3 bg-red-500 rounded-full mr-2" />
																			<h5 className="font-semibold text-red-800">
																				Type
																				II
																				Error
																				Impact
																				(False
																				Negatives)
																			</h5>
																		</div>
																		<div className="mb-3">
																			<span className="text-2xl font-bold text-red-700">
																				{
																					fn
																				}
																			</span>
																			<span className="text-sm text-red-600 ml-2">
																				missed
																				anomalies
																			</span>
																		</div>
																		<div className="space-y-2 text-sm text-gray-700">
																			<div className="flex items-center">
																				<span className="w-2 h-2 bg-red-400 rounded-full mr-2" />
																				<span>
																					Equipment
																					damage
																					risk
																					escalation
																				</span>
																			</div>
																			<div className="flex items-center">
																				<span className="w-2 h-2 bg-red-400 rounded-full mr-2" />
																				<span>
																					Undetected
																					energy
																					consumption
																					inefficiencies
																				</span>
																			</div>
																			<div className="flex items-center">
																				<span className="w-2 h-2 bg-red-400 rounded-full mr-2" />
																				<span>
																					Potential
																					safety
																					protocol
																					violations
																				</span>
																			</div>
																		</div>
																	</div>
																	<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
																		<div className="flex items-center mb-3">
																			<div className="w-3 h-3 bg-yellow-500 rounded-full mr-2" />
																			<h5 className="font-semibold text-yellow-800">
																				Type
																				I
																				Error
																				Impact
																				(False
																				Positives)
																			</h5>
																		</div>
																		<div className="mb-3">
																			<span className="text-2xl font-bold text-yellow-700">
																				{
																					fp
																				}
																			</span>
																			<span className="text-sm text-yellow-600 ml-2">
																				false
																				alarms
																			</span>
																		</div>
																		<div className="space-y-2 text-sm text-gray-700">
																			<div className="flex items-center">
																				<span className="w-2 h-2 bg-yellow-400 rounded-full mr-2" />
																				<span>
																					Operator
																					alert
																					desensitization
																				</span>
																			</div>
																			<div className="flex items-center">
																				<span className="w-2 h-2 bg-yellow-400 rounded-full mr-2" />
																				<span>
																					Unnecessary
																					maintenance
																					resource
																					allocation
																				</span>
																			</div>
																			<div className="flex items-center">
																				<span className="w-2 h-2 bg-yellow-400 rounded-full mr-2" />
																				<span>
																					System
																					credibility
																					deterioration
																				</span>
																			</div>
																		</div>
																	</div>
																</div>
																<div className="mt-6 pt-4 border-t border-gray-200">
																	<div className="grid grid-cols-2 gap-4 text-center">
																		<div>
																			<div className="text-sm text-gray-600 mb-1">
																				Overall
																				Classification
																				Accuracy
																			</div>
																			<div className="text-2xl font-bold text-gray-800">
																				{(
																					((tp +
																						tn) /
																						(tp +
																							fp +
																							fn +
																							tn)) *
																					100
																				).toFixed(
																					1,
																				)}
																				%
																			</div>
																		</div>
																		<div>
																			<div className="text-sm text-gray-600 mb-1">
																				Error
																				Rate
																			</div>
																			<div className="text-2xl font-bold text-gray-800">
																				{(
																					((fp +
																						fn) /
																						(tp +
																							fp +
																							fn +
																							tn)) *
																					100
																				).toFixed(
																					1,
																				)}
																				%
																			</div>
																		</div>
																	</div>
																</div>
															</div>
														</div>
													</div>
												);
											})()}
										</div>
									)}
								</div>
							);
						})}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

export function Stage3TrainingWorkbench({
	experimentRun,
}: Stage3TrainingWorkbenchProps) {
	// State for configuration
	const [scenarioType, setScenarioType] = useState<string>("ERM_BASELINE");
	const [selectedTargetDataset, setSelectedTargetDataset] =
		useState<string>("");
	const [selectedSourceModel, setSelectedSourceModel] = useState<string>("");
	const [availableDatasets, setAvailableDatasets] = useState<any[]>([]);

	const [modelConfig, setModelConfig] = useState<ModelConfig>({
		// PU Learning Strategy
		classPrior: 0.05,

		// Data Preparation
		windowSize: 60,

		// Model Architecture
		modelType: "LSTM",
		hiddenSize: 64,
		numLayers: 1,
		activationFunction: "ReLU",
		dropout: 0.4,

		// Training Process
		epochs: 100,
		batchSize: 128,
		optimizer: "Adam",
		learningRate: 0.001,
		l2Regularization: 0.001,

		// Training Stability
		earlyStopping: true,
		patience: 10,
		learningRateScheduler: "none",
	});
	const [dataSourceConfig, setDataSourceConfig] = useState<DataSourceConfig>({
		selectedDatasets: [],
		positiveDataSourceIds: [],
		unlabeledDataSourceIds: [],
		trainRatio: 70,
		validationRatio: 10,
		testRatio: 20,
		uSampleRatio: 0.1, // 🆕 預設使用 10% 的 U 樣本
		timeRange: {
			startDate: "",
			endDate: "",
		},
	});

	const [evaluationDataConfig, setEvaluationDataConfig] =
		useState<EvaluationDataConfig>({
			testDataSource: "training_holdout",
			customDataRatio: 20,
			timeRange: {
				startDate: "",
				endDate: "",
			},
		});

	// State for trained models and evaluation runs
	const [trainedModels, setTrainedModels] = useState<TrainedModel[]>([]);
	const [evaluationRuns, setEvaluationRuns] = useState<EvaluationRun[]>([]);
	const [selectedModel, setSelectedModel] = useState<string>("");

	// References for auto-scrolling logs
	const trainingLogRef = useRef<HTMLDivElement>(null);
	const evaluationLogRef = useRef<HTMLDivElement>(null);

	// State for training monitoring
	const [isTraining, setIsTraining] = useState(false);
	const [isEvaluating, setIsEvaluating] = useState(false);

	// Add missing status states
	const trainingStatus = {
		isTraining: isTraining,
		isCompleted: false,
	};

	const evaluationStatus = {
		isEvaluating: isEvaluating,
	};
	const [trainingLogs, setTrainingLogs] = useState<string[]>([]);
	const [evaluationLogs, setEvaluationLogs] = useState<string[]>([]);

	// Auto-scroll logs to bottom when new logs are added
	useEffect(() => {
		if (trainingLogRef.current) {
			trainingLogRef.current.scrollTop =
				trainingLogRef.current.scrollHeight;
		}
	}, [trainingLogs]);

	useEffect(() => {
		if (evaluationLogRef.current) {
			evaluationLogRef.current.scrollTop =
				evaluationLogRef.current.scrollHeight;
		}
	}, [evaluationLogs]);

	// Load existing data
	useEffect(() => {
		loadTrainedModels();
		loadEvaluationRuns();
		loadAvailableDatasets();
	}, []);

	// Handle data split ratio changes
	const handleRatioChange = (
		type: keyof Pick<
			DataSourceConfig,
			"trainRatio" | "validationRatio" | "testRatio"
		>,
		value: number,
	) => {
		if (type === "testRatio") {
			// Test ratio is auto-calculated, don't allow manual changes
			return;
		}

		const newDataSourceConfig = {
			...dataSourceConfig,
			[type]: value,
		};

		// Auto-calculate test ratio to make total = 100%
		const autoTestRatio =
			100 -
			newDataSourceConfig.trainRatio -
			newDataSourceConfig.validationRatio;

		// Ensure test ratio is within reasonable bounds (at least 10%, at most 40%)
		const clampedTestRatio = Math.max(10, Math.min(40, autoTestRatio));

		setDataSourceConfig({
			...newDataSourceConfig,
			testRatio: clampedTestRatio,
		});
	};

	const loadTrainedModels = async () => {
		try {
			const response = await fetch(
				`https://weakrisk.yinchen.tw/api/v2/trained-models?experiment_run_id=${experimentRun.id}`,
			);
			if (response.ok) {
				const models = await response.json();
				// console.log("📊 Loaded trained models:", models);
				// console.log(
				// 	"📊 ERM_BASELINE models:",
				// 	models.filter(
				// 		(m: any) => m.scenarioType === "ERM_BASELINE",
				// 	),
				// );
				// console.log(
				// 	"📊 Completed ERM_BASELINE models:",
				// 	models.filter(
				// 		(m: any) =>
				// 			m.scenarioType === "ERM_BASELINE" &&
				// 			m.status === "COMPLETED",
				// 	),
				// );
				setTrainedModels(models);

				// Auto-select first completed ERM_BASELINE model (for GENERALIZATION_CHALLENGE)
				if (
					scenarioType === "GENERALIZATION_CHALLENGE" &&
					!selectedSourceModel
				) {
					const firstERMModel = models.find(
						(m: any) =>
							m.scenarioType === "ERM_BASELINE" &&
							m.status === "COMPLETED",
					);
					if (firstERMModel) {
						setSelectedSourceModel(firstERMModel.id.toString());
					}
				}
			}
		} catch (error) {
			console.error("Failed to load trained models:", error);
		}
	};

	const loadEvaluationRuns = async () => {
		try {
			const response = await fetch(
				`https://weakrisk.yinchen.tw/api/v2/evaluation-runs?experiment_run_id=${experimentRun.id}`,
			);
			if (response.ok) {
				const runs = await response.json();
				setEvaluationRuns(runs);
			}
		} catch (error) {
			console.error("Failed to load evaluation runs:", error);
		}
	};

	const loadAvailableDatasets = async () => {
		try {
			const response = await fetch(
				"https://weakrisk.yinchen.tw/api/v2/analysis-datasets",
			);
			if (response.ok) {
				const datasets = await response.json();
				setAvailableDatasets(datasets);
			}
		} catch (error) {
			console.error("Failed to load available datasets:", error);
		}
	};

	const refreshData = async () => {
		console.log("🔄 Reloading models & evaluation data");

		try {
			// Show loading start notification
			toast.info("🔄 Reloading data...");

			await Promise.all([loadTrainedModels(), loadEvaluationRuns()]);

			// Check if there are any running models and provide specific feedback
			const runningModels = trainedModels.filter(
				(model) => model.status === "RUNNING",
			);
			const completedModels = trainedModels.filter(
				(model) => model.status === "COMPLETED",
			);
			const failedModels = trainedModels.filter(
				(model) => model.status === "FAILED",
			);

			// Provide detailed loading results feedback
			const modelCount = trainedModels.length;
			const evaluationCount = evaluationRuns.length;

			if (runningModels.length > 0) {
				toast.success(
					`📊 Data updated! Models: ${modelCount} (${runningModels.length} training, ${completedModels.length} completed, ${failedModels.length} failed), Evaluations: ${evaluationCount}`,
				);
			} else if (completedModels.length > 0) {
				toast.success(
					`✅ Data updated! ${completedModels.length} models completed training, ${evaluationCount} evaluation records`,
				);
			} else {
				toast.success(
					`📁 Data loaded: ${modelCount} models, ${evaluationCount} evaluation records`,
				);
			}
		} catch (error) {
			console.error("Failed to reload data:", error);
			toast.error(
				"❌ Failed to reload data, please check network connection",
			);
		}
	};

	// Helper functions for model-evaluation relationships
	const getEvaluationCount = (modelId: string) => {
		return evaluationRuns.filter((run) => run.trainedModelId === modelId)
			.length;
	};

	const getModelEvaluations = (modelId: string) => {
		return evaluationRuns.filter((run) => run.trainedModelId === modelId);
	};

	const handleDeleteModel = async (
		modelId: string,
		modelName: string,
		e: React.MouseEvent,
	) => {
		// Prevent event bubbling to the parent div
		e.stopPropagation();

		if (
			!confirm(
				`Are you sure you want to delete model "${modelName}"? This will also delete all related evaluation results.`,
			)
		) {
			return;
		}

		try {
			console.log("🗑️ Delete model request:", modelId);

			const response = await fetch(
				`https://weakrisk.yinchen.tw/api/v2/trained-models/${modelId}`,
				{
					method: "DELETE",
				},
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();
			console.log("✅ Model deleted successfully:", result);

			toast.success(
				`Successfully deleted model "${modelName}" and ${result.deletedEvaluations} evaluation results`,
			);

			// Refresh the data
			await loadTrainedModels();
			await loadEvaluationRuns();
		} catch (error) {
			console.error("❌ Failed to delete model:", error);
			toast.error(
				`Failed to delete model: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	};

	// Handle model renaming
	const handleRenameModel = async (
		modelId: string,
		currentName: string,
		e: React.MouseEvent,
	) => {
		// Prevent event bubbling to the parent div
		e.stopPropagation();

		const newName = prompt(
			`Enter new name for model "${currentName}":`,
			currentName,
		);

		if (
			!newName ||
			newName.trim() === "" ||
			newName.trim() === currentName
		) {
			return; // User cancelled or entered same name
		}

		if (newName.trim().length > 100) {
			toast.error("Model name cannot exceed 100 characters");
			return;
		}

		try {
			console.log(
				"🏷️ Rename model request:",
				modelId,
				"->",
				newName.trim(),
			);

			const response = await fetch(
				`https://weakrisk.yinchen.tw/api/v2/trained-models/${modelId}/rename`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						new_name: newName.trim(),
					}),
				},
			);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(
					errorData.detail ||
						`HTTP error! status: ${response.status}`,
				);
			}

			const result = await response.json();
			console.log("✅ Model renamed successfully:", result);

			toast.success(
				`Model successfully renamed from "${currentName}" to "${newName.trim()}"`,
			);

			// Reload trained models to reflect the changes
			await loadTrainedModels();
		} catch (error) {
			console.error("❌ Failed to rename model:", error);
			toast.error(
				`Failed to rename model: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	};

	// Handle evaluation deletion
	const handleDeleteEvaluation = async (
		evaluationId: string,
		evaluationName: string,
		event: React.MouseEvent,
	) => {
		event.stopPropagation(); // Prevent triggering toggle

		const confirmed = window.confirm(
			`Are you sure you want to delete evaluation "${evaluationName}"?\n\nThis action cannot be undone.`,
		);

		if (!confirmed) {
			return;
		}

		try {
			const response = await fetch(
				`https://weakrisk.yinchen.tw/api/v2/evaluation-runs/${evaluationId}`,
				{
					method: "DELETE",
				},
			);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(
					errorData.detail || "Failed to delete evaluation",
				);
			}

			const result = await response.json();

			// Update local state
			setEvaluationRuns((prevRuns) =>
				prevRuns.filter((run) => run.id !== evaluationId),
			);

			toast.success(result.message || "Evaluation deleted successfully");
		} catch (error) {
			console.error("❌ Failed to delete evaluation:", error);
			toast.error(
				`Failed to delete evaluation: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	};

	// Handle evaluation renaming
	const handleRenameEvaluation = async (
		evaluationId: string,
		currentName: string,
		e: React.MouseEvent,
	) => {
		// Prevent event bubbling to the parent div
		e.stopPropagation();

		const newName = prompt(
			`Enter new name for evaluation "${currentName}":`,
			currentName,
		);

		if (
			!newName ||
			newName.trim() === "" ||
			newName.trim() === currentName
		) {
			return; // User cancelled or entered same name
		}

		if (newName.trim().length > 100) {
			toast.error("Evaluation name cannot exceed 100 characters");
			return;
		}

		try {
			console.log(
				"🏷️ Rename evaluation request:",
				evaluationId,
				"->",
				newName.trim(),
			);

			const response = await fetch(
				`https://weakrisk.yinchen.tw/api/v2/evaluation-runs/${evaluationId}/rename`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						new_name: newName.trim(),
					}),
				},
			);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(
					errorData.detail ||
						`HTTP error! status: ${response.status}`,
				);
			}

			const result = await response.json();
			console.log("✅ Evaluation renamed successfully:", result);

			toast.success(
				`Evaluation successfully renamed from "${currentName}" to "${newName.trim()}"`,
			);

			// Reload evaluation runs to reflect the changes
			await loadEvaluationRuns();
		} catch (error) {
			console.error("❌ Failed to rename evaluation:", error);
			toast.error(
				`Failed to rename evaluation: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	};

	// Extract AnalysisDataset IDs for P and U data sources from experiment configuration
	const extractDataSourceIds = () => {
		console.log(
			"📊 Extracting data source IDs from experiment configuration",
		);

		const filteringParams = experimentRun.filtering_parameters;

		// For now, I'll use all available datasets for both P and U
		// In the future, this could be more granular based on user selection
		let availableDatasetIds: string[] = [];

		if (filteringParams?.selectedDatasetIds) {
			availableDatasetIds = filteringParams.selectedDatasetIds;
		} else if (availableDatasets.length > 0) {
			// Fallback: use all loaded datasets
			availableDatasetIds = availableDatasets.map(
				(dataset) => dataset.id,
			);
		}

		console.log("🔍 Available dataset IDs:", availableDatasetIds);

		// For PU Learning:
		// - P (Positive) data sources: All datasets (since they contain labeled positive samples)
		// - U (Unlabeled) data sources: All datasets (since they contain unlabeled samples)
		const result = {
			positive: availableDatasetIds,
			unlabeled: availableDatasetIds,
		};

		console.log("✅ Extracted P data sources:", result.positive);
		console.log("✅ Extracted U data sources:", result.unlabeled);

		return result;
	};

	const startTraining = async () => {
		console.log("🚀 Starting training request");
		setIsTraining(true);
		setTrainingLogs([]);

		try {
			// Extract AnalysisDataset IDs from experimentRun's filtering parameters
			const extractedDataSourceIds = extractDataSourceIds();

			// Prepare the enhanced data source configuration with P and U data sources
			const enhancedDataSourceConfig = {
				...dataSourceConfig,
				positiveDataSourceIds: extractedDataSourceIds.positive,
				unlabeledDataSourceIds: extractedDataSourceIds.unlabeled,
			};

			console.log(
				"📤 Sending training API request with P and U data sources",
			);
			console.log(
				"🔍 Positive data sources:",
				extractedDataSourceIds.positive,
			);
			console.log(
				"🔍 Unlabeled data sources:",
				extractedDataSourceIds.unlabeled,
			);

			// Generate model name with Taiwan time
			const taiwanTime = new Date()
				.toLocaleString("sv-SE", {
					timeZone: "Asia/Taipei",
				})
				.replace(" ", "_")
				.replace(/:/g, "-");

			const response = await fetch(
				"https://weakrisk.yinchen.tw/api/v2/trained-models",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						name: `${scenarioType}_${taiwanTime}`,
						scenario_type: scenarioType,
						experimentRunId: experimentRun.id,
						modelConfig: JSON.stringify(modelConfig),
						dataSourceConfig: JSON.stringify(
							enhancedDataSourceConfig,
						),
					}),
				},
			);

			console.log("📥 Received backend response:", response.status);

			if (response.ok) {
				const newModel = await response.json();
				console.log("✅ Training job created:", newModel);
				console.log("🔍 Checking jobId:", newModel.jobId);
				console.log(
					"🔍 Full response object:",
					JSON.stringify(newModel, null, 2),
				);
				setTrainedModels((prev) => [...prev, newModel]);
				toast.success("Training job started successfully!");

				// Start WebSocket monitoring
				if (newModel.jobId) {
					console.log("🔗 Starting polling for job:", newModel.jobId);
					startTrainingMonitor(newModel.jobId);
				} else {
					console.error(
						"❌ No jobId received, cannot start monitoring",
					);
					setTrainingLogs((prev) => [
						...prev,
						"❌ No jobId received, cannot start monitoring",
					]);
				}
			} else {
				const error = await response.json();
				console.error("❌ Training request failed:", error);
				toast.error(error.detail || "Failed to start training");
				setIsTraining(false); // Set to false on API error
			}
		} catch (error) {
			console.error("❌ Training request exception:", error);
			toast.error("Failed to start training");
			setIsTraining(false); // Only set to false on error
		}

		console.log("🔚 Training request processing completed");
	};

	const startEvaluation = async () => {
		// Check model selection based on scenario type
		const modelToUse =
			scenarioType === "GENERALIZATION_CHALLENGE"
				? selectedSourceModel
				: selectedModel;

		if (!modelToUse) {
			toast.error("Please select a trained model for evaluation");
			return;
		}

		// For Domain Adaptation, also check if target dataset is selected
		if (scenarioType === "DOMAIN_ADAPTATION" && !selectedTargetDataset) {
			toast.error("Please select a target dataset for testing");
			return;
		}

		setIsEvaluating(true);
		setEvaluationLogs([]);

		try {
			// Prepare test set configuration based on scenario type
			let testSetConfig: any = evaluationDataConfig;

			if (
				scenarioType === "DOMAIN_ADAPTATION" ||
				scenarioType === "GENERALIZATION_CHALLENGE"
			) {
				// For Domain Adaptation, use the selected target dataset
				const selectedDataset = availableDatasets.find(
					(dataset) =>
						dataset.id.toString() === selectedTargetDataset,
				);

				if (selectedDataset) {
					testSetConfig = {
						...evaluationDataConfig,
						targetDataset: {
							building:
								selectedDataset.building_name ||
								selectedDataset.building,
							floor:
								selectedDataset.floor_name ||
								selectedDataset.floor,
							room:
								selectedDataset.room_name ||
								selectedDataset.room,
							datasetId: selectedDataset.id,
						},
					};
				}
			}

			// Generate evaluation name with Taiwan time
			const taiwanTime = new Date()
				.toLocaleString("sv-SE", {
					timeZone: "Asia/Taipei",
				})
				.replace(" ", "_")
				.replace(/:/g, "-");

			const response = await fetch(
				"https://weakrisk.yinchen.tw/api/v2/evaluation-runs",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						name: `Eval_${scenarioType}_${taiwanTime}`,
						scenario_type: scenarioType,
						trained_model_id: modelToUse,
						testSetSource: JSON.stringify(testSetConfig),
					}),
				},
			);

			if (response.ok) {
				const newRun = await response.json();
				setEvaluationRuns((prev) => [...prev, newRun]);
				toast.success("Evaluation job started successfully!");

				// Start WebSocket monitoring
				startEvaluationMonitor(newRun.jobId);
			} else {
				const error = await response.json();
				toast.error(error.detail || "Failed to start evaluation");
			}
		} catch (error) {
			console.error("Failed to start evaluation:", error);
			toast.error("Failed to start evaluation");
		} finally {
			setIsEvaluating(false);
		}
	};

	// Function aliases for button handlers
	const handleStartTraining = startTraining;
	const handleStartEvaluation = startEvaluation;

	const startTrainingMonitor = (jobId: string) => {
		// Manual monitoring instead of automatic polling
		console.log("Training job started with ID:", jobId);
		console.log(
			"💡 Use the reload button to manually check training status",
		);

		// Show notification to user
		toast.info(
			"Training started! Use the reload button to check progress.",
			{
				duration: 5000,
			},
		);
	};

	const startEvaluationMonitor = (jobId: string) => {
		// Manual monitoring instead of automatic polling
		console.log("Evaluation job started with ID:", jobId);
		console.log(
			"💡 Use the reload button to manually check evaluation status",
		);

		// Show notification to user
		toast.info(
			"Evaluation started! Use the reload button to check progress.",
			{
				duration: 5000,
			},
		);
	};

	// WebSocket connection indicator component
	const ConnectionIndicator = ({
		connected,
		isActive,
	}: {
		connected: boolean;
		isActive: boolean;
	}) => {
		if (isActive) {
			return (
				<div className="flex items-center gap-1">
					<div
						className={`w-2 h-2 rounded-full ${connected ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
					/>
					<span className="text-xs text-muted-foreground">
						{connected ? "Connected" : "Disconnected"}
					</span>
				</div>
			);
		}
		return (
			<div className="flex items-center gap-1">
				<div className="w-2 h-2 rounded-full bg-gray-400" />
				<span className="text-xs text-muted-foreground">Idle</span>
			</div>
		);
	};

	// Render Data Configuration based on scenario type
	const renderDataConfiguration = () => {
		// Parse filtering parameters if available
		let filteringParams = null;
		// try {
		// 	if (experimentRun.filtering_parameters) {
		// 		filteringParams = JSON.parse(
		// 			experimentRun.filtering_parameters,
		// 		);
		// 	}
		// } catch (error) {
		// 	console.error("Failed to parse filtering parameters:", error);
		// }
		filteringParams = experimentRun.filtering_parameters;

		switch (scenarioType) {
			case "ERM_BASELINE":
				return (
					<div className="space-y-3 p-3 border rounded-lg bg-blue-50/30">
						<h5 className="text-sm font-medium text-blue-800">
							📊 Dataset Selection & Filtering Configuration
						</h5>
						<div className="space-y-2 text-sm text-blue-700">
							{filteringParams ? (
								<div className="space-y-2">
									{/* Selected Datasets Information */}
									{filteringParams.selectedDatasetIds &&
									Array.isArray(
										filteringParams.selectedDatasetIds,
									) &&
									filteringParams.selectedDatasetIds.length >
										0 ? (
										<div>
											<strong>Selected Datasets:</strong>{" "}
											<span className="text-blue-600">
												{filteringParams
													.selectedDatasetIds
													?.length || 0}{" "}
												dataset(s) selected
											</span>
											<div className="mt-2 space-y-1">
												{availableDatasets.length >
												0 ? (
													availableDatasets
														.filter((dataset) =>
															filteringParams.selectedDatasetIds?.includes(
																dataset.id,
															),
														)
														.map((dataset) => (
															<div
																key={dataset.id}
																className="text-xs bg-white/70 p-2 rounded border"
															>
																<div className="font-medium text-blue-800">
																	{
																		dataset.name
																	}
																</div>
																<div className="text-blue-600">
																	{
																		dataset.building
																	}{" "}
																	-{" "}
																	{
																		dataset.floor
																	}{" "}
																	-{" "}
																	{
																		dataset.room
																	}{" "}
																	|{" "}
																	{
																		dataset.occupantType
																	}
																</div>
																<div className="text-blue-500">
																	{dataset.totalRecords?.toLocaleString()}{" "}
																	records,{" "}
																	{
																		dataset.positiveLabels
																	}{" "}
																	anomalies
																</div>
															</div>
														))
												) : (
													<div className="text-xs text-blue-600 italic">
														Loading dataset
														details...
													</div>
												)}
											</div>
										</div>
									) : (
										<div className="text-blue-600">
											<strong>Datasets:</strong> No
											specific datasets selected (legacy
											configuration)
										</div>
									)}

									{/* Time Range */}
									{filteringParams.startDate &&
										filteringParams.endDate && (
											<div>
												<strong>Time Range:</strong>{" "}
												{filteringParams.startDate}{" "}
												{filteringParams.startTime ||
													"00:00"}{" "}
												→ {filteringParams.endDate}{" "}
												{filteringParams.endTime ||
													"23:59"}
												. Stratified time-based split
												applied downstream.
											</div>
										)}

									{/* Total Data Pool Statistics */}
									<div className="pt-2 border-t border-blue-200">
										<div>
											<strong>Total Data Pool:</strong>{" "}
											{(
												experimentRun.total_data_pool_size ||
												0
											).toLocaleString()}
										</div>
										<div>
											<strong>Positive Labels:</strong>{" "}
											{experimentRun.positive_label_count ||
												0}
										</div>
										<div>
											<strong>Unlabeled (U):</strong>{" "}
											{(
												(experimentRun.total_data_pool_size ||
													0) -
												(experimentRun.positive_label_count ||
													0)
											).toLocaleString()}
										</div>
									</div>
								</div>
							) : (
								<div className="space-y-1">
									<div>
										Source: Total Data Pool from Selected
										Datasets
									</div>
									<div>
										Total Data Pool Size:{" "}
										{(
											experimentRun.total_data_pool_size ||
											0
										).toLocaleString()}
									</div>
									<div>
										Positive Labels:{" "}
										{experimentRun.positive_label_count ||
											0}
									</div>
									<div>
										Negative Labels:{" "}
										{experimentRun.negative_label_count ||
											0}
									</div>
									<div>
										Candidate Events:{" "}
										{experimentRun.candidate_count || 0}
									</div>
								</div>
							)}
						</div>
					</div>
				);

			case "GENERALIZATION_CHALLENGE":
				return (
					<div className="space-y-3">
						<div className="space-y-3 p-3 border rounded-lg bg-green-50/30">
							<h5 className="text-sm font-medium text-green-800">
								🎯 Source Model Selection
							</h5>
							<div>
								<Label className="text-xs">
									Select Model for Evaluation
								</Label>
								<Select
									value={selectedSourceModel}
									onValueChange={setSelectedSourceModel}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select source model..." />
									</SelectTrigger>
									<SelectContent>
										{/* Only show completed ERM_BASELINE models */}
										{trainedModels
											.filter(
												(m) =>
													m.scenarioType ===
														"ERM_BASELINE" &&
													m.status === "COMPLETED",
											)
											.map((model) => (
												<SelectItem
													key={model.id}
													value={model.id.toString()}
												>
													{model.name} (ID: {model.id}
													)
												</SelectItem>
											))}
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="space-y-3 p-3 border rounded-lg bg-orange-50/30">
							<h5 className="text-sm font-medium text-orange-800">
								🎯 Target Distribution (Test Set)
							</h5>
							<div>
								<Label className="text-xs">
									Select Target Dataset for Testing
								</Label>
								<Select
									value={selectedTargetDataset}
									onValueChange={setSelectedTargetDataset}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select target dataset..." />
									</SelectTrigger>
									<SelectContent>
										{availableDatasets.map((dataset) => (
											<SelectItem
												key={dataset.id}
												value={dataset.id.toString()}
											>
												{dataset.name.substring(5, 10)}
												{dataset.building_name ||
													dataset.building}{" "}
												{dataset.floor_name ||
													dataset.floor}{" "}
												{dataset.room_name ||
													dataset.room}
												{": P"}{" "}
												{dataset.anomaly_count ||
													dataset.positiveLabels ||
													0}
												{" / Total "}
												{dataset.record_count ||
													dataset.totalRecords ||
													0}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>
				);

			case "DOMAIN_ADAPTATION":
				return (
					<div className="space-y-3">
						<div className="space-y-3 p-3 border rounded-lg bg-blue-50/30">
							<h5 className="text-sm font-medium text-blue-800">
								📊 Dataset Selection & Filtering Configuration
								(Source Domain)
							</h5>
							<div className="text-sm font-medium text-blue-800 mb-2">
								Source Distribution (Positive Samples):
							</div>
							<div className="space-y-2 text-sm text-blue-700">
								{filteringParams ? (
									<div className="space-y-2">
										{/* Selected Datasets Information */}
										{filteringParams.selectedDatasetIds &&
										Array.isArray(
											filteringParams.selectedDatasetIds,
										) &&
										filteringParams.selectedDatasetIds
											.length > 0 ? (
											<div>
												<strong>
													Selected Datasets:
												</strong>{" "}
												<span className="text-blue-600">
													{filteringParams
														.selectedDatasetIds
														?.length || 0}{" "}
													dataset(s) selected
												</span>
												<div className="mt-2 space-y-1">
													{availableDatasets.length >
													0 ? (
														availableDatasets
															.filter((dataset) =>
																filteringParams.selectedDatasetIds?.includes(
																	dataset.id,
																),
															)
															.map((dataset) => (
																<div
																	key={
																		dataset.id
																	}
																	className="text-xs bg-white/70 p-2 rounded border"
																>
																	<div className="font-medium text-blue-800">
																		{
																			dataset.name
																		}
																	</div>
																	<div className="text-blue-600">
																		{
																			dataset.building
																		}{" "}
																		-{" "}
																		{
																			dataset.floor
																		}{" "}
																		-{" "}
																		{
																			dataset.room
																		}{" "}
																		|{" "}
																		{
																			dataset.occupantType
																		}
																	</div>
																	<div className="text-blue-500">
																		{dataset.totalRecords?.toLocaleString()}{" "}
																		records,{" "}
																		{
																			dataset.positiveLabels
																		}{" "}
																		anomalies
																	</div>
																</div>
															))
													) : (
														<div className="text-xs text-blue-600 italic">
															Loading dataset
															details...
														</div>
													)}
												</div>
											</div>
										) : (
											<div className="text-blue-600">
												<strong>Datasets:</strong> No
												specific datasets selected
												(legacy configuration)
											</div>
										)}

										{/* Time Range */}
										{filteringParams.startDate &&
											filteringParams.endDate && (
												<div>
													<strong>Time Range:</strong>{" "}
													{filteringParams.startDate}{" "}
													{filteringParams.startTime ||
														"00:00"}{" "}
													→ {filteringParams.endDate}{" "}
													{filteringParams.endTime ||
														"23:59"}
													. Stratified time-based
													split applied downstream.
												</div>
											)}

										{/* Total Data Pool Statistics */}
										<div className="pt-2 border-t border-blue-200">
											<div>
												<strong>
													Positive Labels:
												</strong>{" "}
												{experimentRun.positive_label_count ||
													0}
											</div>
										</div>
									</div>
								) : (
									<div className="space-y-1">
										<div>
											Source: Total Data Pool from
											Selected Datasets
										</div>
										<div>
											Total Data Pool Size:{" "}
											{(
												experimentRun.total_data_pool_size ||
												0
											).toLocaleString()}
										</div>
										<div>
											Positive Labels:{" "}
											{experimentRun.positive_label_count ||
												0}
										</div>
										<div>
											Negative Labels:{" "}
											{experimentRun.negative_label_count ||
												0}
										</div>
										<div>
											Candidate Events:{" "}
											{experimentRun.candidate_count || 0}
										</div>
									</div>
								)}
							</div>
						</div>

						<div className="space-y-3 p-3 border rounded-lg bg-orange-50/30">
							<h5 className="text-sm font-medium text-orange-800">
								🎯 Target Distribution (Unlabeled & Test
								Samples)
							</h5>
							<div>
								<Label className="text-xs">
									Select Target Dataset for Unlabeled Data
								</Label>
								<Select
									value={selectedTargetDataset}
									onValueChange={setSelectedTargetDataset}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select target domain..." />
									</SelectTrigger>
									<SelectContent>
										{availableDatasets.map((dataset) => (
											<SelectItem
												key={dataset.id}
												value={dataset.id.toString()}
											>
												{dataset.name.substring(5, 10)}
												{dataset.building_name ||
													dataset.building}{" "}
												{dataset.floor_name ||
													dataset.floor}{" "}
												{dataset.room_name ||
													dataset.room}
												{": P"}{" "}
												{dataset.anomaly_count ||
													dataset.positiveLabels ||
													0}
												{" / Total "}
												{dataset.record_count ||
													dataset.totalRecords ||
													0}
											</SelectItem>
										))}
									</SelectContent>
								</Select>

								{/* Total Data Pool Statistics */}
								<div className="pt-2 border-t border-blue-200">
									<div>
										<strong>Unlabeled (U):</strong>{" "}
										{(() => {
											const selectedDataset =
												availableDatasets.find(
													(dataset) =>
														dataset.id.toString() ===
														selectedTargetDataset,
												);
											return selectedDataset
												? (
														selectedDataset.record_count ||
														selectedDataset.totalRecords ||
														0
													).toLocaleString()
												: "0";
										})()}
									</div>
								</div>
							</div>
						</div>
					</div>
				);
			default:
				return null;
		}
	};

	// Render Model & Training Configuration (show for ERM_BASELINE and DOMAIN_ADAPTATION)
	const renderModelTrainingConfiguration = () => {
		if (
			scenarioType !== "ERM_BASELINE" &&
			scenarioType !== "DOMAIN_ADAPTATION"
		) {
			return null;
		}

		return (
			<div className="space-y-4">
				{/* PU Learning Strategy */}
				<div className="space-y-3 p-3 border rounded-lg bg-blue-50/30">
					<h5 className="text-sm font-medium text-blue-800">
						🎯 PU Learning Strategy
					</h5>

					<div className="space-y-2">
						<Label className="text-xs">
							Class Prior (π_p): {modelConfig.classPrior}
						</Label>
						<Slider
							value={[modelConfig.classPrior]}
							onValueChange={([value]) =>
								setModelConfig((prev) => ({
									...prev,
									classPrior: value,
								}))
							}
							min={0.001}
							max={0.2}
							step={0.001}
							className="w-full"
						/>
						<div className="flex justify-between text-xs text-gray-500 mt-1">
							<span>0.001 (Rare)</span>
							<span>0.200 (Common)</span>
						</div>
						<p className="text-xs text-blue-700">
							Proportion of positives in training data; used in
							nnPU risk. Estimate on train only.
						</p>
					</div>
				</div>

				{/* Data Preparation */}
				<div className="space-y-3 p-3 border rounded-lg bg-green-50/30">
					<h5 className="text-sm font-medium text-green-800">
						📊 Data Preparation
					</h5>

					<div className="space-y-2">
						<Label className="text-xs">
							Window Size (Time Window): {modelConfig.windowSize}{" "}
							minutes
						</Label>
						<Slider
							value={[modelConfig.windowSize]}
							onValueChange={([value]) =>
								setModelConfig((prev) => ({
									...prev,
									windowSize: value,
								}))
							}
							min={30}
							max={240}
							step={10}
							className="w-full"
						/>
						<div className="flex justify-between text-xs text-gray-500 mt-1">
							<span>30 (Short)</span>
							<span>240 (Long)</span>
						</div>
						<p className="text-xs text-green-700">
							Input length (minutes). Must capture full behavioral
							patterns.
						</p>
					</div>
				</div>

				{/* Model Architecture */}
				<div className="space-y-3 p-3 border rounded-lg bg-purple-50/30">
					<h5 className="text-sm font-medium text-purple-800">
						🏗️ Model Architecture
					</h5>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<Label className="text-xs">Model Type</Label>
							<Select
								value={modelConfig.modelType}
								onValueChange={(value) =>
									setModelConfig((prev) => ({
										...prev,
										modelType: value,
									}))
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="LSTM">
										LSTM ✅
									</SelectItem>
									<SelectItem value="GRU">GRU</SelectItem>
									<SelectItem value="Transformer">
										Transformer
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div>
							<Label className="text-xs">
								Activation Function
							</Label>
							<Select
								value={modelConfig.activationFunction}
								onValueChange={(value) =>
									setModelConfig((prev) => ({
										...prev,
										activationFunction: value,
									}))
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="ReLU">
										ReLU ✅
									</SelectItem>
									<SelectItem value="LeakyReLU">
										LeakyReLU
									</SelectItem>
									<SelectItem value="Tanh">Tanh</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="space-y-2">
						<Label className="text-xs">
							Hidden Layer Size: {modelConfig.hiddenSize}
						</Label>
						<Slider
							value={[modelConfig.hiddenSize]}
							onValueChange={([value]) =>
								setModelConfig((prev) => ({
									...prev,
									hiddenSize: value,
								}))
							}
							min={32}
							max={512}
							step={32}
							className="w-full"
						/>
						<div className="flex justify-between text-xs text-gray-500 mt-1">
							<span>32 (Simple)</span>
							<span>512 (Complex)</span>
						</div>
					</div>

					<div className="space-y-2">
						<Label className="text-xs">
							Number of Layers: {modelConfig.numLayers}
						</Label>
						<Slider
							value={[modelConfig.numLayers]}
							onValueChange={([value]) =>
								setModelConfig((prev) => ({
									...prev,
									numLayers: value,
								}))
							}
							min={1}
							max={6}
							step={1}
							className="w-full"
						/>
						<div className="flex justify-between text-xs text-gray-500 mt-1">
							<span>1 (Simple)</span>
							<span>6 (Deep)</span>
						</div>
					</div>

					<div className="space-y-2">
						<Label className="text-xs">
							Dropout Rate: {modelConfig.dropout}
						</Label>
						<Slider
							value={[modelConfig.dropout]}
							onValueChange={([value]) =>
								setModelConfig((prev) => ({
									...prev,
									dropout: value,
								}))
							}
							min={0.0}
							max={0.5}
							step={0.05}
							className="w-full"
						/>
						<div className="flex justify-between text-xs text-gray-500 mt-1">
							<span>0.0 (No Dropout)</span>
							<span>0.5 (Heavy)</span>
						</div>
					</div>
				</div>

				{/* Training Process */}
				<div className="space-y-3 p-3 border rounded-lg bg-orange-50/30">
					<h5 className="text-sm font-medium text-orange-800">
						⚡ Training Process
					</h5>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<Label className="text-xs">Optimizer</Label>
							<Select
								value={modelConfig.optimizer}
								onValueChange={(value) =>
									setModelConfig((prev) => ({
										...prev,
										optimizer: value,
									}))
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="Adam">
										Adam ✅
									</SelectItem>
									<SelectItem value="RMSprop">
										RMSprop
									</SelectItem>
									<SelectItem value="SGD">SGD</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div>
							<Label className="text-xs">Learning Rate</Label>
							<Select
								value={modelConfig.learningRate.toString()}
								onValueChange={(value) =>
									setModelConfig((prev) => ({
										...prev,
										learningRate: Number(value),
									}))
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="0.01">
										Fast (0.01)
									</SelectItem>
									<SelectItem value="0.005">
										Medium-Fast (0.005)
									</SelectItem>
									<SelectItem value="0.001">
										Medium (0.001) ✅
									</SelectItem>
									<SelectItem value="0.0005">
										Slow (0.0005)
									</SelectItem>
									<SelectItem value="0.0001">
										Very Slow (0.0001)
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<Label className="text-xs">Batch Size</Label>
							<Select
								value={modelConfig.batchSize.toString()}
								onValueChange={(value) =>
									setModelConfig((prev) => ({
										...prev,
										batchSize: Number(value),
									}))
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="32">32</SelectItem>
									<SelectItem value="64">64</SelectItem>
									<SelectItem value="128">128 ✅</SelectItem>
									<SelectItem value="256">256</SelectItem>
									<SelectItem value="512">512</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div>
							<Label className="text-xs">L2 Regularization</Label>
							<Select
								value={modelConfig.l2Regularization.toString()}
								onValueChange={(value) =>
									setModelConfig((prev) => ({
										...prev,
										l2Regularization: Number(value),
									}))
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="0">None (0)</SelectItem>
									<SelectItem value="0.00001">
										Very Light (1e-5)
									</SelectItem>
									<SelectItem value="0.0001">
										Light (1e-4) ✅
									</SelectItem>
									<SelectItem value="0.001">
										Medium (1e-3)
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="space-y-2">
						<Label className="text-xs">
							Training Epochs: {modelConfig.epochs}
						</Label>
						<Slider
							value={[modelConfig.epochs]}
							onValueChange={([value]) =>
								setModelConfig((prev) => ({
									...prev,
									epochs: value,
								}))
							}
							min={20}
							max={500}
							step={10}
							className="w-full"
						/>
						<div className="flex justify-between text-xs text-gray-500 mt-1">
							<span>20 (Quick)</span>
							<span>500 (Thorough)</span>
						</div>
					</div>
				</div>

				{/* Training Stability */}
				<div className="space-y-3 p-3 border rounded-lg bg-red-50/30">
					<h5 className="text-sm font-medium text-red-800">
						🛡️ Training Stability
					</h5>

					<div className="flex items-center space-x-2">
						<input
							type="checkbox"
							id="early-stopping"
							checked={modelConfig.earlyStopping}
							onChange={(e) =>
								setModelConfig((prev) => ({
									...prev,
									earlyStopping: e.target.checked,
								}))
							}
							className="rounded"
						/>
						<Label htmlFor="early-stopping" className="text-xs">
							Enable Early Stopping
						</Label>
					</div>

					{modelConfig.earlyStopping && (
						<div className="space-y-2 ml-6">
							<Label className="text-xs">
								Patience: {modelConfig.patience} epochs
							</Label>
							<Slider
								value={[modelConfig.patience]}
								onValueChange={([value]) =>
									setModelConfig((prev) => ({
										...prev,
										patience: value,
									}))
								}
								min={5}
								max={30}
								step={1}
								className="w-full"
							/>
							<div className="flex justify-between text-xs text-gray-500 mt-1">
								<span>5 (Aggressive)</span>
								<span>30 (Patient)</span>
							</div>
						</div>
					)}

					<div>
						<Label className="text-xs">
							Learning Rate Scheduler
						</Label>
						<Select
							value={modelConfig.learningRateScheduler}
							onValueChange={(value) =>
								setModelConfig((prev) => ({
									...prev,
									learningRateScheduler: value,
								}))
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="none">None ✅</SelectItem>
								<SelectItem value="StepLR">Step LR</SelectItem>
								<SelectItem value="ReduceLROnPlateau">
									Reduce on Plateau
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			</div>
		);
	};

	// console.log("evaluationRuns", evaluationRuns);
	return (
		<div className="space-y-6">
			{/* Header */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Brain className="h-5 w-5" />
						Stage 3: Model Training & Evaluation Workbench
					</CardTitle>
					<CardDescription>
						Configure and execute nnPU training and evaluation as
						two distinct, monitorable tasks
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div>
							<h3 className="font-semibold mb-2">
								Total Data Pool Distribution
							</h3>
							<div className="space-y-1 text-sm">
								<div>
									Total Records:{" "}
									<Badge
										variant="default"
										className="bg-blue-600"
									>
										{(
											experimentRun.total_data_pool_size ||
											0
										).toLocaleString()}
									</Badge>
								</div>
								<div>
									Positive (P):{" "}
									<Badge
										variant="outline"
										className="text-orange-600 border-orange-300"
									>
										{experimentRun.positive_label_count ||
											0}
									</Badge>
								</div>
								<div>
									Unlabeled (U):{" "}
									<Badge
										variant="outline"
										className="text-gray-600 border-gray-300"
									>
										{(
											(experimentRun.total_data_pool_size ||
												0) -
											(experimentRun.positive_label_count ||
												0)
										).toLocaleString()}
									</Badge>
								</div>
								<div className="text-xs text-slate-600 mt-2">
									Window prior estimate: πₚ ≈{" "}
									{(
										((experimentRun.positive_label_count ||
											0) /
											(experimentRun.total_data_pool_size ||
												1)) *
										100
									).toFixed(3)}
									% ({experimentRun.positive_label_count || 0}{" "}
									/ {experimentRun.total_data_pool_size || 0}
									); prior may drift over time
								</div>
							</div>
						</div>
						<div>
							<div className="flex items-center justify-between mb-2">
								<h3 className="font-semibold">
									Experiment Status
								</h3>
								<Button
									variant="ghost"
									size="sm"
									onClick={refreshData}
									className="h-6 w-6 p-0"
									title="Reload models & evaluation data"
								>
									<RefreshCw className="h-3 w-3" />
								</Button>
							</div>
							<div className="space-y-1 text-sm">
								<div>
									Current Stage:{" "}
									<Badge>{experimentRun.status}</Badge>
								</div>
								<div>
									Trained Models:{" "}
									<Badge variant="outline">
										{trainedModels.length}
									</Badge>
								</div>
								<div>
									Evaluation Runs:{" "}
									<Badge variant="outline">
										{evaluationRuns.length}
									</Badge>
								</div>
							</div>
						</div>
						<div>
							<h3 className="font-semibold mb-2">
								Available Scenarios
							</h3>
							<div className="space-y-1 text-sm text-muted-foreground">
								<div>• ERM Baseline</div>
								<div>• Generalization Challenge</div>
								<div>• Domain Adaptation</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Main Interface */}
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
				{/* Left Panel: Configuration */}
				<div className="lg:col-span-4 space-y-6">
					{/* Block 1: Experiment Scenario Selection */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Settings className="h-4 w-4" />
								Block 1: Experiment Scenario Selection
							</CardTitle>
							<CardDescription>
								Choose your experiment type to configure the
								appropriate workflow
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{/* Scenario Type */}
							<div className="space-y-2">
								<Label className="text-sm font-medium">
									Scenario Type
								</Label>
								<RadioGroup
									value={scenarioType}
									onValueChange={setScenarioType}
									className="space-y-1"
								>
									<div className="flex items-start space-x-2 rounded-md hover:bg-accent/30 transition-colors">
										<RadioGroupItem
											value="ERM_BASELINE"
											id="erm-baseline"
											className="mt-1"
										/>
										<div className="flex-1">
											<Label
												htmlFor="erm-baseline"
												className="cursor-pointer text-sm font-medium"
											>
												Standard in-domain training
											</Label>
											<p className="text-xs text-muted-foreground mt-0.5">
												Standard training approach
											</p>
										</div>
									</div>
									<div className="flex items-start space-x-2 rounded-md hover:bg-accent/30 transition-colors">
										<RadioGroupItem
											value="GENERALIZATION_CHALLENGE"
											id="gen-challenge"
											className="mt-1"
										/>
										<div className="flex-1">
											<Label
												htmlFor="gen-challenge"
												className="cursor-pointer text-sm font-medium"
											>
												Direct transfer to a new domain
											</Label>
											<p className="text-xs text-muted-foreground mt-0.5">
												Test generalization across
												domains
											</p>
										</div>
									</div>
									<div className="flex items-start space-x-2 rounded-md hover:bg-accent/30 transition-colors">
										<RadioGroupItem
											value="DOMAIN_ADAPTATION"
											id="domain-adapt"
											className="mt-1"
										/>
										<div className="flex-1">
											<Label
												htmlFor="domain-adapt"
												className="cursor-pointer text-sm font-medium"
											>
												U_source + P_target (nnPU)
											</Label>
											<p className="text-xs text-muted-foreground mt-0.5">
												Adapt across conditions
											</p>
										</div>
									</div>
								</RadioGroup>
							</div>
						</CardContent>
					</Card>

					{/* Block 2: Data Configuration (Dynamic based on scenario) */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Database className="h-4 w-4" />
								Block 2: Data Configuration
							</CardTitle>
							<CardDescription>
								{scenarioType === "ERM_BASELINE" &&
									"Source data & filters (leak-safe)"}
								{scenarioType === "GENERALIZATION_CHALLENGE" &&
									"Model and dataset selection"}
								{scenarioType === "DOMAIN_ADAPTATION" &&
									"Source and target domain setup"}
							</CardDescription>
						</CardHeader>
						<CardContent>{renderDataConfiguration()}</CardContent>
					</Card>

					{/* Block 3: Model & Training Configuration (conditional visibility) */}
					{(scenarioType === "ERM_BASELINE" ||
						scenarioType === "DOMAIN_ADAPTATION") && (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Brain className="h-4 w-4" />
									Block 3: Model & Training Configuration
								</CardTitle>
								<CardDescription>
									Configure nnPU hyperparameters and training
									settings
								</CardDescription>
							</CardHeader>
							<CardContent>
								{renderModelTrainingConfiguration()}
							</CardContent>
						</Card>
					)}

					{/* Data Split Strategy (for ERM_BASELINE and DOMAIN_ADAPTATION) */}
					{(scenarioType === "ERM_BASELINE" ||
						scenarioType === "DOMAIN_ADAPTATION") && (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<BarChart3 className="h-4 w-4" />
									Data Split Strategy
								</CardTitle>
								<CardDescription>
									Leak-safe, stratified time-based split
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-3">
									<div className="grid grid-cols-3 gap-3">
										<div>
											<Label className="text-xs">
												Train
											</Label>
											<div className="flex items-center space-x-2">
												<Slider
													value={[
														dataSourceConfig.trainRatio,
													]}
													onValueChange={([value]) =>
														handleRatioChange(
															"trainRatio",
															value,
														)
													}
													max={80}
													min={50}
													step={5}
													className="flex-1"
												/>
												<span className="text-xs w-8">
													{
														dataSourceConfig.trainRatio
													}
													%
												</span>
											</div>
										</div>
										<div>
											<Label className="text-xs">
												Validation
											</Label>
											<div className="flex items-center space-x-2">
												<Slider
													value={[
														dataSourceConfig.validationRatio,
													]}
													onValueChange={([value]) =>
														handleRatioChange(
															"validationRatio",
															value,
														)
													}
													max={30}
													min={10}
													step={5}
													className="flex-1"
												/>
												<span className="text-xs w-8">
													{
														dataSourceConfig.validationRatio
													}
													%
												</span>
											</div>
										</div>
										<div>
											<Label className="text-xs">
												Test
											</Label>
											<div className="flex items-center space-x-2">
												<Slider
													value={[
														dataSourceConfig.testRatio,
													]}
													onValueChange={([value]) =>
														handleRatioChange(
															"testRatio",
															value,
														)
													}
													max={30}
													min={10}
													step={5}
													className="flex-1"
												/>
												<span className="text-xs w-8">
													{dataSourceConfig.testRatio}
													%
												</span>
											</div>
										</div>
									</div>
									<div className="text-xs text-muted-foreground">
										Total:{" "}
										{dataSourceConfig.trainRatio +
											dataSourceConfig.validationRatio +
											dataSourceConfig.testRatio}
										%
										{dataSourceConfig.trainRatio +
											dataSourceConfig.validationRatio +
											dataSourceConfig.testRatio !==
											100 && (
											<span className="text-red-600 ml-1">
												(Must equal 100%)
											</span>
										)}
									</div>
								</div>

								{/* 🆕 U Sample Ratio Configuration */}
								<div className="space-y-2 pt-3 border-t border-gray-200">
									<div>
										<Label className="text-xs font-medium">
											U Mini-batch Ratio
										</Label>
										<div className="flex items-center space-x-2 mt-1">
											<Label className="text-xs text-muted-foreground min-w-0">
												U Sample Ratio:
											</Label>
											<Slider
												value={[
													dataSourceConfig.uSampleRatio *
														100,
												]}
												onValueChange={([value]) =>
													setDataSourceConfig({
														...dataSourceConfig,
														uSampleRatio:
															value / 100,
													})
												}
												max={100}
												min={5}
												step={5}
												className="flex-1"
											/>
											<span className="text-xs w-12 text-center">
												{(
													dataSourceConfig.uSampleRatio *
													100
												).toFixed(0)}
												%
											</span>
										</div>
										<p className="text-xs text-muted-foreground mt-1">
											Percent of U sampled per step. Lower
											= faster; too low can hurt risk
											estimation.
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Action Buttons */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Play className="h-4 w-4" />
								Actions
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{/* Training Button (for ERM_BASELINE and DOMAIN_ADAPTATION) */}
								{(scenarioType === "ERM_BASELINE" ||
									scenarioType === "DOMAIN_ADAPTATION") && (
									<Button
										onClick={handleStartTraining}
										disabled={
											// trainingStatus.isTraining ||
											dataSourceConfig.trainRatio +
												dataSourceConfig.validationRatio +
												dataSourceConfig.testRatio !==
											100
										}
										className="w-full"
									>
										{/* {trainingStatus.isTraining ? (
											<>
												<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
												Starting Training...
											</>
										) : (
											<>
												<Play className="h-4 w-4 mr-2" />
												▶ Start Model Training
											</>
										)} */}
										<>
											<Play className="h-4 w-4 mr-2" />▶
											Start Model Training
										</>
									</Button>
								)}

								{/* Model Selection and Evaluation for ERM_BASELINE */}
								{scenarioType === "ERM_BASELINE" &&
									trainedModels.length > 0 && (
										<>
											<div className="space-y-2">
												<Label className="text-sm font-medium">
													Select Model for Evaluation
												</Label>
												<Select
													value={selectedModel}
													onValueChange={
														setSelectedModel
													}
												>
													<SelectTrigger>
														<SelectValue placeholder="Choose a trained model..." />
													</SelectTrigger>
													<SelectContent>
														{trainedModels
															.filter(
																(model) =>
																	model.status ===
																	"COMPLETED",
															)
															.map((model) => (
																<SelectItem
																	key={
																		model.id
																	}
																	value={
																		model.id
																	}
																>
																	{model.name}{" "}
																	(
																	{
																		model.scenarioType
																	}
																	)
																</SelectItem>
															))}
													</SelectContent>
												</Select>
											</div>

											<Button
												onClick={handleStartEvaluation}
												disabled={
													evaluationStatus.isEvaluating ||
													!selectedModel
												}
												variant="outline"
												className="w-full"
											>
												{evaluationStatus.isEvaluating ? (
													<>
														<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2" />
														Evaluating...
													</>
												) : (
													<>
														<TrendingUp className="h-4 w-4 mr-2" />
														📈 Start Model
														Evaluation
													</>
												)}
											</Button>
										</>
									)}

								{/* Model Selection and Evaluation for DOMAIN_ADAPTATION */}
								{scenarioType === "DOMAIN_ADAPTATION" &&
									trainedModels.length > 0 && (
										<>
											<div className="space-y-2">
												<Label className="text-sm font-medium">
													Select Model for Evaluation
												</Label>
												<Select
													value={selectedModel}
													onValueChange={
														setSelectedModel
													}
												>
													<SelectTrigger>
														<SelectValue placeholder="Choose a trained model..." />
													</SelectTrigger>
													<SelectContent>
														{trainedModels
															.filter(
																(model) =>
																	model.status ===
																	"COMPLETED",
															)
															.map((model) => (
																<SelectItem
																	key={
																		model.id
																	}
																	value={
																		model.id
																	}
																>
																	{model.name}{" "}
																	(
																	{
																		model.scenarioType
																	}
																	)
																</SelectItem>
															))}
													</SelectContent>
												</Select>
											</div>

											<div className="space-y-2">
												<Label className="text-sm font-medium">
													🎯 Target Dataset for
													Testing
												</Label>
												<Select
													value={
														selectedTargetDataset
													}
													onValueChange={
														setSelectedTargetDataset
													}
												>
													<SelectTrigger>
														<SelectValue placeholder="Select target domain for testing..." />
													</SelectTrigger>
													<SelectContent>
														{availableDatasets.map(
															(dataset) => (
																<SelectItem
																	key={
																		dataset.id
																	}
																	value={dataset.id.toString()}
																>
																	{dataset.building_name ||
																		dataset.building}{" "}
																	{dataset.floor_name ||
																		dataset.floor}{" "}
																	{dataset.room_name ||
																		dataset.room}
																	: P{" "}
																	{dataset.positiveLabels ||
																		0}{" "}
																	/ Total{" "}
																	{dataset.record_count ||
																		dataset.totalRecords ||
																		0}
																</SelectItem>
															),
														)}
													</SelectContent>
												</Select>
											</div>

											<Button
												onClick={handleStartEvaluation}
												disabled={
													evaluationStatus.isEvaluating ||
													!selectedModel ||
													!selectedTargetDataset
												}
												variant="outline"
												className="w-full"
											>
												{evaluationStatus.isEvaluating ? (
													<>
														<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2" />
														Evaluating...
													</>
												) : (
													<>
														<TrendingUp className="h-4 w-4 mr-2" />
														📈 Start Model
														Evaluation
													</>
												)}
											</Button>
										</>
									)}

								{/* Evaluation Button (for GENERALIZATION_CHALLENGE) */}
								{scenarioType ===
									"GENERALIZATION_CHALLENGE" && (
									<Button
										onClick={handleStartEvaluation}
										disabled={
											evaluationStatus.isEvaluating ||
											!selectedSourceModel
										}
										variant="outline"
										className="w-full"
									>
										{evaluationStatus.isEvaluating ? (
											<>
												<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2" />
												Evaluating...
											</>
										) : (
											<>
												<TrendingUp className="h-4 w-4 mr-2" />
												📈 Start Model Evaluation
											</>
										)}
									</Button>
								)}

								{/* Reload Data Button */}
								<Button
									onClick={refreshData}
									variant="outline"
									className="w-full"
								>
									<RefreshCw className="h-4 w-4 mr-2" />
									Reload Models & Evaluation Data
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Right Panel: Monitoring and Results */}
				<div className="lg:col-span-8 space-y-6">
					{/* Monitoring Section */}
					<div className="grid grid-cols-1 xl:grid-cols-2 gap-4 hidden">
						{/* Training Monitor */}
						<Card>
							<CardHeader>
								<div className="flex items-center justify-between">
									<CardTitle className="flex items-center gap-2">
										<Activity className="h-4 w-4" />
										Training Monitor
										{isTraining && (
											<Loader2 className="h-3 w-3 animate-spin text-blue-500" />
										)}
									</CardTitle>
									<ConnectionIndicator
										connected={false}
										isActive={isTraining}
									/>
								</div>
							</CardHeader>
							<CardContent>
								<div
									ref={trainingLogRef}
									className="h-40 bg-gray-50 text-gray-800 font-mono text-xs p-3 rounded border overflow-y-auto"
								>
									{trainingLogs.length === 0 ? (
										<div className="text-gray-500 italic">
											No training logs yet...
										</div>
									) : (
										trainingLogs.map((log, index) => (
											<div
												key={index}
												className="mb-1 text-gray-700"
											>
												{log}
											</div>
										))
									)}
								</div>
							</CardContent>
						</Card>

						{/* Evaluation Monitor */}
						<Card>
							<CardHeader>
								<div className="flex items-center justify-between">
									<CardTitle className="flex items-center gap-2">
										<TrendingUp className="h-4 w-4" />
										Evaluation Monitor
										{isEvaluating && (
											<Loader2 className="h-3 w-3 animate-spin text-blue-500" />
										)}
									</CardTitle>
									<ConnectionIndicator
										connected={false}
										isActive={isEvaluating}
									/>
								</div>
							</CardHeader>
							<CardContent>
								<div
									ref={evaluationLogRef}
									className="h-40 bg-gray-50 text-gray-800 font-mono text-xs p-3 rounded border overflow-y-auto"
								>
									{evaluationLogs.length === 0 ? (
										<div className="text-gray-500 italic">
											No evaluation logs yet...
										</div>
									) : (
										evaluationLogs.map((log, index) => (
											<div
												key={index}
												className="mb-1 text-gray-700"
											>
												{log}
											</div>
										))
									)}
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Trained Models */}
					<TrainedModels
						trainedModels={trainedModels}
						getEvaluationCount={getEvaluationCount}
						getModelEvaluations={getModelEvaluations}
						handleDeleteModel={handleDeleteModel}
						handleRenameModel={handleRenameModel}
					/>

					{/* Evaluation Results */}
					<EvaluationResults
						evaluationRuns={evaluationRuns}
						trainedModels={trainedModels}
						handleDeleteEvaluation={handleDeleteEvaluation}
						handleRenameEvaluation={handleRenameEvaluation}
					/>
				</div>
			</div>
		</div>
	);
}
