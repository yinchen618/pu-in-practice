import { OverviewDetails } from "./overview-details";
import { OverviewMetrics } from "./overview-metrics";
import { ResearchValue } from "./research-value";

import type { TestbedOverview } from "@/hooks/use-testbed-data";

interface OverviewTabProps {
	overviewLoading: boolean;
	overview: TestbedOverview | null;
}

export function OverviewTab({ overviewLoading, overview }: OverviewTabProps) {
	if (overviewLoading) {
		return (
			<div className="text-center py-8">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto" />
				<p className="mt-4 text-slate-600">
					Loading testbed overview...
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-8">
			{/* Key Metrics */}
			<OverviewMetrics overview={overview} />

			{/* Bottom Section */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
				{/* Left Column */}
				<OverviewDetails />

				{/* Right Column - Research Value */}
				<ResearchValue />
			</div>
		</div>
	);
}
