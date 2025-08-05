import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

export function ResearchValue() {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Lightbulb className="h-5 w-5" />
					Research Value & Applications
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Unique Dataset Characteristics */}
				<div>
					<h4 className="font-semibold text-lg mb-3 text-slate-700">
						Unique Dataset Characteristics
					</h4>
					<div className="space-y-3">
						<div className="flex items-start gap-3">
							<div className="w-2 h-2 bg-slate-600 rounded-full mt-2" />
							<p className="text-sm">
								<strong>Long-term longitudinal data</strong>{" "}
								reveals seasonal and behavioral shifts.
							</p>
						</div>
						<div className="flex items-start gap-3">
							<div className="w-2 h-2 bg-slate-600 rounded-full mt-2" />
							<p className="text-sm">
								<strong>Dual-meter design</strong> decouples
								whole-household consumption from high-power
								appliance (e.g., A/C) usage.
							</p>
						</div>
						<div className="flex items-start gap-3">
							<div className="w-2 h-2 bg-slate-600 rounded-full mt-2" />
							<p className="text-sm">
								<strong>
									Natural, unscripted behavioral patterns
								</strong>{" "}
								from a real-world residential environment.
							</p>
						</div>
					</div>
				</div>

				{/* Research Applications */}
				<div>
					<h4 className="font-semibold text-lg mb-3 text-slate-700">
						Research Applications
					</h4>
					<div className="space-y-3">
						<div className="flex items-start gap-3">
							<div className="w-2 h-2 bg-slate-600 rounded-full mt-2" />
							<div>
								<p className="font-medium text-slate-700">
									Ideal for PU Learning Scenarios
								</p>
								<p className="text-sm text-slate-600">
									Frame occupancy detection as a PU problem
									where 'user present' (clear energy signal)
									is a Positive (P) label, while low-energy
									periods form the Unlabeled (U) set.
								</p>
							</div>
						</div>
						<div className="flex items-start gap-3">
							<div className="w-2 h-2 bg-slate-600 rounded-full mt-2" />
							<div>
								<p className="font-medium text-slate-700">
									PU-based Anomaly Detection
								</p>
								<p className="text-sm text-slate-600">
									Define 'normal' appliance operation (e.g.,
									A/C cycles) as P to identify rare anomalous
									events like equipment faults or abnormal
									energy spikes from the U data.
								</p>
							</div>
						</div>
						<div className="flex items-start gap-3">
							<div className="w-2 h-2 bg-slate-600 rounded-full mt-2" />
							<div>
								<p className="font-medium text-slate-700">
									A True Weakly-Supervised Testbed
								</p>
								<p className="text-sm text-slate-600">
									The data inherently represents a
									weakly-supervised problem, as ground-truth
									for 'negative' labels (e.g., user is truly
									away vs. just sleeping) is unobtainable.
								</p>
							</div>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
