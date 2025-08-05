"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";

export default function ApplicationsTab() {
	return (
		<div className="max-w-4xl mx-auto space-y-6">
			<h2 className="text-3xl font-bold text-slate-900 mb-6">
				Practical Applications
			</h2>

			<div className="p-6 bg-orange-50 rounded-lg">
				<h4 className="font-semibold text-orange-900 mb-2">
					Real-world Use Cases
				</h4>
				<ul className="text-sm text-orange-700 space-y-2">
					<li>
						• <strong>Document classification:</strong> positive
						samples are relevant documents, unlabeled contain both
						relevant and irrelevant
					</li>
					<li>
						• <strong>Recommendation systems:</strong> positive
						samples are clicked/purchased items, unlabeled include
						unclicked items
					</li>
					<li>
						• <strong>Anomaly detection:</strong> positive samples
						are known anomalies, unlabeled contain normal data and
						unknown anomalies
					</li>
					<li>
						• <strong>Medical diagnosis:</strong> positive samples
						are confirmed cases, unlabeled include undiagnosed
						patients
					</li>
					<li>
						• <strong>Spam detection:</strong> positive samples are
						confirmed spam, unlabeled emails may contain spam or
						legitimate messages
					</li>
				</ul>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle>Advantages of PU Learning</CardTitle>
					</CardHeader>
					<CardContent>
						<ul className="text-sm space-y-2">
							<li>• Reduces labeling costs significantly</li>
							<li>• Handles class imbalance naturally</li>
							<li>• Works with partial supervision</li>
							<li>• Applicable to large-scale problems</li>
						</ul>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Key Challenges</CardTitle>
					</CardHeader>
					<CardContent>
						<ul className="text-sm space-y-2">
							<li>• Accurate prior estimation is crucial</li>
							<li>• Model selection requires careful tuning</li>
							<li>• Evaluation metrics need adjustment</li>
							<li>
								• Convergence can be sensitive to initialization
							</li>
						</ul>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
