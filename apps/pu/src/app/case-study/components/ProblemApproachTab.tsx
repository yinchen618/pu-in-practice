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
	ArrowRight,
	BarChart3,
	CheckCircle,
	Target,
	Zap,
} from "lucide-react";

export default function ProblemApproachTab() {
	return (
		<div className="max-w-5xl mx-auto px-6 space-y-8">
			{/* Page Title */}
			<div className="text-center mb-8">
				<h1 className="text-4xl font-bold text-slate-800 mb-4">
					Problem & Approach
				</h1>
				<p className="text-lg text-slate-600 max-w-3xl mx-auto">
					Identifying the domain shift challenge in anomaly detection
					and presenting a systematic
					<strong>risk estimation–driven</strong> approach to overcome
					it through
					<strong> PU learning</strong> and{" "}
					<strong>domain adaptation</strong>.
				</p>
			</div>

			{/* Problem Statement */}
			<Card className="shadow-lg ">
				<CardHeader>
					<h2 className="text-base font-semibold uppercase text-blue-600 tracking-wider text-center mb-4">
						Problem Definition
					</h2>
					<CardTitle className="text-3xl font-bold text-gray-800 text-center">
						The Industrial Challenge
					</CardTitle>
					<p className="text-lg text-gray-500 pt-2 text-center">
						Brittle anomaly detection models that fail across
						domains
					</p>
				</CardHeader>
				<CardContent>
					<div className="bg-red-50 p-6 rounded-lg border border-red-200">
						<h4 className="font-semibold text-red-800 mb-4 flex items-center gap-2">
							<AlertTriangle className="h-5 w-5" />
							Core Problem: Domain Shift
						</h4>
						<ul className="space-y-3 text-gray-700">
							<li className="flex items-start gap-1">
								<span className="text-red-600 mt-1">•</span>
								<span>
									ERM models perform well in{" "}
									<strong>single, stable environments</strong>
								</span>
							</li>
							<li className="flex items-start gap-1">
								<span className="text-red-600 mt-1">•</span>
								<span>
									Catastrophic failure when deployed to{" "}
									<strong>new environments</strong>
								</span>
							</li>
							<li className="flex items-start gap-1">
								<span className="text-red-600 mt-1">•</span>
								<span>
									Model trained on the office-worker domain{" "}
									<strong>fails to transfer</strong> to the
									student domain
								</span>
							</li>
							<li className="flex items-start gap-1">
								<span className="text-red-600 mt-1">•</span>
								<span>
									Makes traditional models{" "}
									<strong>brittle and unreliable</strong> for
									scale
								</span>
							</li>
						</ul>
					</div>
				</CardContent>
			</Card>

			{/* 2. Results Analysis Dashboard (Visual Summary) */}
			<Card className="shadow-lg border">
				<CardHeader>
					<h2 className="text-base font-semibold uppercase text-blue-600 tracking-wider text-center mb-4">
						Experimental Design
					</h2>
					<CardTitle className="text-2xl font-semibold text-slate-800 flex items-center gap-2">
						<BarChart3 className="h-6 w-6 text-blue-600" />
						Three-Act Hypothesis Testing
					</CardTitle>
					<CardDescription>
						Systematic approach to validate my domain adaptation
						solution
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="rounded-md border border-slate-200 bg-slate-50 p-4">
						<p className="text-sm font-semibold text-slate-700 mb-2">
							Success Criteria
						</p>
						<ul className="text-sm text-slate-600 list-disc ml-5 space-y-1">
							<li>
								Target-domain performance ↑ (e.g.,{" "}
								<strong>AUC-PR</strong>, balanced accuracy)
							</li>
							<li>
								Scenario 3 &gt; Scenario 2 by a statistically
								meaningful margin
							</li>
							<li>
								Expected <strong>target risk</strong> ↓ relative
								to ERM transfer
							</li>
						</ul>
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
							<CardContent className="pt-4 space-y-4">
								<div>
									<p className="font-medium text-blue-700 mb-2 text-center">
										Hypothesis:
									</p>
									<ul className="text-sm text-gray-600 space-y-2 text-left ml-10">
										<li className="flex items-start gap-2">
											<ArrowRight className="h-3 w-3 mt-1 flex-shrink-0" />
											<span>
												ERM works well in-domain
											</span>
										</li>
										<li className="flex items-start gap-2">
											<ArrowRight className="h-3 w-3 mt-1 flex-shrink-0" />
											<span>
												Establishes performance
												benchmark
											</span>
										</li>
									</ul>
								</div>

								<div className="border-t pt-3">
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
							<CardContent className="pt-4 space-y-4">
								<div>
									<p className="font-medium text-orange-700 mb-2 text-center">
										Hypothesis:
									</p>
									<ul className="text-sm text-gray-600 space-y-2 text-left ml-10">
										<li className="flex items-start gap-2">
											<ArrowRight className="h-3 w-3 mt-1 flex-shrink-0" />
											<span>
												Performance collapse on new
												domain
											</span>
										</li>
										<li className="flex items-start gap-2">
											<ArrowRight className="h-3 w-3 mt-1 flex-shrink-0" />
											<span>
												Domain shift causes failure
											</span>
										</li>
									</ul>
								</div>

								<div className="border-t border-orange-200 pt-3">
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
							<CardContent className="pt-4 space-y-4">
								<div>
									<p className="font-medium text-green-700 mb-2 text-center">
										Hypothesis:
									</p>
									<ul className="text-sm text-gray-600 space-y-2 text-left ml-10">
										<li className="flex items-start gap-2">
											<ArrowRight className="h-3 w-3 mt-1 flex-shrink-0" />
											<span>
												PU Learning enables adaptation
											</span>
										</li>
										<li className="flex items-start gap-2">
											<ArrowRight className="h-3 w-3 mt-1 flex-shrink-0" />
											<span>
												U<sub>source</sub> + P
												<sub>target</sub> strategy works
												(with target class-prior{" "}
												<strong>
													π<sub>p</sub>
												</strong>{" "}
												estimation)
											</span>
										</li>
									</ul>
								</div>

								<div className="border-t border-green-200 pt-3">
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

			{/* Core Methodologies */}
			<Card className="shadow-lg bg-gradient-to-r from-slate-50 to-slate-100 border-2 border-slate-200">
				<CardHeader>
					<h2 className="text-base font-semibold uppercase text-blue-600 tracking-wider text-center mb-4">
						My Approach
					</h2>
					<CardTitle className="text-3xl font-bold text-center flex items-center justify-center gap-3 text-slate-800">
						<CheckCircle className="h-8 w-8 text-green-600" />
						Methodological Framework
					</CardTitle>
					<p className="text-lg text-slate-600 pt-2 text-center">
						Two complementary ML paradigms for label scarcity and
						domain shift, under a<strong>risk-estimation</strong>{" "}
						perspective
					</p>
				</CardHeader>
				<CardContent>
					<div className="grid md:grid-cols-2 gap-6">
						{/* PU Learning */}
						<div className="bg-white p-6 rounded-lg border border-green-200 shadow-sm">
							<div className="flex items-center gap-3 mb-4">
								<Target className="h-6 w-6 text-green-600" />
								<h4 className="font-semibold text-green-700 text-lg">
									Positive-Unlabeled Learning
								</h4>
							</div>
							<p className="text-slate-700 mb-4">
								Learning from{" "}
								<strong>limited positive examples</strong> and
								<strong> abundant unlabeled data</strong>
							</p>
							<ul className="space-y-2 text-sm text-slate-600">
								<li className="flex items-start gap-2">
									<span className="text-green-600 mt-1">
										✓
									</span>
									<span>
										Overcomes negative label scarcity
									</span>
								</li>
								<li className="flex items-start gap-2">
									<span className="text-green-600 mt-1">
										✓
									</span>
									<span>
										Non-negative risk minimization (nnPU)
									</span>
								</li>
								<li className="flex items-start gap-2">
									<span className="text-green-600 mt-1">
										✓
									</span>
									<span>
										Robust to label noise and uncertainty
									</span>
								</li>
								<li className="flex items-start gap-2">
									<span className="text-green-600 mt-1">
										✓
									</span>
									<span>
										Requires class-prior{" "}
										<strong>
											π<sub>p</sub>
										</strong>{" "}
										(misestimation impacts risk); nnPU clamp
										prevents negative risk
									</span>
								</li>
							</ul>
						</div>

						{/* Domain Adaptation */}
						<div className="bg-white p-6 rounded-lg border border-blue-200 shadow-sm">
							<div className="flex items-center gap-3 mb-4">
								<Zap className="h-6 w-6 text-blue-600" />
								<h4 className="font-semibold text-blue-700 text-lg">
									Domain Adaptation
								</h4>
							</div>
							<p className="text-slate-700 mb-4">
								Transferring knowledge across different
								environments with{" "}
								<strong>minimal supervision</strong>
							</p>
							<ul className="space-y-2 text-sm text-slate-600">
								<li className="flex items-start gap-2">
									<span className="text-blue-600 mt-1">
										✓
									</span>
									<span>
										Bridges source-target domain gap
									</span>
								</li>
								<li className="flex items-start gap-2">
									<span className="text-blue-600 mt-1">
										✓
									</span>
									<span>
										Handles distribution shift gracefully
									</span>
								</li>
								<li className="flex items-start gap-2">
									<span className="text-blue-600 mt-1">
										✓
									</span>
									<span>Enables scalable deployment</span>
								</li>
								<li className="flex items-start gap-2">
									<span className="text-blue-600 mt-1">
										✓
									</span>
									<span>
										Importance weighting{" "}
										<em>
											w(x)=p<sub>t</sub>(x)/p<sub>s</sub>
											(x)
										</em>{" "}
										via density-ratio estimation
									</span>
								</li>
							</ul>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
