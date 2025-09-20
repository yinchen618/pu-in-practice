"use client";

import { LaTeX } from "@/components/LaTeX";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, Database, GanttChartSquare } from "lucide-react";

export default function SinglePhaseThreeWireRevised() {
	return (
		<Card className="bg-white shadow-lg border">
			<CardHeader>
				<CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-3">
					<Database className="h-7 w-7 text-blue-600" />
					Data Sourcing & Feature Engineering
				</CardTitle>
				<CardDescription className="text-md pt-1">
					Addressing the core challenge of transforming complex, raw
					electrical signals into a clean, synchronized, and
					feature-rich dataset.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Challenge Section */}
				<div className="p-4 rounded-lg border-2 border-amber-200 bg-amber-50/50">
					<h4 className="font-semibold text-amber-800 mb-3 flex items-center gap-2 text-lg">
						<AlertTriangle className="h-5 w-5" />
						The Challenge: Noisy & Complex Raw Data
					</h4>
					<ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
						<li>
							<strong>Complex Electrical System (1Φ3W):</strong>{" "}
							Raw readings from two 110V lines (L1, L2) do not
							directly differentiate between 110V and 220V
							appliance usage.
						</li>
						<li>
							<strong>Temporal Asynchronicity:</strong> IoT meters
							suffer from clock drift and network latency,
							resulting in unsynchronized time-series data.
						</li>
						<li>
							<strong>Data Gaps & Noise:</strong> Intermittent
							sensor dropouts create missing data points,
							disrupting analysis.
						</li>
					</ul>
				</div>

				{/* Solution Section */}
				<div className="p-4 rounded-lg border-2 border-teal-200 bg-teal-50/50">
					<h4 className="font-semibold text-teal-800 mb-3 flex items-center gap-2 text-lg">
						<GanttChartSquare className="h-5 w-5" />
						My Solution: A Multi-Stage ETL (Extract, Transform,
						Load) Pipeline
					</h4>
					<ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
						<li>
							<strong>1Φ3W Feature Derivation:</strong> Apply
							mathematical transformations to raw L1/L2 readings
							to derive meaningful features:{" "}
							<code className="font-mono text-xs bg-slate-200 px-1 rounded">
								Total Power
							</code>
							,{" "}
							<code className="font-mono text-xs bg-slate-200 px-1 rounded">
								110V Load
							</code>
							, and{" "}
							<code className="font-mono text-xs bg-slate-200 px-1 rounded">
								220V Load
							</code>
							.
						</li>
						<li>
							<strong>Temporal Synchronization:</strong> ETL
							resamples to uniform 1-minute intervals and aligns
							clocks; preserves class-prior estimates by avoiding
							leakage across splits.
						</li>
						<li>
							<strong>Hybrid Gap-Filling:</strong> A strategy that
							forward-fills short gaps (≤3 mins) to maintain data
							continuity, while removing longer, unreliable
							periods.
						</li>
						<li>
							<strong>Prior-Stability Check:</strong> Track
							estimated π_p over time windows to monitor shift and
							guard against biased risk estimates.
						</li>
					</ul>
				</div>

				{/* Collapsible Details */}
				<details className="bg-slate-50 border border-slate-200 rounded-lg p-4">
					<summary className="text-sm font-semibold text-slate-700 cursor-pointer hover:text-slate-800 flex items-center gap-2">
						<span className="text-lg">📐</span>
						[+] View 1Φ3W Feature Derivation Formulas & Mathematical
						Foundation
					</summary>
					<div className="pt-6 space-y-6">
						{/* Mathematical Formulas */}
						<div className="grid md:grid-cols-3 gap-4">
							<div className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
								<div className="font-semibold text-blue-800 text-sm mb-3 flex items-center justify-center gap-2">
									<span className="w-2 h-2 bg-blue-500 rounded-full" />
									Total Power
								</div>
								<div className="text-center">
									<LaTeX>
										{"P_{\\text{total}} = P_{L1} + P_{L2}"}
									</LaTeX>
								</div>
								<div className="text-xs text-blue-600 mt-2 text-center">
									Sum of both lines
								</div>
							</div>
							<div className="bg-white p-4 rounded-lg border border-purple-200 shadow-sm">
								<div className="font-semibold text-purple-800 text-sm mb-3 flex items-center justify-center gap-2">
									<span className="w-2 h-2 bg-purple-500 rounded-full" />
									220V Load
								</div>
								<div className="text-center">
									<LaTeX>
										{
											"P_{220V} = 2 \\times \\min(P_{L1}, P_{L2})"
										}
									</LaTeX>
								</div>
								<div className="text-xs text-purple-600 mt-2 text-center">
									Balanced load across lines
								</div>
							</div>
							<div className="bg-white p-4 rounded-lg border border-amber-200 shadow-sm">
								<div className="font-semibold text-amber-800 text-sm mb-3 flex items-center justify-center gap-2">
									<span className="w-2 h-2 bg-amber-500 rounded-full" />
									110V Load
								</div>
								<div className="text-center">
									<LaTeX>
										{"P_{110V} = |P_{L1} - P_{L2}|"}
									</LaTeX>
								</div>
								<div className="text-xs text-amber-600 mt-2 text-center">
									Imbalanced load difference
								</div>
							</div>
						</div>

						{/* Explanation */}
						<div className="bg-white p-4 rounded-lg border border-slate-200">
							<h5 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
								<span className="text-lg">⚡</span>
								Electrical Engineering Rationale
							</h5>
							<div className="text-sm text-slate-700 space-y-2">
								<p className="flex items-start gap-2">
									<span className="text-blue-500 font-bold">
										•
									</span>
									<span>
										<strong>
											Single-Phase Three-Wire (1Φ3W):
										</strong>{" "}
										Two 110V lines that can combine to
										provide 220V
									</span>
								</p>
								<p className="flex items-start gap-2">
									<span className="text-purple-500 font-bold">
										•
									</span>
									<span>
										<strong>220V Appliances:</strong> Draw
										balanced power from both lines
										simultaneously
									</span>
								</p>
								<p className="flex items-start gap-2">
									<span className="text-amber-500 font-bold">
										•
									</span>
									<span>
										<strong>110V Appliances:</strong> Create
										imbalance by drawing from only one line
									</span>
								</p>
							</div>
						</div>
					</div>
				</details>
			</CardContent>
		</Card>
	);
}
