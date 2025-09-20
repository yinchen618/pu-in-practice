"use client";

import { LaTeX } from "@/components/LaTeX";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, School } from "lucide-react";
import React from "react";

function ReferenceItem({
	title,
	authors,
	venue,
	note,
	link,
	tone = "info",
}: {
	title: string;
	authors: string;
	venue: string;
	note: string;
	link?: string;
	tone?: "info" | "success";
}) {
	const toneClass = {
		info: "bg-blue-50 border-blue-500 text-blue-700",
		success: "bg-green-50 border-green-500 text-green-700",
	}[tone];
	return (
		<div className="pt-6">
			<h4 className="text-xl font-bold text-slate-800 mb-2">{title}</h4>
			<p className="text-sm text-slate-500 mb-3">
				{authors}. {venue}.
				{link && (
					<>
						{" — "}
						<a
							className="text-blue-600 hover:underline"
							href={link}
							target="_blank"
							rel="noopener noreferrer nofollow"
							aria-label={`${title} paper link`}
						>
							Paper
						</a>
					</>
				)}
			</p>
			<div className={`border-l-4 p-3 rounded-r-md text-xs ${toneClass}`}>
				{note}
			</div>
		</div>
	);
}

export default function ReferencesTab() {
	return (
		<div className="max-w-4xl mx-auto space-y-12">
			{/* 1. Page Header */}
			<div className="text-center">
				<h1 className="text-4xl font-bold  text-slate-800 mb-4">
					References & Theoretical Foundations
				</h1>
				<p className="text-lg text-slate-600 max-w-3xl mx-auto">
					This section summarizes the core academic papers from
					Sugiyama Lab that form the theoretical bedrock of this
					project, particularly the seminal works on unbiased (uPU)
					and non-negative (nnPU) learning.
				</p>
			</div>

			{/* 2. Core Papers Analysis */}
			<section aria-labelledby="foundations-heading">
				<Card className="shadow-lg border">
					<CardHeader>
						<CardTitle
							id="foundations-heading"
							className="text-2xl font-semibold text-slate-800 flex items-center gap-3"
						>
							<BookOpen className="h-6 w-6 text-blue-700" />
							Core Foundations: uPU & nnPU
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-6 divide-y divide-slate-200">
						<ReferenceItem
							title="Analysis of Learning from Positive and Unlabeled Data"
							authors="du Plessis, M. C., Niu, G., and Sugiyama, M."
							venue="NeurIPS 2014"
							note="Widely used as the unbiased baseline risk estimator; we contrast its properties with nnPU in our demo."
							link="https://www.ms.k.u-tokyo.ac.jp/sugi/2014/NIPS2014b.pdf"
							tone="info"
						/>
						<ReferenceItem
							title="Positive-Unlabeled Learning with Non-Negative Risk Estimator"
							authors="Kiryo, R., du Plessis, M. C., Niu, G., and Sugiyama, M."
							venue="NeurIPS 2017"
							note="The demo adopts the nnPU estimator to avoid negative-risk issues and stabilize training."
							link="https://proceedings.neurips.cc/paper/2017/hash/7cce53cf90577442771720a370c3c723-Abstract.html"
							tone="success"
						/>
					</CardContent>
				</Card>
			</section>

			{/* 3. Theoretical Summary & Comparison */}
			<section aria-labelledby="theory-heading">
				<Card className="shadow-lg border">
					<CardHeader>
						<CardTitle
							id="theory-heading"
							className="text-2xl font-semibold text-slate-800"
						>
							Theoretical Summary: uPU vs. nnPU
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="overflow-x-auto">
							<table className="w-full text-sm border border-slate-200">
								<caption className="sr-only">
									Comparison of uPU and nnPU risk estimators
								</caption>
								<thead>
									<tr className="bg-slate-50 border-b">
										<th
											scope="col"
											className="text-left p-3 font-semibold text-slate-600 w-1/4"
										>
											Aspect
										</th>
										<th
											scope="col"
											className="text-left p-3 font-semibold text-blue-800"
										>
											uPU (NeurIPS 2014)
										</th>
										<th
											scope="col"
											className="text-left p-3 font-semibold text-green-800"
										>
											nnPU (NeurIPS 2017)
										</th>
									</tr>
								</thead>
								<tbody>
									<tr className="border-b">
										<th
											scope="row"
											className="p-3 font-medium text-slate-600 text-left"
										>
											PU Risk Definition
										</th>
										<td className="p-3 font-mono whitespace-pre-wrap">
											<LaTeX displayMode={false}>
												{
													"\\hat{R}_{\\text{pu}} = \\pi_p \\hat{R}_{p}^{+} - \\pi_p \\hat{R}_{p}^{-} + \\hat{R}_{u}^{-}"
												}
											</LaTeX>
										</td>
										<td className="p-3 font-mono whitespace-pre-wrap">
											<LaTeX displayMode={false}>
												{
													"\\tilde{R}_{\\text{pu}} = \\pi_p \\hat{R}_{p}^{+} + \\max\\{0, \\hat{R}_{u}^{-} - \\pi_p \\hat{R}_{p}^{-}\\}"
												}
											</LaTeX>
										</td>
									</tr>
									<tr className="border-b">
										<th
											scope="row"
											className="p-3 font-medium text-slate-600 text-left"
										>
											Risk Estimator
										</th>
										<td className="p-3 text-slate-700">
											Unbiased, but can go negative
										</td>
										<td className="p-3 text-slate-700">
											Non-negative constraint
										</td>
									</tr>
									<tr className="border-b">
										<th
											scope="row"
											className="p-3 font-medium text-slate-600 text-left"
										>
											Key Strength
										</th>
										<td className="p-3 text-slate-700">
											Theoretically sound unbiased
											baseline
										</td>
										<td className="p-3 text-slate-700">
											Stable with deep models
										</td>
									</tr>
									<tr>
										<th
											scope="row"
											className="p-3 font-medium text-slate-600 text-left"
										>
											Failure Mode
										</th>
										<td className="p-3 text-red-600">
											Overfitting when risk &lt; 0
										</td>
										<td className="p-3 text-slate-700">
											Robust, but sensitive to class-prior
											misestimation
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</CardContent>
				</Card>
			</section>

			{/* 4. Implementation Resources */}
			<section aria-labelledby="resources-heading">
				<Card className="shadow-lg border">
					<CardHeader>
						<CardTitle
							id="resources-heading"
							className="text-2xl font-semibold text-slate-800"
						>
							Implementation Notes & Resources
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-slate-700 mb-4 text-sm">
							The nnPU risk estimator in this demo is adapted from
							the Sugiyama Lab’s reference PU implementation (
							<code>PU.zip</code>
							). The core logic was integrated with an LSTM model
							for the smart residential testbed.
						</p>
						<p className="text-xs text-slate-500 mb-4">
							Please follow the license/terms in the original
							package when reusing the code.
						</p>
						<ul className="text-sm space-y-2">
							<li>
								<a
									href="https://www.ms.k.u-tokyo.ac.jp/sugi/software/PU/PU.zip"
									target="_blank"
									rel="noopener noreferrer nofollow"
									className="flex items-center gap-2 text-blue-600 hover:underline"
									aria-label="Download reference PU implementation from Sugiyama Lab"
								>
									<BookOpen className="h-4 w-4" /> Download
									Reference PU Implementation (PU.zip)
								</a>
							</li>
							<li>
								<a
									href="https://www.ms.k.u-tokyo.ac.jp/sugi/"
									target="_blank"
									rel="noopener noreferrer nofollow"
									className="flex items-center gap-2 text-blue-600 hover:underline"
									aria-label="Visit Sugiyama Lab Homepage"
								>
									<School className="h-4 w-4" /> Sugiyama Lab
									Homepage
								</a>
							</li>
						</ul>
					</CardContent>
				</Card>
			</section>
		</div>
	);
}
