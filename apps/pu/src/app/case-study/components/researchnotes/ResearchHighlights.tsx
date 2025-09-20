"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChartBig, BrainCircuit, Layers, Lightbulb } from "lucide-react";

export default function ResearchHighlights() {
	return (
		<section id="research-highlights" className="scroll-mt-6">
			<Card className="bg-white shadow-lg">
				<CardHeader>
					<h2 className="text-base font-semibold uppercase text-blue-600 tracking-wider mb-4">
						Research Highlights
					</h2>
					<CardTitle className="text-3xl font-bold text-gray-800">
						Key Research Insights
					</CardTitle>
					<p className="text-lg text-gray-500 pt-2">
						Critical challenges and opportunities discovered when
						applying Ishida-lab risk-estimation theories to
						real-world data.
					</p>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Insight 1: nnPU */}
					<div className="space-y-3 p-4 rounded-lg border bg-slate-50/50">
						<h4 className="text-xl font-semibold text-slate-800">
							On nnPU Risk-Estimation: The Challenge of a Dynamic
							Class Prior π(t)
						</h4>
						<div className="border-l-4 border-l-orange-400 pl-4 py-3 bg-orange-50 rounded-r-lg">
							<p className="font-semibold text-orange-800 mb-2">
								Challenge on My Testbed:
							</p>
							<div className="space-y-1 text-orange-900">
								<p>
									• Ishida-lab theory assumes{" "}
									<strong>static class prior π</strong>
								</p>
								<p>
									• My data shows{" "}
									<strong>
										non-stationary, dynamic π(t)
									</strong>
								</p>
								<p>
									•{" "}
									<strong>
										AC anomalies spike in summer
									</strong>{" "}
									→ time-varying risk-estimation challenge
								</p>
							</div>
						</div>
						<div className="pt-2">
							<h5 className="font-semibold text-slate-700 flex items-center gap-2 mb-2">
								<Lightbulb className="w-5 h-5 text-yellow-500" />
								Inspired Future Question:
							</h5>
							<p className="text-slate-600 leading-relaxed">
								Can I design an{" "}
								<strong>"Online nnPU Risk-Estimation"</strong>{" "}
								algorithm that dynamically adapts to changing
								class prior π(t)?
							</p>
						</div>
					</div>

					{/* Insight 2: Distribution Shift */}
					<div className="space-y-3 p-4 rounded-lg border bg-slate-50/50">
						<h4 className="text-xl font-semibold text-slate-800">
							On Distribution Shift under Weak Supervision: The
							Problem of Compound Shifts
						</h4>
						<div className="border-l-4 border-l-purple-400 pl-4 py-3 bg-purple-50 rounded-r-lg">
							<p className="font-semibold text-purple-800 mb-2">
								Challenge on My Testbed:
							</p>
							<div className="space-y-1 text-purple-900">
								<p>
									• <strong>Covariate shift:</strong> energy
									usage patterns change by season
								</p>
								<p>
									• <strong>Label shift:</strong> anomaly
									definition & frequency change under weak
									supervision
								</p>
								<p>
									•{" "}
									<strong>Compound distribution shift</strong>{" "}
									beyond existing risk-estimation methods
								</p>
							</div>
						</div>
						<div className="pt-2">
							<h5 className="font-semibold text-slate-700 flex items-center gap-2 mb-2">
								<Lightbulb className="w-5 h-5 text-yellow-500" />
								Inspired Future Question:
							</h5>
							<p className="text-slate-600 leading-relaxed">
								How can I develop a{" "}
								<strong>unified framework</strong> to handle
								compound shifts within PU risk-estimation
								context?
							</p>
						</div>
					</div>

					{/* Insight 3: Noisy Labels */}
					<div className="space-y-3 p-4 rounded-lg border bg-slate-50/50">
						<h4 className="text-xl font-semibold text-slate-800">
							On Label Noise under Weak Supervision: The Signal in
							Structured "Noise"
						</h4>
						<div className="border-l-4 border-l-teal-400 pl-4 py-3 bg-teal-50 rounded-r-lg">
							<p className="font-semibold text-teal-800 mb-2">
								Challenge on My Testbed:
							</p>
							<div className="space-y-1 text-teal-900">
								<p>
									• Ishida-lab theory handles{" "}
									<strong>random noise</strong>
								</p>
								<p>
									• My weak supervision data has{" "}
									<strong>
										structured, behavior-related "noise"
									</strong>
								</p>
								<p>
									• <strong>Systematic disagreement</strong>{" "}
									between operators under weak supervision
								</p>
							</div>
						</div>
						<div className="pt-2">
							<h5 className="font-semibold text-slate-700 flex items-center gap-2 mb-2">
								<Lightbulb className="w-5 h-5 text-yellow-500" />
								Inspired Future Question:
							</h5>
							<p className="text-slate-600 leading-relaxed">
								Can I leverage{" "}
								<strong>structured "noise"</strong> as valuable
								signal about context-dependence of anomaly
								detection under weak supervision?
							</p>
						</div>
					</div>

					{/* Future Directions - 簡化版本 */}
					<div className="border-t-2 border-dashed pt-6 mt-6">
						<h4 className="text-xl font-bold text-gray-800 flex items-center gap-3 mb-4">
							<Layers className="h-6 w-6 text-gray-600" />
							Future Directions in Risk-Estimation Architecture
						</h4>
						<p className="text-gray-600 mb-4">
							Beyond refining the PU risk-estimation algorithm,
							exploring alternative model architectures offers
							promising avenues.
						</p>
						<div className="grid md:grid-cols-2 gap-4">
							{/* XGBoost Card */}
							<div className="p-4 rounded-lg border-2 border-slate-200 bg-white hover:border-slate-300 transition-all">
								<h5 className="font-semibold text-slate-700 flex items-center gap-2 mb-3">
									<BarChartBig className="w-5 h-5 text-green-600" />
									XGBoost for Interpretability under Weak
									Supervision
								</h5>
								<div className="space-y-1 text-sm text-slate-600">
									<p>
										• <strong>Tree-based models</strong>{" "}
										with PU risk-estimation
									</p>
									<p>
										•{" "}
										<strong>
											Feature importance scores
										</strong>{" "}
										for interpretability under weak
										supervision
									</p>
									<p>
										• Help operators understand{" "}
										<strong>anomaly drivers</strong>
									</p>
								</div>
							</div>
							{/* Transformer Card */}
							<div className="p-4 rounded-lg border-2 border-slate-200 bg-white hover:border-slate-300 transition-all">
								<h5 className="font-semibold text-slate-700 flex items-center gap-2 mb-3">
									<BrainCircuit className="w-5 h-5 text-purple-600" />
									Transformers for Long-Range Dependencies in
									Risk-Estimation
								</h5>
								<div className="space-y-1 text-sm text-slate-600">
									<p>
										•{" "}
										<strong>
											Self-attention mechanism
										</strong>{" "}
										vs LSTMs under weak supervision
									</p>
									<p>
										• Capture{" "}
										<strong>
											complex, long-range dependencies
										</strong>
									</p>
									<p>
										• Detect{" "}
										<strong>slow-building anomalies</strong>{" "}
										(weeks/months)
									</p>
								</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</section>
	);
}
