"use client";

import {
	AlertTriangle,
	Clock,
	RotateCcw,
	TrendingUp,
	ZoomIn,
	ZoomOut,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../../../components/ui/card";
import type { AnomalyEvent } from "./types";

// 使用 Plotly.js 進行圖表繪製
import dynamic from "next/dynamic";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface TimeSeriesAnalysisPanelProps {
	selectedEvent: AnomalyEvent | null;
}

export function TimeSeriesAnalysisPanel({
	selectedEvent,
}: TimeSeriesAnalysisPanelProps) {
	const [eventDetails, setEventDetails] = useState<AnomalyEvent | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [zoomRange, setZoomRange] = useState<{
		start?: number;
		end?: number;
	}>({});
	// const plotRef = useRef<any>(null); // Plotly 組件不支持 ref

	// 獲取事件詳細資料（包含 dataWindow）
	const fetchEventDetails = async (eventId: string) => {
		setIsLoading(true);
		try {
			const response = await fetch(`/api/casestudy/events/${eventId}`, {
				credentials: "include",
				headers: { "Content-Type": "application/json" },
			});

			if (response.ok) {
				const result = await response.json();
				setEventDetails(result.data);
			}
		} catch (error) {
			console.error("獲取事件詳情失敗:", error);
		} finally {
			setIsLoading(false);
		}
	};

	// 當選中事件變化時獲取詳情
	useEffect(() => {
		if (selectedEvent?.id) {
			fetchEventDetails(selectedEvent.id);
		} else {
			setEventDetails(null);
		}
	}, [selectedEvent?.id]);

	// 準備圖表資料
	const prepareChartData = () => {
		if (!eventDetails?.dataWindow) {
			return null;
		}

		const { timestamps, values } = eventDetails.dataWindow;
		const eventTime = new Date(eventDetails.eventTimestamp);

		// 轉換時間戳為 Date 物件
		const timeData = timestamps.map((ts) => new Date(ts));

		// 找到異常點的索引
		const eventIndex = timeData.findIndex(
			(time) => Math.abs(time.getTime() - eventTime.getTime()) < 60000, // 1分鐘容差
		);

		return {
			timeData,
			values,
			eventIndex,
			eventTime,
		};
	};

	const chartData = prepareChartData();

	// 圖表配置
	const getPlotData = () => {
		if (!chartData) {
			return [];
		}

		const { timeData, values, eventIndex } = chartData;

		// 主要時序資料
		const mainTrace = {
			x: timeData,
			y: values,
			type: "scatter" as const,
			mode: "lines" as const,
			name: "用電量",
			line: {
				color: "#2563eb",
				width: 2,
			},
		};

		// 異常點標記
		const anomalyTrace =
			eventIndex >= 0
				? {
						x: [timeData[eventIndex]],
						y: [values[eventIndex]],
						type: "scatter" as const,
						mode: "markers" as const,
						name: "異常事件",
						marker: {
							color: "#dc2626",
							size: 12,
							symbol: "star",
							line: {
								color: "#ffffff",
								width: 2,
							},
						},
					}
				: null;

		return anomalyTrace ? [mainTrace, anomalyTrace] : [mainTrace];
	};

	// 圖表佈局配置
	const getPlotLayout = () => ({
		title: {
			text: eventDetails
				? `電錶 ${eventDetails.meterId} 用電趨勢分析`
				: "",
			font: { size: 16 },
		},
		xaxis: {
			title: { text: "時間" },
			type: "date" as const,
			range:
				zoomRange.start && zoomRange.end
					? [zoomRange.start, zoomRange.end]
					: undefined,
		},
		yaxis: {
			title: { text: "用電量 (kWh)" },
		},
		margin: { l: 60, r: 30, t: 50, b: 50 },
		height: 400,
		showlegend: true,
		legend: {
			x: 0,
			y: 1,
			bgcolor: "rgba(255,255,255,0.8)",
		},
		hovermode: "x unified" as const,
	});

	// 縮放控制
	const handleZoomIn = () => {
		if (!chartData) {
			return;
		}
		const { timeData } = chartData;
		const totalDuration =
			timeData[timeData.length - 1].getTime() - timeData[0].getTime();
		const centerTime = eventDetails
			? new Date(eventDetails.eventTimestamp).getTime()
			: timeData[0].getTime() + totalDuration / 2;

		const newRange = totalDuration * 0.3; // 縮放到30%
		setZoomRange({
			start: centerTime - newRange / 2,
			end: centerTime + newRange / 2,
		});
	};

	const handleZoomOut = () => {
		setZoomRange({});
	};

	const handleResetView = () => {
		setZoomRange({});
		// 移除 plotRef 的使用，因為 Plotly 組件不支持 ref
	};

	// 格式化時間
	const formatDateTime = (timestamp: string) => {
		return new Date(timestamp).toLocaleString("zh-TW", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		});
	};

	// 獲取狀態顯示資訊
	const getStatusDisplay = (status: AnomalyEvent["status"]) => {
		switch (status) {
			case "UNREVIEWED":
				return {
					text: "待審核",
					color: "bg-orange-100 text-orange-800",
				};
			case "CONFIRMED_POSITIVE":
				return {
					text: "已確認異常",
					color: "bg-green-100 text-green-800",
				};
			case "REJECTED_NORMAL":
				return { text: "已駁回正常", color: "bg-red-100 text-red-800" };
		}
	};

	if (!selectedEvent) {
		return (
			<div className="flex-1 flex items-center justify-center bg-gray-50">
				<div className="text-center">
					<TrendingUp className="size-16 text-gray-400 mx-auto mb-4" />
					<h3 className="text-lg font-medium text-gray-900 mb-2">
						選擇事件以查看分析
					</h3>
					<p className="text-gray-500">
						點擊左側的異常事件來查看詳細的時序資料分析
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex-1 flex flex-col bg-white">
			{/* 標題區域 */}
			<div className="border-b p-4">
				<div className="flex items-center justify-between mb-2">
					<h3 className="text-lg font-semibold text-gray-900">
						時序資料分析
					</h3>

					{/* 控制按鈕 */}
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={handleZoomIn}
							disabled={!chartData}
						>
							<ZoomIn className="size-4" />
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={handleZoomOut}
							disabled={!chartData}
						>
							<ZoomOut className="size-4" />
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={handleResetView}
							disabled={!chartData}
						>
							<RotateCcw className="size-4" />
						</Button>
					</div>
				</div>

				{/* 事件基本資訊 */}
				<div className="flex items-center gap-4 text-sm text-gray-600">
					<div className="flex items-center gap-1">
						<AlertTriangle className="size-4" />
						<span>事件ID: {selectedEvent.eventId}</span>
					</div>
					<div className="flex items-center gap-1">
						<Clock className="size-4" />
						<span>
							時間: {formatDateTime(selectedEvent.eventTimestamp)}
						</span>
					</div>
					<Badge
						className={getStatusDisplay(selectedEvent.status).color}
					>
						{getStatusDisplay(selectedEvent.status).text}
					</Badge>
				</div>
			</div>

			{/* 主要內容區域 */}
			<div className="flex-1 p-4">
				{isLoading ? (
					<div className="flex items-center justify-center h-full">
						<div className="text-center">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
							<p className="text-gray-500">載入圖表資料中...</p>
						</div>
					</div>
				) : chartData ? (
					<div className="space-y-4">
						{/* 資料統計卡片 */}
						<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
							<Card>
								<CardHeader className="pb-2">
									<CardTitle className="text-sm font-medium text-gray-600">
										偵測規則
									</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-lg font-semibold">
										{selectedEvent.detectionRule}
									</p>
								</CardContent>
							</Card>

							<Card>
								<CardHeader className="pb-2">
									<CardTitle className="text-sm font-medium text-gray-600">
										異常分數
									</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-lg font-semibold text-red-600">
										{selectedEvent.score.toFixed(2)}
									</p>
								</CardContent>
							</Card>

							<Card>
								<CardHeader className="pb-2">
									<CardTitle className="text-sm font-medium text-gray-600">
										電錶ID
									</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-lg font-semibold">
										{selectedEvent.meterId}
									</p>
								</CardContent>
							</Card>

							<Card>
								<CardHeader className="pb-2">
									<CardTitle className="text-sm font-medium text-gray-600">
										資料點數
									</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-lg font-semibold">
										{chartData.values.length}
									</p>
								</CardContent>
							</Card>
						</div>

						{/* 主圖表 */}
						<Card>
							<CardContent className="p-4">
								<Plot
									data={getPlotData()}
									layout={getPlotLayout()}
									config={{
										displayModeBar: true,
										displaylogo: false,
										modeBarButtonsToRemove: [
											"pan2d",
											"lasso2d",
											"select2d",
											"autoScale2d",
										],
										responsive: true,
									}}
									style={{ width: "100%", height: "400px" }}
								/>
							</CardContent>
						</Card>

						{/* 標籤資訊 */}
						{eventDetails?.eventLabelLinks &&
							eventDetails.eventLabelLinks.length > 0 && (
								<Card>
									<CardHeader>
										<CardTitle className="text-sm font-medium">
											已標記標籤
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="flex flex-wrap gap-2">
											{eventDetails.eventLabelLinks.map(
												(link) => (
													<Badge
														key={link.label.id}
														variant="secondary"
													>
														{link.label.name}
													</Badge>
												),
											)}
										</div>
									</CardContent>
								</Card>
							)}
					</div>
				) : (
					<div className="flex items-center justify-center h-full">
						<div className="text-center">
							<AlertTriangle className="size-16 text-gray-400 mx-auto mb-4" />
							<h3 className="text-lg font-medium text-gray-900 mb-2">
								無法載入圖表資料
							</h3>
							<p className="text-gray-500">
								這個事件可能缺少時序資料或資料格式有誤
							</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
