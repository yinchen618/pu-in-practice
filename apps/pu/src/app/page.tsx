"use client";

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
	FlaskConical,
	Layers,
	type LucideIcon,
	Microscope,
	Network,
	Settings,
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
			{" "}
			{/* Hero Section */}
			<div className="text-center mb-16" id="top">
				<div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-slate-700 to-slate-800 text-white mb-8">
					<Brain className="h-10 w-10" />
				</div>
				<h1 className="text-4xl md:text-5xl font-bold mb-4 text-slate-800">
					PU Learning in Practice
				</h1>
				<h2 className="text-xl md:text-2xl text-slate-600 mb-6 font-medium">
					From uPU/nnPU Theory to a Real-World Smart Residential
					Testbed
				</h2>
				<p className="text-lg text-slate-600 max-w-5xl mx-auto leading-relaxed mb-8">
					This interactive research prototype bridges state-of-the-art
					Positive-Unlabeled (PU) learning theory—pioneered by
					Professor Masashi Sugiyama’s group—with large-scale,
					real-world data from my 95-unit “Smart Residential Testbed.”
					It demonstrates robust class-prior estimation, non-negative
					risk minimization, and evaluation under imperfect labels and
					label shift. The goal: to validate theoretical insights from
					uPU/nnPU in a truly uncontrolled, non-stationary
					environment.
				</p>
				<div className="flex flex-wrap justify-center gap-4 text-sm text-slate-500 mb-12">
					<div className="flex items-center gap-2">
						<FlaskConical className="h-4 w-4" />
						<span>Theoretical</span>
					</div>
					<div className="flex items-center gap-2">
						<Network className="h-4 w-4" />
						<span>Data</span>
					</div>
					<div className="flex items-center gap-2">
						<Target className="h-4 w-4" />
						<span>Application</span>
					</div>
				</div>
			</div>{" "}
			{/* Core Navigation Area - Three Core Demonstration Sections */}
			<div className="mb-16">
				<h2 className="text-3xl font-bold text-center mb-4 text-slate-800">
					Research Demonstration Path – From Theory to Deployment
				</h2>
				<p className="text-lg text-slate-600 text-center mb-12 max-w-3xl mx-auto">
					A complete journey: replicate PU theory in a sandbox, apply
					it to real-world smart home data, and evaluate its practical
					impact.
				</p>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					{/* Card 1: PU Learning Theory */}
					<Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-slate-200 hover:border-slate-300">
						<CardHeader className="text-center pb-4">
							<div className="w-16 h-16 bg-slate-600 rounded-full flex items-center justify-center mx-auto mb-4">
								<FlaskConical className="h-8 w-8 text-white" />
							</div>
							<CardTitle className="text-xl text-slate-800 group-hover:text-slate-700 transition-colors">
								① Synthetic Sandbox
							</CardTitle>
						</CardHeader>
						<CardContent className="text-center">
							<CardDescription className="text-base mb-6 leading-relaxed text-slate-600">
								Replicate uPU and nnPU algorithms under
								controlled synthetic data. Experiment with
								class-prior settings, regularization, and model
								complexity. Observe overfitting and prior
								estimation instability in a safe environment.
							</CardDescription>
							<div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-6">
								<p className="text-sm text-slate-700 font-medium">
									🎯 Theoretical Depth: Deep Understanding of
									Frontier Algorithms
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

					{/* Card 2: Smart Residential Testbed */}
					<Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-slate-200 hover:border-slate-300">
						<CardHeader className="text-center pb-4">
							<div className="w-16 h-16 bg-slate-600 rounded-full flex items-center justify-center mx-auto mb-4">
								<Network className="h-8 w-8 text-white" />
							</div>
							<CardTitle className="text-xl text-slate-800 group-hover:text-slate-700 transition-colors">
								② Testbed & Labeling
							</CardTitle>
						</CardHeader>
						<CardContent className="text-center">
							<CardDescription className="text-base mb-6 leading-relaxed text-slate-600">
								Leverage the real-time data stream from over 90
								monitored residential units. Apply a two-stage
								funnel to generate candidate anomalies, then
								confirm them via expert review.
							</CardDescription>
							<div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-6">
								<p className="text-sm text-slate-700 font-medium">
									🏠 Real Data: 90+ Residential Units Live
									Monitoring
								</p>
							</div>
							<Button
								size="lg"
								className="w-full bg-slate-700 hover:bg-slate-800 text-white"
								asChild
							>
								<Link href="/testbed">
									Explore Case Study – Stage 1 & 2
									<Activity className="ml-2 h-4 w-4" />
								</Link>
							</Button>
						</CardContent>
					</Card>

					{/* Card 3: Application Case Study */}
					<Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-slate-200 hover:border-slate-300">
						<CardHeader className="text-center pb-4">
							<div className="w-16 h-16 bg-slate-600 rounded-full flex items-center justify-center mx-auto mb-4">
								<Target className="h-8 w-8 text-white" />
							</div>
							<CardTitle className="text-xl text-slate-800 group-hover:text-slate-700 transition-colors">
								③ PU Training & Backtest
							</CardTitle>
						</CardHeader>
						<CardContent className="text-center">
							<CardDescription className="text-base mb-6 leading-relaxed text-slate-600">
								Train PU models on labeled anomalies, predict on
								unseen time ranges, and compare against a
								rule-based baseline under rolling backtests.
							</CardDescription>
							<div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-6">
								<p className="text-sm text-slate-700 font-medium">
									⚡ Practical Application: Perfect
									Integration of Theory and Reality
								</p>
							</div>
							<Button
								size="lg"
								className="w-full bg-slate-700 hover:bg-slate-800 text-white"
								asChild
							>
								<Link href="/case-study">
									Explore Case Study – Stage 3
									<TrendingUp className="ml-2 h-4 w-4" />
								</Link>
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>
			{/* Academic Background & Technical Foundation */}
			<div className="mb-16 bg-slate-50 border border-slate-200 rounded-xl p-8">
				<h2 className="text-2xl font-bold mb-6 text-center text-slate-800">
					Research Background & Technical Foundation
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
					<div>
						<h3 className="text-lg font-semibold mb-3 flex items-center text-slate-800">
							<FlaskConical className="h-5 w-5 mr-2 text-slate-600" />
							Theoretical Foundation
						</h3>
						<p className="text-slate-600 leading-relaxed">
							Based on Professor Masashi Sugiyama's pioneering
							research in PU Learning, this project explores how
							to construct effective classifiers when only
							positive samples and unlabeled samples are
							available. This challenge is extremely common in the
							real world, yet there are few complete interactive
							demonstrations.
						</p>
					</div>
					<div>
						<h3 className="text-lg font-semibold mb-3 flex items-center text-slate-800">
							<Network className="h-5 w-5 mr-2 text-slate-600" />
							Technical Implementation
						</h3>
						<p className="text-slate-600 leading-relaxed">
							This platform is built with PyTorch + FastAPI
							backend and Next.js + TypeScript frontend,
							integrating a real IoT data collection system to
							demonstrate complete capabilities from theoretical
							research to engineering implementation.
						</p>
					</div>
				</div>
			</div>
			{/* Research Impact & Innovation */}
			<div className="mb-16">
				<h2 className="text-3xl font-bold text-center mb-8 text-slate-800">
					Research Impact & Innovation
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
					<div className="text-center p-6 bg-white border border-slate-200 rounded-lg">
						<div className="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center mx-auto mb-4">
							<FlaskConical className="h-6 w-6 text-white" />
						</div>
						<h3 className="font-semibold mb-2 text-slate-800">
							Robust Prior Estimation
						</h3>
						<p className="text-sm text-slate-600">
							Compare mean vs median vs advanced estimators to
							stabilize learning in noisy, shifting environments.
						</p>
					</div>
					<div className="text-center p-6 bg-white border border-slate-200 rounded-lg">
						<div className="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center mx-auto mb-4">
							<Network className="h-6 w-6 text-white" />
						</div>
						<h3 className="font-semibold mb-2 text-slate-800">
							Non-Negative Risk in the Wild
						</h3>
						<p className="text-sm text-slate-600">
							Apply nnPU to prevent overfitting and maintain
							stable risk minimization in non-stationary real
							data.
						</p>
					</div>
					<div className="text-center p-6 bg-white border border-slate-200 rounded-lg">
						<div className="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center mx-auto mb-4">
							<Target className="h-6 w-6 text-white" />
						</div>
						<h3 className="font-semibold mb-2 text-slate-800">
							Leakage-Safe Pipeline
						</h3>
						<p className="text-sm text-slate-600">
							Enforce strict temporal splits and feature
							versioning to ensure valid evaluation without data
							leakage.
						</p>
					</div>
					<div className="text-center p-6 bg-white border border-slate-200 rounded-lg">
						<div className="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center mx-auto mb-4">
							<Layers className="h-6 w-6 text-white" />
						</div>
						<h3 className="font-semibold mb-2 text-slate-800">
							Open & Reproducible
						</h3>
						<p className="text-sm text-slate-600">
							All code and configs are open for inspection and
							reproduction of key experiments.
						</p>
					</div>
				</div>
			</div>
			{/* Reviewer Fast Path */}
			<div className="mb-16">
				<h2 className="text-2xl font-bold text-center mb-4 text-slate-800">
					Reviewer Fast Path – 3 Steps to See Everything
				</h2>
				<ol className="list-decimal max-w-3xl mx-auto text-slate-700 space-y-2 pl-5">
					<li>
						<strong>Open Demo</strong> – change class prior and see
						risk curve shifts
					</li>
					<li>
						<strong>Open Case Study Stage 2</strong> – inspect two
						confirmed anomalies
					</li>
					<li>
						<strong>Open Case Study Stage 3</strong> – compare nnPU
						vs rule-based backtest results
					</li>
				</ol>
			</div>
			{/* Footer Information */}
			<div className="mt-16 border-t border-slate-200 pt-8">
				<div className="text-center">
					<h3 className="text-lg font-semibold mb-3 text-slate-800">
						About the Author
					</h3>
					<p className="text-slate-600 mb-4">
						An interactive research prototype by{" "}
						<strong>Yin-Chen Chen</strong> — Lecturer, Software
						Engineer, and Smart Space Platform Developer — developed
						in support of a PhD application to{" "}
						<strong>
							Professor Masashi Sugiyama's lab (University of
							Tokyo)
						</strong>
						.
					</p>

					{/* Call to Action Button */}
					<div className="mb-6">
						<Button
							size="lg"
							variant="outline"
							className="border-slate-300 text-slate-700 hover:bg-slate-50"
							asChild
						>
							<Link href="mailto:yinchen.chen@example.com?subject=PhD Application Inquiry">
								📬 Contact / CV / Application Summary
							</Link>
						</Button>
					</div>

					<div className="flex flex-wrap justify-center gap-4 text-sm text-slate-500">
						<div className="flex items-center gap-2">
							<Settings className="h-4 w-4" />
							<span>Powered by PyTorch + FastAPI</span>
						</div>
						<div className="flex items-center gap-2">
							<Layers className="h-4 w-4" />
							<span>Next.js + TypeScript</span>
						</div>
						<div className="flex items-center gap-2">
							<Network className="h-4 w-4" />
							<span>IoT Data Collection System</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
