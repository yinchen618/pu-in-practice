"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Check, Filter, Tag, TrendingUp, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// 動態導入 Plotly 組件，禁用 SSR
const Plot = dynamic(() => import("react-plotly.js"), {
	ssr: false,
	loading: () => (
		<div className="h-[400px] flex items-center justify-center">
			<div className="text-slate-500">Loading chart...</div>
		</div>
	),
});

// 模擬候選事件資料
interface AnomalyCandidate {
	id: string;
	timestamp: string;
	ruleTriggered: string;
	status: "Unreviewed" | "Confirmed Positive" | "Rejected";
	unitId: string;
	value: number;
	zScore: number;
}

// 模擬時間序列資料
interface TimeSeriesData {
	timestamp: string;
	value: number;
	isAnomaly?: boolean;
}

// 產生模擬資料
const generateMockCandidates = (): AnomalyCandidate[] => {
	const statuses: AnomalyCandidate["status"][] = [
		"Unreviewed",
		"Confirmed Positive",
		"Rejected",
	];
	const rules = [
		"Z-score > 3",
		"Sudden spike > 200%",
		"Pattern deviation",
		"Time-based anomaly",
	];

	return Array.from({ length: 25 }, (_, i) => ({
		id: `event_20250801_unitA${101 + i}`,
		timestamp: new Date(
			2025,
			0,
			1 + i,
			8 + (i % 16),
			(i * 13) % 60,
		).toISOString(),
		ruleTriggered: rules[i % rules.length],
		status: i < 15 ? "Unreviewed" : statuses[(i - 15) % statuses.length],
		unitId: `A${101 + i}`,
		value: 150 + Math.random() * 200,
		zScore: 3 + Math.random() * 2,
	}));
};

const generateTimeSeriesData = (eventTime: string): TimeSeriesData[] => {
	const eventDate = new Date(eventTime);
	const data: TimeSeriesData[] = [];

	// 生成事件前後各30分鐘的資料 (每5分鐘一個點)
	for (let i = -36; i <= 36; i++) {
		const timestamp = new Date(eventDate.getTime() + i * 5 * 60 * 1000);
		const isAnomalyPoint = i >= -2 && i <= 2; // 事件時間點前後10分鐘

		let value: number;
		if (isAnomalyPoint) {
			// 異常期間：較高的值
			value = 180 + Math.random() * 100 + Math.abs(i) * 20;
		} else {
			// 正常期間：基線值加雜訊
			value = 80 + Math.random() * 40 + Math.sin(i * 0.3) * 15;
		}

		data.push({
			timestamp: timestamp.toISOString(),
			value,
			isAnomaly: isAnomalyPoint && i === 0,
		});
	}

	return data;
};

