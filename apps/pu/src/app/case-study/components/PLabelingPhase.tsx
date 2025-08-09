"use client";

import { Eye, Tag, Zap } from "lucide-react";
import { useState } from "react";
import { Button } from "../../../components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../../../components/ui/card";
import { AnomalyLabelingSystem } from "./AnomalyLabelingSystem";
import { WorkbenchPage } from "./WorkbenchPage";

type ViewMode = "dashboard" | "workbench";

export function PLabelingPhase() {
	const [viewMode, setViewMode] = useState<ViewMode>("dashboard");

	return (
		<div className="space-y-6">
			{/* 模式選擇 */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center justify-between">
						<div className="flex items-center">
							<Tag className="h-5 w-5 mr-2 text-orange-600" />
							P-Labeling 異常事件標記系統
						</div>
						<div className="flex gap-2">
							<Button
								variant={
									viewMode === "dashboard"
										? "default"
										: "outline"
								}
								size="sm"
								onClick={() => setViewMode("dashboard")}
								className="flex items-center gap-2"
							>
								<Eye className="h-4 w-4" />
								總覽模式
							</Button>
							<Button
								variant={
									viewMode === "workbench"
										? "default"
										: "outline"
								}
								size="sm"
								onClick={() => setViewMode("workbench")}
								className="flex items-center gap-2"
							>
								<Zap className="h-4 w-4" />
								工作台模式
							</Button>
						</div>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-sm text-gray-600">
						{viewMode === "dashboard" ? (
							<p>
								<strong>總覽模式：</strong>{" "}
								查看完整的事件列表、統計資料，
								並可以審核所有狀態的事件。適合分析和管理。
							</p>
						) : (
							<p>
								<strong>工作台模式：</strong>{" "}
								專注於未標記事件的高效處理。
								自動載入下一個事件，提高標記效率。
							</p>
						)}
					</div>
				</CardContent>
			</Card>

			{/* 根據模式渲染不同組件 */}
			{viewMode === "dashboard" ? (
				<AnomalyLabelingSystem />
			) : (
				<WorkbenchPage />
			)}
		</div>
	);
}
