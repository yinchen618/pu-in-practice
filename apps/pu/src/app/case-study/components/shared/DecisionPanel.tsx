"use client";

import { Clock, Filter, User } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "../../../../components/ui/alert";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Label } from "../../../../components/ui/label";
import { Textarea } from "../../../../components/ui/textarea";
import type { AnomalyEvent } from "../types";

interface DecisionPanelProps {
	selectedEvent: AnomalyEvent | null;
	onLabelSubmit?: (eventId: string, label: string, notes?: string) => void;
	isSubmitting?: boolean;
}

export function DecisionPanel({
	selectedEvent,
	onLabelSubmit,
	isSubmitting = false,
}: DecisionPanelProps) {
	const [notes, setNotes] = useState("");
	const [error, setError] = useState<string | null>(null);

	// Empty state component
	const EmptyStateCard = () => (
		<div className="h-full flex items-center justify-center">
			<div className="text-center text-gray-500">
				<Filter className="size-12 mx-auto mb-4 text-gray-300" />
				<p className="text-lg font-medium mb-2">
					Select Event to Start Review
				</p>
				<p className="text-sm">
					Choose an event from the left panel to begin the review and
					labeling process
				</p>
			</div>
		</div>
	);

	// Action card component (pending labeling state)
	const ActionCard = () => {
		if (!selectedEvent || !onLabelSubmit) {
			return null;
		}

		const handleLabelClick = async (label: string) => {
			setError(null);
			try {
				await onLabelSubmit(selectedEvent.id, label, notes);
				setNotes(""); // Clear notes after success
			} catch (err) {
				setError(
					err instanceof Error
						? err.message
						: "Labeling failed, please try again",
				);
			}
		};

		return (
			<div className="space-y-6">
				{/* Event Basic Information */}
				<div className="space-y-3">
					<div>
						<span className="text-gray-600">Event ID:</span>{" "}
						<span className="font-medium font-mono text-sm">
							{selectedEvent.id}
						</span>
					</div>
					<div>
						<span className="text-gray-600">Meter ID:</span>{" "}
						<span className="font-medium">
							{selectedEvent.meterId}
						</span>
					</div>
					<div>
						<span className="text-gray-600">Current Status:</span>{" "}
						<Badge className="bg-yellow-100 text-yellow-800">
							Pending Review
						</Badge>
					</div>
					<div>
						<span className="text-gray-600">Detection Rule:</span>{" "}
						<span className="font-medium">
							{selectedEvent.detectionRule}
						</span>
					</div>
					{selectedEvent.score && (
						<div>
							<span className="text-gray-600">
								Anomaly Score:
							</span>{" "}
							<span className="font-medium text-orange-600">
								{selectedEvent.score.toFixed(3)}
							</span>
						</div>
					)}
				</div>

				{/* Error Message */}
				{error && (
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				{/* Decision Buttons */}
				<div className="space-y-3">
					<Label className="text-sm font-medium">
						Decision Action:
					</Label>
					<div className="space-y-2">
						<Button
							onClick={() =>
								handleLabelClick("CONFIRMED_POSITIVE")
							}
							className="w-full"
							variant="default"
							disabled={isSubmitting}
						>
							✓ Confirm as Anomaly Event
						</Button>
						<Button
							onClick={() => handleLabelClick("REJECTED_NORMAL")}
							variant="outline"
							className="w-full border-red-300 text-red-700 hover:bg-red-50"
							disabled={isSubmitting}
						>
							✗ Reject as Normal
						</Button>
					</div>
				</div>

				{/* Notes Section */}
				<div className="space-y-2">
					<Label htmlFor="notes" className="text-sm font-medium">
						Review Notes (Optional)
					</Label>
					<Textarea
						id="notes"
						placeholder="Describe your reasoning..."
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
						rows={3}
						className="resize-none"
					/>
					<p className="text-xs text-gray-500">
						e.g., Confirmed anomaly - suspected equipment failure,
						high consumption during abnormal hours
					</p>
				</div>
			</div>
		);
	};

	// Review card component (already labeled state)
	const ReviewCard = () => {
		if (!selectedEvent) {
			return null;
		}

		const getStatusInfo = (status: string) => {
			switch (status) {
				case "CONFIRMED_POSITIVE":
					return {
						text: "Confirmed Anomaly",
						className: "bg-green-100 text-green-800",
						icon: "✓",
					};
				case "REJECTED_NORMAL":
					return {
						text: "Rejected Normal",
						className: "bg-red-100 text-red-800",
						icon: "✗",
					};
				default:
					return {
						text: "Pending Review",
						className: "bg-yellow-100 text-yellow-800",
						icon: "?",
					};
			}
		};

		const statusInfo = getStatusInfo(selectedEvent.status);
		const isReviewed = selectedEvent.status !== "UNREVIEWED";

		return (
			<div className="space-y-6">
				{/* Event Basic Information */}
				<div className="space-y-3">
					<div>
						<span className="text-gray-600">Event ID:</span>{" "}
						<span className="font-medium font-mono text-sm">
							{selectedEvent.id}
						</span>
					</div>
					<div>
						<span className="text-gray-600">Meter ID:</span>{" "}
						<span className="font-medium">
							{selectedEvent.meterId}
						</span>
					</div>
					<div>
						<span className="text-gray-600">Status:</span>{" "}
						<Badge className={statusInfo.className}>
							{statusInfo.icon} {statusInfo.text}
						</Badge>
					</div>
					<div>
						<span className="text-gray-600">Detection Rule:</span>{" "}
						<span className="font-medium">
							{selectedEvent.detectionRule}
						</span>
					</div>
					{selectedEvent.score && (
						<div>
							<span className="text-gray-600">
								Anomaly Score:
							</span>{" "}
							<span className="font-medium text-orange-600">
								{selectedEvent.score.toFixed(3)}
							</span>
						</div>
					)}
				</div>

				{/* Review Information */}
				{isReviewed && (
					<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
						<div className="flex items-center gap-2 mb-2">
							<User className="size-4 text-blue-600" />
							<span className="font-medium text-blue-800">
								Review Completed
							</span>
						</div>
						<p className="text-sm text-blue-700 mb-2">
							This event has been reviewed. Review time:
							{selectedEvent.reviewTimestamp
								? new Date(selectedEvent.reviewTimestamp)
										.toISOString()
										.replace("T", " ")
										.substring(0, 16)
								: "Unknown"}
						</p>
						{selectedEvent.justificationNotes && (
							<div>
								<span className="text-sm font-medium text-blue-800">
									Review Notes:
								</span>
								<p className="text-sm text-blue-700 mt-1">
									{selectedEvent.justificationNotes}
								</p>
							</div>
						)}
					</div>
				)}

				{/* Time Information */}
				<div className="border-t pt-4 space-y-2">
					<div className="flex items-center gap-2 text-xs text-gray-600">
						<Clock className="size-3" />
						<span>
							Event Created:
							{new Date(selectedEvent.createdAt)
								.toISOString()
								.replace("T", " ")
								.substring(0, 16)}
						</span>
					</div>
					{selectedEvent.updatedAt !== selectedEvent.createdAt && (
						<div className="flex items-center gap-2 text-xs text-gray-600">
							<Clock className="size-3" />
							<span>
								Last Updated:
								{new Date(selectedEvent.updatedAt)
									.toISOString()
									.replace("T", " ")
									.substring(0, 16)}
							</span>
						</div>
					)}
				</div>
			</div>
		);
	};

	// Main rendering logic
	if (!selectedEvent) {
		return (
			<div className="h-full border rounded-lg bg-white p-4">
				<EmptyStateCard />
			</div>
		);
	}

	return (
		<div className="h-full border rounded-lg bg-white p-4">
			<div className="mb-4">
				<h3 className="text-lg font-semibold text-gray-800">
					Review & Decision
				</h3>
			</div>

			<div className="h-[calc(100%-3rem)] overflow-y-auto">
				{selectedEvent.status === "UNREVIEWED" ? (
					<ActionCard />
				) : (
					<ReviewCard />
				)}
			</div>
		</div>
	);
}
