import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MetricValue } from "../../types/common";

interface BaseMetricsDisplayProps {
	title: string;
	metrics: MetricValue[];
	isActive?: boolean;
	children?: React.ReactNode;
}

export function BaseMetricsDisplay({
	title,
	metrics,
	isActive = false,
	children,
}: BaseMetricsDisplayProps) {
	const formatValue = (metric: MetricValue): string => {
		if (metric.value === null || metric.value === undefined) {
			return "N/A";
		}

		switch (metric.format) {
			case "percentage":
				return `${Number(metric.value).toFixed(metric.precision || 1)}%`;
			case "coordinate":
				if (typeof metric.value === "object" && metric.value !== null) {
					const coord = metric.value as { x: number; y: number };
					return `(${coord.x.toFixed(metric.precision || 2)}, ${coord.y.toFixed(metric.precision || 2)})`;
				}
				return String(metric.value);
			case "number":
				return Number(metric.value).toFixed(metric.precision || 0);
			default:
				return String(metric.value);
		}
	};

	return (
		<Card className={isActive ? "ring-2 ring-blue-200" : ""}>
			<CardHeader>
				<CardTitle className="text-lg">{title}</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* 自定義內容 */}
				{children}

				{/* 數值指標 */}
				<div className="space-y-3">
					{metrics.map((metric, index) => (
						<div
							key={index}
							className="flex justify-between items-center"
						>
							<span className="text-sm font-medium text-gray-700">
								{metric.label}:
							</span>
							<span className="text-sm font-mono text-gray-900">
								{formatValue(metric)}
							</span>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
