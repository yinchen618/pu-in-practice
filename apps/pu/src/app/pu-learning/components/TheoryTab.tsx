"use client";

import { LaTeX } from "@/app/weak-supervision/challenge/components/LaTeX";
import {} from "@/components/ui/card";

export default function TheoryTab() {
	return (
		<div className="max-w-4xl mx-auto space-y-6">
			<h2 className="text-3xl font-bold text-slate-900 mb-6">
				Theoretical Background
			</h2>

			<div className="p-6 bg-blue-50 rounded-lg">
				<h4 className="font-semibold text-blue-900 mb-2">
					[1] Unbiased PU Learning (ICML 2015)
				</h4>
				<p className="text-sm text-blue-800 mb-3">
					<strong>Authors:</strong> Marthinus Christoffel du Plessis,
					Gang Niu, Masashi Sugiyama
				</p>
				<p className="text-sm text-blue-700 mb-3">
					Introduced the concept of unbiased PU learning by
					reformulating the classification risk to avoid the need for
					class-prior estimation. However, can suffer from overfitting
					when using complex models due to the risk potentially
					becoming negative.
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
					[2] Non-negative PU Learning (NIPS 2017)
				</h4>
				<p className="text-sm text-green-800 mb-3">
					<strong>Authors:</strong> Ryuichi Kiryo, Gang Niu, Marthinus
					Christoffel du Plessis, Masashi Sugiyama
				</p>
				<p className="text-sm text-green-700 mb-3">
					Addressed the overfitting issue in uPU by constraining the
					risk to be non-negative. This prevents the algorithm from
					overfitting to complex models and provides more stable
					training dynamics.
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
		</div>
	);
}
