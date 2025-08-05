"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain } from "lucide-react";

export function MethodologyPhase() {
	return (
		<div className="space-y-8">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center">
						<Brain className="h-5 w-5 mr-2 text-purple-600" />
						PU Learning Methodology
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
						<div className="bg-purple-50 p-6 rounded-lg">
							<h4 className="font-semibold text-purple-800 mb-4">
								1. Problem Formulation
							</h4>
							<div className="space-y-3 text-sm text-purple-700">
								<p>
									<strong>Positive Set (P):</strong> ~200
									<strong>manually confirmed</strong> energy
									anomalies
								</p>
								<p>
									<strong>Unlabeled Set (U):</strong> 43.2M
									readings (mix of normal + unknown anomalies)
								</p>
								<p>
									<strong>Assumption:</strong> Selected
									Completely At Random (SCAR)
								</p>
								<div className="bg-white p-3 rounded border">
									<div className="text-center mb-2 font-mono text-sm">
										P(s=1|x,y=1) = c (constant)
									</div>
									<p className="text-xs text-purple-600">
										This core assumption enables unbiased
										risk estimation, allowing us to learn
										directly from the biased P and U sets.
									</p>
								</div>
							</div>
						</div>

						<div className="bg-blue-50 p-6 rounded-lg">
							<h4 className="font-semibold text-blue-800 mb-4">
								2. Algorithm Selection
							</h4>
							<div className="space-y-3 text-sm text-blue-700">
								<p>
									<strong>Primary:</strong> Non-negative PU
									(nnPU) Learning
								</p>
								<p>
									<strong>Backup:</strong> Unbiased PU (uPU)
									Learning
								</p>
								<p>
									<strong>Reason:</strong> Handles overfitting
									to positive data
								</p>
								<p className="text-xs text-blue-600">
									Chosen for its effectiveness in handling
									complex, non-linear patterns typical of
									energy data.
								</p>
								<div className="bg-white p-3 rounded border">
									<div className="text-center font-mono text-sm">
										R̂_nnPU = π⁺ R̂_P⁺ + max(0, R̂_U - π⁺ R̂_P⁺)
									</div>
								</div>
							</div>
						</div>

						<div className="bg-green-50 p-6 rounded-lg">
							<h4 className="font-semibold text-green-800 mb-4">
								3. Class Prior Estimation
							</h4>
							<div className="space-y-3 text-sm text-green-700">
								<p>
									<strong>Method:</strong> AlphaMax algorithm
								</p>
								<p>
									<strong>Estimated π⁺:</strong> 0.0046
									(0.46%)
								</p>
								<p className="text-xs text-green-600">
									This low prior confirms the extreme class
									imbalance in our real-world dataset,
									validating the necessity of the PU Learning
									framework.
								</p>
								<p>
									<strong>Validation:</strong>{" "}
									Cross-validation on known positives
								</p>
								<div className="bg-white p-3 rounded border">
									<div className="text-center font-mono text-sm">
										π⁺ = |P| / (|P| + |positive samples in
										U|)
									</div>
								</div>
							</div>
						</div>
					</div>

					<div className="bg-slate-50 p-6 rounded-lg">
						<h4 className="font-semibold text-slate-800 mb-4">
							Feature Engineering for Energy Anomalies
						</h4>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<h5 className="font-medium text-slate-700 mb-3">
									Temporal Features
								</h5>
								<ul className="text-sm text-slate-600 space-y-1">
									<li>
										• Hour-of-day & day-of-week patterns (to
										capture user routines)
									</li>
									<li>
										• Monthly seasonal trends (to model
										long-term shifts)
									</li>
									<li>
										• Multi-scale moving averages (1h, 6h,
										24h) (to capture dynamic state changes)
									</li>
								</ul>
							</div>
							<div>
								<h5 className="font-medium text-slate-700 mb-3">
									Statistical Features
								</h5>
								<ul className="text-sm text-slate-600 space-y-1">
									<li>
										• Deviation from personal baseline (to
										identify abnormal consumption levels)
									</li>
									<li>
										• Z-score normalization (to standardize
										features across different units)
									</li>
									<li>• Rate of change detection</li>
									<li>• Appliance-level disaggregation</li>
								</ul>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
