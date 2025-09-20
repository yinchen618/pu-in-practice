"use client";

import { LaTeX } from "@/components/LaTeX";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Activity,
	Brain,
	Cpu,
	FileText,
	FlaskConical,
	Layers,
	type LucideIcon,
	Microscope,
	Network,
	Rocket,
	Target,
	TrendingUp,
} from "lucide-react";
import Link from "next/link";

interface FeatureCardData {
	icon: LucideIcon;
	title: string;
	description: string;
	href: string;
	difficulty: string;
	tags: string[];
	color: string;
	academicValue: string;
	isHighlight?: boolean;
	isNew?: boolean;
}

export default function HomePage() {
	return (
		<div className="container mx-auto px-4 py-12">
			{/* --- Hero Section (MODIFIED) --- */}
			<div className="text-center mb-16" id="top">
				<div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-slate-700 to-slate-800 text-white mb-8">
					<Brain className="h-10 w-10" />
				</div>
				<h1 className="text-4xl md:text-5xl font-bold mb-4 text-slate-800">
					Risk Estimation in Practice
				</h1>
				<h2 className="text-xl md:text-2xl text-slate-600 mb-6 font-medium">
					From Unbiased Theory to Real-World Deployment: An AI-Powered
					Testbed
				</h2>
				<p className="text-lg text-slate-600 max-w-5xl mx-auto leading-relaxed mb-8">
					In this project, I demonstrate the practical application of{" "}
					<strong>Prof. Takashi Ishida&rsquo;s</strong> framework for{" "}
					<strong>unbiased risk estimation</strong> on a 95-unit smart
					residential testbed. By estimating and controlling risk, the
					system diagnoses and corrects <strong>domain shift</strong>,
					enabling reliable deployment in complex, non-stationary
					environments.
				</p>

				{/* --- Highlighted Models Section (NEW) --- */}
				<div className="max-w-4xl mx-auto mb-8">
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
						{/* Main Highlight: LSTM + PU learning */}
						<div className="lg:col-span-2 bg-white border-2 border-slate-700 rounded-lg p-8 text-left shadow-lg">
							<div className="flex items-start">
								<div className="bg-slate-700 text-white rounded-full h-12 w-12 flex-shrink-0 flex items-center justify-center mr-4 mt-2">
									<Cpu className="h-6 w-6" />
								</div>
								<div>
									<h3 className="text-xl font-bold text-slate-800 mb-2 mt-2">
										Core Implementation: Risk Estimation +
										PU learning
									</h3>
									{/* 技術標籤 */}
									<div className="flex flex-wrap gap-2 mt-3 mb-4">
										<span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700 border border-slate-200">
											LSTM
										</span>
										<span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700 border border-slate-200">
											nnPU
										</span>
										<span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700 border border-slate-200">
											Unlabeled-only
										</span>
										<span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700 border border-slate-200">
											Domain Shift
										</span>
										<span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700 border border-slate-200">
											Risk Estimation
										</span>
									</div>
									<p className="text-slate-600 mb-5 mt-6">
										Combining <strong>LSTM</strong> with{" "}
										<strong>PU learning</strong>, I used
										<strong>
											{" "}
											unlabeled data to estimate
											deployment risk
										</strong>
										, not just to classify. This{" "}
										<strong>risk-aware</strong> approach
										enabled robust anomaly detection under
										domain shift.
									</p>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
										<div className="bg-slate-100 border border-slate-200 rounded-lg p-3">
											<div className="font-bold text-slate-800">
												F1-score 73.9%
											</div>
											<div className="text-slate-600">
												ERM Baseline
											</div>
										</div>
										<div className="bg-slate-100 border border-slate-200 rounded-lg p-3">
											<div className="font-bold text-slate-800">
												F1-score 77.9%
											</div>
											<div className="text-slate-600">
												Risk-Aware Adaptation
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
						{/* Future Directions */}
						<div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-left">
							<h3 className="text-lg font-semibold text-slate-800 mb-3">
								Future Research Directions
							</h3>
							<div className="space-y-3">
								<div className="bg-white p-3 rounded-md border border-slate-200">
									<p className="font-semibold text-slate-700">
										Extend to Complementary Labels
									</p>
									<p className="text-xs text-slate-500">
										Unbiased risk with restricted feedback
									</p>
								</div>
								<div className="bg-white p-3 rounded-md border border-slate-200">
									<p className="font-semibold text-slate-700">
										Handle Noisy Labels
									</p>
									<p className="text-xs text-slate-500">
										Noise-robust unbiased estimators
									</p>
								</div>
								<div className="bg-white p-3 rounded-md border border-slate-200">
									<p className="font-semibold text-slate-700">
										Build Online Risk Monitoring &
										Adaptation
									</p>
									<p className="text-xs text-slate-500">
										Real-time estimation for adaptive
										deployment
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>

				<p className="text-lg text-slate-600 max-w-5xl mx-auto leading-relaxed mb-12">
					This interactive platform bridges theory and real-world
					practice, offering transparent inspection and concrete
					evidence for <strong>risk-aware weak supervision</strong>.
				</p>
			</div>

			{/* --- Core Navigation Area (MODIFIED) --- */}
			<div className="mb-16">
				<h2 className="text-3xl font-bold text-center mb-4 text-slate-800">
					Research Path: From Theory to Deployment
				</h2>
				<div className="text-lg text-slate-600 text-center mb-12 max-w-3xl mx-auto">
					<p className="mb-2">A three-stage journey:</p>
					<ul className="list-none space-y-1">
						<li>
							• Master the principles of unbiased risk estimation
						</li>
						<li>• Understand the real-world environment</li>
						<li>• Implement a risk-aware PU learning model</li>
					</ul>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					{/* Card 1: PU learning Theory (MODIFIED) */}
					<Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-slate-200 hover:border-slate-300">
						<CardHeader className="text-center pb-4">
							<div className="w-16 h-16 bg-slate-600 rounded-full flex items-center justify-center mx-auto mb-4">
								<FlaskConical className="h-8 w-8 text-white" />
							</div>
							<CardTitle className="text-xl text-slate-800 group-hover:text-slate-700 transition-colors">
								① Synthetic Sandbox: Theory Validation (uPU /
								nnPU)
							</CardTitle>
						</CardHeader>
						<CardContent className="text-center">
							<CardDescription className="text-base mb-6 leading-relaxed text-slate-600">
								<p className="mb-3">
									Replicating unbiased risk estimation under
									controlled conditions:
								</p>
								<ul className="text-sm list-none space-y-1 text-left">
									<li>
										• Compare estimated risk{" "}
										<LaTeX displayMode={false}>
											{"\\hat{R}"}
										</LaTeX>{" "}
										vs. true risk{" "}
										<LaTeX displayMode={false}>{"R"}</LaTeX>
									</li>
									<li>
										• Quantify{" "}
										<LaTeX displayMode={false}>
											{"\\mathrm{corr}(\\hat{R}, R)"}
										</LaTeX>{" "}
										(correspondence)
									</li>
									<li>
										• Validate theoretical guarantees (uPU
										vs. nnPU)
									</li>
									<li>• Controlled environment evaluation</li>
								</ul>
							</CardDescription>
							<div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-6">
								<p className="text-sm text-slate-700 font-medium">
									🎯 Goal: Show that{" "}
									<strong>
										risk estimation works without target
										labels
									</strong>
									.
								</p>
							</div>
							<Button
								size="lg"
								className="w-full bg-slate-700 hover:bg-slate-800 text-white"
								asChild
							>
								<Link href="/pu-learning">
									Open Interactive Demo
									<Microscope className="ml-2 h-4 w-4" />
								</Link>
							</Button>
						</CardContent>
					</Card>

					{/* Card 2: Smart Residential Testbed (MODIFIED) */}
					<Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-slate-200 hover:border-slate-300">
						<CardHeader className="text-center pb-4">
							<div className="w-16 h-16 bg-slate-600 rounded-full flex items-center justify-center mx-auto mb-4">
								<Network className="h-8 w-8 text-white" />
							</div>
							<CardTitle className="text-xl text-slate-800 group-hover:text-slate-700 transition-colors">
								② Real-World Testbed & Data
							</CardTitle>
						</CardHeader>
						<CardContent className="text-center">
							<CardDescription className="text-base mb-6 leading-relaxed text-slate-600">
								<p className="mb-3">
									95-unit smart residential testbed:
								</p>
								<ul className="text-sm list-none space-y-1 text-left">
									<li>
										• Non-stationary, domain-shifted
										environments
									</li>
									<li>
										• Diverse users: students & office
										workers
									</li>
									<li>• Live data streams monitoring</li>
									<li>
										• Realistic data quality and collection
										issues
									</li>
								</ul>
							</CardDescription>
							<div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-6">
								<p className="text-sm text-slate-700 font-medium">
									🏠 Environment: 95 diverse residential units
									with live monitoring.
								</p>
							</div>
							<Button
								size="lg"
								className="w-full bg-slate-700 hover:bg-slate-800 text-white"
								asChild
							>
								<Link href="/testbed">
									Explore the Environment
									<Activity className="ml-2 h-4 w-4" />
								</Link>
							</Button>
						</CardContent>
					</Card>

					{/* Card 3: Application Case Study (MODIFIED) */}
					<Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-slate-200 hover:border-slate-300">
						<CardHeader className="text-center pb-4">
							<div className="w-16 h-16 bg-slate-600 rounded-full flex items-center justify-center mx-auto mb-4">
								<Target className="h-8 w-8 text-white" />
							</div>
							<CardTitle className="text-xl text-slate-800 group-hover:text-slate-700 transition-colors">
								③ Risk-Aware Training & Evaluation (LSTM + PU)
							</CardTitle>
						</CardHeader>
						<CardContent className="text-center">
							<CardDescription className="text-base mb-6 leading-relaxed text-slate-600">
								<p className="mb-3">
									Implement PU-based unbiased risk estimation
									for adaptation:
								</p>
								<ul className="text-sm list-none space-y-1 text-left">
									<li>
										• Process real-world sequential data
									</li>
									<li>
										• Train LSTM + PU with risk-aware
										correction
									</li>
									<li>
										• Evaluate against ERM & standard domain
										adaptation
									</li>
									<li>
										• Validate effectiveness with rigorous
										testing
									</li>
								</ul>
							</CardDescription>
							<div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-6">
								<p className="text-sm text-slate-700 font-medium">
									⚡ Result: <strong>F1-score 77.9%</strong>,
									recovered from failure under domain shift.
								</p>
							</div>
							<Button
								size="lg"
								className="w-full bg-slate-700 hover:bg-slate-800 text-white"
								asChild
							>
								<Link href="/case-study">
									View Training Results
									<TrendingUp className="ml-2 h-4 w-4" />
								</Link>
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>

			{/* --- Research Impact & Innovation (MODIFIED) --- */}
			<div className="mb-16">
				<h2 className="text-3xl font-bold text-center mb-8 text-slate-800">
					Key Research Contributions
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
					<div className="text-center p-6 bg-white border border-slate-200 rounded-lg">
						<div className="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center mx-auto mb-4">
							<FlaskConical className="h-6 w-6 text-white" />
						</div>
						<h3 className="font-semibold mb-2 text-slate-800">
							From Theory to Risk Estimation
						</h3>
						<ul className="text-sm text-slate-600 list-none space-y-1 text-left">
							<li>
								• Bridged Ishida&rsquo;s framework to
								deployments
							</li>
							<li>
								• Applied risk estimation to domain-shift
								failures
							</li>
							<li>• Demonstrated practical effectiveness</li>
						</ul>
					</div>
					<div className="text-center p-6 bg-white border border-slate-200 rounded-lg">
						<div className="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center mx-auto mb-4">
							<Network className="h-6 w-6 text-white" />
						</div>
						<h3 className="font-semibold mb-2 text-slate-800">
							Unbiased Risk in the Wild
						</h3>
						<ul className="text-sm text-slate-600 list-none space-y-1 text-left">
							<li>
								• Implemented unbiased estimators with PU data
							</li>
							<li>
								•{" "}
								<strong>
									Prevented silent deployment failures
								</strong>
							</li>
							<li>
								• Quantified{" "}
								<LaTeX displayMode={false}>
									{"\\mathrm{corr}(\\hat{R}, R)"}
								</LaTeX>{" "}
								correspondence
							</li>
						</ul>
					</div>
					<div className="text-center p-6 bg-white border border-slate-200 rounded-lg">
						<div className="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center mx-auto mb-4">
							<Rocket className="h-6 w-6 text-white" />
						</div>
						<h3 className="font-semibold mb-2 text-slate-800">
							Deep Learning Integration
						</h3>
						<ul className="text-sm text-slate-600 list-none space-y-1 text-left">
							<li>
								• Integrated <strong>LSTM</strong> with PU-based
								risk estimation
							</li>
							<li>• Handled sequential, non-stationary data</li>
							<li>• Adapted without target-domain labels</li>
						</ul>
					</div>
					<div className="text-center p-6 bg-white border border-slate-200 rounded-lg">
						<div className="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center mx-auto mb-4">
							<Layers className="h-6 w-6 text-white" />
						</div>
						<h3 className="font-semibold mb-2 text-slate-800">
							Open & Transparent
						</h3>
						<ul className="text-sm text-slate-600 list-none space-y-1 text-left">
							<li>• Interactive risk inspection</li>
							<li>• Reproducible key results</li>
							<li>• Clear trace from theory to practice</li>
						</ul>
					</div>
				</div>
			</div>

			{/* --- Footer Information (MODIFIED) --- */}
			<div className="mt-16 border-t border-slate-200 pt-8">
				<div className="text-center">
					<h3 className="text-lg font-semibold mb-3 text-slate-800">
						About This Project
					</h3>
					<p className="text-slate-600 mb-4 max-w-4xl mx-auto">
						This interactive research prototype was developed by{" "}
						<strong>Yin-Chen Chen</strong> to demonstrate
						capabilities in{" "}
						<strong>risk estimation and weak supervision</strong>.
						The methodology aligns with the research focus of{" "}
						<strong>
							Prof. Takashi Ishida&rsquo;s lab at the University
							of Tokyo
						</strong>
						, bridging unbiased theory with real-world deployment
						challenges.
					</p>

					<div className="mb-6">
						<Button
							size="lg"
							variant="outline"
							className="border-slate-300 text-slate-700 hover:bg-slate-50"
							asChild
						>
							<Link href="/about">
								<FileText className="h-4 w-4 mr-2" />
								View My Application Statement
							</Link>
						</Button>
					</div>

					<div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
						<div className="flex items-center gap-2">
							<span>Backend: PyTorch + FastAPI</span>
						</div>
						<div className="flex items-center gap-2">
							<span>Frontend: Next.js + TypeScript</span>
						</div>
						<div className="flex items-center gap-2">
							<span>Data Source: Live IoT System</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
