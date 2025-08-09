"use client";

import { LaTeX } from "@/app/weak-supervision/challenge/components/LaTeX";
import {} from "@/components/ui/card";

export default function TheoryTab() {
	return (
		<div className="max-w-4xl mx-auto space-y-6">
			<h2 className="text-3xl font-bold text-slate-900 mb-2">
				Theoretical Background
			</h2>
			<p className="text-slate-700 mb-6">
				PU learning reformulates binary classification using only
				positive and unlabeled data. This section summarizes two key
				algorithms from Sugiyama Lab: unbiased PU learning (uPU) and
				non-negative PU learning (nnPU).
			</p>

			<div className="p-6 bg-blue-50 rounded-lg">
				<h4 className="font-semibold text-blue-900 mb-2">
					[1] Unbiased PU Learning (ICML 2015)
				</h4>
				<p className="text-sm text-blue-800 mb-3">
					<strong>Authors:</strong> Marthinus Christoffel du Plessis,
					Gang Niu, Masashi Sugiyama
				</p>
				<p className="text-sm text-blue-700 mb-3">
					Reformulates classification risk to avoid needing labeled
					negatives, using class-prior π for risk estimation. Prone to
					overfitting with complex models.
				</p>
				<div className="text-xs">
					<a
						href="https://proceedings.mlr.press/v37/plessis15.html"
						target="_blank"
						rel="noopener noreferrer"
						className="text-blue-600 hover:text-blue-800 underline mr-3"
					>
						📄 ICML 2015 Paper
					</a>
					<a
						href="https://www.ms.k.u-tokyo.ac.jp/sugi/2015/ICML2015.pdf"
						target="_blank"
						rel="noopener noreferrer"
						className="text-blue-600 hover:text-blue-800 underline"
					>
						📎 PDF
					</a>
				</div>
			</div>

			<div className="p-6 bg-green-50 rounded-lg">
				<h4 className="font-semibold text-green-900 mb-2">
					[2] Non-negative PU Learning (NeurIPS 2017)
				</h4>
				<p className="text-sm text-green-800 mb-3">
					<strong>Authors:</strong> Ryuichi Kiryo, Gang Niu, Marthinus
					Christoffel du Plessis, Masashi Sugiyama
				</p>
				<p className="text-sm text-green-700 mb-3">
					Constrains risk to be non-negative, preventing overfitting
					and stabilizing training.
				</p>
				<div className="text-xs">
					<a
						href="https://papers.nips.cc/paper/2017/hash/7cce53cf90577442771720a370c3c723-Abstract.html"
						target="_blank"
						rel="noopener noreferrer"
						className="text-green-600 hover:text-green-800 underline mr-3"
					>
						📄 NIPS 2017 Paper
					</a>
					<a
						href="https://proceedings.neurips.cc/paper/2017/file/7cce53cf90577442771720a370c3c723-Paper.pdf"
						target="_blank"
						rel="noopener noreferrer"
						className="text-green-600 hover:text-green-800 underline"
					>
						📎 PDF
					</a>
				</div>
			</div>

			<div className="p-6 bg-purple-50 rounded-lg">
				<h4 className="font-semibold text-purple-900 mb-2">
					Key Theoretical Insights
				</h4>
				<ul className="text-sm text-purple-700 space-y-1">
					<li>
						• PU learning reformulates binary classification using
						only positive and unlabeled data
					</li>
					<li>
						• The class-prior{" "}
						<span className="font-mono">
							<LaTeX displayMode={false}>{"\\pi_p"}</LaTeX>
						</span>{" "}
						is crucial for unbiased risk estimation
					</li>
					<li>
						• uPU risk:{" "}
						<span className="font-mono">
							<LaTeX displayMode={false}>
								{
									"\\hat{R}_{\\text{pu}}(g) = \\pi_p \\hat{R}_{p}^{+}(g) - \\pi_p \\hat{R}_{p}^{-}(g) + \\hat{R}_{u}^{-}(g)"
								}
							</LaTeX>
						</span>
					</li>
					<li>
						• nnPU risk:{" "}
						<span className="font-mono">
							<LaTeX displayMode={false}>
								{
									"\\tilde{R}_{\\text{pu}}(g) = \\pi_p \\hat{R}_{p}^{+}(g) + \\max\\{0, \\hat{R}_{u}^{-}(g) - \\pi_p \\hat{R}_{p}^{-}(g)\\}"
								}
							</LaTeX>
						</span>
					</li>
					<li>
						• uPU uses <strong>Squared Loss</strong> with linear
						algebraic solution
					</li>
					<li>
						• nnPU uses{" "}
						<strong>
							<LaTeX displayMode={false}>{"l_{\\rm sig}"}</LaTeX>
						</strong>{" "}
						for gradient-based optimization
					</li>
				</ul>
			</div>

			<div className="p-6 bg-slate-50 rounded-lg">
				<h4 className="font-semibold text-slate-900 mb-2">In System</h4>
				<p className="text-sm text-slate-700 mb-3">
					Risk estimators here are implemented exactly in our training
					pipeline. nnPU’s non-negative constraint is applied before
					gradient updates.
				</p>
				<h4 className="font-semibold text-slate-900 mb-2">
					Failure Modes
				</h4>
				<p className="text-sm text-slate-700">
					Prior misestimation, high unlabeled contamination, risk &lt;
					0 in uPU.
				</p>
			</div>
		</div>
	);
}
