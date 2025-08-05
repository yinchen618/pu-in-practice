"use client";

import {
	AlertTriangle,
	CheckCircle,
	Clock,
	Filter,
	Search,
	X,
	XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../../components/ui/select";
import type { AnomalyEvent, AnomalyEventStats, EventFilters } from "./types";

interface AnomalyCandidatesPanelProps {
	organizationId: string;
	selectedEventId?: string;
	onEventSelect: (event: AnomalyEvent) => void;
	onStatsUpdate?: (stats: AnomalyEventStats) => void;
}

export function AnomalyCandidatesPanel({
	organizationId,
	selectedEventId,
	onEventSelect,
	onStatsUpdate,
}: AnomalyCandidatesPanelProps) {
	const [events, setEvents] = useState<AnomalyEvent[]>([]);
	const [stats, setStats] = useState<AnomalyEventStats | null>(null);
	const [filters, setFilters] = useState<EventFilters>({});
	const [isExpanded, setIsExpanded] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);

	// 獲取事件列表
	const fetchEvents = useCallback(
		async (resetPage = false) => {
			if (!organizationId) {
				return;
			}

			setIsLoading(true);
			try {
				const currentPage = resetPage ? 1 : page;
				const params = new URLSearchParams({
					organization_id: organizationId,
					page: currentPage.toString(),
					limit: "20",
				});

				// 添加篩選參數
				if (filters.status) {
					params.append("status", filters.status);
				}
				if (filters.meterId) {
					params.append("meter_id", filters.meterId);
				}
				if (searchTerm) {
					params.append("search", searchTerm);
				}
				if (filters.dateFrom) {
					params.append("date_from", filters.dateFrom);
				}
				if (filters.dateTo) {
					params.append("date_to", filters.dateTo);
				}

				const response = await fetch(
					`https://python.yinchen.tw/api/case-study/events?${params}`,
					{
						headers: { "Content-Type": "application/json" },
					},
				);

				if (response.ok) {
					const result = await response.json();
					const eventsData =
						result.success && result.data
							? result.data
							: { events: [] };
					const newEvents = eventsData.events || [];

					if (resetPage) {
						setEvents(newEvents);
						setPage(1);
					} else {
						setEvents((prev) => [...prev, ...newEvents]);
					}

					setHasMore(result.data.page < result.data.totalPages);
					if (resetPage) {
						setPage(2);
					} else {
						setPage((prev) => prev + 1);
					}
				}
			} catch (error) {
				console.error("獲取事件列表失敗:", error);
			} finally {
				setIsLoading(false);
			}
		},
		[organizationId, filters, searchTerm, page],
	);

	// 獲取統計資訊
	const fetchStats = useCallback(async () => {
		if (!organizationId) {
			return;
		}

		try {
			const response = await fetch(
				`https://python.yinchen.tw/api/case-study/stats?organization_id=${organizationId}`,
				{
					headers: { "Content-Type": "application/json" },
				},
			);

			if (response.ok) {
				const result = await response.json();
				if (result.success && result.data) {
					setStats(result.data);
					onStatsUpdate?.(result.data);
				}
			}
		} catch (error) {
			console.error("獲取統計資訊失敗:", error);
		}
	}, [organizationId, onStatsUpdate]);

	// 更新篩選器
	const updateFilter = (key: keyof EventFilters, value: any) => {
		setFilters((prev) => ({
			...prev,
			[key]: value === "all" ? undefined : value,
		}));
		setPage(1);
	};

	// 清除篩選器
	const clearFilters = () => {
		setFilters({});
		setSearchTerm("");
		setPage(1);
	};

	// 檢查是否有活躍篩選器
	const hasActiveFilters =
		Object.values(filters).some(
			(v) => v !== undefined && v !== null && v !== "",
		) || searchTerm !== "";

	// 獲取狀態圖標和顏色
	const getStatusInfo = (status: AnomalyEvent["status"]) => {
		switch (status) {
			case "UNREVIEWED":
				return {
					icon: Clock,
					color: "text-orange-500",
					bg: "bg-orange-50",
				};
			case "CONFIRMED_POSITIVE":
				return {
					icon: CheckCircle,
					color: "text-green-500",
					bg: "bg-green-50",
				};
			case "REJECTED_NORMAL":
				return {
					icon: XCircle,
					color: "text-red-500",
					bg: "bg-red-50",
				};
		}
	};

	// 格式化時間
	const formatTime = (timestamp: string) => {
		return new Date(timestamp).toLocaleString("zh-TW", {
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	// 初始載入
	useEffect(() => {
		fetchStats();
		fetchEvents(true);
	}, []);

	// 篩選器或搜尋變化時重新載入
	useEffect(() => {
		fetchEvents(true);
	}, [filters, searchTerm]);

	return (
		<div className="flex flex-col h-full border-r bg-white">
			{/* 標題和統計 */}
			<div className="p-4 border-b">
				<h3 className="text-lg font-semibold text-gray-900 mb-2">
					異常事件候選
				</h3>

				{stats && (
					<div className="grid grid-cols-2 gap-2 text-sm">
						<div className="flex items-center gap-2">
							<Clock className="size-4 text-orange-500" />
							<span>待審核: {stats.unreviewed}</span>
						</div>
						<div className="flex items-center gap-2">
							<CheckCircle className="size-4 text-green-500" />
							<span>已確認: {stats.confirmed}</span>
						</div>
						<div className="flex items-center gap-2">
							<XCircle className="size-4 text-red-500" />
							<span>已駁回: {stats.rejected}</span>
						</div>
						<div className="flex items-center gap-2">
							<AlertTriangle className="size-4 text-blue-500" />
							<span>總計: {stats.total}</span>
						</div>
					</div>
				)}
			</div>

			{/* 篩選器控制 */}
			<div className="p-4 border-b space-y-3">
				<div className="flex items-center justify-between">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setIsExpanded(!isExpanded)}
						className="gap-2"
					>
						<Filter className="size-4" />
						篩選器
						{hasActiveFilters &&
							` (${Object.values(filters).filter((v) => v !== undefined).length + (searchTerm ? 1 : 0)})`}
					</Button>

					{hasActiveFilters && (
						<Button
							variant="ghost"
							size="sm"
							onClick={clearFilters}
						>
							<X className="size-4 mr-1" />
							清除
						</Button>
					)}
				</div>

				{/* 主要搜尋框 */}
				<div className="relative">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400" />
					<Input
						placeholder="搜尋事件ID或電錶ID..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-10"
					/>
				</div>

				{/* 展開的篩選器 */}
				{isExpanded && (
					<div className="space-y-3 p-3 border rounded-lg bg-gray-50">
						<div className="space-y-2">
							<Label className="text-sm font-medium">狀態</Label>
							<Select
								value={filters.status || ""}
								onValueChange={(value) =>
									updateFilter(
										"status",
										value === "all" ? undefined : value,
									)
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="選擇狀態" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">
										全部狀態
									</SelectItem>
									<SelectItem value="UNREVIEWED">
										待審核
									</SelectItem>
									<SelectItem value="CONFIRMED_POSITIVE">
										已確認異常
									</SelectItem>
									<SelectItem value="REJECTED_NORMAL">
										已駁回正常
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label className="text-sm font-medium">
								電錶ID
							</Label>
							<Input
								placeholder="篩選特定電錶"
								value={filters.meterId || ""}
								onChange={(e) =>
									updateFilter("meterId", e.target.value)
								}
							/>
						</div>

						<div className="grid grid-cols-2 gap-2">
							<div className="space-y-2">
								<Label className="text-sm font-medium">
									開始日期
								</Label>
								<Input
									type="date"
									value={filters.dateFrom || ""}
									onChange={(e) =>
										updateFilter("dateFrom", e.target.value)
									}
								/>
							</div>
							<div className="space-y-2">
								<Label className="text-sm font-medium">
									結束日期
								</Label>
								<Input
									type="date"
									value={filters.dateTo || ""}
									onChange={(e) =>
										updateFilter("dateTo", e.target.value)
									}
								/>
							</div>
						</div>
					</div>
				)}

				{/* 已選擇的篩選條件標籤 */}
				{hasActiveFilters && (
					<div className="flex flex-wrap gap-2">
						{filters.status && (
							<Badge variant="secondary" className="gap-1">
								狀態:{" "}
								{filters.status === "UNREVIEWED"
									? "待審核"
									: filters.status === "CONFIRMED_POSITIVE"
										? "已確認"
										: "已駁回"}
								<button
									type="button"
									onClick={() =>
										updateFilter("status", undefined)
									}
									className="ml-1 hover:bg-destructive/20 rounded-full"
								>
									<X className="size-3" />
								</button>
							</Badge>
						)}
						{searchTerm && (
							<Badge variant="secondary" className="gap-1">
								搜尋: {searchTerm}
								<button
									type="button"
									onClick={() => setSearchTerm("")}
									className="ml-1 hover:bg-destructive/20 rounded-full"
								>
									<X className="size-3" />
								</button>
							</Badge>
						)}
					</div>
				)}
			</div>

			{/* 事件列表 */}
			<div className="flex-1 overflow-y-auto">
				{isLoading && events.length === 0 ? (
					<div className="p-4 text-center text-gray-500">
						載入中...
					</div>
				) : events.length === 0 ? (
					<div className="p-4 text-center text-gray-500">
						沒有找到事件
					</div>
				) : (
					<div className="space-y-2 p-2">
						{events.map((event) => {
							const statusInfo = getStatusInfo(event.status);
							const StatusIcon = statusInfo.icon;
							const isSelected = selectedEventId === event.id;

							return (
								<button
									key={event.id}
									className={`w-full text-left p-3 rounded-lg border transition-all hover:shadow-sm ${
										isSelected
											? "border-blue-500 bg-blue-50"
											: "border-gray-200 hover:border-gray-300"
									}`}
									onClick={() => onEventSelect(event)}
									type="button"
								>
									<div className="flex items-start justify-between mb-2">
										<div className="flex items-center gap-2">
											<StatusIcon
												className={`size-4 ${statusInfo.color}`}
											/>
											<span className="font-medium text-sm text-gray-900">
												{event.eventId}
											</span>
										</div>
										<Badge
											variant="outline"
											className={`text-xs ${statusInfo.color} ${statusInfo.bg}`}
										>
											{event.score.toFixed(2)}
										</Badge>
									</div>

									<div className="space-y-1 text-xs text-gray-600">
										<div className="flex justify-between">
											<span>電錶: {event.meterId}</span>
											<span>
												{formatTime(
													event.eventTimestamp,
												)}
											</span>
										</div>
										<div className="text-gray-500 truncate">
											規則: {event.detectionRule}
										</div>
									</div>

									{event.justificationNotes && (
										<div className="mt-2 text-xs text-gray-500 italic truncate">
											"{event.justificationNotes}"
										</div>
									)}
								</button>
							);
						})}

						{/* 載入更多按鈕 */}
						{hasMore && (
							<div className="p-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => fetchEvents()}
									disabled={isLoading}
									className="w-full"
								>
									{isLoading ? "載入中..." : "載入更多"}
								</Button>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
