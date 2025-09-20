"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Blocks, Bot, Database, HardDrive, Server } from "lucide-react";

const CodeBlock = ({ children }: { children: React.ReactNode }) => (
	<pre className="bg-gray-800 text-white p-3 rounded-md overflow-x-auto text-xs font-mono">
		<code>{children}</code>
	</pre>
);

export default function TechStackRevised() {
	return (
		<Card className="bg-white shadow-lg border">
			<CardHeader>
				<CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-3">
					<Blocks className="h-7 w-7 text-blue-600" />
					System Architecture & Experimental Setup
				</CardTitle>
				<CardDescription className="text-md pt-1">
					An overview of the full-stack application, service design,
					and the specific environment used for reproducible model
					training and evaluation.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Section 1: Architecture */}
				<div>
					<h4 className="text-lg font-semibold text-gray-700 mb-3">
						Full-Stack Application Architecture
					</h4>
					<div className="grid md:grid-cols-2 gap-4">
						<div className="p-3 rounded-lg border bg-slate-50/70">
							<h5 className="font-semibold text-slate-800 mb-2 flex items-center gap-2 text-sm">
								<Server className="h-4 w-4" />
								Frontend Stack
							</h5>
							<ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
								<li>
									<strong>Framework:</strong> Next.js 14 +
									TypeScript
								</li>
								<li>
									<strong>UI:</strong> Shadcn/UI + Tailwind
									CSS
								</li>
								<li>
									<strong>State:</strong> React Query
									(TanStack)
								</li>
								<li>
									<strong>Real-time:</strong> WebSocket
								</li>
							</ul>
						</div>

						<div className="p-3 rounded-lg border bg-slate-50/70">
							<h5 className="font-semibold text-slate-800 mb-2 flex items-center gap-2 text-sm">
								<Database className="h-4 w-4" />
								Backend Stack
							</h5>
							<ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
								<li>
									<strong>API:</strong> FastAPI + Python 3.10
								</li>
								<li>
									<strong>ML:</strong> PyTorch + Scikit-learn
								</li>
								<li>
									<strong>Data:</strong> Pandas + SQLAlchemy
								</li>
								<li>
									<strong>Async:</strong> WebSocket
								</li>
							</ul>
						</div>
					</div>
				</div>

				{/* Section 2: Core Services */}
				<div>
					<h4 className="text-lg font-semibold text-gray-700 mb-3">
						Core Backend Service Design
					</h4>
					<div className="p-3 rounded-lg border bg-slate-50/70">
						<CodeBlock>{`class ModelTrainer:
    # Handles LSTM+nnPU model training with WebSocket progress updates
    async def train_model(self, config) -> TrainedModel

class ModelEvaluator:
    # Conducts multi-scenario evaluation (ERM, Generalization, Adaptation)
    async def evaluate_model(self, model_id, scenario) -> EvaluationResult

class PriorEstimator:
    # Estimates class prior (π_p) with held-out anchors / EM-style mixture modeling
    # Exposes sensitivity sweep for robustness analysis
    def estimate(self, dataset) -> float`}</CodeBlock>
					</div>
				</div>

				{/* Section: Ablations & Robustness */}
				<div>
					<h4 className="text-lg font-semibold text-gray-700 mb-3">
						Ablations & Robustness
					</h4>
					<p className="text-sm text-gray-600 mb-3">
						(i) prior sweep (±Δ), (ii) label-noise stress
						(instance-dependent corruption), (iii)
						complementary-label drop-in variant.
					</p>
				</div>

				{/* Section 3: Environment */}
				<div>
					<h4 className="text-lg font-semibold text-gray-700 mb-3">
						ML Experimental Environment
					</h4>
					<div className="grid md:grid-cols-2 gap-4">
						<div className="p-3 rounded-lg border bg-slate-50/70">
							<h5 className="font-semibold text-slate-800 mb-2 flex items-center gap-2 text-sm">
								<HardDrive className="h-4 w-4" />
								Hardware Specifications
							</h5>
							<ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
								<li>
									<strong>CPU:</strong> Intel Core i9-13900K
								</li>
								<li>
									<strong>GPU:</strong> NVIDIA RTX 4090 (24GB)
								</li>
								<li>
									<strong>RAM:</strong> 64 GB DDR5
								</li>
							</ul>
						</div>
						<div className="p-3 rounded-lg border bg-slate-50/70">
							<h5 className="font-semibold text-slate-800 mb-2 flex items-center gap-2 text-sm">
								<Bot className="h-4 w-4" />
								Key Software Libraries
							</h5>
							<ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
								<li>
									<strong>OS:</strong> Ubuntu 22.04 LTS
								</li>
								<li>
									<strong>Python:</strong> 3.10
								</li>
								<li>
									<strong>PyTorch:</strong> 2.1.0 (CUDA 12.1)
								</li>
							</ul>
						</div>
					</div>
				</div>
			</CardContent>
			<CardFooter>
				<div className="w-full text-center text-xs text-gray-500 p-2 bg-slate-50 rounded-lg border">
					<strong>Performance Benchmark:</strong> A full training
					cycle on this system completes in approximately 45 minutes.
				</div>
			</CardFooter>
		</Card>
	);
}
