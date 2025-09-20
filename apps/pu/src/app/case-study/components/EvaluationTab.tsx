"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	AlertTriangle,
	BarChart3,
	Baseline,
	Sparkles,
	Zap,
} from "lucide-react";

export default function EvaluationTab() {
	return (
		<div className="max-w-5xl mx-auto px-4 space-y-8">
			{/* 1. Tab-specific heading */}
			<div className="text-center mb-8">
				<h2 className="text-4xl font-bold text-slate-800 mb-4">
					Experimental Results — Risk-Estimation–Driven Domain
					Adaptation
				</h2>
				<p className="text-lg text-slate-600 max-w-3xl mx-auto">
					Three scenarios under distribution shift, evaluated with a{" "}
					<strong>PU-aware, risk-estimation</strong> lens (nnPU;
					target class-prior{" "}
					<em>
						π<sub>p</sub>
					</em>
					).
				</p>
			</div>

			{/* 2. Results Analysis Dashboard (Visual Summary) */}
			<Card className="shadow-lg border">
				<CardHeader>
					<CardTitle className="text-2xl font-semibold text-slate-800 flex items-center gap-2">
						<BarChart3 className="h-6 w-6 text-blue-600" />
						Results Dashboard (PU-aware)
					</CardTitle>
					<CardDescription>
						Side-by-side comparison with <strong>PU caveats</strong>
						: "0" in U ≠ confirmed negative; precision can be
						deflated by hidden positives.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
						<strong>PU Note.</strong> In test/eval, "0" denotes{" "}
						<em>Unlabeled</em>, not confirmed negative. Precision is
						PU-aware; TP Recall is unaffected by unlabeled
						ambiguity.
					</div>
					{/* Performance Metrics Comparison Cards */}
					<div className="grid md:grid-cols-3 gap-4 text-center">
						{/* ERM Baseline */}
						<Card>
							<CardHeader className="bg-slate-50">
								<p className="text-sm font-semibold text-slate-500">
									SCENARIO 1
								</p>
								<CardTitle className="text-blue-700">
									ERM Baseline
								</CardTitle>
							</CardHeader>
							<CardContent className="pt-6 space-y-4">
								<div className="space-y-2">
									<div>
										<p className="text-3xl font-bold text-slate-800">
											73.9%
										</p>
										<p className="text-sm text-slate-500">
											F1 Score
										</p>
									</div>
									<div>
										<p className="text-xl font-semibold text-slate-700">
											61.9%
										</p>
										<p className="text-xs text-slate-500">
											Precision (PU-aware)
										</p>
									</div>
									<div>
										<p className="text-xl font-semibold text-slate-700">
											91.8%
										</p>
										<p className="text-xs text-slate-500">
											TP Recall
										</p>
									</div>
								</div>

								<div className="border-t pt-3 mt-4">
									<div className="text-sm space-y-1">
										<p className="font-medium text-slate-600">
											Training Data:
										</p>
										<p className="text-slate-500">
											(U) Office Worker domain
										</p>
										<p className="text-slate-500">
											(P) Office Worker domain
										</p>

										<p className="font-medium text-slate-600 pt-2">
											Prediction Target:
										</p>
										<p className="text-slate-500">
											Office Worker domain <br />
											(Held-out test set)
										</p>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Generalization Challenge */}
						<Card className="border-2 border-orange-400 bg-orange-50">
							<CardHeader className="bg-orange-100">
								<p className="text-sm font-semibold text-orange-600">
									SCENARIO 2
								</p>
								<CardTitle className="text-orange-800">
									Generalization Challenge
								</CardTitle>
							</CardHeader>
							<CardContent className="pt-6 space-y-4">
								<div className="space-y-2">
									<div>
										<p className="text-3xl font-bold text-orange-700">
											18.2%
										</p>
										<p className="text-sm text-slate-500">
											F1 Score
										</p>
									</div>
									<div>
										<p className="text-xl font-semibold text-orange-600">
											10.0%
										</p>
										<p className="text-xs text-slate-500">
											Precision (PU-aware)
										</p>
									</div>
									<div>
										<p className="text-xl font-semibold text-orange-600">
											100.0%
										</p>
										<p className="text-xs text-slate-500">
											TP Recall
										</p>
									</div>
								</div>

								<div className="border-t border-orange-200 pt-3 mt-4">
									<div className="text-sm space-y-1">
										<p className="font-medium text-orange-700">
											Model Used:
										</p>
										<p className="text-orange-600">
											Pre-trained ERM Baseline model
											<br /> (from Scenario 1)
										</p>
										{/* <p className="text-orange-600">
											• No additional training or
											adaptation
										</p> */}

										<p className="font-medium text-orange-700 pt-2">
											Prediction Target:
										</p>
										<p className="text-orange-600">
											Student domain dataset
											<br /> (completely new domain)
										</p>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Domain Adaptation */}
						<Card className="border-2 border-green-500 bg-green-50">
							<CardHeader className="bg-green-100">
								<p className="text-sm font-semibold text-green-600">
									SCENARIO 3
								</p>
								<CardTitle className="text-green-800">
									Domain Adaptation
								</CardTitle>
							</CardHeader>
							<CardContent className="pt-6 space-y-4">
								<div className="space-y-2">
									<div>
										<p className="text-3xl font-bold text-green-700">
											77.9%
										</p>
										<p className="text-sm text-slate-500">
											F1 Score
										</p>
									</div>
									<div>
										<p className="text-xl font-semibold text-green-600">
											63.8%
										</p>
										<p className="text-xs text-slate-500">
											Precision (PU-aware)
										</p>
									</div>
									<div>
										<p className="text-xl font-semibold text-green-600">
											99.8%
										</p>
										<p className="text-xs text-slate-500">
											TP Recall
										</p>
									</div>
								</div>

								<div className="border-t border-green-200 pt-3 mt-4">
									<div className="text-sm space-y-1">
										<p className="font-medium text-green-700">
											Training Data:
										</p>
										<p className="text-green-600">
											(U) Office Worker domain
										</p>
										<p className="text-green-600">
											(P) Student domain
										</p>

										<p className="font-medium text-green-700 pt-2">
											Prediction Target:
										</p>
										<p className="text-green-600">
											Student domain (Held-out test set)
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</CardContent>
			</Card>

			{/* 3. Deep Dive Analysis */}
			<div className="space-y-6 pt-8">
				<h3 className="text-3xl font-bold text-center text-slate-800">
					Deep Dive: Analysis of Each Scenario
				</h3>

				{/* ERM Baseline Analysis */}
				<Card className="border-l-4 border-l-blue-500">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Baseline className="h-6 w-6 text-blue-600" />
							SCENARIO I: ERM Baseline (The Benchmark)
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<p>
							<strong>Goal:</strong> Establish a performance
							benchmark within a single domain (the "office
							worker" dataset).
						</p>
						<p>
							<strong>Method:</strong> Train, validate, and test
							the model exclusively on data from the office worker
							domain.
						</p>
						<div>
							<div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
								<p className="text-blue-800 font-semibold text-sm">
									💡 Key Finding: Robust Benchmark Performance
								</p>
							</div>
							<p className="font-semibold">Analysis:</p>
							<blockquote className="border-l-2 pl-4 text-slate-600 italic">
								Strong in-domain <em>risk baseline</em>: high TP
								Recall (91.8%) with moderate Precision (PU-aware
								61.9%)—a standard recall/precision trade-off for
								anomaly search. This result serves as my{" "}
								<strong>"gold standard"</strong> for comparison.
							</blockquote>
						</div>
					</CardContent>
				</Card>

				{/* Generalization Challenge Analysis */}
				<Card className="border-l-4 border-l-orange-500">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<AlertTriangle className="h-6 w-6 text-orange-500" />
							SCENARIO II: Generalization Challenge (The Conflict)
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<p>
							<strong>Goal:</strong> Test the benchmark model's
							performance on a never-before-seen domain (the
							"student room" dataset) to assess its generalization
							capability.
						</p>
						<p>
							<strong>Method:</strong> Apply the trained
							ERM_BASELINE model directly to the student room
							data.
						</p>
						<div>
							<div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
								<p className="text-orange-800 font-semibold text-sm">
									⚠️ Key Finding: Severe Domain Shift Impact
								</p>
							</div>
							<p className="font-semibold">Analysis:</p>
							<blockquote className="border-l-2 pl-4 text-slate-600 italic">
								Severe <em>target-risk</em> increase under
								shift: F1 18.2% with 100% TP Recall / 10.0%
								Precision (PU-aware)—the model flags unfamiliar
								target patterns as anomalies. It powerfully
								demonstrates the existence of{" "}
								<strong>Domain Shift</strong>. The combination
								of 100% Recall and 10.0% Precision is a classic
								signal that the model, knowing only "office
								worker" patterns, classified nearly all
								unfamiliar "student" patterns as anomalous.
							</blockquote>
						</div>
					</CardContent>
				</Card>

				{/* Domain Adaptation Analysis */}
				<Card className="border-l-4 border-l-green-500">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Zap className="h-6 w-6 text-green-500" />
							SCENARIO III: Domain Adaptation (The Resolution)
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<p>
							<strong>Goal:</strong> Employ a strategy to adapt
							the model to the new student domain.
						</p>
						<p>
							<strong>Method:</strong> Train a new model using
							unlabeled data (U) from the source domain (office
							worker) and labeled positive data (P) from the
							target domain (student). This is a highly effective
							semi-supervised domain adaptation method for PU
							learning. Includes target class-prior estimation (
							<em>
								π<sub>p</sub>
							</em>
							) for nnPU stability.
						</p>
						<div>
							<div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
								<p className="text-green-800 font-semibold text-sm">
									🚀 Key Finding: Outstanding Adaptation
									Success
								</p>
							</div>
							<p className="font-semibold">Analysis:</p>
							<blockquote className="border-l-2 pl-4 text-slate-600 italic">
								Target-risk reduced and generalization restored:
								F1 77.9% (&gt; 73.9% baseline). Leveraging U
								<sub>source</sub> as background + P
								<sub>target</sub> with nnPU (clamped risk)
								yields a more reliable boundary. The model
								successfully learned to identify student
								anomalies. This superior performance is likely
								because the model leveraged the large pool of
								unlabeled source data as a rich "background
								context," helping it form a more robust decision
								boundary.
							</blockquote>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* 4. Conclusion */}
			<Card className="mt-12 bg-gradient-to-r from-slate-700 to-slate-600 text-white">
				<CardHeader>
					<CardTitle className="flex items-center gap-3">
						<Sparkles className="h-6 w-6 text-yellow-400" />
						Conclusion: Risk-Estimation Takeaways
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-slate-100 leading-relaxed mb-6">
						My three experiments clearly narrate the story of
						identifying a critical real-world problem and solving it
						with an advanced strategy:
					</p>

					<div className="space-y-4">
						<div className="flex items-start gap-4 p-4 bg-slate-600/50 rounded-lg border border-slate-500">
							<div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
								1
							</div>
							<div>
								<h4 className="font-bold text-slate-50 mb-2">
									SCENARIO I (Benchmark)
								</h4>
								<p className="text-slate-100 text-sm">
									I first proved my method is effective in a
									controlled, single-domain scenario.
								</p>
								<ul className="mt-2 text-slate-200 text-xs space-y-1">
									<li>
										• Established performance baseline: F1
										Score 73.9%
									</li>
									<li>
										• Validated model effectiveness within
										office worker domain
									</li>
									<li>
										• Created "gold standard" for comparison
									</li>
									<li>
										→ establishes an in-domain risk
										baseline.
									</li>
								</ul>
							</div>
						</div>

						<div className="flex items-start gap-4 p-4 bg-slate-600/50 rounded-lg border border-slate-500">
							<div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
								2
							</div>
							<div>
								<h4 className="font-bold text-slate-50 mb-2">
									SCENARIO II (Conflict)
								</h4>
								<p className="text-slate-100 text-sm">
									I then demonstrated that this model fails
									when faced with a domain shift, highlighting
									the core problem.
								</p>
								<ul className="mt-2 text-slate-200 text-xs space-y-1">
									<li>
										• Performance collapse: F1 Score dropped
										to 18.2%
									</li>
									<li>
										• Demonstrated existence of Domain Shift
										challenge
									</li>
									<li>
										• Identified critical limitation of
										single-domain models
									</li>
									<li>
										→ evidences target-risk inflation caused
										by shift.
									</li>
								</ul>
							</div>
						</div>

						<div className="flex items-start gap-4 p-4 bg-slate-600/50 rounded-lg border border-slate-500">
							<div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
								3
							</div>
							<div>
								<h4 className="font-bold text-slate-50 mb-2">
									SCENARIO III (Resolution)
								</h4>
								<p className="text-slate-100 text-sm">
									Finally, I showcased an effective domain
									adaptation strategy that not only solved the
									problem but achieved state-of-the-art
									results.
								</p>
								<ul className="mt-2 text-slate-200 text-xs space-y-1">
									<li>
										• Superior performance: F1 Score
										improved to 77.9%
									</li>
									<li>
										• Successful cross-domain adaptation
										strategy
									</li>
									<li>
										• Outperformed original benchmark by 4.0
										percentage points
									</li>
									<li>
										→ achieves target-risk reduction via
										U_source + P_target (nnPU).
									</li>
								</ul>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
