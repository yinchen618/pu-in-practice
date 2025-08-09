"use client";

import { useCallback, useEffect, useState } from "react";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../../../components/ui/card";
import { useCaseStudyData } from "../../../hooks/use-case-study-data";
import { DecisionPanel } from "./shared/DecisionPanel";
import { EventList } from "./shared/EventList";
import { TimeSeriesChart } from "./shared/TimeSeriesChart";
import type { AnomalyEvent } from "./types";

export function WorkbenchPage() {
	const [currentEvent, setCurrentEvent] = useState<AnomalyEvent | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// 使用 case study data hook，只載入待標記的事件
	const { events, eventsLoading, loadEvents, reviewEvent } =
		useCaseStudyData();

	// 載入未標記的事件
	const loadUnlabeledEvents = useCallback(async () => {
		await loadEvents({ status: "UNREVIEWED" });
	}, [loadEvents]);

	// 初始載入
	useEffect(() => {
		loadUnlabeledEvents();
	}, [loadUnlabeledEvents]);

	// 處理事件選擇
	const handleEventSelect = useCallback((event: AnomalyEvent) => {
		setCurrentEvent(event);
	}, []);

	// 處理標記提交
	const handleLabelSubmit = useCallback(
		async (eventId: string, label: string, notes?: string) => {
			setIsSubmitting(true);
			try {
				await reviewEvent(eventId, {
					status: label,
					reviewerId: "demo-reviewer",
					justificationNotes: notes,
				});

				// 重新載入事件列表
				await loadUnlabeledEvents();

				// 自動選擇下一個事件
				const currentIndex = (events?.events || []).findIndex(
					(e) => e.id === eventId,
				);
				const nextEvent =
					(events?.events || [])[currentIndex + 1] ||
					(events?.events || [])[0];

				if (nextEvent && nextEvent.id !== eventId) {
					setCurrentEvent(nextEvent);
				} else {
					setCurrentEvent(null);
				}
			} finally {
				setIsSubmitting(false);
			}
		},
		[reviewEvent, loadUnlabeledEvents, events],
	);

	// 處理刷新
	const handleRefresh = useCallback(async () => {
		await loadUnlabeledEvents();
	}, [loadUnlabeledEvents]);

	// 自動選擇第一個事件
	useEffect(() => {
		if (events?.events && events.events.length > 0 && !currentEvent) {
			setCurrentEvent(events.events[0]);
		}
	}, [events, currentEvent]);

	const unlabeledEvents = (events?.events || []).filter(
		(event) => event.status === "UNREVIEWED",
	);

	return (
		<div className="space-y-6">
			{/* 標題 */}
			<div className="text-center">
				<h2 className="text-2xl font-bold text-gray-900 mb-2">
					異常標記工作台
				</h2>
				<p className="text-gray-600 max-w-2xl mx-auto">
					專注模式 - 高效完成異常事件標記任務。 剩餘{" "}
					{unlabeledEvents.length} 個待審核事件。
				</p>
			</div>

			{/* 主要工作界面 */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">
						標記工作台 - 待審核事件
					</CardTitle>
				</CardHeader>
				<CardContent className="p-0">
					<div className="h-[700px] flex">
						{/* 左側：待標記事件列表 */}
						<div className="w-72 flex-shrink-0 p-4 border-r">
							<EventList
								events={unlabeledEvents}
								selectedEventId={currentEvent?.id}
								isLoading={eventsLoading}
								onEventSelect={handleEventSelect}
								onRefresh={handleRefresh}
								showSearch={true}
								showStatusFilter={false} // 工作台模式不需要狀態篩選
								total={events?.total || 0}
								page={events?.page || 1}
								limit={events?.limit || 50}
								onFiltersChange={(filters) =>
									loadEvents({
										...filters,
										status: "UNREVIEWED",
									})
								}
							/>
						</div>

						{/* 中間：時序資料分析 */}
						<div className="flex-1 p-4">
							<TimeSeriesChart
								selectedEvent={currentEvent}
								isLoading={false}
							/>
						</div>

						{/* 右側：決策面板 */}
						<div className="w-80 flex-shrink-0 p-4 border-l">
							<DecisionPanel
								selectedEvent={currentEvent}
								onLabelSubmit={handleLabelSubmit}
								isSubmitting={isSubmitting}
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* 進度統計 */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card>
					<CardContent className="p-4">
						<div className="text-center">
							<div className="text-2xl font-bold text-orange-600">
								{unlabeledEvents.length}
							</div>
							<p className="text-sm text-gray-600">待處理事件</p>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="text-center">
							<div className="text-2xl font-bold text-green-600">
								{
									(events?.events || []).filter(
										(e) =>
											e.status === "CONFIRMED_POSITIVE",
									).length
								}
							</div>
							<p className="text-sm text-gray-600">已確認異常</p>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="text-center">
							<div className="text-2xl font-bold text-red-600">
								{
									(events?.events || []).filter(
										(e) => e.status === "REJECTED_NORMAL",
									).length
								}
							</div>
							<p className="text-sm text-gray-600">已駁回正常</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
