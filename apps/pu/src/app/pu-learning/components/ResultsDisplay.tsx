import { Badge } from "@/components/ui/badge";
// ResultsDisplay.tsx
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Activity,
	AlertTriangle,
	BarChart,
	CheckCircle,
	HelpCircle,
	TrendingUp,
} from "lucide-react";
import type { SimulationResult } from "./types";

interface ResultsDisplayProps {
	results: SimulationResult | null;
	algorithm: "uPU" | "nnPU";
	// Add current configuration for display
	currentConfig?: {
		distribution: string;
		dimensions: number;
		sampleSize: number;
		positiveRatio: number;
		labelFrequency: number;
		hiddenSize: number;
	};
}

export default function ResultsDisplay({
	results,
	algorithm,
	currentConfig,
}: ResultsDisplayProps) {
	if (!results) {
		return (
			<div className="col-span-full">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Activity className="h-5 w-5" />
							Simulation Results
						</CardTitle>
						<CardDescription>
							Results will appear here after running the
							simulation
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
							<div className="text-center">
								<BarChart className="h-8 w-8 mx-auto text-gray-400 mb-2" />
								<p className="text-sm text-gray-500">
									No simulation results yet
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	const formatErrorRate = (rate: number) => {
		if (rate < 0.01) {
			return `${(rate * 100).toFixed(3)}%`;
		}
		if (rate < 0.1) {
			return `${(rate * 100).toFixed(2)}%`;
		}
		return `${(rate * 100).toFixed(1)}%`;
	};

	const getErrorSeverity = (
		rate: number,
	): "default" | "secondary" | "destructive" | "outline" => {
		if (rate < 0.02) {
			return "secondary"; // Good performance
		}
		if (rate < 0.05) {
			return "outline"; // Warning
		}
		return "destructive"; // Needs improvement
	};

	const getAlgorithmColor = () => {
		return algorithm === "uPU" ? "bg-amber-500" : "bg-emerald-500";
	};

	const getRiskText = () => {
		const finalRisk =
			results.metrics.riskCurve[results.metrics.riskCurve.length - 1]
				?.risk || 0;
		return finalRisk.toFixed(4);
	};

	const getFinalRisk = () => {
		return (
			results.metrics.riskCurve[results.metrics.riskCurve.length - 1]
				?.risk || 0
		);
	};

	// 新增：模型狀態判斷邏輯
	const getModelStatus = () => {
		const testingErrorRate = results.metrics.errorRate;
		const trainingErrorRate = results.metrics.trainingErrorRate;

		// 判斷是否嚴重過擬合
		const isSevereOverfitting =
			testingErrorRate > trainingErrorRate * 3 &&
			trainingErrorRate < 0.05;

		if (isSevereOverfitting) {
			return {
				status: "🔴 嚴重過擬合 (Severe Overfitting)",
				color: "text-red-600",
				bgColor: "bg-red-50",
				borderColor: "border-red-200",
				description:
					"模型在訓練數據上表現完美，但在新數據上表現差得多，代表它只是死記硬背，未能學習通用規律。",
			};
		}

		return {
			status: "🟢 健康 (Healthy)",
			color: "text-green-600",
			bgColor: "bg-green-50",
			borderColor: "border-green-200",
			description: "模型在訓練與測試數據上的表現一致，狀態良好。",
		};
	};

	const modelStatus = getModelStatus();

	return (
		<div className="col-span-full space-y-4">
			{/* Model Status Card - 新增 */}
			<Card
				className={`${modelStatus.borderColor} ${modelStatus.bgColor}`}
			>
				<CardHeader>
					<CardTitle
						className={`flex items-center gap-2 ${modelStatus.color}`}
					>
						<Activity className="h-5 w-5" />
						模型狀態 (Model Status)
						<div className="relative group">
							<HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
							<div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
								{modelStatus.description}
								<div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800" />
							</div>
						</div>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-lg font-semibold mb-2">
						{modelStatus.status}
					</div>
					<p className="text-sm text-gray-600">
						{modelStatus.description}
					</p>
				</CardContent>
			</Card>

			{/* Main Results Card */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Activity className="h-5 w-5" />
						Simulation Results
						<Badge
							className={`ml-2 ${getAlgorithmColor()} text-white`}
						>
							{algorithm}
						</Badge>
					</CardTitle>
					<CardDescription>
						PU Learning classification performance metrics
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						{/* Testing Error Rate */}
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								{results.metrics.errorRate < 0.02 ? (
									<CheckCircle className="h-4 w-4 text-green-500" />
								) : (
									<AlertTriangle className="h-4 w-4 text-amber-500" />
								)}
								<span className="text-sm font-medium">
									測試錯誤率
								</span>
							</div>
							<div className="text-2xl font-bold">
								{formatErrorRate(results.metrics.errorRate)}
							</div>
							<Badge
								variant={getErrorSeverity(
									results.metrics.errorRate,
								)}
							>
								{results.metrics.errorRate < 0.02
									? "Excellent"
									: results.metrics.errorRate < 0.05
										? "Good"
										: "Needs Tuning"}
							</Badge>
						</div>

						{/* Training Error Rate - 新增 */}
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								{results.metrics.trainingErrorRate < 0.02 ? (
									<CheckCircle className="h-4 w-4 text-green-500" />
								) : (
									<AlertTriangle className="h-4 w-4 text-amber-500" />
								)}
								<span className="text-sm font-medium">
									訓練錯誤率
								</span>
							</div>
							<div className="text-2xl font-bold">
								{formatErrorRate(
									results.metrics.trainingErrorRate,
								)}
							</div>
							<Badge
								variant={getErrorSeverity(
									results.metrics.trainingErrorRate,
								)}
							>
								{results.metrics.trainingErrorRate < 0.02
									? "Excellent"
									: results.metrics.trainingErrorRate < 0.05
										? "Good"
										: "Needs Tuning"}
							</Badge>
						</div>

						{/* Prior Estimation */}
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<TrendingUp className="h-4 w-4 text-blue-500" />
								<span className="text-sm font-medium">
									Prior Estimation
								</span>
							</div>
							<div className="text-2xl font-bold">
								{results.metrics.estimatedPrior.toFixed(3)}
							</div>
							<Badge variant="outline">Estimated Prior</Badge>
						</div>

						{/* Final Risk */}
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<BarChart className="h-4 w-4 text-red-500" />
								<span className="text-sm font-medium">
									Final Risk
								</span>
							</div>
							<div className="text-2xl font-bold">
								{getRiskText()}
							</div>
							<Badge
								variant={
									getFinalRisk() > 0
										? "destructive"
										: "secondary"
								}
							>
								{getFinalRisk() > 0 ? "Positive" : "Negative"}
							</Badge>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Configuration Summary */}
			{currentConfig && (
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">
							Configuration Used
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
							<div>
								<span className="font-medium">
									Distribution:
								</span>{" "}
								{currentConfig.distribution}
							</div>
							<div>
								<span className="font-medium">Dimensions:</span>{" "}
								{currentConfig.dimensions}D
							</div>
							<div>
								<span className="font-medium">
									Sample Size:
								</span>{" "}
								{currentConfig.sampleSize.toLocaleString()}
							</div>
							<div>
								<span className="font-medium">
									Positive Ratio:
								</span>{" "}
								{(currentConfig.positiveRatio * 100).toFixed(1)}
								%
							</div>
							<div>
								<span className="font-medium">
									Label Frequency:
								</span>{" "}
								{(currentConfig.labelFrequency * 100).toFixed(
									1,
								)}
								%
							</div>
							<div>
								<span className="font-medium">
									Hidden Layers:
								</span>{" "}
								{currentConfig.hiddenSize}
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Performance Insights */}
			{results.metrics.errorRate < 0.01 && (
				<Card className="border-green-200 bg-green-50">
					<CardHeader>
						<CardTitle className="text-green-800 flex items-center gap-2">
							<CheckCircle className="h-5 w-5" />
							Excellent Performance! 🎉
						</CardTitle>
					</CardHeader>
					<CardContent className="text-green-700">
						<p>
							Your model achieved an exceptionally low error rate
							of {formatErrorRate(results.metrics.errorRate)}.
							This indicates excellent separation between positive
							and unlabeled data.
						</p>
					</CardContent>
				</Card>
			)}

			{results.metrics.errorRate > 0.1 && (
				<Card className="border-amber-200 bg-amber-50">
					<CardHeader>
						<CardTitle className="text-amber-800 flex items-center gap-2">
							<AlertTriangle className="h-5 w-5" />
							Performance Suggestions
						</CardTitle>
					</CardHeader>
					<CardContent className="text-amber-700">
						<p>
							High error rate detected (
							{formatErrorRate(results.metrics.errorRate)}).
							Consider:
						</p>
						<ul className="list-disc list-inside mt-2 space-y-1">
							<li>Increasing sample size</li>
							<li>Adjusting regularization (λ parameter)</li>
							<li>Trying different prior estimation methods</li>
							<li>
								Using 8D gaussian distribution for better
								separability
							</li>
						</ul>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
