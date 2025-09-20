"use client";

// Simple LaTeX component mock to prevent build errors.
const LaTeX = ({ children }: { children: string }) => {
	return (
		<span className="font-serif italic">{children.replace(/\$/g, "")}</span>
	);
};

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, CheckCircle, ClipboardCheck } from "lucide-react";

export default function ModelEvaluationRevised() {
	return (
		<Card className="bg-white shadow-lg border">
			<CardHeader>
				<CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-3">
					<ClipboardCheck className="h-7 w-7 text-blue-600" />
					Evaluation Metrics for PU learning
				</CardTitle>
				<CardDescription className="text-md pt-1">
					Standard metrics can be misleading in PU because U mixes
					unknown positives/negatives. I adopt a dual-metric approach
					for a more accurate and meaningful assessment of model
					performance.
				</CardDescription>
			</CardHeader>
			<CardContent className="grid md:grid-cols-2 gap-6">
				{/* Limitations Section */}
				<div className="p-4 rounded-lg border-2 border-amber-200 bg-amber-50/50">
					<h4 className="font-semibold text-amber-800 mb-3 flex items-center gap-2 text-lg">
						<AlertTriangle className="h-5 w-5" />
						Limitations of Standard Metrics
					</h4>
					<p className="text-sm text-gray-700">
						Metrics like F1-Score, Precision, and Recall must be
						interpreted with caution. In my test set, '0' labels
						represent 'Unlabeled' data, not 'Confirmed Negative'.
						This mixture can artificially deflate precision, as the
						model might correctly identify hidden positives within
						the unlabeled set, which are counted as False Positives.
					</p>
				</div>

				{/* Reliable Metrics Section */}
				<div className="p-4 rounded-lg border-2 border-teal-200 bg-teal-50/50">
					<h4 className="font-semibold text-teal-800 mb-3 flex items-center gap-2 text-lg">
						<CheckCircle className="h-5 w-5" />
						More Reliable PU Metrics
					</h4>
					<ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
						<li>
							<strong>
								True Positive Recall (on labeled P):
							</strong>{" "}
							fraction of confirmed positives correctly identified
							— immune to U ambiguity.
						</li>
						<li>
							<strong>Estimated Positive Rate in U:</strong>{" "}
							proportion of U predicted positive; compared against
							π_p to diagnose over/under-prediction.
						</li>
						<li>
							<strong>
								Prior-Adjusted Precision (Elkan–Noto style):
							</strong>{" "}
							estimate precision by correcting for the expected
							positive mass in U under π_p.
						</li>
					</ul>
					<p className="text-sm text-gray-700 mt-3">
						I also report a{" "}
						<strong>"PU-AUC-PR (diagnostic)"</strong> computed with
						prior-adjusted counts to visualize trade-offs under the
						assumed π_p.
					</p>
				</div>
			</CardContent>
		</Card>
	);
}
