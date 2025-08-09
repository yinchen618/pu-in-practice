"use client";

import { RefreshCw, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../../../components/ui/select";
import type { AnomalyEvent } from "../types";
import { EventListItem } from "./EventListItem";

interface EventListProps {
	events: AnomalyEvent[];
	selectedEventId?: string;
	isLoading?: boolean;
	onEventSelect: (event: AnomalyEvent) => void;
	onRefresh?: () => void;
	showSearch?: boolean;
	showStatusFilter?: boolean;
	// 分頁相關
	total?: number;
	page?: number;
	limit?: number;
	onPageChange?: (page: number) => void;
	onFiltersChange?: (filters: any) => void;
	meterLabelMap?: Record<string, string>;
}

export function EventList({
	events,
	selectedEventId,
	isLoading = false,
	onEventSelect,
	onRefresh,
	showSearch = true,
	showStatusFilter = true,
	total = 0,
	page = 1,
	limit = 50,
	onPageChange,
	onFiltersChange,
	meterLabelMap = {},
}: EventListProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");

	// 處理篩選變更
	const handleFilterChange = (
		newSearchTerm?: string,
		newStatusFilter?: string,
	) => {
		const search = newSearchTerm !== undefined ? newSearchTerm : searchTerm;
		const status =
			newStatusFilter !== undefined ? newStatusFilter : statusFilter;

		if (onFiltersChange) {
			const filters: any = {};
			if (search) {
				filters.search = search;
			}
			if (status !== "all") {
				filters.status = status;
			}
			onFiltersChange(filters);
		}
	};

	// 使用所有事件，不進行前端篩選（已由後端處理）
	const displayEvents = events || [];

	return (
		<div className="h-full flex flex-col">
			{/* Title and Refresh Button */}
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-lg font-semibold text-gray-800">
					Anomaly Candidates
				</h3>
				{onRefresh && (
					<Button
						variant="outline"
						size="sm"
						onClick={onRefresh}
						disabled={isLoading}
					>
						<RefreshCw
							className={`size-4 mr-1 ${
								isLoading ? "animate-spin" : ""
							}`}
						/>
						Refresh
					</Button>
				)}
			</div>

			{/* Filter Controls */}
			<div className="space-y-3 mb-4">
				{showSearch && (
					<div>
						<Label htmlFor="search" className="text-sm font-medium">
							Search Events
						</Label>
						<div className="relative mt-1">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400" />
							<Input
								id="search"
								placeholder="Search by Event ID or Meter ID..."
								value={searchTerm}
								onChange={(e) => {
									setSearchTerm(e.target.value);
									// Delayed search execution to avoid too frequent API calls
									const timeoutId = setTimeout(() => {
										handleFilterChange(e.target.value);
									}, 500);
									return () => clearTimeout(timeoutId);
								}}
								className="pl-10"
							/>
						</div>
					</div>
				)}

				{showStatusFilter && (
					<div>
						<Label
							htmlFor="status-filter"
							className="text-sm font-medium"
						>
							Filter by Status
						</Label>
						<Select
							value={statusFilter}
							onValueChange={(value) => {
								setStatusFilter(value);
								handleFilterChange(undefined, value);
							}}
						>
							<SelectTrigger className="mt-1">
								<SelectValue placeholder="Select Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Status</SelectItem>
								<SelectItem value="UNREVIEWED">
									Pending Review
								</SelectItem>
								<SelectItem value="CONFIRMED_POSITIVE">
									Confirmed Anomaly
								</SelectItem>
								<SelectItem value="REJECTED_NORMAL">
									Rejected Normal
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
				)}
			</div>

			{/* Event Statistics and Pagination */}
			<div className="flex items-center justify-between text-sm text-gray-600 mb-3">
				<div>
					Showing {displayEvents.length} / {total} events
					{total > limit && (
						<span className="ml-2">
							(Page {page}, Total {Math.ceil(total / limit)}{" "}
							pages)
						</span>
					)}
				</div>
				{total > limit && onPageChange && (
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => onPageChange(page - 1)}
							disabled={page <= 1}
						>
							Previous
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => onPageChange(page + 1)}
							disabled={page >= Math.ceil(total / limit)}
						>
							Next
						</Button>
					</div>
				)}
			</div>

			{/* Event List */}
			<div className="flex-1 overflow-y-auto space-y-2 border rounded-lg p-3 bg-gray-50">
				{isLoading ? (
					<div className="flex items-center justify-center h-32">
						<div className="flex items-center gap-2">
							<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
							<div className="text-gray-500">Loading...</div>
						</div>
					</div>
				) : displayEvents.length === 0 ? (
					<div className="flex items-center justify-center h-32">
						<div className="text-center text-gray-500">
							<p>No events found matching the criteria</p>
							{(searchTerm || statusFilter !== "all") && (
								<p className="text-xs mt-1">
									Try adjusting search terms or filters
								</p>
							)}
						</div>
					</div>
				) : (
					displayEvents.map((event) => (
						<EventListItem
							key={event.id}
							event={event}
							isSelected={selectedEventId === event.id}
							onSelect={onEventSelect}
							meterLabel={meterLabelMap[event.meterId]}
						/>
					))
				)}
			</div>
		</div>
	);
}
