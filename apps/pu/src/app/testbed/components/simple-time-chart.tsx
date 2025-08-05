"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MeterData } from "@/hooks/use-testbed-data";
import * as d3 from "d3";
import { AlertCircle, BarChart3 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface SimpleTimeChartProps {
	chartLoading: boolean;
	error: string | null;
	meterData: MeterData | null;
	selectedMeter: string;
	startDate?: string;
	endDate?: string;
}

export function SimpleTimeChart({
	chartLoading,
	error,
	meterData,
	selectedMeter,
	startDate,
	endDate,
}: SimpleTimeChartProps) {
	const svgRef = useRef<SVGSVGElement>(null);
	const [tooltipData, setTooltipData] = useState<{
		visible: boolean;
		x: number;
		y: number;
		time: string;
		power: number;
	}>({
		visible: false,
		x: 0,
		y: 0,
		time: "",
		power: 0,
	});

	useEffect(() => {
		if (!meterData || !svgRef.current) {
			return;
		}

		const svg = d3.select(svgRef.current);
		svg.selectAll("*").remove();

		// 設置尺寸和邊距
		const margin = { top: 30, right: 40, bottom: 80, left: 80 };
		const width = 1000 - margin.left - margin.right;
		const height = 500 - margin.top - margin.bottom;

		// 主繪圖區域
		const g = svg
			.append("g")
			.attr("transform", `translate(${margin.left},${margin.top})`);

		// 提取和處理數據，將 UTC 時間轉換為台灣時間顯示
		const data =
			meterData.timeSeries?.map(
				(d: { timestamp: string; power: number }) => {
					// 後端返回的是 UTC 時間，前端顯示時轉換為台灣時間 (UTC+8)
					const utcDate = new Date(d.timestamp);
					// 如果時間戳沒有時區信息，則假設為 UTC
					const taiwanDate = new Date(
						utcDate.getTime() + 8 * 60 * 60 * 1000,
					);
					return {
						timestamp: taiwanDate,
						power: d.power,
					};
				},
			) || [];

		// 如果沒有數據，直接返回
		if (data.length === 0) {
			return;
		}

		// 識別異常值
		const avgPower = meterData.statistics.averagePower;
		const powers = data.map(
			(d: { timestamp: Date; power: number }) => d.power,
		);
		const stdDev = Math.sqrt(
			powers.reduce(
				(sum: number, p: number) => sum + (p - avgPower) ** 2,
				0,
			) / powers.length,
		);
		const threshold = avgPower + 2 * stdDev;

		// 設置時間軸範圍 - 優先使用用戶選擇的日期範圍
		let timeExtent: [Date, Date];
		if (startDate && endDate) {
			// 將用戶選擇的日期（本地時間）轉換為台灣時間顯示範圍
			const startUtc = new Date(startDate);
			const endUtc = new Date(endDate);
			const startTaiwan = new Date(
				startUtc.getTime() + 8 * 60 * 60 * 1000,
			);
			const endTaiwan = new Date(endUtc.getTime() + 8 * 60 * 60 * 1000);
			timeExtent = [startTaiwan, endTaiwan];
		} else {
			const extent = d3.extent(
				data,
				(d: { timestamp: Date; power: number }) => d.timestamp,
			);
			timeExtent = extent as [Date, Date];
		}

		const xScale = d3.scaleTime().domain(timeExtent).range([0, width]);

		const yScale = d3
			.scaleLinear()
			.domain([
				0,
				d3.max(
					data,
					(d: { timestamp: Date; power: number }) => d.power,
				) as number,
			])
			.range([height, 0]);

		// 繪製網格線
		g.append("g")
			.attr("class", "grid")
			.attr("transform", `translate(0,${height})`)
			.call(
				d3
					.axisBottom(xScale)
					.tickSize(-height)
					.tickFormat(() => ""),
			)
			.selectAll("line")
			.style("stroke", "#e2e8f0")
			.style("stroke-width", 1);

		g.append("g")
			.attr("class", "grid")
			.call(
				d3
					.axisLeft(yScale)
					.tickSize(-width)
					.tickFormat(() => ""),
			)
			.selectAll("line")
			.style("stroke", "#e2e8f0")
			.style("stroke-width", 1);

		// 計算時間範圍來決定適當的格式
		const timeRangeHours =
			(timeExtent[1].getTime() - timeExtent[0].getTime()) /
			(1000 * 60 * 60);
		let timeFormat: string;
		let tickCount: number;

		if (timeRangeHours <= 24) {
			// 小於 24 小時：顯示 小時:分鐘
			timeFormat = "%H:%M";
			tickCount = Math.min(
				16,
				Math.max(6, Math.floor(timeRangeHours / 1.5)),
			);
		} else if (timeRangeHours <= 168) {
			// 小於 7 天：顯示 月/日 小時:分鐘
			timeFormat = "%m/%d %H:%M";
			tickCount = Math.min(
				20,
				Math.max(8, Math.floor(timeRangeHours / 8)),
			);
		} else {
			// 超過 7 天：顯示 月/日
			timeFormat = "%m/%d";
			tickCount = Math.min(
				15,
				Math.max(8, Math.floor(timeRangeHours / 16)),
			);
		}

		// 繪製 X 軸
		g.append("g")
			.attr("transform", `translate(0,${height})`)
			.call(
				d3
					.axisBottom(xScale)
					.ticks(tickCount)
					.tickFormat((d) => d3.timeFormat(timeFormat)(d as Date)),
			)
			.selectAll("text")
			.style("text-anchor", "end")
			.attr("dx", "-.8em")
			.attr("dy", ".15em")
			.attr("transform", "rotate(-45)");

		g.append("g").call(d3.axisLeft(yScale));

		// 創建線條生成器
		const line = d3
			.line<{ timestamp: Date; power: number }>()
			.x((d: { timestamp: Date; power: number }) => xScale(d.timestamp))
			.y((d: { timestamp: Date; power: number }) => yScale(d.power))
			.curve(d3.curveMonotoneX)
			// 當數據點間隔超過 5 分鐘時中斷線條（電表每分鐘一筆資料）
			.defined((d, i) => {
				if (i === 0) {
					return true;
				}
				const prevTime = data[i - 1].timestamp.getTime();
				const currentTime = d.timestamp.getTime();
				const timeDiff = (currentTime - prevTime) / (1000 * 60); // 轉換為分鐘
				return timeDiff <= 5; // 如果間隔超過 5 分鐘，則中斷線條
			});

		// 繪製主線條（會自動處理數據間隙）
		g.append("path")
			.datum(data)
			.attr("d", line)
			.style("fill", "none")
			.style("stroke", "#3b82f6")
			.style("stroke-width", 2);

		// 繪製數據點
		g.selectAll(".dot")
			.data(data)
			.enter()
			.append("circle")
			.attr("class", "dot")
			.attr("cx", (d: { timestamp: Date; power: number }) =>
				xScale(d.timestamp),
			)
			.attr("cy", (d: { timestamp: Date; power: number }) =>
				yScale(d.power),
			)
			.attr("r", 4)
			.style("fill", "#3b82f6")
			.style("stroke", "#fff")
			.style("stroke-width", 1.5)
			.style("opacity", 0.7);

		// 繪製異常點
		const anomalies = data.filter(
			(d: { timestamp: Date; power: number }) => d.power > threshold,
		);
		g.selectAll(".anomaly")
			.data(anomalies)
			.enter()
			.append("path")
			.attr("class", "anomaly")
			.attr("d", (d) => {
				const x = xScale(
					(d as { timestamp: Date; power: number }).timestamp,
				);
				const y = yScale(
					(d as { timestamp: Date; power: number }).power,
				);
				return `M ${x},${y - 8} L ${x + 8},${y} L ${x},${y + 8} L ${x - 8},${y} Z`;
			})
			.style("fill", "#ef4444")
			.style("stroke", "#fff")
			.style("stroke-width", 1.5);

		// 添加互動層
		const overlay = g
			.append("rect")
			.attr("width", width)
			.attr("height", height)
			.style("fill", "none")
			.style("pointer-events", "all");

		// 創建tooltip
		const tooltip = d3
			.select("body")
			.append("div")
			.attr("class", "d3-tooltip")
			.style("position", "absolute")
			.style("visibility", "hidden")
			.style("background", "rgba(0, 0, 0, 0.9)")
			.style("color", "white")
			.style("padding", "12px")
			.style("border-radius", "6px")
			.style("font-size", "14px")
			.style("font-weight", "500")
			.style("z-index", "1000")
			.style("box-shadow", "0 4px 12px rgba(0, 0, 0, 0.3)");

		// 滑鼠互動
		overlay
			.on("mousemove", (event) => {
				const [mouseX] = d3.pointer(event);
				const x0 = xScale.invert(mouseX);
				const bisectDate = d3.bisector(
					(d: { timestamp: Date; power: number }) => d.timestamp,
				).left;
				const i = bisectDate(data, x0, 1);
				const d0 = data[i - 1];
				const d1 = data[i];
				const d =
					d1 &&
					x0.getTime() - d0.timestamp.getTime() >
						d1.timestamp.getTime() - x0.getTime()
						? d1
						: d0;

				if (d) {
					// 時間戳已經在資料處理時轉換為台灣時間，直接格式化顯示
					const taiwanTime = d.timestamp.toLocaleString("zh-TW", {
						year: "numeric",
						month: "2-digit",
						day: "2-digit",
						hour: "2-digit",
						minute: "2-digit",
						second: "2-digit",
						hour12: false,
					});

					tooltip
						.style("visibility", "visible")
						.html(`
							<div>時間: ${taiwanTime} (台灣時間)</div>
							<div>功率: ${d.power.toFixed(1)}W</div>
						`)
						.style("left", `${event.pageX + 10}px`)
						.style("top", `${event.pageY - 10}px`);
				}
			})
			.on("mouseout", () => {
				tooltip.style("visibility", "hidden");
			});

		// 添加軸標籤
		g.append("text")
			.attr("transform", "rotate(-90)")
			.attr("y", 0 - margin.left)
			.attr("x", 0 - height / 2)
			.attr("dy", "1em")
			.style("text-anchor", "middle")
			.style("font-size", "16px")
			.style("font-weight", "600")
			.text("Power (W)");

		g.append("text")
			.attr(
				"transform",
				`translate(${width / 2}, ${height + margin.bottom - 15})`,
			)
			.style("text-anchor", "middle")
			.style("font-size", "16px")
			.style("font-weight", "600")
			.text("Time");

		// 添加標題
		svg.append("text")
			.attr("x", width / 2 + margin.left)
			.attr("y", margin.top / 2)
			.attr("text-anchor", "middle")
			.style("font-size", "20px")
			.style("font-weight", "bold")
			.style("fill", "#1e293b")
			.text(
				selectedMeter === "main"
					? "Main Meter Power Consumption Trend"
					: selectedMeter === "appliance"
						? "Appliance Meter Power Consumption Trend"
						: "Both Meters Power Consumption Trend",
			);

		// 清理函數
		return () => {
			d3.select("body").selectAll(".d3-tooltip").remove();
		};
	}, [meterData, selectedMeter, startDate, endDate]);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-lg">
					<BarChart3 className="h-4 w-4" />
					Time Series Visualization
				</CardTitle>
			</CardHeader>
			<CardContent>
				{chartLoading ? (
					<div className="flex items-center justify-center h-[450px]">
						<div className="text-center">
							<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto" />
							<p className="mt-4 text-slate-600">
								Loading measurement data...
							</p>
						</div>
					</div>
				) : error ? (
					<div className="flex items-center justify-center h-[450px]">
						<div className="text-center text-red-600">
							<AlertCircle className="h-12 w-12 mx-auto mb-4" />
							<p>{error}</p>
						</div>
					</div>
				) : meterData ? (
					<div className="relative">
						<div className="w-full">
							<svg
								ref={svgRef}
								width="1000"
								height="500"
								className="w-full"
								style={{ background: "#f8fafc" }}
							/>
						</div>

						<div className="mt-6 text-sm text-slate-600 space-y-2">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<p className="font-medium mb-2">
										📊 Chart Features:
									</p>
									<ul className="space-y-1 text-xs">
										<li>
											• Interactive D3.js visualization
										</li>
										<li>
											• Hover for detailed information
										</li>
										<li>
											• Automatic time format adjustment
										</li>
									</ul>
								</div>
								<div>
									<p className="font-medium mb-2">
										⚠️ Data Indicators:
									</p>
									<ul className="space-y-1 text-xs">
										<li>
											• Red diamonds = potential anomalies
										</li>
										<li>
											• Line breaks = gaps &gt; 5 minutes
										</li>
										<li>
											• All times in Taiwan Time (UTC+8)
										</li>
									</ul>
								</div>
							</div>
							<div className="text-center pt-2 border-t border-slate-200">
								<p className="text-xs text-slate-500">
									Data points:{" "}
									{meterData.timeSeries?.length || 0} | Chart
									size: 1000×500px
								</p>
							</div>
						</div>
					</div>
				) : (
					<div className="flex items-center justify-center h-[450px]">
						<p className="text-slate-500">
							Please select a unit and date range to view data
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
