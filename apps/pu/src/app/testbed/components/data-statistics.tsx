import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MeterData } from "@/hooks/use-testbed-data";

interface DataStatisticsProps {
	meterData: MeterData;
}

export function DataStatistics({ meterData }: DataStatisticsProps) {
	return (
		<Card className="mt-4">
			<CardHeader>
				<CardTitle className="text-lg">Data Statistics</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					<div className="text-center">
						<div className="text-2xl font-bold text-slate-700">
							{meterData.statistics.totalDataPoints}
						</div>
						<p className="text-sm text-slate-600">Total Points</p>
					</div>
					<div className="text-center">
						<div className="text-2xl font-bold text-slate-700">
							{meterData.statistics.averagePower.toFixed(1)}W
						</div>
						<p className="text-sm text-slate-600">Average Power</p>
					</div>
					<div className="text-center">
						<div className="text-2xl font-bold text-slate-700">
							{meterData.statistics.maxPower.toFixed(1)}W
						</div>
						<p className="text-sm text-slate-600">Max Power</p>
					</div>
					<div className="text-center">
						<div className="text-2xl font-bold text-slate-700">
							{meterData.statistics.minPower.toFixed(1)}W
						</div>
						<p className="text-sm text-slate-600">Min Power</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
