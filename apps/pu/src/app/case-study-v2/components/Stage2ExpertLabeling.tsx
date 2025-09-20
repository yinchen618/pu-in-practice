"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
	CategoryScale,
	Chart as ChartJS,
	Legend,
	LineElement,
	LinearScale,
	PointElement,
	TimeScale,
	Title,
	Tooltip,
} from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";
import {
	AlertTriangle,
	Calendar,
	Check,
	Eye,
	Gauge,
	Play,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import "chartjs-adapter-date-fns";
import { toast } from "sonner";
import type { ExperimentRun } from "../types";

// Register Chart.js components
ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
	TimeScale,
	annotationPlugin,
);

// Anomaly event interface definition
interface AnomalyEvent {
	id: string;
	event_id: string;
	name?: string;
	dataset_id: string;
	line: string;
	event_timestamp: string;
	detection_rule?: string;
	score?: number;
	anomaly_score?: number;
	status: "UNREVIEWED" | "CONFIRMED_POSITIVE" | "REJECTED_NORMAL";
	data_window:
		| string
		| {
				startTime?: string;
				endTime?: string;
				duration?: string;
				start_time?: string;
				end_time?: string;
				raw?: string;
		  };
	reviewer_id?: string;
	review_timestamp?: string;
	justification_notes?: string;
	experiment_run_id?: string;
	created_at?: string;
	metadata?: any;
	dataset?: {
		name: string;
	};

	// Legacy fields for backwards compatibility
	eventId?: string;
	meter_id?: string; // Keep for backward compatibility
	meterId?: string;
	eventTimestamp?: string;
	detectionRule?: string;
	dataWindow?: any;
}

// Time series data point interface
interface DataPoint {
	timestamp: string;
	wattageTotal: number;
	wattage110v?: number;
	wattage220v?: number;
}

interface Stage2ExpertLabelingProps {
	experimentRun: ExperimentRun;
	onComplete: () => void;
}

