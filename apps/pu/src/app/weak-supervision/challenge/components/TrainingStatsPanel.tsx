"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Activity,
	AlertCircle,
	BarChart3,
	Brain,
	CheckCircle,
	Target,
	TrendingUp,
	Users,
	Zap,
} from "lucide-react";
import type { LearningMode } from "../lib/DatasetGenerator";
import type { CLLDashboardData } from "../lib/types/CLLDashboardData";
import type { PNUDashboardData } from "../lib/types/PNUDashboardData";
import type { PUDashboardData } from "../lib/types/PUDashboardData";

interface TrainingStatsPanelProps {
	currentMode: LearningMode;
	puStats?: PUDashboardData;
	pnuStats?: PNUDashboardData;
	cllStats?: CLLDashboardData;
	isRunning: boolean;
	currentStep: string;
}

interface StatsCardProps {
	title: string;
	value: string | number;
	icon: React.ReactNode;
	color: string;
	description?: string;
}

function StatsCard({ title, value, icon, color, description }: StatsCardProps) {
	return (
		<Card className="border-2">
			<CardContent className="p-4">
				<div className="flex items-center gap-3">
					<div className={`p-2 rounded-lg ${color}`}>{icon}</div>
					<div className="flex-1">
						<p className="text-sm font-medium text-gray-600">
							{title}
						</p>
						<p className="text-2xl font-bold text-gray-900">
							{value}
						</p>
						{description && (
							<p className="text-xs text-gray-500 mt-1">
								{description}
							</p>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

interface AlgorithmStatsProps {
	stats: PUDashboardData | PNUDashboardData | CLLDashboardData;
	algorithmName: string;
	isActive: boolean;
	currentStep: string;
}

function AlgorithmStats({
	stats,
	algorithmName,
	isActive,
	currentStep,
}: AlgorithmStatsProps) {
	const getPhaseStatus = () => {
		if (!stats.currentPhase) {
			return "初始化";
		}
		switch (stats.currentPhase) {
			case "initial":
				return "初始化階段";
			case "learning":
				return "學習階段";
			case "analysis":
				return "分析階段";
			default:
				return "未知階段";
		}
	};

	const getAccuracyColor = (accuracy?: number) => {
		if (!accuracy) {
			return "text-gray-500";
		}
		if (accuracy >= 0.8) {
			return "text-green-600";
		}
		if (accuracy >= 0.6) {
			return "text-yellow-600";
		}
		return "text-red-600";
	};

	return (
		<div className="space-y-4">
			{/* 算法狀態 */}
			<Card
				className={`border-2 ${isActive ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
			>
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Brain className="h-5 w-5" />
							{algorithmName} 算法
						</div>
						<Badge variant={isActive ? "default" : "secondary"}>
							{isActive ? "執行中" : "待機"}
						</Badge>
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<div className="flex items-center justify-between">
						<span className="text-sm text-gray-600">當前階段</span>
						<span className="font-medium">{getPhaseStatus()}</span>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-sm text-gray-600">執行步驟</span>
						<span className="font-medium">{currentStep}</span>
					</div>
				</CardContent>
			</Card>

			{/* 核心統計數據 */}
			<div className="grid grid-cols-2 gap-4">
				<StatsCard
					title="準確率"
					value={
						stats.accuracy
							? `${(stats.accuracy * 100).toFixed(1)}%`
							: "N/A"
					}
					icon={<Target className="h-4 w-4" />}
					color="bg-green-100 text-green-600"
					description="模型預測準確性"
				/>
				<StatsCard
					title="總樣本數"
					value={stats.totalSamples || 0}
					icon={<Users className="h-4 w-4" />}
					color="bg-blue-100 text-blue-600"
					description="參與訓練的樣本"
				/>
				<StatsCard
					title="錯誤分類"
					value={stats.misclassifiedSamples || 0}
					icon={<AlertCircle className="h-4 w-4" />}
					color="bg-red-100 text-red-600"
					description="預測錯誤的樣本"
				/>
				<StatsCard
					title="平均熵值"
					value={
						stats.averageEntropy
							? stats.averageEntropy.toFixed(3)
							: "N/A"
					}
					icon={<Activity className="h-4 w-4" />}
					color="bg-purple-100 text-purple-600"
					description="系統不確定性指標"
				/>
			</div>

			{/* 算法特定統計 */}
			{"positiveSamples" in stats && (
				<Card>
					<CardHeader>
						<CardTitle className="text-sm">
							PU 算法特定數據 (Neural Network)
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						<div className="flex justify-between">
							<span className="text-sm text-gray-600">
								正樣本數
							</span>
							<span className="font-medium">
								{stats.positiveSamples || 0}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-sm text-gray-600">
								未標記樣本
							</span>
							<span className="font-medium">
								{stats.unlabeledSamples || 0}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-sm text-gray-600">
								RN 數量
							</span>
							<span className="font-medium">
								{stats.rnCount || 0}
							</span>
						</div>
						{/* Neural Network 統計 */}
						{stats.algorithmStats && (
							<>
								<hr className="my-2" />
								<div className="flex justify-between">
									<span className="text-sm text-gray-600">
										學習率
									</span>
									<span className="font-medium">
										{stats.algorithmStats.learningRate ||
											0.01}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm text-gray-600">
										訓練週期
									</span>
									<span className="font-medium">
										{stats.algorithmStats.epochs || 100}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm text-gray-600">
										PU 損失
									</span>
									<span className="font-medium">
										{stats.algorithmStats.puLoss?.toFixed(
											4,
										) || "N/A"}
									</span>
								</div>
								<div className="text-xs text-gray-500 mt-2">
									<div>
										權重: w1=
										{stats.algorithmStats.weights?.w1?.toFixed(
											3,
										) || "0"}
										, w2=
										{stats.algorithmStats.weights?.w2?.toFixed(
											3,
										) || "0"}
									</div>
									<div>
										偏移:{" "}
										{stats.algorithmStats.weights?.bias?.toFixed(
											3,
										) || "0"}
									</div>
								</div>
							</>
						)}
					</CardContent>
				</Card>
			)}

			{"iterationsCompleted" in stats && (
				<Card>
					<CardHeader>
						<CardTitle className="text-sm">
							PNU 算法特定數據
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						<div className="flex justify-between">
							<span className="text-sm text-gray-600">
								完成迭代數
							</span>
							<span className="font-medium">
								{stats.iterationsCompleted || 0}
							</span>
						</div>
					</CardContent>
				</Card>
			)}

			{"complementaryLabelsProcessed" in stats && (
				<Card>
					<CardHeader>
						<CardTitle className="text-sm">
							CLL 算法特定數據
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						<div className="flex justify-between">
							<span className="text-sm text-gray-600">
								處理的互補標籤
							</span>
							<span className="font-medium">
								{stats.complementaryLabelsProcessed || 0}
							</span>
						</div>
					</CardContent>
				</Card>
			)}

			{/* 分析狀態 */}
			<Card>
				<CardHeader>
					<CardTitle className="text-sm flex items-center gap-2">
						<CheckCircle className="h-4 w-4" />
						分析狀態
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center gap-2">
						<div
							className={`w-3 h-3 rounded-full ${
								stats.analysisComplete
									? "bg-green-500"
									: "bg-yellow-500"
							}`}
						/>
						<span className="text-sm">
							{stats.analysisComplete ? "分析完成" : "分析進行中"}
						</span>
					</div>
				</CardContent>
			</Card>

			{/* 日誌預覽 */}
			{stats.logs && stats.logs.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="text-sm">最新日誌</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="bg-gray-50 p-3 rounded text-xs font-mono max-h-32 overflow-y-auto">
							{stats.logs.slice(-5).map((log, index) => (
								<div key={index} className="mb-1">
									{log}
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

export function TrainingStatsPanel({
	currentMode,
	puStats,
	pnuStats,
	cllStats,
	isRunning,
	currentStep,
}: TrainingStatsPanelProps) {
	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<BarChart3 className="h-5 w-5 text-blue-600" />
					全部樣本訓練狀態統計
				</CardTitle>
			</CardHeader>
			<CardContent>
				<Tabs defaultValue="overview" className="w-full">
					<TabsList className="grid w-full grid-cols-4">
						<TabsTrigger
							value="overview"
							className="flex items-center gap-2"
						>
							<TrendingUp className="h-4 w-4" />
							總覽
						</TabsTrigger>
						<TabsTrigger
							value="pu"
							className="flex items-center gap-2"
						>
							<Zap className="h-4 w-4" />
							PU 算法
						</TabsTrigger>
						<TabsTrigger
							value="pnu"
							className="flex items-center gap-2"
						>
							<Users className="h-4 w-4" />
							PNU 算法
						</TabsTrigger>
						<TabsTrigger
							value="cll"
							className="flex items-center gap-2"
						>
							<Target className="h-4 w-4" />
							CLL 算法
						</TabsTrigger>
					</TabsList>

					<TabsContent value="overview" className="mt-6 space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<Card className="border-2 border-blue-200 bg-blue-50">
								<CardContent className="p-4 text-center">
									<Zap className="h-8 w-8 text-blue-600 mx-auto mb-2" />
									<h3 className="font-semibold text-blue-900">
										PU 學習
									</h3>
									<div className="mt-2 space-y-1">
										<p className="text-sm text-blue-700">
											準確率:{" "}
											{puStats?.accuracy
												? `${(puStats.accuracy * 100).toFixed(1)}%`
												: "N/A"}
										</p>
										<p className="text-sm text-blue-700">
											樣本數: {puStats?.totalSamples || 0}
										</p>
									</div>
									<Badge
										variant={
											currentMode === "PU"
												? "default"
												: "secondary"
										}
									>
										{currentMode === "PU"
											? "當前模式"
											: "待機"}
									</Badge>
								</CardContent>
							</Card>

							<Card className="border-2 border-green-200 bg-green-50">
								<CardContent className="p-4 text-center">
									<Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
									<h3 className="font-semibold text-green-900">
										PNU 學習
									</h3>
									<div className="mt-2 space-y-1">
										<p className="text-sm text-green-700">
											準確率:{" "}
											{pnuStats?.accuracy
												? `${(pnuStats.accuracy * 100).toFixed(1)}%`
												: "N/A"}
										</p>
										<p className="text-sm text-green-700">
											樣本數:{" "}
											{pnuStats?.totalSamples || 0}
										</p>
									</div>
									<Badge
										variant={
											currentMode === "PNU"
												? "default"
												: "secondary"
										}
									>
										{currentMode === "PNU"
											? "當前模式"
											: "待機"}
									</Badge>
								</CardContent>
							</Card>

							<Card className="border-2 border-purple-200 bg-purple-50">
								<CardContent className="p-4 text-center">
									<Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
									<h3 className="font-semibold text-purple-900">
										CLL 學習
									</h3>
									<div className="mt-2 space-y-1">
										<p className="text-sm text-purple-700">
											準確率:{" "}
											{cllStats?.accuracy
												? `${(cllStats.accuracy * 100).toFixed(1)}%`
												: "N/A"}
										</p>
										<p className="text-sm text-purple-700">
											樣本數:{" "}
											{cllStats?.totalSamples || 0}
										</p>
									</div>
									<Badge
										variant={
											currentMode === "CLL"
												? "default"
												: "secondary"
										}
									>
										{currentMode === "CLL"
											? "當前模式"
											: "待機"}
									</Badge>
								</CardContent>
							</Card>
						</div>

						<Card>
							<CardHeader>
								<CardTitle className="text-sm">
									系統狀態
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<span className="text-sm text-gray-600">
											當前執行模式
										</span>
										<Badge variant="outline">
											{currentMode}
										</Badge>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-sm text-gray-600">
											訓練狀態
										</span>
										<div className="flex items-center gap-2">
											<div
												className={`w-3 h-3 rounded-full ${
													isRunning
														? "bg-green-500 animate-pulse"
														: "bg-gray-400"
												}`}
											/>
											<span className="text-sm">
												{isRunning ? "執行中" : "停止"}
											</span>
										</div>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-sm text-gray-600">
											當前步驟
										</span>
										<span className="font-medium">
											{currentStep}
										</span>
									</div>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="pu" className="mt-6">
						{puStats ? (
							<AlgorithmStats
								stats={puStats}
								algorithmName="PU (正樣本-未標註)"
								isActive={currentMode === "PU"}
								currentStep={currentStep}
							/>
						) : (
							<Card>
								<CardContent className="p-8 text-center">
									<AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
									<p className="text-gray-500">
										PU 算法尚未初始化
									</p>
								</CardContent>
							</Card>
						)}
					</TabsContent>

					<TabsContent value="pnu" className="mt-6">
						{pnuStats ? (
							<AlgorithmStats
								stats={pnuStats}
								algorithmName="PNU (正樣本-未標註-負樣本)"
								isActive={currentMode === "PNU"}
								currentStep={currentStep}
							/>
						) : (
							<Card>
								<CardContent className="p-8 text-center">
									<AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
									<p className="text-gray-500">
										PNU 算法尚未初始化
									</p>
								</CardContent>
							</Card>
						)}
					</TabsContent>

					<TabsContent value="cll" className="mt-6">
						{cllStats ? (
							<AlgorithmStats
								stats={cllStats}
								algorithmName="CLL (互補標籤學習)"
								isActive={currentMode === "CLL"}
								currentStep={currentStep}
							/>
						) : (
							<Card>
								<CardContent className="p-8 text-center">
									<AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
									<p className="text-gray-500">
										CLL 算法尚未初始化
									</p>
								</CardContent>
							</Card>
						)}
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}
