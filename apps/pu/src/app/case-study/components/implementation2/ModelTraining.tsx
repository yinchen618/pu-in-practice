"use client";

import { LaTeX } from "@/components/LaTeX";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Calculator, Network, Target } from "lucide-react";

export default function ModelTrainingRevised() {
	return (
		<Card className="bg-white shadow-lg border">
			<CardHeader>
				<CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-3">
					<Network className="h-7 w-7 text-blue-600" />
					Model Architecture & Training Paradigm
				</CardTitle>
				<CardDescription className="text-md pt-1">
					Detailing the LSTM network structure and the non-negative PU
					(nnPU) learning framework used to train the model under
					label uncertainty.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Section 1: Architecture */}
				<div className="p-4 rounded-lg border bg-slate-50/70">
					<h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2 text-lg">
						LSTM Network Architecture
					</h4>
					<p className="text-sm text-gray-700 mb-3">
						A multi-layer recurrent neural network designed to
						capture temporal dependencies from the feature vectors:
					</p>
					<div className="text-xs text-gray-600 space-y-1 font-mono bg-white p-3 rounded-md border">
						<p>Input (Feature Vectors)</p>
						<p> -&gt; Batch Normalization</p>
						<p>
							{" "}
							-&gt; Multi-layer LSTM (hiddenSize: 64, layers: 1)
						</p>
						<p> -&gt; Dropout (rate: 0.4)</p>
						<p> -&gt; Fully-Connected Classifier (2 layers)</p>
						<p> -&gt; Sigmoid Output (Prediction Score)</p>
					</div>
				</div>

				{/* Section 2: nnPU Loss */}
				<div className="p-4 rounded-lg border bg-slate-50/70">
					<h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2 text-lg">
						<Calculator className="h-5 w-5" />
						The nnPU learning Paradigm
					</h4>
					<p className="text-sm text-gray-700 mb-3">
						The non-negative PU (nnPU) objective estimates
						classification risk without explicit negatives and
						clamps it at 0 to avoid overfitting:
					</p>
					<div className="p-4 bg-white rounded-md border">
						<div className="text-center mb-3">
							<LaTeX displayMode>
								{String.raw`
\tilde{R}_{\text{pu}}(f)
= \pi_p \,\widehat{R}_{p}^{+}(f)
 + \max\!\left\{0,\; \widehat{R}_{u}^{-}(f) - \pi_p \,\widehat{R}_{p}^{-}(f)\right\}.
`}
							</LaTeX>
						</div>
						<p className="text-sm text-slate-600">
							Here, π_p is the class prior;{" "}
							<LaTeX>{"\\widehat{R}_{p}^{+}"}</LaTeX> is the
							positive risk on labeled P;
							<LaTeX>{"\\widehat{R}_{u}^{-}"}</LaTeX> is the
							negative risk estimated on U;{" "}
							<LaTeX>{"\\widehat{R}_{p}^{-}"}</LaTeX> is the
							negative risk on P. I estimate π_p and report
							sensitivity analyses (±Δ around the estimate).
						</p>
					</div>
				</div>

				{/* Section 3: Training Protocol */}
				<div className="p-4 rounded-lg border bg-slate-50/70">
					<h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2 text-lg">
						<Target className="h-5 w-5" />
						Training & Validation Protocol
					</h4>
					<ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
						<li>
							<strong>Optimizer:</strong> Adam with mini-batch
							gradient descent.
						</li>
						<li>
							<strong>Validation Metric:</strong> The{" "}
							<strong>F1-Score</strong> on the validation set is
							monitored at the end of each epoch.
						</li>
						<li>
							<strong>Model Selection:</strong>{" "}
							<strong>Early Stopping</strong> is used to halt
							training if the validation F1-score does not improve
							for 10 consecutive epochs. The model state with the
							highest validation F1-score is saved and used for
							final evaluation.
						</li>
						<li>
							<strong>Prior Sensitivity:</strong> For robustness,
							I sweep π_p within a plausible range and choose
							models whose validation risk is stable under small
							prior perturbations.
						</li>
					</ul>
				</div>
			</CardContent>
		</Card>
	);
}
