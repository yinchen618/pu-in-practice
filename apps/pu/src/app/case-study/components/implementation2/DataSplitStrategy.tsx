"use client";

import DataSplitStrategyFlow from "@/app/case-study/components/diagrams/DataSplitStrategyFlow";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, CheckCircle, GitBranch } from "lucide-react";
import { useState } from "react";
// import DataSplitStrategyFlow from "../diagrams/DataSplitStrategyFlow"; // Removed to fix import error

const CodeBlock = ({ children }: { children: React.ReactNode }) => (
	<pre className="bg-gray-800 text-white p-3 rounded-md overflow-x-auto text-xs font-mono">
		<code>{children}</code>
	</pre>
);

export default function DataSplitStrategyRevised() {
	const [showCode, setShowCode] = useState(false);

	return (
		<Card className="bg-white shadow-lg border">
			<CardHeader>
				<CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-3">
					<GitBranch className="h-7 w-7 text-blue-600" />
					Methodology: The Stratified Time-based Split
				</CardTitle>
				<CardDescription className="text-md pt-1">
					A crucial step to prevent data leakage and ensure the
					validity of PU learning experiments by maintaining a
					balanced sample distribution across all data splits.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="grid md:grid-cols-2 gap-6">
					{/* Problem Section */}
					<div className="p-4 rounded-lg border-2 border-amber-200 bg-amber-50/50">
						<h4 className="font-semibold text-amber-800 mb-3 flex items-center gap-2 text-lg">
							<AlertTriangle className="h-5 w-5" />
							The Problem with Naive Splitting
						</h4>
						<p className="text-sm text-gray-700 mb-3">
							A direct time-based split on datasets with temporal
							clustering of positive labels often results in
							validation or test sets containing only positive
							samples.
						</p>
						<ul className="list-disc list-inside space-y-1 text-xs text-red-700 font-medium">
							<li>
								Leads to training runtime errors in nnPU loss.
							</li>
							<li>
								Produces misleadingly perfect evaluation metrics
								(100% F1).
							</li>
							<li>Invalidates the entire research outcome.</li>
						</ul>
					</div>

					{/* Solution Section */}
					<div className="p-4 rounded-lg border-2 border-teal-200 bg-teal-50/50">
						<h4 className="font-semibold text-teal-800 mb-3 flex items-center gap-2 text-lg">
							<CheckCircle className="h-5 w-5" />
							The Stratified Solution
						</h4>
						<p className="text-sm text-gray-700 mb-3">
							I first separate samples into Positive (P) and
							Unlabeled (U) groups. A time-based split is applied
							to each group independently, and then the
							corresponding splits are merged back together.
						</p>
						<ul className="list-disc list-inside space-y-1 text-xs text-green-700 font-medium">
							<li>
								Guarantees P and U in all sets (no positive-only
								folds).
							</li>
							<li>
								Keeps π_p approximately consistent across splits
								(reduces risk bias).
							</li>
							<li>
								Stabilizes nnPU training and enables reliable,
								prior-aware evaluation.
							</li>
						</ul>
					</div>
				</div>

				<div>
					<h4 className="font-semibold text-slate-700 mb-4 text-center text-lg">
						Comparison of Splitting Strategies
					</h4>
					{/* Placeholder for the diagram component to resolve import error */}
					<DataSplitStrategyFlow />
				</div>

				<details className="bg-slate-50 border border-slate-200 rounded-lg p-3">
					<summary className="text-sm font-semibold text-slate-600 cursor-pointer hover:text-slate-800">
						[+] View Python Implementation Pseudocode
					</summary>
					<div className="pt-4">
						<CodeBlock>{`# 1. Separate data into Positive (P) and Unlabeled (U) groups
p_data = df[df['label'] == 1].sort_values('timestamp')
u_data = df[df['label'] == 0].sort_values('timestamp')

# 2. Apply time-based split to each group
p_train, p_val, p_test = time_split(p_data, ratios=[0.7, 0.1, 0.2])
u_train, u_val, u_test = time_split(u_data, ratios=[0.7, 0.1, 0.2])

# 3. Merge corresponding splits and re-sort to maintain chronology
train_df = pd.concat([p_train, u_train]).sort_values('timestamp')
val_df = pd.concat([p_val, u_val]).sort_values('timestamp')
test_df = pd.concat([p_test, u_test]).sort_values('timestamp')`}</CodeBlock>
					</div>
				</details>
			</CardContent>
		</Card>
	);
}
