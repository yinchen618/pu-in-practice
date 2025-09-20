"use client";

import { LaTeX } from "@/components/LaTeX";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileCode2, ListOrdered, Network, Target } from "lucide-react";

export default function AlgorithmFormalism() {
	return (
		<section id="algorithm-formalism" className="scroll-mt-6">
			<Card className="bg-white shadow-lg">
				<CardHeader>
					<h2 className="text-base font-semibold uppercase text-blue-600 tracking-wider mb-4">
						Algorithm Formalism
					</h2>
					<CardTitle className="text-3xl font-bold text-gray-800">
						Algorithm & Mathematical Formalism
					</CardTitle>
					<p className="text-gray-500 text-sm mb-2">
						All preprocessing respects chronology (split-first,
						process-later) to avoid time leakage.
					</p>
					<p className="text-lg text-gray-500 pt-2">
						A formal definition of the end-to-end methodology, from
						feature extraction to the nnPU learning objective.
					</p>
				</CardHeader>
				<CardContent className="space-y-8">
					{/* Section 1: Notations */}
					<div>
						<h4 className="text-xl font-semibold text-gray-700 flex items-center gap-3 mb-4 border-b pb-2">
							<ListOrdered className="h-5 w-5" />
							1. Notations & Problem Setup
						</h4>
						<div className="text-base text-gray-600 space-y-3">
							<p>
								Let{" "}
								<LaTeX>
									{
										"\\mathcal{D}_{raw} = \\{(\\mathbf{x}_t, \\tau_t)\\}_{t=1}^T"
									}
								</LaTeX>{" "}
								be the raw time-series dataset, where{" "}
								<LaTeX>
									{"\\mathbf{x}_t \\in \\mathbb{R}^d"}
								</LaTeX>{" "}
								is the d-dimensional feature vector at timestamp{" "}
								<LaTeX>{"\\tau_t"}</LaTeX>.
							</p>
							<p>
								The dataset consists of two subsets: a labeled
								positive set{" "}
								<LaTeX>
									{
										"\\mathcal{P} = \\{(\\mathbf{x}_i, y_i) | y_i = +1\\}"
									}
								</LaTeX>
								and an unlabeled set{" "}
								<LaTeX>{"\\mathcal{U}"}</LaTeX>. My objective is
								to learn a classifier <LaTeX>{"f"}</LaTeX>
								using only <LaTeX>{"\\mathcal{P}"}</LaTeX> and{" "}
								<LaTeX>{"\\mathcal{U}"}</LaTeX>.
							</p>
							<p>
								We evaluate with PU-aware metrics: TP Recall and
								Precision (PU-aware), acknowledging that "0" in
								U ≠ confirmed negative.
							</p>
						</div>
					</div>

					{/* Section 2: Model Architecture */}
					<div>
						<h4 className="text-xl font-semibold text-gray-700 flex items-center gap-3 mb-4 border-b pb-2">
							<Network className="h-5 w-5" />
							2. Model Architecture:{" "}
							<LaTeX>
								{"f_{\\theta} = g_{\\theta} \\circ \\Phi"}
							</LaTeX>
						</h4>
						<div className="space-y-4">
							<div>
								<h5 className="text-lg font-semibold text-gray-600 mb-2">
									A. Temporal Feature Extraction (
									<LaTeX>{"\\Phi"}</LaTeX>)
								</h5>
								<p className="text-gray-600 mb-3">
									Given a sliding window of size{" "}
									<LaTeX>{"W"}</LaTeX>, the feature extractor{" "}
									<LaTeX>{"\\Phi"}</LaTeX> maps a sequence of
									raw features to an enhanced feature vector{" "}
									<LaTeX>
										{"\\mathbf{z}_t \\in \\mathbb{R}^D"}
									</LaTeX>{" "}
									(D ≫ d).
								</p>
								<div className="my-3 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
									<LaTeX
										displayMode={true}
									>{`\\mathbf{z}_t = \\Phi(\\mathbf{x}_{t-W+1}, \\dots, \\mathbf{x}_t) = 
                    \\begin{bmatrix}
                      \\mathbf{x}_t \\\\
                      \\text{mean}(\\{\\mathbf{x}_i\\}_{i=t-W+1}^t) \\\\
                      \\text{std}(\\{\\mathbf{x}_i\\}_{i=t-W+1}^t) \\\\
                      \\vdots
                    \\end{bmatrix}`}</LaTeX>
								</div>
							</div>
							<div>
								<h5 className="text-lg font-semibold text-gray-600 mb-2">
									B. LSTM-based Classifier (
									<LaTeX>{"g_{\\theta}"}</LaTeX>)
								</h5>
								<p className="text-gray-600 mb-3">
									The classifier takes the enhanced vector{" "}
									<LaTeX>{"\\mathbf{z}_t"}</LaTeX> and
									produces a probability score{" "}
									<LaTeX>{"\\hat{p}_t"}</LaTeX>
									via an LSTM and a two-layer MLP.
								</p>
								<div className="my-3 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
									<LaTeX displayMode={true}>
										{
											"\\hat{p}_t = f_{\\theta}(\\mathbf{z}_t) = \\sigma(W_2 \\cdot \\text{ReLU}(W_1 \\cdot \\text{LSTM}(\\text{BN}(\\mathbf{z}_t)) + b_1) + b_2)"
										}
									</LaTeX>
								</div>
							</div>
						</div>
					</div>

					{/* Section 3: Learning Objective */}
					<div>
						<h4 className="text-xl font-semibold text-gray-700 flex items-center gap-3 mb-4 border-b pb-2">
							<Target className="h-5 w-5" />
							3. Learning Objective: nnPU Risk Minimization
						</h4>
						<p className="text-gray-600 mb-3">
							The non-negative PU (nnPU) risk for classifier f_θ
							with class-prior π_p is
						</p>
						<div className="my-3 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
							<LaTeX displayMode={true}>
								{String.raw`
\widehat{R}_{\mathrm{pu}}(f_\theta)
= \pi_p\,\widehat{R}_{p}^{+}(f_\theta)
  + \max\!\bigl\{0,\;\widehat{R}_{u}^{-}(f_\theta) - \pi_p\,\widehat{R}_{p}^{-}(f_\theta)\bigr\}.
`}
							</LaTeX>
						</div>
						<p className="text-gray-600">
							Here, <LaTeX>{"\\widehat{R}_{p}^{+}"}</LaTeX> is the
							positive risk on P,{" "}
							<LaTeX>{"\\widehat{R}_{u}^{-}"}</LaTeX> the negative
							risk on U, and{" "}
							<LaTeX>{"\\widehat{R}_{p}^{-}"}</LaTeX> the negative
							risk on P. The max(0,·) clamp prevents negative
							risk.
						</p>
						<p className="text-gray-600">
							The optimization objective is thus{" "}
							<LaTeX>
								{
									"\\theta^* = \\arg\\min_{\\theta} \\widehat{R}_{\\mathrm{pu}}(f_\\theta)"
								}
							</LaTeX>
							.
						</p>
					</div>

					{/* Section 4: Algorithm Pseudocode - 強化視覺效果 */}
					<div>
						<h4 className="text-xl font-semibold text-gray-700 flex items-center gap-3 mb-4 border-b pb-2">
							<FileCode2 className="h-5 w-5" />
							4. The Complete Algorithm
						</h4>
						<div className="p-6 rounded-lg border-2 border-slate-300 bg-gradient-to-br from-slate-50 to-blue-50 font-mono text-sm text-gray-700 shadow-inner">
							<p className="font-bold text-lg mb-3 text-slate-800">
								Algorithm: LSTM Training with Temporal Features
								and nnPU Learning
							</p>
							<div className="border-t border-slate-300 my-3" />
							<p className="mb-2">
								<strong>Input:</strong> Positive set{" "}
								<LaTeX>{"\\mathcal{P}"}</LaTeX>, Unlabeled set{" "}
								<LaTeX>{"\\mathcal{U}"}</LaTeX>, window size{" "}
								<LaTeX>{"W"}</LaTeX>, prior{" "}
								<LaTeX>{"\\pi_p"}</LaTeX>, learning rate{" "}
								<LaTeX>{"\\eta"}</LaTeX>, batch size{" "}
								<LaTeX>{"B"}</LaTeX>.
							</p>
							<p className="mb-3">
								<strong>Output:</strong> Trained model
								parameters <LaTeX>{"\\theta^*"}</LaTeX>.
							</p>
							<div className="border-t border-slate-300 my-3" />
							<ol className="list-decimal list-inside space-y-2">
								<li>
									<strong>Prior Estimation:</strong> Estimate
									class-prior π_p on{" "}
									<LaTeX>{"\\mathcal{Z}_{train}"}</LaTeX>{" "}
									(e.g., KM/Alpha-max).
								</li>
								<li>
									<strong>Data Preparation:</strong> Merge{" "}
									<LaTeX>{"\\mathcal{P}"}</LaTeX> and{" "}
									<LaTeX>{"\\mathcal{U}"}</LaTeX>, sort by
									timestamp, and perform time-preserving split
									into{" "}
									<LaTeX>
										{
											"\\mathcal{D}_{train}, \\mathcal{D}_{val}"
										}
									</LaTeX>
									.
								</li>
								<li>
									<strong>Feature Engineering:</strong> Apply
									extractor <LaTeX>{"\\Phi"}</LaTeX> to
									generate feature sets
									<LaTeX>
										{
											"\\mathcal{Z}_{train}, \\mathcal{Z}_{val}"
										}
									</LaTeX>
									.
								</li>
								<li>
									<strong>Standardization:</strong> Fit a
									scaler <LaTeX>{"S"}</LaTeX> on{" "}
									<LaTeX>{"\\mathcal{Z}_{train}"}</LaTeX> and
									apply it to all feature sets.
								</li>
								<li>
									<strong>Initialization:</strong> Initialize
									model parameters <LaTeX>{"\\theta"}</LaTeX>{" "}
									and optimizer.
								</li>
								<li>
									<strong>Training Loop:</strong>
								</li>
								<li className="list-none pl-6">
									<p>
										<strong>for</strong> epoch = 1{" "}
										<strong>to</strong> E{" "}
										<strong>do</strong>
									</p>
									<div className="pl-6 border-l border-slate-300 ml-2">
										<p>
											<strong>for each</strong> mini-batch{" "}
											<LaTeX>
												{
													"\\mathcal{B} \\subseteq \\mathcal{Z}_{train}"
												}
											</LaTeX>{" "}
											<strong>do</strong>
										</p>
										<div className="pl-6 border-l border-slate-300 ml-2 space-y-1">
											<p>
												Compute empirical risks{" "}
												<LaTeX>
													{
														"\\hat{R}_p^+, \\hat{R}_u^-, \\hat{R}_u^+"
													}
												</LaTeX>{" "}
												on{" "}
												<LaTeX>{"\\mathcal{B}"}</LaTeX>.
											</p>
											<p>
												Calculate nnPU loss{" "}
												<LaTeX>
													{
														"L_\\mathcal{B} \\leftarrow \\pi_p \\hat{R}_p^+ + \\max(0, \\hat{R}_u^- - \\pi_p \\hat{R}_u^+)"
													}
												</LaTeX>
												.
											</p>
											<p>
												Update parameters:{" "}
												<LaTeX>
													{
														"\\theta \\leftarrow \\theta - \\eta \\nabla_\\theta L_\\mathcal{B}"
													}
												</LaTeX>
												.
											</p>
										</div>
										<p>
											<strong>end for</strong>
										</p>
										<p>
											Perform PU-aware validation on{" "}
											<LaTeX>
												{"\\mathcal{Z}_{val}"}
											</LaTeX>{" "}
											using TP recall, precision on
											labeled positives, and negative risk
											diagnostics; check for early
											stopping.
										</p>
									</div>
									<p>
										<strong>end for</strong>
									</p>
								</li>
								<li>
									<strong>Return</strong> best parameters{" "}
									<LaTeX>{"\\theta^*"}</LaTeX>.
								</li>
							</ol>
						</div>
					</div>
				</CardContent>
			</Card>
		</section>
	);
}
