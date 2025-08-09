"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";

export default function ApplicationsTab() {
	return (
		<div className="max-w-4xl mx-auto space-y-6">
			<h2 className="text-3xl font-bold text-slate-900 mb-2">
				Practical Applications
			</h2>
			<p className="text-slate-700 mb-6">
				PU learning excels in domains where negative labels are hard to
				obtain. In this project, anomaly detection in smart residential
				environments is the main application focus.
			</p>

			<div className="p-6 bg-orange-50 rounded-lg">
				<h4 className="font-semibold text-orange-900 mb-2">
					Real-world Use Cases
				</h4>
				<ul className="text-sm text-orange-700 space-y-2">
					<li>
						• <strong>Appliance Fault Detection:</strong> positives
						are confirmed faulty appliance events.
					</li>
					<li>
						• <strong>Occupancy-Linked Anomalies:</strong> positives
						are high-consumption periods when unoccupied.
					</li>
					<li>
						• <strong>Data Integrity Anomalies:</strong> positives
						are confirmed data gaps or sensor faults.
					</li>
				</ul>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle>What PU Fixes Here</CardTitle>
					</CardHeader>
					<CardContent>
						<ul className="text-sm space-y-2">
							<li>
								• Reduces labeling cost in large IoT deployments
							</li>
							<li>
								• Handles class imbalance and rare-event
								detection
							</li>
							<li>
								• Maintains learning stability under label shift
							</li>
						</ul>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Links to Case Study</CardTitle>
					</CardHeader>
					<CardContent>
						<ul className="text-sm space-y-2">
							<li>
								• Stage 2: Two confirmed anomalies –{" "}
								<a
									className="text-blue-700 hover:underline"
									href="/case-study?tab=data-exploration"
								>
									open labeling view
								</a>
							</li>
							<li>
								• Stage 3: Backtest nnPU vs rule-based –{" "}
								<a
									className="text-blue-700 hover:underline"
									href="/case-study?tab=model-training"
								>
									open comparison
								</a>
							</li>
						</ul>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
