"use client";

import { Badge } from "../../../../components/ui/badge";
import type { AnomalyEvent } from "../types";

interface EventListItemProps {
	event: AnomalyEvent;
	isSelected: boolean;
	onSelect: (event: AnomalyEvent) => void;
	meterLabel?: string;
}

export function EventListItem({
	event,
	isSelected,
	onSelect,
	meterLabel,
}: EventListItemProps) {
	const getStatusBadgeStyle = (status: string) => {
		switch (status) {
			case "CONFIRMED_POSITIVE":
				return "bg-green-100 text-green-800";
			case "REJECTED_NORMAL":
				return "bg-red-100 text-red-800";
			default:
				return "bg-yellow-100 text-yellow-800";
		}
	};

	const getStatusDisplayText = (status: string) => {
		switch (status) {
			case "CONFIRMED_POSITIVE":
				return "Confirmed Anomaly";
			case "REJECTED_NORMAL":
				return "Rejected Normal";
			default:
				return "Pending Review";
		}
	};

	return (
		<button
			type="button"
			onClick={() => onSelect(event)}
			className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md text-left w-full ${
				isSelected
					? "border-blue-500 bg-blue-50"
					: "border-gray-200 bg-white hover:border-gray-300"
			}`}
		>
			<div className="flex items-center justify-between mb-2">
				<span className="text-sm font-medium text-gray-800 truncate">
					{event.id}
				</span>
				<Badge className={getStatusBadgeStyle(event.status)}>
					{getStatusDisplayText(event.status)}
				</Badge>
			</div>

			<div className="text-xs text-gray-600 space-y-1">
				<div className="flex justify-between">
					<span>Meter ID:</span>
					<span className="font-medium">{event.meterId}</span>
				</div>
				{meterLabel && (
					<div className="flex justify-between">
						<span>Room:</span>
						<span
							className="font-medium truncate max-w-[12rem]"
							title={meterLabel}
						>
							{meterLabel}
						</span>
					</div>
				)}
				<div className="flex justify-between">
					<span>Time:</span>
					<span className="font-medium">
						{new Date(event.eventTimestamp)
							.toISOString()
							.replace("T", " ")
							.substring(0, 16)}
					</span>
				</div>
				<div className="flex justify-between">
					<span>Detection Rule:</span>
					<span className="font-medium text-orange-600 truncate">
						{event.detectionRule}
					</span>
				</div>
				{event.score && (
					<div className="flex justify-between">
						<span>Anomaly Score:</span>
						<span className="font-medium text-red-600">
							{event.score.toFixed(3)}
						</span>
					</div>
				)}
			</div>
		</button>
	);
}
