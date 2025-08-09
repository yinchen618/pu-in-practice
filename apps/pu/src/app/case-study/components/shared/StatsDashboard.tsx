"use client";

import { BarChart3, Database, UserCheck } from "lucide-react";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../../../../components/ui/card";

interface StatsDashboardProps {
	stats: {
		total: number;
		unreviewed: number;
		confirmed: number;
		rejected: number;
	} | null;
	isLoading?: boolean;
}

export function StatsDashboard({
	stats,
	isLoading = false,
}: StatsDashboardProps) {
	if (isLoading) {
		return (
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				{[...Array(4)].map((_, i) => (
					<Card key={i}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								<div className="h-4 bg-gray-200 rounded animate-pulse" />
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="h-8 bg-gray-200 rounded animate-pulse mb-2" />
							<div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	if (!stats) {
		return null;
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
			{/* Total Events */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">
						Total Events
					</CardTitle>
					<Database className="size-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{stats.total}</div>
					<p className="text-xs text-muted-foreground">
						All anomaly candidate events detected by the system
					</p>
				</CardContent>
			</Card>

			{/* Pending Review */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">
						Pending Review
					</CardTitle>
					<UserCheck className="size-4 text-orange-500" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold text-orange-600">
						{stats.unreviewed}
					</div>
					<p className="text-xs text-muted-foreground">
						{stats.total > 0
							? ((stats.unreviewed / stats.total) * 100).toFixed(
									1,
								)
							: "0"}
						% remaining to process
					</p>
				</CardContent>
			</Card>

			{/* Confirmed Anomalies */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">
						Confirmed Anomalies
					</CardTitle>
					<BarChart3 className="size-4 text-green-500" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold text-green-600">
						{stats.confirmed}
					</div>
					<p className="text-xs text-muted-foreground">
						{stats.total > 0
							? ((stats.confirmed / stats.total) * 100).toFixed(1)
							: "0"}
						% anomaly rate
					</p>
				</CardContent>
			</Card>

			{/* Rejected Normal */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">
						Rejected Normal
					</CardTitle>
					<BarChart3 className="size-4 text-red-500" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold text-red-600">
						{stats.rejected}
					</div>
					<p className="text-xs text-muted-foreground">
						{stats.total > 0
							? ((stats.rejected / stats.total) * 100).toFixed(1)
							: "0"}
						% false positive rate
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
