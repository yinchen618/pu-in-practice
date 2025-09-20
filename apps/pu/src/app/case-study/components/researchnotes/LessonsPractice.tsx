"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	GanttChart,
	GitCompareArrows,
	Microscope,
	SearchCheck,
	ShieldAlert,
} from "lucide-react";

// Define props type for Learning Point component
type LearningPointProps = {
	icon: React.ElementType;
	title: string;
	subtitle?: string;
	children: React.ReactNode;
};

// Reusable Learning Point subcomponent - 簡化版本
const LearningPoint = ({
	icon: Icon,
	title,
	subtitle,
	children,
}: LearningPointProps) => (
	<div className="flex items-start gap-4 p-4 rounded-lg border bg-slate-50/50 hover:bg-slate-50 transition-colors">
		<Icon className="h-6 w-6 text-slate-500 mt-1 flex-shrink-0" />
		<div className="space-y-2">
			<h4 className="text-lg font-semibold text-slate-800">{title}</h4>
			{subtitle && (
				<p className="text-sm font-medium text-blue-600 mb-2">
					{subtitle}
				</p>
			)}
			<div className="text-gray-700 text-sm leading-relaxed">
				{children}
			</div>
		</div>
	</div>
);

export default function LessonsPractice() {
	return (
		<section id="lessons-practice" className="scroll-mt-6">
			<Card className="bg-white shadow-lg">
				<CardHeader>
					<h2 className="text-base font-semibold uppercase text-blue-600 tracking-wider text-left mb-4">
						Lessons from Practice
					</h2>
					<CardTitle className="text-3xl font-bold text-gray-800 text-left">
						Core Takeaways & Key Learnings
					</CardTitle>
					<p className="text-lg text-gray-500 pt-2 text-left">
						Critical insights distilled from my development
						lifecycle and research journey.
					</p>
				</CardHeader>
				<CardContent className="space-y-4">
					<LearningPoint
						icon={GanttChart}
						title="The Sanctity of Time Series"
						subtitle="Temporal order is inviolable"
					>
						<div className="space-y-2">
							<p>
								Temporal order is <strong>inviolable</strong>{" "}
								(no leakage across time).
							</p>
							<p>
								<strong>Split-first, process-later</strong> is
								the first principle.
							</p>
							<p>
								Any op that breaks chronology ⇒{" "}
								<strong>invalid evaluation</strong>.
							</p>
							<p>
								Time is the ground truth in sequential analysis.
							</p>
						</div>
					</LearningPoint>

					<LearningPoint
						icon={ShieldAlert}
						title="Data Leakage is a Silent Killer"
						subtitle="Prevention > detection"
					>
						<div className="space-y-2">
							<p>Prevention &gt; detection.</p>
							<p>
								<strong>
									Time-based split → then feature engineering
								</strong>
								.
							</p>
							<p>
								Fit scalers/priors on{" "}
								<strong>train only</strong>.
							</p>
							<p>
								Guarantees <strong>PU-aware</strong> evaluation.
							</p>
						</div>
					</LearningPoint>

					<LearningPoint
						icon={GitCompareArrows}
						title="Consistency is King"
						subtitle="Training and evaluation must use the same ruler"
					>
						<div className="space-y-2">
							<p>
								Train/val/test must share the{" "}
								<strong>same features/scaler/arch</strong>.
							</p>
							<p>
								One shared codepath (e.g.,{" "}
								<code>shared_models.py</code>).
							</p>
							<p>
								Reproducible configs = comparable{" "}
								<strong>risk</strong>.
							</p>
						</div>
					</LearningPoint>

					<LearningPoint
						icon={SearchCheck}
						title="Trust Logs, but Question Results"
						subtitle="Critical thinking over blind acceptance"
					>
						<div className="space-y-2">
							<p>"Successful run" ≠ correct results.</p>
							<p>
								<strong>Inflated F1 (≥0.9) under PU</strong> is
								suspicious.
							</p>
							<p>
								Pattern: Recall≈1.0 &amp; TN≈0 ⇒{" "}
								<strong>hidden positives in U</strong>.
							</p>
							<p>Always inspect error composition.</p>
						</div>
					</LearningPoint>

					<LearningPoint
						icon={Microscope}
						title="The Devil is in the Details"
						subtitle="Micro-level implementation determines macro-level success"
					>
						<div className="space-y-2">
							<p>Micro-impl → macro-success.</p>
							<p>
								PyTorch gotchas: <code>.cpu()</code>,{" "}
								<code>grad_fn</code>, RNG seeds.
							</p>
							<p>
								<code>BatchNorm1d</code> expects{" "}
								<code>[N, C]</code> not <code>[N, T, C]</code>.
							</p>
							<p>
								Small mismatches → large <strong>risk</strong>{" "}
								drift.
							</p>
						</div>
					</LearningPoint>
				</CardContent>
			</Card>
		</section>
	);
}
