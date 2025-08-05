"use client";

import { BarChart3, Database, Info, UserCheck } from "lucide-react";
import { useCallback, useState } from "react";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { Badge } from "../../../components/ui/badge";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../../../components/ui/card";
import { AnomalyCandidatesPanel } from "./AnomalyCandidatesPanel";
import { ReviewDecisionPanel } from "./ReviewDecisionPanel";
import { TimeSeriesAnalysisPanel } from "./TimeSeriesAnalysisPanel";
import type { AnomalyEvent, AnomalyEventStats } from "./types";

export function AnomalyLabelingSystem() {
	const [selectedEvent, setSelectedEvent] = useState<AnomalyEvent | null>(
		null,
	);
	const [stats, setStats] = useState<AnomalyEventStats | null>(null);
	const [refreshKey, setRefreshKey] = useState(0);

	// 模擬組織ID，實際使用時應該從認證系統獲取
	const organizationId = "demo-org-id";

	// 處理事件選擇
	const handleEventSelect = useCallback((event: AnomalyEvent) => {
		setSelectedEvent(event);
	}, []);

	// 處理統計更新
	const handleStatsUpdate = useCallback((newStats: AnomalyEventStats) => {
		setStats(newStats);
	}, []);

	// 處理審核提交完成
	const handleReviewSubmitted = useCallback(() => {
		// 觸發重新載入
		setRefreshKey((prev) => prev + 1);

		// 如果當前選中的事件被審核了，可以選擇清除選擇或保持選中
		// 這裡我們保持選中狀態，讓用戶可以看到更新後的狀態
	}, []);

	return (
		<div className="space-y-6">
			{/* 系統介紹 */}
			<div className="space-y-4">
				<div className="text-center">
					<h2 className="text-2xl font-bold text-gray-900 mb-2">
						異常事件標記系統
					</h2>
					<p className="text-gray-600 max-w-3xl mx-auto">
						這是一個專為電錶異常檢測研究設計的標記系統。
						研究員可以審核由演算法檢測到的異常候選事件，並為確認的異常事件添加標籤，
						以建立高品質的訓練資料集用於進一步的機器學習研究。
					</p>
				</div>

				<Alert>
					<Info className="size-4" />
					<AlertDescription>
						<strong>使用流程：</strong>
						1. 從左側選擇待審核的事件 → 2.
						在中間查看詳細的時序資料分析 → 3.
						在右側做出審核決策並添加標籤
					</AlertDescription>
				</Alert>

				{/* 統計概覽 */}
				{stats && (
					<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									總事件數
								</CardTitle>
								<Database className="size-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{stats.total}
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									待審核
								</CardTitle>
								<UserCheck className="size-4 text-orange-500" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-orange-600">
									{stats.unreviewed}
								</div>
								<p className="text-xs text-muted-foreground">
									剩餘{" "}
									{(
										(stats.unreviewed / stats.total) *
										100
									).toFixed(1)}
									%
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									已確認異常
								</CardTitle>
								<BarChart3 className="size-4 text-green-500" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-green-600">
									{stats.confirmed}
								</div>
								<p className="text-xs text-muted-foreground">
									{(
										(stats.confirmed / stats.total) *
										100
									).toFixed(1)}
									% 異常率
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									已駁回正常
								</CardTitle>
								<BarChart3 className="size-4 text-red-500" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-red-600">
									{stats.rejected}
								</div>
								<p className="text-xs text-muted-foreground">
									{(
										(stats.rejected / stats.total) *
										100
									).toFixed(1)}
									% 誤檢率
								</p>
							</CardContent>
						</Card>
					</div>
				)}
			</div>

			{/* 主要標記界面 */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle className="text-lg">
							異常事件標記工作台
						</CardTitle>
						<div className="flex items-center gap-2">
							<Badge variant="outline">實時資料</Badge>
							<Badge variant="outline">智慧標記</Badge>
						</div>
					</div>
				</CardHeader>
				<CardContent className="p-0">
					<div className="h-[800px] flex">
						{/* 左側：異常候選事件列表 */}
						<div className="w-80 flex-shrink-0">
							<AnomalyCandidatesPanel
								key={`candidates-${refreshKey}`}
								organizationId={organizationId}
								selectedEventId={selectedEvent?.id}
								onEventSelect={handleEventSelect}
								onStatsUpdate={handleStatsUpdate}
							/>
						</div>

						{/* 中間：時序資料分析 */}
						<div className="flex-1">
							<TimeSeriesAnalysisPanel
								selectedEvent={selectedEvent}
							/>
						</div>

						{/* 右側：審核決策面板 */}
						<div className="w-80 flex-shrink-0">
							<ReviewDecisionPanel
								selectedEvent={selectedEvent}
								organizationId={organizationId}
								onReviewSubmitted={handleReviewSubmitted}
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* 技術說明 */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">技術架構說明</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						<div>
							<h4 className="font-semibold text-gray-900 mb-2">
								資料處理流程
							</h4>
							<ul className="text-sm text-gray-600 space-y-1">
								<li>• 自動化異常檢測演算法</li>
								<li>• Z-score 與統計偏差分析</li>
								<li>• 時序模式識別</li>
								<li>• 候選事件自動生成</li>
							</ul>
						</div>

						<div>
							<h4 className="font-semibold text-gray-900 mb-2">
								標記系統特色
							</h4>
							<ul className="text-sm text-gray-600 space-y-1">
								<li>• 人機協作標記界面</li>
								<li>• 多維度標籤分類</li>
								<li>• 審核歷史追蹤</li>
								<li>• 品質控制機制</li>
							</ul>
						</div>

						<div>
							<h4 className="font-semibold text-gray-900 mb-2">
								研究應用價值
							</h4>
							<ul className="text-sm text-gray-600 space-y-1">
								<li>• 訓練資料品質提升</li>
								<li>• PU Learning 效能優化</li>
								<li>• 領域知識整合</li>
								<li>• 可解釋性增強</li>
							</ul>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
