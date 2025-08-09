"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";

export default function ReferencesTab() {
	return (
		<div className="max-w-4xl mx-auto space-y-6">
			<h2 className="text-3xl font-bold text-slate-900 mb-2">
				References
			</h2>
			<p className="text-slate-700 mb-6">
				Core references from Sugiyama Lab underpinning this work. Each
				method is either implemented directly in the Demo or applied to
				real testbed data in the Case Study.
			</p>

			<div className="space-y-4">
				<Card>
					<CardHeader>
						<CardTitle>Primary Research Papers</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<h5 className="font-medium">
								1. du Plessis, M. C., Niu, G., & Sugiyama, M.
								(2015)
							</h5>
							<p className="text-sm text-slate-600">
								Analysis of learning from positive and unlabeled
								data. <em>ICML 2015</em>
							</p>
							<p className="text-xs text-slate-600">
								[Implemented: Yes – Where used: Demo (uPU risk),
								Case Study Stage 3]
							</p>
						</div>
						<div>
							<h5 className="font-medium">
								2. Kiryo, R., Niu, G., du Plessis, M. C., &
								Sugiyama, M. (2017)
							</h5>
							<p className="text-sm text-slate-600">
								Positive-unlabeled learning with non-negative
								risk estimator. <em>NIPS 2017</em>
							</p>
							<p className="text-xs text-slate-600">
								[Implemented: Yes – Where used: Demo (nnPU),
								Case Study Stage 3]
							</p>
						</div>
						<div>
							<h5 className="font-medium">
								3. Niu, G., du Plessis, M. C., Sakai, T., Ma,
								Y., & Sugiyama, M. (2016)
							</h5>
							<p className="text-sm text-slate-600">
								Theoretical comparisons of positive-unlabeled
								learning against positive-negative learning.{" "}
								<em>NIPS 2016</em>
							</p>
							<p className="text-xs text-slate-600">
								[Implemented: Yes – Where used: Comparative
								analysis in Case Study]
							</p>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Implementation Resources</CardTitle>
					</CardHeader>
					<CardContent>
						<ul className="text-sm space-y-2">
							<li>
								•{" "}
								<a
									href="https://github.com/kiryor/nnPU"
									className="text-blue-600 hover:underline"
								>
									Official nnPU Implementation (GitHub)
								</a>
							</li>
							<li>
								•{" "}
								<a
									href="https://www.ms.k.u-tokyo.ac.jp/sugi/"
									className="text-blue-600 hover:underline"
								>
									Sugiyama Lab Homepage
								</a>
							</li>
							<li>
								•{" "}
								<a
									href="https://scikit-learn.org/"
									className="text-blue-600 hover:underline"
								>
									Scikit-learn Documentation
								</a>
							</li>
							<li>
								•{" "}
								<a
									href="https://pytorch.org/"
									className="text-blue-600 hover:underline"
								>
									PyTorch Framework
								</a>
							</li>
						</ul>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
