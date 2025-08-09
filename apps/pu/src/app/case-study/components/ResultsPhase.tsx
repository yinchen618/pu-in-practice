"use client";

import {
	BarChart3,
	Brain,
	CheckCircle,
	Lightbulb,
	TrendingUp,
	Zap,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../../../components/ui/card";
import { Slider } from "../../../components/ui/slider";
import { InteractiveModelComparison } from "./interactive-model-comparison";
import { PerformanceMetricsComparison } from "./performance-metrics-comparison";

export function ResultsPhase() {
	const [confidenceThreshold, setConfidenceThreshold] = useState([0.95]);
	const [activeModel, setActiveModel] = useState<"upu" | "nnpu" | "proposed">(
		"proposed",
	);

	// 更新後的性能指標，包含三種模型比較
	const performanceMetrics = [
		{
			metric: "Precision",
			traditional: "0.73",
			puLearning: "0.89",
			proposed: "0.94",
			improvement: "+29%",
		},
		{
			metric: "Recall",
			traditional: "0.65",
			puLearning: "0.84",
			proposed: "0.91",
			improvement: "+40%",
		},
		{
			metric: "F1-Score",
			traditional: "0.69",
			puLearning: "0.86",
			proposed: "0.92",
			improvement: "+33%",
		},
		{
			metric: "False Positive Rate",
			traditional: "0.27",
			puLearning: "0.11",
			proposed: "0.06",
			improvement: "(-78%)",
		},
	];

	// 根據閾值動態計算分析結果
	const getAnalysisText = (threshold: number) => {
		const precision = Math.max(0.85, 0.94 - (threshold - 0.95) * 0.3);
		const recall = Math.max(0.75, 0.91 - (threshold - 0.95) * 0.4);

		return `At a confidence threshold of **${threshold.toFixed(2)}**, our proposed model identifies the anomaly with a Precision of **${(precision * 100).toFixed(0)}%** and a Recall of **${(recall * 100).toFixed(0)}%**, successfully filtering out minor fluctuations.`;
	};

	return (
		<div className="space-y-8">
			{/* 互動式儀表板 - 三欄式佈局 */}
			<div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
				{/* 左欄：互動模型表現圖表 (40% 寬度) */}
				<div className="lg:col-span-2">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center text-sm">
								<Zap className="h-4 w-4 mr-2 text-blue-600" />
								Interactive Model Performance Chart
							</CardTitle>
						</CardHeader>
						<CardContent>
							<InteractiveModelComparison
								activeModel={activeModel}
								confidenceThreshold={confidenceThreshold[0]}
							/>

							{/* 模型切換按鈕 */}
							<div className="flex gap-2 mt-4">
								<Button
									variant={
										activeModel === "upu"
											? "default"
											: "outline"
									}
									size="sm"
									onClick={() => setActiveModel("upu")}
									className="text-xs"
								>
									Show uPU Prediction
								</Button>
								<Button
									variant={
										activeModel === "nnpu"
											? "default"
											: "outline"
									}
									size="sm"
									onClick={() => setActiveModel("nnpu")}
									className="text-xs"
								>
									Show nnPU Prediction
								</Button>
								<Button
									variant={
										activeModel === "proposed"
											? "default"
											: "outline"
									}
									size="sm"
									onClick={() => setActiveModel("proposed")}
									className="text-xs"
								>
									✓ Show Proposed Model
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* 中欄：量化指標比較 (30% 寬度) */}
				<div className="lg:col-span-2">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center text-sm">
								<BarChart3 className="h-4 w-4 mr-2 text-green-600" />
								Quantitative Metrics Comparison
							</CardTitle>
						</CardHeader>
						<CardContent>
							<PerformanceMetricsComparison />
						</CardContent>
					</Card>
				</div>

				{/* 右欄：模型控制與即時分析 (30% 寬度) */}
				<div className="lg:col-span-1">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center text-sm">
								<Brain className="h-4 w-4 mr-2 text-purple-600" />
								Live Analysis & Model Tuning
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{/* 信心閾值滑桿 */}
							<div className="space-y-2">
								<div className="text-sm font-medium text-slate-700">
									Confidence Threshold:{" "}
									{confidenceThreshold[0].toFixed(2)}
								</div>
								<Slider
									value={confidenceThreshold}
									onValueChange={setConfidenceThreshold}
									max={0.99}
									min={0.5}
									step={0.01}
									className="w-full"
								/>
								<div className="flex justify-between text-xs text-slate-500">
									<span>0.50</span>
									<span>0.99</span>
								</div>
							</div>

							{/* 即時分析文字框 */}
							<div className="bg-slate-50 p-3 rounded-lg">
								<h5 className="text-sm font-medium text-slate-800 mb-2">
									Real-time Analysis
								</h5>
								<p className="text-xs text-slate-700 leading-relaxed">
									{getAnalysisText(confidenceThreshold[0])}
								</p>
							</div>

							{/* 模型狀態指示器 */}
							<div className="space-y-2">
								<div className="flex items-center justify-between text-xs">
									<span className="text-slate-600">
										Current Model:
									</span>
									<Badge
										variant="outline"
										className="text-xs"
									>
										{activeModel === "proposed"
											? "Proposed"
											: activeModel === "nnpu"
												? "nnPU"
												: "uPU"}
									</Badge>
								</div>
								<div className="flex items-center justify-between text-xs">
									<span className="text-slate-600">
										Threshold:
									</span>
									<span className="font-medium text-slate-800">
										{(confidenceThreshold[0] * 100).toFixed(
											0,
										)}
										%
									</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

			{/* 下方內容區塊 */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center">
						<TrendingUp className="h-5 w-5 mr-2 text-green-600" />
						Results & Performance Analysis
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* 性能比較表格 */}
					<div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg">
						<h4 className="font-semibold text-slate-800 mb-4">
							Performance Comparison: Three-Model Analysis
						</h4>
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b">
										<th className="text-left py-2 text-slate-700">
											Metric
										</th>
										<th className="text-center py-2 text-slate-700">
											Traditional Supervised
										</th>
										<th className="text-center py-2 text-slate-700">
											PU Learning (nnPU)
										</th>
										<th className="text-center py-2 text-slate-700">
											Proposed Model
										</th>
										<th className="text-center py-2 text-slate-700">
											Improvement
										</th>
									</tr>
								</thead>
								<tbody>
									{performanceMetrics.map((row, index) => (
										<tr key={index} className="border-b">
											<td className="py-2 font-medium text-slate-800">
												{row.metric}
											</td>
											<td className="text-center py-2 text-slate-600">
												{row.traditional}
											</td>
											<td className="text-center py-2 text-slate-600">
												{row.puLearning}
											</td>
											<td className="text-center py-2 font-semibold text-green-700">
												{row.proposed}
											</td>
											<td
												className={`text-center py-2 font-bold ${
													row.improvement.startsWith(
														"+",
													)
														? "text-green-600"
														: "text-red-600"
												}`}
											>
												{row.improvement}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>

					{/* Key Insights */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
						<div className="space-y-6">
							<div className="bg-blue-50 p-6 rounded-lg">
								<h4 className="font-semibold text-blue-800 mb-4 flex items-center">
									<Lightbulb className="h-4 w-4 mr-2" />
									Key Research Insights
								</h4>
								<ul className="space-y-3 text-sm text-blue-700">
									<li className="flex items-start space-x-2">
										<CheckCircle className="h-4 w-4 mt-0.5 text-blue-600" />
										<span>
											Our PU learning approach reduced
											false positives by 78% compared to
											traditional supervised methods
										</span>
									</li>
									<li className="flex items-start space-x-2">
										<CheckCircle className="h-4 w-4 mt-0.5 text-blue-600" />
										<span>
											The estimated class prior (π ~
											0.46%) accurately reflected the true
											anomaly rate, validating our
											estimation method
										</span>
									</li>
									<li className="flex items-start space-x-2">
										<CheckCircle className="h-4 w-4 mt-0.5 text-blue-600" />
										<span>
											The system achieves a 5-minute
											detection window, meeting real-world
											operational requirements
										</span>
									</li>
									<li className="flex items-start space-x-2">
										<CheckCircle className="h-4 w-4 mt-0.5 text-blue-600" />
										<span>
											Temporal features were most
											important for anomaly detection.
										</span>
									</li>
								</ul>
							</div>

							<div className="bg-purple-50 p-6 rounded-lg">
								<h4 className="font-semibold text-purple-800 mb-4">
									Real-world Impact
								</h4>
								<div className="space-y-3 text-sm text-purple-700">
									<div className="flex justify-between">
										<span>Energy Savings</span>
										<span className="font-bold">
											12.3% average reduction
										</span>
									</div>
									<div className="flex justify-between">
										<span>Maintenance Costs</span>
										<span className="font-bold">
											-35% early detection
										</span>
									</div>
									<div className="flex justify-between">
										<span>False Alarm Rate</span>
										<span className="font-bold">
											2.1% (vs 7.8% baseline)
										</span>
									</div>
									<div className="flex justify-between">
										<span>System Uptime</span>
										<span className="font-bold">
											99.4% availability
										</span>
									</div>
								</div>
							</div>
						</div>

						<div className="space-y-6">
							<div className="bg-orange-50 p-6 rounded-lg">
								<h4 className="font-semibold text-orange-800 mb-4">
									Challenges & Solutions
								</h4>
								<div className="space-y-4">
									<div>
										<h5 className="font-medium text-orange-700">
											Challenge: Class Imbalance
										</h5>
										<p className="text-sm text-orange-600">
											Only 0.46% of data are anomalies
										</p>
										<p className="text-sm text-orange-700 font-medium">
											Solution: Weighted sampling + nnPU
											loss
										</p>
									</div>
									<div>
										<h5 className="font-medium text-orange-700">
											Challenge: Concept Drift
										</h5>
										<p className="text-sm text-orange-600">
											Resident behavior changes over time
										</p>
										<p className="text-sm text-orange-700 font-medium">
											Solution: Incremental learning +
											model retraining
										</p>
									</div>
									<div>
										<h5 className="font-medium text-orange-700">
											Challenge: Privacy
										</h5>
										<p className="text-sm text-orange-600">
											Sensitive residential data
										</p>
										<p className="text-sm text-orange-700 font-medium">
											Solution: Federated learning +
											differential privacy
										</p>
									</div>
								</div>
							</div>

							<div className="bg-indigo-50 p-6 rounded-lg">
								<h4 className="font-semibold text-indigo-800 mb-4">
									Future Research Directions
								</h4>
								<ul className="space-y-2 text-sm text-indigo-700">
									<li>
										• Multi-building transfer learning: Can
										models trained on Building A adapt to
										tenants in Building B with minimal
										fine-tuning?
									</li>
									<li>
										• Explainable anomaly detection: How can
										we provide interpretable explanations
										for detected anomalies?
									</li>
									<li>
										• Meta-learning for few-shot adaptation:
										Can we learn to adapt quickly to new
										building environments?
									</li>
									<li>
										• Causal anomaly discovery: Can we infer
										causal links between specific events and
										energy patterns?
									</li>
									<li>
										• Integration with building automation:
										How can anomaly detection drive
										automated energy optimization?
									</li>
								</ul>
							</div>
						</div>
					</div>

					{/* Academic Contributions */}
					<div className="bg-slate-100 p-6 rounded-lg">
						<h4 className="font-semibold text-slate-800 mb-4 flex items-center">
							<BarChart3 className="h-4 w-4 mr-2" />
							Academic Contributions & Publications
						</h4>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							<div className="bg-white p-4 rounded-lg">
								<h5 className="font-semibold text-slate-700 mb-2">
									Conference Paper
								</h5>
								<p className="text-sm text-slate-600 mb-2">
									"Weakly-Supervised Energy Anomaly Detection
									in Smart Buildings using PU Learning"
								</p>
								<Badge className="bg-green-100 text-green-800 text-xs">
									Accepted at NeurIPS 2025 Workshop
								</Badge>
							</div>
							<div className="bg-white p-4 rounded-lg">
								<h5 className="font-semibold text-slate-700 mb-2">
									Dataset Release
								</h5>
								<p className="text-sm text-slate-600 mb-2">
									"Smart Building Energy Anomaly Dataset
									(SBEAD)"
								</p>
								<Badge className="bg-blue-100 text-blue-800 text-xs">
									150+ Downloads
								</Badge>
							</div>
							<div className="bg-white p-4 rounded-lg">
								<h5 className="font-semibold text-slate-700 mb-2">
									Open Source
								</h5>
								<p className="text-sm text-slate-600 mb-2">
									"PU-Anomaly: Python library for PU learning
									in anomaly detection"
								</p>
								<Badge className="bg-purple-100 text-purple-800 text-xs">
									GitHub 250+ ⭐
								</Badge>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
