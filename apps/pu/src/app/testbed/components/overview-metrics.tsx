import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Database, Gauge, TrendingUp } from "lucide-react";
import type { TestbedOverview } from "@/hooks/use-testbed-data";

interface OverviewMetricsProps {
	overview?: TestbedOverview | null;
}

export function OverviewMetrics({ overview }: OverviewMetricsProps) {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
			<Card className="border-l-4 border-l-slate-600">
				<CardHeader className="pb-2">
					<CardTitle className="text-lg flex items-center gap-2">
						<Building className="h-5 w-5 text-slate-600" />
						Total Apartments
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-3xl font-bold text-slate-700">
						{overview?.unitCount || "~90"}
					</div>
					<p className="text-sm text-slate-600 mt-1">
						Two residential buildings
					</p>
				</CardContent>
			</Card>

			<Card className="border-l-4 border-l-slate-600">
				<CardHeader className="pb-2">
					<CardTitle className="text-lg flex items-center gap-2">
						<Gauge className="h-5 w-5 text-slate-600" />
						Active Sensors
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-3xl font-bold text-slate-700">
						{overview?.activeUnits || "~180"}
					</div>
					<p className="text-sm text-slate-600 mt-1">
						Smart meters per unit
					</p>
				</CardContent>
			</Card>

			<Card className="border-l-4 border-l-slate-600">
				<CardHeader className="pb-2">
					<CardTitle className="text-lg flex items-center gap-2">
						<Database className="h-5 w-5 text-slate-600" />
						Data Points/Day
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-3xl font-bold text-slate-700">
						{overview?.totalPower ? `${Math.round(overview.totalPower / 1000)}K` : "~260K"}
					</div>
					<p className="text-sm text-slate-600 mt-1">
						Per-minute resolution
					</p>
				</CardContent>
			</Card>

			<Card className="border-l-4 border-l-slate-600">
				<CardHeader className="pb-2">
					<CardTitle className="text-lg flex items-center gap-2">
						<TrendingUp className="h-5 w-5 text-slate-600" />
						Platform Uptime
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-3xl font-bold text-slate-700">
						{overview?.dataQuality?.completeness ? `${overview.dataQuality.completeness.toFixed(1)}%` : "99.7%"}
					</div>
					<p className="text-sm text-slate-600 mt-1">
						Continuous data stream
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