export function PLabelingPhase() {
	const [candidates] = useState<AnomalyCandidate[]>(generateMockCandidates());
	const [filteredCandidates, setFilteredCandidates] =
		useState<AnomalyCandidate[]>(candidates);
	const [selectedCandidate, setSelectedCandidate] =
		useState<AnomalyCandidate | null>(null);
	const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [notes, setNotes] = useState<string>("");
	const [searchTerm, setSearchTerm] = useState<string>("");

	// 篩選候選事件
	useEffect(() => {
		let filtered = candidates;

		if (statusFilter !== "all") {
			filtered = filtered.filter((c) => c.status === statusFilter);
		}

		if (searchTerm) {
			filtered = filtered.filter(
				(c) =>
					c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
					c.unitId.toLowerCase().includes(searchTerm.toLowerCase()) ||
					c.ruleTriggered
						.toLowerCase()
						.includes(searchTerm.toLowerCase()),
			);
		}

		setFilteredCandidates(filtered);
	}, [statusFilter, searchTerm, candidates]);

	// 選擇候選事件時載入時間序列資料
	useEffect(() => {
		if (selectedCandidate) {
			const data = generateTimeSeriesData(selectedCandidate.timestamp);
			setTimeSeriesData(data);
			setNotes(""); // 清空筆記
		}
	}, [selectedCandidate]);

	const handleCandidateSelect = (candidate: AnomalyCandidate) => {
		setSelectedCandidate(candidate);
	};

	const handleStatusUpdate = (
		newStatus: "Confirmed Positive" | "Rejected",
	) => {
		if (!selectedCandidate) {
			return;
		}

		// 模擬 API 呼叫
		console.log(`Updating ${selectedCandidate.id} to ${newStatus}`);
		console.log(`Notes: ${notes}`);

		// 實際應用中，這裡會呼叫 API 更新資料庫
		// await updateAnomalyLabel(selectedCandidate.id, newStatus, notes);

		// 更新本地狀態 (模擬)
		const updatedCandidate = { ...selectedCandidate, status: newStatus };
		setSelectedCandidate(updatedCandidate);

		// 這裡可以添加成功提示
		alert(`Event ${selectedCandidate.id} has been marked as ${newStatus}`);
	};

	const getStatusBadgeVariant = (status: AnomalyCandidate["status"]) => {
		switch (status) {
			case "Confirmed Positive":
				return "bg-green-100 text-green-800";
			case "Rejected":
				return "bg-red-100 text-red-800";
			default:
				return "bg-yellow-100 text-yellow-800";
		}
	};

	// 準備圖表資料
	const plotData: Array<{
		x: string[];
		y: number[];
		type: "scatter";
		mode: "lines+markers" | "markers";
		name: string;
		line?: { color: string; width: number };
		marker: {
			color: string;
			size: number;
			symbol?: string;
			line?: { color: string; width: number };
		};
	}> =
		timeSeriesData.length > 0
			? [
					{
						x: timeSeriesData.map((d) => d.timestamp),
						y: timeSeriesData.map((d) => d.value),
						type: "scatter" as const,
						mode: "lines+markers" as const,
						name: "Energy Consumption",
						line: { color: "#3b82f6", width: 2 },
						marker: { color: "#3b82f6", size: 4 },
					},
					{
						x: timeSeriesData
							.filter((d) => d.isAnomaly)
							.map((d) => d.timestamp),
						y: timeSeriesData
							.filter((d) => d.isAnomaly)
							.map((d) => d.value),
						type: "scatter" as const,
						mode: "markers" as const,
						name: "Anomaly Event",
						marker: {
							color: "#ef4444",
							size: 12,
							symbol: "star",
							line: { color: "#dc2626", width: 2 },
						},
					},
				]
			: [];

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center">
						<Tag className="h-5 w-5 mr-2 text-orange-600" />P
						Labeling (Internal) - Anomaly Review Dashboard
					</CardTitle>
				</CardHeader>
				<CardContent>
					{/* 三欄式佈局 */}
					<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[800px]">
						{/* 左欄：候選事件列表 */}
						<div className="lg:col-span-4 flex flex-col">
							<div className="mb-4">
								<h3 className="text-lg font-semibold text-slate-800 mb-3">
									Anomaly Candidates for Review
								</h3>

								{/* 篩選控制 */}
								<div className="space-y-3">
									<div>
										<Label
											htmlFor="search"
											className="text-sm"
										>
											Search Events
										</Label>
										<Input
											id="search"
											placeholder="Search by ID, unit, or rule..."
											value={searchTerm}
											onChange={(e) =>
												setSearchTerm(e.target.value)
											}
											className="mt-1"
										/>
									</div>

									<div>
										<Label
											htmlFor="status-filter"
											className="text-sm"
										>
											Filter by Status
										</Label>
										<Select
											value={statusFilter}
											onValueChange={setStatusFilter}
										>
											<SelectTrigger className="mt-1">
												<SelectValue placeholder="All Statuses" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="all">
													All Statuses
												</SelectItem>
												<SelectItem value="Unreviewed">
													Unreviewed
												</SelectItem>
												<SelectItem value="Confirmed Positive">
													Confirmed Positive
												</SelectItem>
												<SelectItem value="Rejected">
													Rejected
												</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>
							</div>

							{/* 事件列表 */}
							<div className="flex-1 overflow-y-auto space-y-2 border rounded-lg p-3 bg-slate-50">
								{filteredCandidates.map((candidate) => (
									<button
										key={candidate.id}
										type="button"
										onClick={() =>
											handleCandidateSelect(candidate)
										}
										className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md text-left w-full ${
											selectedCandidate?.id ===
											candidate.id
												? "border-blue-500 bg-blue-50"
												: "border-slate-200 bg-white hover:border-slate-300"
										}`}
									>
										<div className="flex items-center justify-between mb-2">
											<span className="text-sm font-medium text-slate-800">
												{candidate.id}
											</span>
											<Badge
												className={getStatusBadgeVariant(
													candidate.status,
												)}
											>
												{candidate.status}
											</Badge>
										</div>
										<div className="text-xs text-slate-600 space-y-1">
											<div>Unit: {candidate.unitId}</div>
											<div>
												Time:{" "}
												{new Date(
													candidate.timestamp,
												).toLocaleString()}
											</div>
											<div>
												Rule: {candidate.ruleTriggered}
											</div>
											<div>
												Z-Score:{" "}
												{candidate.zScore.toFixed(2)}
											</div>
										</div>
									</button>
								))}
							</div>
						</div>

						{/* 中欄：視覺化分析 */}
						<div className="lg:col-span-5 flex flex-col">
							<h3 className="text-lg font-semibold text-slate-800 mb-3">
								Event Time-Series Analysis
							</h3>

							<div className="flex-1 border rounded-lg bg-white">
								{selectedCandidate &&
								timeSeriesData.length > 0 ? (
									<div className="h-full p-4">
										<div className="mb-4">
											<h4 className="font-medium text-slate-700 mb-2">
												Energy Consumption Pattern -{" "}
												{selectedCandidate.unitId}
											</h4>
											<p className="text-sm text-slate-600">
												Event Time:{" "}
												{new Date(
													selectedCandidate.timestamp,
												).toLocaleString()}
											</p>
											<p className="text-sm text-slate-600">
												Analysis Window: ±30 minutes
												around event
											</p>
										</div>

										<Plot
											data={plotData}
											layout={{
												autosize: true,
												height: 400,
												margin: {
													l: 50,
													r: 50,
													t: 20,
													b: 50,
												},
												xaxis: {
													title: { text: "Time" },
													type: "date",
												},
												yaxis: {
													title: {
														text: "Energy Consumption (kWh)",
													},
												},
												showlegend: true,
												legend: {
													x: 0,
													y: 1,
												},
											}}
											config={{
												displayModeBar: true,
												displaylogo: false,
												modeBarButtonsToRemove: [
													"lasso2d",
													"select2d",
												],
											}}
											useResizeHandler={true}
											style={{
												width: "100%",
												height: "100%",
											}}
										/>
									</div>
								) : (
									<div className="h-full flex items-center justify-center text-slate-500">
										<div className="text-center">
											<TrendingUp className="h-12 w-12 mx-auto mb-4 text-slate-300" />
											<p>
												Select an event from the left
												panel to view its time-series
												analysis
											</p>
										</div>
									</div>
								)}
							</div>
						</div>

						{/* 右欄：決策與標註面板 */}
						<div className="lg:col-span-3 flex flex-col">
							<h3 className="text-lg font-semibold text-slate-800 mb-3">
								Review & Decision
							</h3>

							<div className="flex-1 border rounded-lg bg-white p-4">
								{selectedCandidate ? (
									<div className="space-y-6">
										{/* 事件資訊 */}
										<div className="space-y-2">
											<div>
												<Label className="text-sm font-medium">
													Selected Event ID:
												</Label>
												<p className="text-sm text-slate-700 font-mono">
													{selectedCandidate.id}
												</p>
											</div>
											<div>
												<Label className="text-sm font-medium">
													Current Status:
												</Label>
												<div className="mt-1">
													<Badge
														className={getStatusBadgeVariant(
															selectedCandidate.status,
														)}
													>
														{
															selectedCandidate.status
														}
													</Badge>
												</div>
											</div>
											<div>
												<Label className="text-sm font-medium">
													Triggered Rule:
												</Label>
												<p className="text-sm text-slate-700">
													{
														selectedCandidate.ruleTriggered
													}
												</p>
											</div>
										</div>

										{/* 決策按鈕 */}
										<div className="space-y-3">
											<Label className="text-sm font-medium">
												Decision Actions:
											</Label>
											<div className="space-y-2">
												<Button
													onClick={() =>
														handleStatusUpdate(
															"Confirmed Positive",
														)
													}
													className="w-full bg-green-600 hover:bg-green-700 text-white"
													disabled={
														selectedCandidate.status ===
														"Confirmed Positive"
													}
												>
													<Check className="h-4 w-4 mr-2" />
													Confirm as Positive (P)
												</Button>
												<Button
													onClick={() =>
														handleStatusUpdate(
															"Rejected",
														)
													}
													variant="outline"
													className="w-full border-red-300 text-red-700 hover:bg-red-50"
													disabled={
														selectedCandidate.status ===
														"Rejected"
													}
												>
													<X className="h-4 w-4 mr-2" />
													Reject as Normal (U)
												</Button>
											</div>
										</div>

										{/* 筆記區域 */}
										<div className="space-y-2">
											<Label
												htmlFor="notes"
												className="text-sm font-medium"
											>
												Notes / Justification
											</Label>
											<Textarea
												id="notes"
												placeholder="Enter your reasoning for this labeling decision..."
												value={notes}
												onChange={(e) =>
													setNotes(e.target.value)
												}
												rows={4}
												className="resize-none"
											/>
											<p className="text-xs text-slate-500">
												Example: "Confirmed as positive
												- suspected HVAC malfunction
												based on unusual consumption
												spike during off-hours"
											</p>
										</div>

										{/* 統計資訊 */}
										<div className="border-t pt-4">
											<Label className="text-sm font-medium mb-2 block">
												Review Progress
											</Label>
											<div className="space-y-2 text-sm">
												<div className="flex justify-between">
													<span>Total Events:</span>
													<span className="font-medium">
														{candidates.length}
													</span>
												</div>
												<div className="flex justify-between">
													<span>Reviewed:</span>
													<span className="font-medium">
														{
															candidates.filter(
																(c) =>
																	c.status !==
																	"Unreviewed",
															).length
														}
													</span>
												</div>
												<div className="flex justify-between">
													<span>
														Confirmed Positive:
													</span>
													<span className="font-medium text-green-600">
														{
															candidates.filter(
																(c) =>
																	c.status ===
																	"Confirmed Positive",
															).length
														}
													</span>
												</div>
												<div className="flex justify-between">
													<span>Rejected:</span>
													<span className="font-medium text-red-600">
														{
															candidates.filter(
																(c) =>
																	c.status ===
																	"Rejected",
															).length
														}
													</span>
												</div>
											</div>
										</div>
									</div>
								) : (
									<div className="h-full flex items-center justify-center text-slate-500">
										<div className="text-center">
											<Filter className="h-12 w-12 mx-auto mb-4 text-slate-300" />
											<p className="text-sm">
												Select an event to begin review
											</p>
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
