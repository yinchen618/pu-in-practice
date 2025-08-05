import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import type { AlgorithmStepConfig, StepStatus } from "../../types/common";

interface BaseAlgorithmStepsPanelProps {
	title: string;
	steps: AlgorithmStepConfig[];
	getStepStatus: (stepId: string) => StepStatus;
}

export function BaseAlgorithmStepsPanel({
	title,
	steps,
	getStepStatus,
}: BaseAlgorithmStepsPanelProps) {
	const getStepIcon = (status: StepStatus) => {
		switch (status) {
			case "completed":
				return <CheckCircle2 className="h-5 w-5 text-green-500" />;
			case "active":
				return (
					<Clock className="h-5 w-5 text-blue-500 animate-pulse" />
				);
			default:
				return <Circle className="h-5 w-5 text-gray-300" />;
		}
	};

	const getStepBadge = (status: StepStatus) => {
		switch (status) {
			case "completed":
				return (
					<Badge
						variant="secondary"
						className="bg-green-100 text-green-800"
					>
						已完成
					</Badge>
				);
			case "active":
				return (
					<Badge
						variant="secondary"
						className="bg-blue-100 text-blue-800"
					>
						進行中
					</Badge>
				);
			default:
				return (
					<Badge
						variant="secondary"
						className="bg-gray-100 text-gray-600"
					>
						等待中
					</Badge>
				);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">{title}</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{steps.map((step) => {
					const status = getStepStatus(step.id);
					return (
						<div key={step.id} className="space-y-2">
							<div className="flex items-center gap-3">
								{getStepIcon(status)}
								<div className="flex-1">
									<div className="flex items-center justify-between">
										<h4 className="font-medium text-gray-900">
											{step.title}
										</h4>
										{getStepBadge(status)}
									</div>
									<p className="text-sm text-gray-600">
										{step.description}
									</p>
								</div>
							</div>
							{status === "active" && (
								<div className="ml-8 space-y-1">
									{step.details.map(
										(detail: string, index: number) => (
											<div
												key={index}
												className="text-xs text-gray-500 flex items-center gap-2"
											>
												<div className="w-1 h-1 bg-gray-400 rounded-full" />
												{detail}
											</div>
										),
									)}
								</div>
							)}
						</div>
					);
				})}
			</CardContent>
		</Card>
	);
}
