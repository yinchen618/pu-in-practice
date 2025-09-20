"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Activity, GitMerge, Scaling, Split } from "lucide-react";

export default function DataPreprocessingEnglish() {
	return (
		<section id="data-preprocessing" className="scroll-mt-6">
			<Card className="bg-white shadow-lg">
				<CardHeader>
					<h3 className="text-xl font-bold text-gray-800 pt-1">
						Data Preprocessing: From Raw Signals to Trainable
						Features
					</h3>
					<p className="text-md text-gray-500 pt-2">
						This process produces context-aware feature vectors
						while preserving the validity of π_p estimation and
						downstream PU risk.
					</p>
				</CardHeader>
				<CardContent className="grid gap-6">
					{/* Step 1: Data Integration */}
					<div className="p-6 border rounded-xl bg-slate-50/70 space-y-3">
						<h4 className="text-lg font-semibold text-gray-700 flex items-center gap-3">
							<GitMerge className="h-6 w-6 text-indigo-500" />
							1. Data Integration & Chronological Alignment
						</h4>
						<p className="text-sm text-gray-600">
							Extract Positive (P) and Unlabeled (U) datasets from
							the database, merge them, and perform a strict
							chronological sort by timestamp to establish a
							temporal foundation for all subsequent operations.
						</p>
					</div>

					{/* Step 2: Feature Engineering */}
					<div className="p-6 border rounded-xl bg-slate-50/70 space-y-3">
						<h4 className="text-lg font-semibold text-gray-700 flex items-center gap-3">
							<Activity className="h-6 w-6 text-red-500" />
							2. Dynamic Temporal Feature Engineering
						</h4>
						<p className="text-sm text-gray-600">
							Utilizing a sliding window mechanism, I look back
							over a defined period at each time step to compute
							statistical (mean, std) and trend features,
							expanding single data points into high-dimensional
							"historical snapshots."
						</p>
					</div>

					{/* Step 3: Data Splitting (Teaser version) */}
					<div className="p-6 border rounded-xl bg-slate-50/70 space-y-3">
						<h4 className="text-lg font-semibold text-gray-700 flex items-center gap-3">
							<Split className="h-6 w-6 text-green-500" />
							3. Robust Data Splitting Strategy
						</h4>
						<p className="text-sm text-gray-600">
							This is a <strong>critical step</strong> for
							ensuring research validity. To prevent data leakage
							and ensure a balanced distribution of P/U samples in
							validation/test sets, I designed a "Stratified
							Time-based Split" strategy.
						</p>
						<p className="text-sm text-gray-600 mt-2">
							<strong>Prior-Consistent Splits:</strong> Each fold
							maintains similar P:U mixture to keep π_p estimates
							comparable across train/val/test, which stabilizes
							nnPU optimization.
						</p>
						<div className="bg-green-50 border-l-4 border-green-500 p-3 rounded-r-lg">
							<p className="text-sm text-green-800">
								<strong>Deep Dive:</strong> The next section
								will compare this strategy against traditional
								methods and provide implementation details.
							</p>
						</div>
					</div>

					{/* Step 4: Standardization */}
					<div className="p-6 border rounded-xl bg-slate-50/70 space-y-3">
						<h4 className="text-lg font-semibold text-gray-700 flex items-center gap-3">
							<Scaling className="h-6 w-6 text-amber-500" />
							4. Feature Standardization
						</h4>
						<p className="text-sm text-gray-600">
							Feature standardization is performed using
							scikit-learn's StandardScaler. To prevent
							information leakage, the scaler is{" "}
							<strong>
								fitted only on the training data (X_train)
							</strong>{" "}
							and then used to transform the validation and test
							sets.
						</p>
					</div>
				</CardContent>
			</Card>
		</section>
	);
}