export function Stage2ExpertLabeling({
	experimentRun,
	onComplete,
}: Stage2ExpertLabelingProps) {
	// State management
	const [events, setEvents] = useState<AnomalyEvent[]>([]);
	const [selectedEvent, setSelectedEvent] = useState<AnomalyEvent | null>(
		null,
	);
	const [chartData, setChartData] = useState<DataPoint[]>([]);
	const [loading, setLoading] = useState(false);
	const [justificationNotes, setJustificationNotes] = useState("");
	const [submitting, setSubmitting] = useState(false);

	// Chart display controls
	const [showWattage110v, setShowWattage110v] = useState(true);
	const [showWattage220v, setShowWattage220v] = useState(true);

	// Time range selection
	const [timeRange, setTimeRange] = useState("10min");

	// Pagination and sorting state
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage] = useState(100);
	const [totalItems, setTotalItems] = useState(0); // Total items in database
	const [sortField, setSortField] = useState<string>("event_timestamp");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

	// Time range options
	const timeRangeOptions = [
		{ value: "10min", label: "10 min", minutes: 10 },
		{ value: "6hour", label: "6 hours", minutes: 360 },
		{ value: "1day", label: "1 day", minutes: 1440 },
		{ value: "1week", label: "1 week", minutes: 10080 },
	];

	// Sort options
	const sortOptions = [
		{ value: "event_timestamp", label: "Event Time" },
		{ value: "wattageTotal", label: "Total Wattage" },
		{ value: "wattage110v", label: "110V Wattage" },
		{ value: "wattage220v", label: "220V Wattage" },
		{ value: "score", label: "Anomaly Score" },
	];

	// Load unreviewed events list with pagination
	const loadEvents = async (page = 1) => {
		setLoading(true);
		try {
			const offset = (page - 1) * itemsPerPage;
			const response = await fetch(
				`https://weakrisk.yinchen.tw/api/v2/anomaly-events?experiment_run_id=${experimentRun.id}&status=UNREVIEWED&limit=${itemsPerPage}&offset=${offset}`,
			);
			if (response.ok) {
				const data = await response.json();
				setEvents(data);

				// Get total count for pagination (separate API call if needed)
				const totalResponse = await fetch(
					`https://weakrisk.yinchen.tw/api/v2/anomaly-events?experiment_run_id=${experimentRun.id}&status=UNREVIEWED&count_only=true`,
				);
				if (totalResponse.ok) {
					const totalData = await totalResponse.json();
					setTotalItems(totalData.total || data.length);
				} else {
					// Fallback: use current data length
					setTotalItems(data.length);
				}

				// Auto-select first event if available and no current selection
				if (data.length > 0 && !selectedEvent) {
					setSelectedEvent(data[0]);
				}
			} else {
				console.error(
					"Failed to load events:",
					response.status,
					response.statusText,
				);
				toast.error("Failed to load events");
			}
		} catch (error) {
			console.error("Failed to load events:", error);
			toast.error("Failed to load events");
		} finally {
			setLoading(false);
		}
	};

	// Load chart data
	const loadChartData = async (event: AnomalyEvent) => {
		setLoading(true);
		try {
			// Get event time
			const eventTimestamp =
				event.event_timestamp || event.eventTimestamp || "";
			const eventTime = new Date(eventTimestamp);

			// Calculate new time range based on selected time interval
			const selectedOption = timeRangeOptions.find(
				(opt) => opt.value === timeRange,
			);
			const rangeMinutes = selectedOption?.minutes || 10;

			// Center around event time, take half the time range before and after
			const halfRange = (rangeMinutes * 60 * 1000) / 2; // Convert to milliseconds
			const startTime = new Date(
				eventTime.getTime() - halfRange,
			).toISOString();
			const endTime = new Date(
				eventTime.getTime() + halfRange,
			).toISOString();

			// Use new API endpoint with time range parameters
			const response = await fetch(
				`https://weakrisk.yinchen.tw/api/v2/anomaly-events/${event.id}/data?start_time=${encodeURIComponent(startTime)}&end_time=${encodeURIComponent(endTime)}`,
			);
			if (response.ok) {
				const data = await response.json();
				setChartData(data);
			} else {
				console.error(
					"Failed to load chart data:",
					response.status,
					response.statusText,
				);
				toast.error("Failed to load chart data");
			}
		} catch (error) {
			console.error("Failed to load chart data:", error);
			toast.error("Failed to load chart data");
		} finally {
			setLoading(false);
		}
	};

	// Submit review results
	const submitReview = async (
		status: "CONFIRMED_POSITIVE" | "REJECTED_NORMAL",
	) => {
		if (!selectedEvent) {
			return;
		}

		setSubmitting(true);
		try {
			const response = await fetch(
				`https://weakrisk.yinchen.tw/api/v2/anomaly-events/${selectedEvent.id}/review`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						status,
						reviewer_id: "current_user", // TODO: Get from auth system
						justification_notes: justificationNotes.trim() || null,
					}),
				},
			);

			if (response.ok) {
				// Remove reviewed event from list
				const updatedEvents = events.filter(
					(e) => e.id !== selectedEvent.id,
				);
				setEvents(updatedEvents);

				// Adjust pagination if necessary
				const newTotalPages = Math.ceil(
					updatedEvents.length / itemsPerPage,
				);
				if (currentPage > newTotalPages && newTotalPages > 0) {
					setCurrentPage(newTotalPages);
				}

				// Select next event from current page
				const sortedUpdatedEvents = getSortedEvents(updatedEvents);
				const startIndex = (currentPage - 1) * itemsPerPage;
				const currentPageEvents = sortedUpdatedEvents.slice(
					startIndex,
					startIndex + itemsPerPage,
				);

				if (currentPageEvents.length > 0) {
					setSelectedEvent(currentPageEvents[0]);
					setJustificationNotes("");
				} else if (sortedUpdatedEvents.length > 0) {
					// If current page is empty, go to first available event
					setSelectedEvent(sortedUpdatedEvents[0]);
					setCurrentPage(1);
					setJustificationNotes("");
				} else {
					setSelectedEvent(null);
					onComplete(); // All events reviewed
				}

				toast.success(
					`Event marked as ${status === "CONFIRMED_POSITIVE" ? "anomaly" : "normal"}`,
				);
			} else {
				console.error(
					"Failed to submit review:",
					response.status,
					response.statusText,
				);
				toast.error("Failed to submit review");
			}
		} catch (error) {
			console.error("Failed to submit review:", error);
			toast.error("Failed to submit review");
		} finally {
			setSubmitting(false);
		}
	};

	// Confirm all events as anomaly
	const confirmAllAsAnomaly = async () => {
		if (totalItems === 0) {
			return;
		}

		// Confirm with user before proceeding
		if (
			!window.confirm(
				`Are you sure you want to confirm all ${totalItems} unreviewed events as anomalies? This action cannot be undone.`,
			)
		) {
			return;
		}

		setSubmitting(true);
		try {
			// Send bulk review request for all unreviewed events in the experiment
			const response = await fetch(
				"https://weakrisk.yinchen.tw/api/v2/anomaly-events/bulk-review-by-experiment",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						experiment_run_id: experimentRun.id,
						status: "CONFIRMED_POSITIVE",
						reviewer_id: "current_user", // TODO: Get from auth system
						justification_notes:
							"Bulk confirmed all remaining events as anomaly",
					}),
				},
			);

			if (response.ok) {
				const result = await response.json();

				// Clear all events and complete the stage
				setEvents([]);
				setSelectedEvent(null);
				setTotalItems(0);
				onComplete();

				toast.success(
					`Successfully confirmed ${result.total_updated} events as anomalies`,
				);
			} else {
				console.error(
					"Failed to submit bulk review:",
					response.status,
					response.statusText,
				);
				toast.error("Failed to submit bulk review");
			}
		} catch (error) {
			console.error("Failed to submit bulk review:", error);
			toast.error("Failed to submit bulk review");
		} finally {
			setSubmitting(false);
		}
	};

	// Handle Stage 3 transition
	const handleStage3Transition = async () => {
		// Check if all events are labeled (totalItems should be 0)
		if (totalItems > 0) {
			toast.error(
				`Cannot proceed to Stage 3. Please complete labeling of all ${totalItems} remaining events.`,
			);
			return;
		}

		// Confirm with user before proceeding
		if (
			!window.confirm(
				"Are you sure you want to proceed to Stage 3? This will complete the expert labeling phase and move to the next stage.",
			)
		) {
			return;
		}

		setSubmitting(true);
		try {
			const response = await fetch(
				`https://weakrisk.yinchen.tw/api/v2/experiment-runs/${experimentRun.id}/status`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						status: "COMPLETED",
					}),
				},
			);

			if (response.ok) {
				const result = await response.json();
				toast.success("Successfully advanced to Stage 3!");

				// Call the onComplete callback to refresh parent component
				onComplete();
			} else {
				const errorData = await response.json();
				console.error(
					"Failed to update experiment status:",
					response.status,
					errorData,
				);
				toast.error(errorData.detail || "Failed to advance to Stage 3");
			}
		} catch (error) {
			console.error("Failed to update experiment status:", error);
			toast.error("Failed to advance to Stage 3");
		} finally {
			setSubmitting(false);
		}
	};

	// Reject items in current page
	const rejectCurrentPageItems = async () => {
		const currentPageEvents = getCurrentPageEvents();

		if (currentPageEvents.length === 0) {
			return;
		}

		// Confirm with user before proceeding
		if (
			!window.confirm(
				`Are you sure you want to reject all ${currentPageEvents.length} items on this page as normal? This action cannot be undone.`,
			)
		) {
			return;
		}

		setSubmitting(true);
		try {
			// Send bulk review request for current page items
			const response = await fetch(
				"https://weakrisk.yinchen.tw/api/v2/anomaly-events/bulk-review",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						event_ids: currentPageEvents.map(
							(event: AnomalyEvent) => event.id,
						),
						status: "REJECTED_NORMAL",
						reviewer_id: "current_user", // TODO: Get from auth system
						justification_notes:
							"Bulk rejected as normal from current page",
					}),
				},
			);

			if (response.ok) {
				// After bulk rejection, reload current page
				await loadEvents(currentPage);

				toast.success(
					`Successfully rejected ${currentPageEvents.length} items as normal`,
				);
			} else {
				console.error(
					"Failed to submit bulk rejection:",
					response.status,
					response.statusText,
				);
				toast.error("Failed to submit bulk rejection");
			}
		} catch (error) {
			console.error("Failed to submit bulk rejection:", error);
			toast.error("Failed to submit bulk rejection");
		} finally {
			setSubmitting(false);
		}
	};

	// Event selection handler
	const handleEventSelect = (event: AnomalyEvent) => {
		setSelectedEvent(event);
		setJustificationNotes("");
	};

	// Sorting function
	const getSortedEvents = (eventsToSort: AnomalyEvent[]) => {
		return [...eventsToSort].sort((a: AnomalyEvent, b: AnomalyEvent) => {
			let aValue: any;
			let bValue: any;

			switch (sortField) {
				case "event_timestamp":
					aValue = new Date(
						a.event_timestamp || a.eventTimestamp || "",
					).getTime();
					bValue = new Date(
						b.event_timestamp || b.eventTimestamp || "",
					).getTime();
					break;
				case "score":
					aValue = a.score || a.anomaly_score || 0;
					bValue = b.score || b.anomaly_score || 0;
					break;
				case "wattageTotal":
					// Extract from data_window if available
					aValue = getWattageFromDataWindow(
						a.data_window,
						"wattageTotal",
					);
					bValue = getWattageFromDataWindow(
						b.data_window,
						"wattageTotal",
					);
					break;
				case "wattage110v":
					aValue = getWattageFromDataWindow(
						a.data_window,
						"wattage110v",
					);
					bValue = getWattageFromDataWindow(
						b.data_window,
						"wattage110v",
					);
					break;
				case "wattage220v":
					aValue = getWattageFromDataWindow(
						a.data_window,
						"wattage220v",
					);
					bValue = getWattageFromDataWindow(
						b.data_window,
						"wattage220v",
					);
					break;
				default:
					aValue = 0;
					bValue = 0;
			}

			if (sortOrder === "asc") {
				return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
			}
			return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
		});
	};

	// Helper function to extract wattage from data_window
	const getWattageFromDataWindow = (
		dataWindow: any,
		field: string,
	): number => {
		if (!dataWindow) {
			return 0;
		}

		try {
			let parsed = dataWindow;
			if (typeof dataWindow === "string") {
				parsed = JSON.parse(dataWindow);
			}
			return parsed[field] || 0;
		} catch {
			return 0;
		}
	};

	// Get current page events (no longer need local pagination since I fetch by page)
	const getCurrentPageEvents = () => {
		return events; // Events are already paginated from backend
	};

	// Calculate total pages based on total items from backend
	const totalPages = Math.ceil(totalItems / itemsPerPage);

	// Handle sort change
	const handleSortChange = (field: string) => {
		if (field === sortField) {
			setSortOrder(sortOrder === "asc" ? "desc" : "asc");
		} else {
			setSortField(field);
			setSortOrder("asc");
		}
		setCurrentPage(1); // Reset to first page when sorting changes
		loadEvents(1); // Reload first page with new sort
	};

	// Handle page change
	const handlePageChange = (newPage: number) => {
		if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
			setCurrentPage(newPage);
			loadEvents(newPage);
		}
	};

	// Initialize and load data when experiment changes
	useEffect(() => {
		setCurrentPage(1); // Reset to first page
		loadEvents(1); // Load first page
	}, [experimentRun.id]);

	useEffect(() => {
		if (selectedEvent) {
			loadChartData(selectedEvent);
		}
	}, [selectedEvent, timeRange]); // Reload data when selected event or time range changes

	// Chart configuration
	const chartOptions = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				position: "top" as const,
			},
			title: {
				display: true,
				text: "Power Usage Trend Analysis",
			},
		},
		scales: {
			x: {
				type: "time" as const,
				time: {
					displayFormats: {
						hour: "HH:mm",
						day: "MM/dd",
					},
				},
				title: {
					display: true,
					text: "Time",
				},
			},
			y: {
				title: {
					display: true,
					text: "Wattage (W)",
				},
			},
		},
	} as any;

	const getChartData = () => {
		if (!chartData.length) {
			return { labels: [], datasets: [] };
		}

		// Get event time to mark special points
		const eventTime = selectedEvent
			? new Date(
					selectedEvent.event_timestamp ||
						selectedEvent.eventTimestamp ||
						"",
				).getTime()
			: null;

		const datasets = [
			{
				label: "Total Wattage",
				data: chartData.map((d) => d.wattageTotal),
				borderColor: "rgb(59, 130, 246)",
				backgroundColor: "rgba(59, 130, 246, 0.1)",
				tension: 0.1,
				pointRadius: chartData.map((d) => {
					// If it's a point near event time, use larger point
					if (
						eventTime &&
						Math.abs(new Date(d.timestamp).getTime() - eventTime) <
							60000
					) {
						return 8;
					}
					return 3;
				}),
				pointBackgroundColor: chartData.map((d) => {
					// If it's a point near event time, use red color
					if (
						eventTime &&
						Math.abs(new Date(d.timestamp).getTime() - eventTime) <
							60000
					) {
						return "rgba(255, 99, 132, 0.8)";
					}
					return "rgb(59, 130, 246)";
				}),
				pointBorderColor: chartData.map((d) => {
					// If it's a point near event time, use red border
					if (
						eventTime &&
						Math.abs(new Date(d.timestamp).getTime() - eventTime) <
							60000
					) {
						return "rgba(255, 99, 132, 1)";
					}
					return "rgb(59, 130, 246)";
				}),
				pointBorderWidth: chartData.map((d) => {
					// If it's a point near event time, use thicker border
					if (
						eventTime &&
						Math.abs(new Date(d.timestamp).getTime() - eventTime) <
							60000
					) {
						return 3;
					}
					return 1;
				}),
			},
		];

		// Add 110V wattage line
		if (
			showWattage110v &&
			chartData.some((d) => d.wattage110v !== undefined)
		) {
			datasets.push({
				label: "110V Wattage",
				data: chartData.map((d) => d.wattage110v || 0),
				borderColor: "rgb(34, 197, 94)",
				backgroundColor: "rgba(34, 197, 94, 0.1)",
				tension: 0.1,
				pointRadius: 2,
				pointBackgroundColor: "rgb(34, 197, 94)",
				pointBorderColor: "rgb(34, 197, 94)",
				pointBorderWidth: 1,
			} as any);
		}

		// Add 220V wattage line
		if (
			showWattage220v &&
			chartData.some((d) => d.wattage220v !== undefined)
		) {
			datasets.push({
				label: "220V Wattage",
				data: chartData.map((d) => d.wattage220v || 0),
				borderColor: "rgb(168, 85, 247)",
				backgroundColor: "rgba(168, 85, 247, 0.1)",
				tension: 0.1,
				pointRadius: 2,
				pointBackgroundColor: "rgb(168, 85, 247)",
				pointBorderColor: "rgb(168, 85, 247)",
				pointBorderWidth: 1,
			} as any);
		}

		return {
			labels: chartData.map((d) => new Date(d.timestamp)),
			datasets,
		};
	};

	return (
		<div className="space-y-6">
			{/* Statistical overview */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Play className="h-5 w-5" />
						Stage 2: Expert Labeling - Anomaly Event Review
						Dashboard
					</CardTitle>
					<CardDescription>
						Review anomaly event candidates generated in Stage 1 to
						establish high-quality labels for model training
					</CardDescription>
				</CardHeader>
				<CardContent>
					{/* Candidate Review Statistics */}
					<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
						<div className="text-center">
							<div className="text-2xl font-bold">
								{experimentRun.candidate_count || 0}
							</div>
							<div className="text-sm text-muted-foreground">
								Total Candidates
							</div>
							<div className="text-xs text-gray-500 mt-1">
								From total data pool
							</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-orange-600">
								{Math.max(
									0,
									(experimentRun.candidate_count || 0) -
										(experimentRun.positive_label_count ||
											0) -
										(experimentRun.negative_label_count ||
											0),
								)}
							</div>
							<div className="text-sm text-muted-foreground">
								Pending Review
							</div>
							<div className="text-xs text-gray-500 mt-1">
								Need manual labeling
							</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-green-600">
								{experimentRun.positive_label_count || 0}
							</div>
							<div className="text-sm text-muted-foreground">
								Confirmed Anomalies
							</div>
							<div className="text-xs text-gray-500 mt-1">
								Expert validated positive
							</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-blue-600">
								{experimentRun.negative_label_count || 0}
							</div>
							<div className="text-sm text-muted-foreground">
								Confirmed Normal
							</div>
							<div className="text-xs text-gray-500 mt-1">
								Expert validated negative
							</div>
						</div>
					</div>

					<div className="mt-4">
						<div className="flex items-center justify-between">
							<span>Review Progress:</span>
							<Badge variant="outline">
								{(experimentRun.positive_label_count || 0) +
									(experimentRun.negative_label_count ||
										0)}{" "}
								/ {experimentRun.candidate_count || 0} labeled
							</Badge>
						</div>
						{(experimentRun.total_data_pool_size || 0) > 0 && (
							<div className="flex items-center justify-between mt-2">
								<span className="text-sm text-gray-600">
									Data Pool Coverage:
								</span>
								<Badge variant="secondary">
									{experimentRun.candidate_count || 0}{" "}
									candidates from{" "}
									{(
										experimentRun.total_data_pool_size || 0
									).toLocaleString()}{" "}
									total records (
									{(experimentRun.total_data_pool_size || 0) >
									0
										? (
												((experimentRun.candidate_count ||
													0) /
													(experimentRun.total_data_pool_size ||
														1)) *
												100
											).toFixed(3)
										: 0}
									%)
								</Badge>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Three-column layout: Event List | Chart Visualization | Labeling Tools */}
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
				{/* Left column: Event List */}
				<Card className="lg:col-span-3">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Eye className="h-4 w-4" />
							Events Pending Review
						</CardTitle>
						{/* Sort controls */}
						<div className="flex items-center gap-2 text-sm">
							<label htmlFor="sort-field">Sort by:</label>
							<select
								id="sort-field"
								value={sortField}
								onChange={(e) =>
									handleSortChange(e.target.value)
								}
								className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
							>
								{sortOptions.map((option) => (
									<option
										key={option.value}
										value={option.value}
									>
										{option.label}
									</option>
								))}
							</select>
							<button
								type="button"
								onClick={() => handleSortChange(sortField)}
								className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
								title={`Switch to ${sortOrder === "asc" ? "descending" : "ascending"} order`}
							>
								{sortOrder === "asc" ? "↑" : "↓"}
							</button>
						</div>
					</CardHeader>
					<CardContent className="p-0">
						<div className="h-[400px] overflow-y-auto">
							{getCurrentPageEvents().map(
								(event: AnomalyEvent) => (
									<button
										key={event.id}
										className={`w-full text-left p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
											selectedEvent?.id === event.id
												? "bg-blue-50 border-blue-200"
												: ""
										}`}
										onClick={() => handleEventSelect(event)}
										type="button"
									>
										<div className="space-y-2">
											<div className="flex items-center justify-between">
												<Badge
													variant="outline"
													className="text-xs"
												>
													{event.detection_rule ||
														event.detectionRule ||
														"N/A"}
												</Badge>
												<div className="flex items-center gap-1 text-sm text-orange-600">
													<Gauge className="h-3 w-3" />
													{(
														event.score ||
														event.anomaly_score ||
														0
													).toFixed(2)}
												</div>
											</div>
											<div className="text-sm font-medium">
												{event.name ||
													`${event.dataset?.name || "Unknown Dataset"} - ${event.line || "L1"}`}
											</div>
											<div className="flex items-center gap-1 text-xs text-muted-foreground">
												<Calendar className="h-3 w-3" />
												{new Date(
													event.event_timestamp ||
														event.eventTimestamp ||
														"",
												).toLocaleString()}
											</div>
											{/* Display power data */}
											<div className="text-xs text-muted-foreground space-y-1">
												<div>
													Total:{" "}
													{getWattageFromDataWindow(
														event.data_window,
														"wattageTotal",
													).toFixed(1)}
													W
												</div>
												<div className="flex gap-2">
													<span>
														110V:{" "}
														{getWattageFromDataWindow(
															event.data_window,
															"wattage110v",
														).toFixed(1)}
														W
													</span>
													<span>
														220V:{" "}
														{getWattageFromDataWindow(
															event.data_window,
															"wattage220v",
														).toFixed(1)}
														W
													</span>
												</div>
											</div>
										</div>
									</button>
								),
							)}
							{events.length === 0 && (
								<div className="p-8 text-center text-muted-foreground">
									{loading
										? "Loading..."
										: "All events have been reviewed"}
								</div>
							)}
						</div>

						{/* Pagination controls */}
						{events.length > 0 && (
							<div className="p-4 border-t bg-gray-50">
								<div className="flex flex-col items-center gap-3 text-sm">
									{/* Bulk action buttons */}
									<div className="flex flex-col gap-2">
										<Button
											onClick={confirmAllAsAnomaly}
											disabled={
												submitting ||
												events.length === 0
											}
											className="bg-rose-700 hover:bg-rose-800 text-white"
											size="sm"
										>
											<Check className="h-4 w-4 mr-2" />
											Confirm all as Anomaly ({totalItems}
											)
										</Button>

										<Button
											onClick={rejectCurrentPageItems}
											disabled={
												submitting ||
												getCurrentPageEvents()
													.length === 0
											}
											className="bg-gray-600 hover:bg-gray-700 text-white"
											size="sm"
										>
											<X className="h-4 w-4 mr-2" />
											Reject Items on This Page (
											{getCurrentPageEvents().length})
										</Button>
									</div>

									<div className="text-muted-foreground">
										Showing{" "}
										{(currentPage - 1) * itemsPerPage + 1}-
										{Math.min(
											currentPage * itemsPerPage,
											totalItems,
										)}{" "}
										of {totalItems} items
									</div>
									<div className="flex items-center gap-2">
										<button
											type="button"
											onClick={() =>
												handlePageChange(
													currentPage - 1,
												)
											}
											disabled={currentPage === 1}
											className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
										>
											Previous
										</button>
										<span className="px-2">
											{currentPage} / {totalPages}
										</span>
										<button
											type="button"
											onClick={() =>
												handlePageChange(
													currentPage + 1,
												)
											}
											disabled={
												currentPage === totalPages
											}
											className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
										>
											Next
										</button>
									</div>
								</div>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Middle column: Chart Visualization */}
				<Card className="lg:col-span-6">
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle>Time Series Visualization</CardTitle>
							{/* Control area */}
							<div className="flex items-center gap-6">
								{/* 時間區間選擇 */}
								<div className="flex items-center gap-2">
									<label
										htmlFor="time-range-select"
										className="text-sm font-medium"
									>
										Time Range:
									</label>
									<select
										id="time-range-select"
										value={timeRange}
										onChange={(e) =>
											setTimeRange(e.target.value)
										}
										className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
									>
										{timeRangeOptions.map((option) => (
											<option
												key={option.value}
												value={option.value}
											>
												{option.label}
											</option>
										))}
									</select>
								</div>
								{/* Line display controls */}
								<div className="flex items-center gap-4">
									<label className="flex items-center gap-2 text-sm">
										<input
											type="checkbox"
											checked={showWattage110v}
											onChange={(e) =>
												setShowWattage110v(
													e.target.checked,
												)
											}
											className="rounded"
										/>
										<span className="text-green-600">
											110V Wattage
										</span>
									</label>
									<label className="flex items-center gap-2 text-sm">
										<input
											type="checkbox"
											checked={showWattage220v}
											onChange={(e) =>
												setShowWattage220v(
													e.target.checked,
												)
											}
											className="rounded"
										/>
										<span className="text-purple-600">
											220V Wattage
										</span>
									</label>
								</div>
							</div>
						</div>
						{selectedEvent && (
							<CardDescription>
								Event Time:{" "}
								{new Date(
									selectedEvent.event_timestamp ||
										selectedEvent.eventTimestamp ||
										"",
								).toLocaleString()}{" "}
								| Dataset:{" "}
								{selectedEvent.dataset?.name || "Unknown"} |
								Line: {selectedEvent.line || "L1"} | Rule:{" "}
								{selectedEvent.detection_rule ||
									selectedEvent.detectionRule ||
									"N/A"}
							</CardDescription>
						)}
					</CardHeader>
					<CardContent>
						{selectedEvent ? (
							<div className="h-[400px]">
								{loading ? (
									<div className="flex items-center justify-center h-full">
										<div>Loading chart data...</div>
									</div>
								) : (
									<Line
										data={getChartData()}
										options={chartOptions}
									/>
								)}
							</div>
						) : (
							<div className="flex items-center justify-center h-[400px] text-muted-foreground">
								Please select an event to view detailed data
							</div>
						)}
					</CardContent>
				</Card>

				{/* Right column: Labeling Tools */}
				<Card className="lg:col-span-3">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<AlertTriangle className="h-4 w-4" />
							Labeling Tools
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{selectedEvent ? (
							<>
								{/* Event Details */}
								<div className="space-y-2 text-sm">
									<div>
										<strong>Event ID:</strong>{" "}
										{selectedEvent.event_id ||
											selectedEvent.eventId ||
											selectedEvent.id}
									</div>
									<div>
										<strong>Detection Score:</strong>{" "}
										{(
											selectedEvent.score ||
											selectedEvent.anomaly_score ||
											0
										).toFixed(3)}
									</div>
									<div>
										<strong>Data Window:</strong> {(() => {
											if (
												typeof selectedEvent.data_window ===
												"string"
											) {
												try {
													const parsed = JSON.parse(
														selectedEvent.data_window,
													);
													return (
														parsed.duration || "N/A"
													);
												} catch {
													return selectedEvent.data_window;
												}
											} else if (
												selectedEvent.data_window
											) {
												return (
													selectedEvent.data_window
														.duration || "N/A"
												);
											}
											return "N/A";
										})()}
									</div>
								</div>

								<Separator />

								{/* Labeling Justification Input */}
								<div className="space-y-2">
									<label
										htmlFor="justification"
										className="text-sm font-medium"
									>
										Labeling Reason (Optional):
									</label>
									<Textarea
										id="justification"
										placeholder="Please describe your decision basis..."
										value={justificationNotes}
										onChange={(e) =>
											setJustificationNotes(
												e.target.value,
											)
										}
										className="min-h-[80px]"
									/>
								</div>

								<Separator />

								{/* Labeling Buttons */}
								<div className="space-y-2">
									<Button
										onClick={() =>
											submitReview("CONFIRMED_POSITIVE")
										}
										disabled={submitting}
										className="w-full bg-rose-700 hover:bg-rose-800"
									>
										<Check className="h-4 w-4 mr-2" />
										Confirm as Anomaly
									</Button>
									<Button
										onClick={() =>
											submitReview("REJECTED_NORMAL")
										}
										disabled={submitting}
										variant="outline"
										className="w-full"
									>
										<X className="h-4 w-4 mr-2" />
										Reject as Normal
									</Button>
								</div>

								{submitting && (
									<div className="text-center text-sm text-muted-foreground">
										Submitting...
									</div>
								)}
							</>
						) : (
							<div className="text-center text-muted-foreground">
								Please select an event for labeling
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Stage Transition Controls */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Play className="h-5 w-5" />
						Stage Progression
					</CardTitle>
					<CardDescription>
						Complete Stage 2 expert labeling and proceed to Stage 3
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="text-center space-y-4">
						<div className="text-sm text-muted-foreground">
							Current Status:{" "}
							<span className="font-medium">
								{experimentRun.status}
							</span>
						</div>
						<Button
							onClick={handleStage3Transition}
							disabled={submitting || totalItems > 0}
							className="bg-blue-600 hover:bg-blue-700 text-white"
							size="lg"
						>
							<Play className="h-4 w-4 mr-2" />
							Proceed to Stage 3
						</Button>
						{totalItems > 0 && (
							<div className="text-sm text-amber-600">
								Please complete all labeling before proceeding
								to Stage 3
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
