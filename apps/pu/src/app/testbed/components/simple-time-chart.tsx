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
		const width = 800 - margin.left - margin.right;
		const height = 500 - margin.top - margin.bottom;

		// 主繪圖區域
		const g = svg
			.append("g")
			.attr("transform", `translate(${margin.left},${margin.top})`);

		// 提取和處理數據：
		// - 將後端字串正規化為 UTC 時間（若無時區資訊，視為 UTC 而非本地）
		// - 顯示時一律以 Asia/Taipei 進行格式化
		function parseAsUtcIfNoTz(ts: string): Date {
			let s = ts.trim();
			// 將空白分隔改為 T，便於標準 ISO 解析
			if (s.includes(" ") && !s.includes("T")) {
				s = s.replace(" ", "T");
			}
			const hasTz = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(s);
			// 若末尾沒有 Z 或明確偏移，視為 UTC（DB 為 +0）
			if (!hasTz) {
				s = `${s}Z`;
			}
			return new Date(s);
		}

		const data =
			meterData.timeSeries?.map(
				(d: { timestamp: string; power: number }) => ({
					timestamp: parseAsUtcIfNoTz(d.timestamp),
					power: d.power,
				}),
			) || [];

		// 可能存在的 Appliance 另一條序列
		const applianceRaw =
			meterData.applianceTimeSeries?.map(
				(d: { timestamp: string; power: number }) => ({
					timestamp: parseAsUtcIfNoTz(d.timestamp),
					power: d.power,
				}),
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

		// 依使用者的時間範圍先過濾資料，避免資料掉在圖外
		const selectedStart = startDate ? new Date(startDate) : null;
		const selectedEnd = endDate ? new Date(endDate) : null;
		const filteredData = data.filter((d) => {
			if (selectedStart && d.timestamp < selectedStart) {
				return false;
			}
			if (selectedEnd && d.timestamp > selectedEnd) {
				return false;
			}
			return true;
		});

		// 以「搜尋區間 ∪ 全部資料範圍」作為 x 軸 domain，讓空窗期可視（考慮 both 情況）
		const seriesForExtent =
			applianceRaw.length > 0 ? data.concat(applianceRaw) : data;
		const totalExtent = d3.extent(
			seriesForExtent,
			(d: { timestamp: Date; power: number }) => d.timestamp,
		) as [Date, Date];
		let domainStart = totalExtent[0];
		let domainEnd = totalExtent[1];
		if (selectedStart && selectedStart < domainStart) {
			domainStart = selectedStart;
		}
		if (selectedEnd && selectedEnd > domainEnd) {
			domainEnd = selectedEnd;
		}
		// 在兩端各加 10 分鐘 padding，避免視覺太擁擠
		const padMs = 10 * 60 * 1000;
		const paddedStart = new Date(domainStart.getTime() - padMs);
		const paddedEnd = new Date(domainEnd.getTime() + padMs);
		const timeExtent: [Date, Date] = [paddedStart, paddedEnd];

		const xScale = d3.scaleTime().domain(timeExtent).range([0, width]);

		// Debug logs: 顯示資料與圖表的時間範圍（UTC 與台灣時間）
		const dataExtent = d3.extent(
			data,
			(d: { timestamp: Date; power: number }) => d.timestamp,
		) as [Date, Date];
		const fmtTW = (d: Date) =>
			new Intl.DateTimeFormat("zh-TW", {
				timeZone: "Asia/Taipei",
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
				hour: "2-digit",
				minute: "2-digit",
				second: "2-digit",
				hour12: false,
			}).format(d);
		console.log(
			"[TimeChart] Data range UTC:",
			dataExtent[0]?.toISOString(),
			"~",
			dataExtent[1]?.toISOString(),
			`(total=${data.length})`,
		);
		console.log(
			"[TimeChart] Data range Taipei:",
			dataExtent[0] ? fmtTW(dataExtent[0]) : null,
			"~",
			dataExtent[1] ? fmtTW(dataExtent[1]) : null,
		);
		console.log(
			"[TimeChart] Selected range UTC:",
			selectedStart?.toISOString() || null,
			"~",
			selectedEnd?.toISOString() || null,
		);
		console.log(
			"[TimeChart] X domain UTC:",
			timeExtent[0]?.toISOString(),
			"~",
			timeExtent[1]?.toISOString(),
		);
		console.log(
			"[TimeChart] X domain Taipei:",
			fmtTW(timeExtent[0]),
			"~",
			fmtTW(timeExtent[1]),
		);

		// 針對實際繪圖的資料也輸出範圍與數量（限制在 union）
		const displayData = data.filter(
			(d) => d.timestamp >= domainStart && d.timestamp <= domainEnd,
		);
		const applianceDisplayData = applianceRaw.filter(
			(d) => d.timestamp >= domainStart && d.timestamp <= domainEnd,
		);
		const dispExtent = d3.extent(
			displayData,
			(d: { timestamp: Date; power: number }) => d.timestamp,
		) as [Date, Date];
		console.log(
			"[TimeChart] DisplayData range UTC:",
			dispExtent[0]?.toISOString(),
			"~",
			dispExtent[1]?.toISOString(),
			`(count=${displayData.length})`,
		);
		console.log(
			"[TimeChart] DisplayData range Taipei:",
			dispExtent[0] ? fmtTW(dispExtent[0]) : null,
			"~",
			dispExtent[1] ? fmtTW(dispExtent[1]) : null,
		);

		const yScale = d3
			.scaleLinear()
			.domain([
				0,
				d3.max(
					selectedMeter === "both" && applianceDisplayData.length > 0
						? displayData.concat(applianceDisplayData)
						: displayData,
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
		let timeFormat: "HM" | "MDHM" | "MD";
		let tickCount: number;

		if (timeRangeHours <= 24) {
			// 小於 24 小時：顯示 小時:分鐘
			timeFormat = "HM";
			tickCount = Math.min(
				16,
				Math.max(6, Math.floor(timeRangeHours / 1.5)),
			);
		} else if (timeRangeHours <= 168) {
			// 小於 7 天：顯示 月/日 小時:分鐘
			timeFormat = "MDHM";
			tickCount = Math.min(
				20,
				Math.max(8, Math.floor(timeRangeHours / 8)),
			);
		} else {
			// 超過 7 天：顯示 月/日
			timeFormat = "MD";
			tickCount = Math.min(
				15,
				Math.max(8, Math.floor(timeRangeHours / 16)),
			);
		}

		// 台灣時間格式化工具（不改變座標，只改顯示）
		function formatTaipeiLabel(d: Date): string {
			const optsBase: Intl.DateTimeFormatOptions = {
				timeZone: "Asia/Taipei",
				hour12: false,
			};
			if (timeFormat === "HM") {
				return new Intl.DateTimeFormat("en-CA", {
					...optsBase,
					hour: "2-digit",
					minute: "2-digit",
				}).format(d);
			}
			if (timeFormat === "MDHM") {
				const date = new Intl.DateTimeFormat("en-CA", {
					...optsBase,
					month: "2-digit",
					day: "2-digit",
				}).format(d);
				const hm = new Intl.DateTimeFormat("en-CA", {
					...optsBase,
					hour: "2-digit",
					minute: "2-digit",
				}).format(d);
				return `${date} ${hm}`;
			}
			// MD
			return new Intl.DateTimeFormat("en-CA", {
				...optsBase,
				month: "2-digit",
				day: "2-digit",
			}).format(d);
		}

		// 繪製 X 軸（不強制加入最左端刻度，避免與第一個自動刻度重疊）
		g.append("g")
			.attr("transform", `translate(0,${height})`)
			.call(
				d3
					.axisBottom(xScale)
					.ticks(tickCount)
					.tickFormat((d) => formatTaipeiLabel(d as Date)),
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
			.datum(displayData)
			.attr("d", line)
			.style("fill", "none")
			.style("stroke", "#3b82f6")
			.style("stroke-width", 2);

		// 繪製數據點
		g.selectAll(".dot")
			.data(displayData)
			.enter()
			.append("circle")
			.attr("class", "dot")
			.attr("cx", (d: { timestamp: Date; power: number }) =>
				xScale(d.timestamp),
			)
			.attr("cy", (d: { timestamp: Date; power: number }) =>
				yScale(d.power),
			)
			.attr("r", 2.5)
			.style("fill", "#3b82f6")
			.style("stroke", "#fff")
			.style("stroke-width", 1.5)
			.style("opacity", 0.6);

		// 繪製 Appliance 線與點（僅在 both 且有資料時）
		if (selectedMeter === "both" && applianceDisplayData.length > 0) {
			const lineAppliance = d3
				.line<{ timestamp: Date; power: number }>()
				.x((d) => xScale(d.timestamp))
				.y((d) => yScale(d.power))
				.curve(d3.curveMonotoneX)
				.defined((d, i) => {
					if (i === 0) {
						return true;
					}
					const prevTime =
						applianceDisplayData[i - 1].timestamp.getTime();
					const currentTime = d.timestamp.getTime();
					const timeDiff = (currentTime - prevTime) / (1000 * 60);
					return timeDiff <= 5;
				});

			g.append("path")
				.datum(applianceDisplayData)
				.attr("d", lineAppliance)
				.style("fill", "none")
				.style("stroke", "#22c55e")
				.style("stroke-width", 2);

			g.selectAll(".dot-appliance")
				.data(applianceDisplayData)
				.enter()
				.append("circle")
				.attr("class", "dot-appliance")
				.attr("cx", (d) => xScale(d.timestamp))
				.attr("cy", (d) => yScale(d.power))
				.attr("r", 2.5)
				.style("fill", "#22c55e")
				.style("stroke", "#fff")
				.style("stroke-width", 1.5)
				.style("opacity", 0.6);
		}

		// 繪製異常點
		const anomalies = displayData.filter(
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
				const s = 5; // 半徑縮小
				return `M ${x},${y - s} L ${x + s},${y} L ${x},${y + s} L ${x - s},${y} Z`;
			})
			.style("fill", "#ef4444")
			.style("stroke", "#fff")
			.style("stroke-width", 1.5);

		// 標示缺資料區段：在 both 模式下，使用主/副合併序列來判斷缺口
		const missingIntervals: Array<{ start: Date; end: Date }> = [];
		let prevT = domainStart;
		const gapMin = 5;
		const combined =
			selectedMeter === "both" && applianceDisplayData.length > 0
				? displayData
						.concat(applianceDisplayData)
						.sort(
							(a, b) =>
								a.timestamp.getTime() - b.timestamp.getTime(),
						)
				: displayData;
		for (let i = 0; i < combined.length; i += 1) {
			const t = combined[i].timestamp;
			const diffMin = (t.getTime() - prevT.getTime()) / (1000 * 60);
			if (diffMin > gapMin) {
				missingIntervals.push({ start: prevT, end: t });
			}
			prevT = t;
		}
		// union 右端尾段
		if ((domainEnd.getTime() - prevT.getTime()) / (1000 * 60) > gapMin) {
			missingIntervals.push({ start: prevT, end: domainEnd });
		}

		const bandHeight = 8;
		g.selectAll(".no-data-band")
			.data(missingIntervals)
			.enter()
			.append("rect")
			.attr("class", "no-data-band")
			.attr("x", (d) => {
				const s = new Date(
					Math.max(timeExtent[0].getTime(), d.start.getTime()),
				);
				return xScale(s);
			})
			.attr("y", height - bandHeight)
			.attr("width", (d) => {
				const s = new Date(
					Math.max(timeExtent[0].getTime(), d.start.getTime()),
				);
				const e = new Date(
					Math.min(timeExtent[1].getTime(), d.end.getTime()),
				);
				return Math.max(1, xScale(e) - xScale(s));
			})
			.attr("height", bandHeight)
			.style("fill", "#94a3b8")
			.style("opacity", 0.6)
			.append("title")
			.text((d) => {
				const fmt = (dt: Date) =>
					new Intl.DateTimeFormat("zh-TW", {
						timeZone: "Asia/Taipei",
						year: "numeric",
						month: "2-digit",
						day: "2-digit",
						hour: "2-digit",
						minute: "2-digit",
						second: "2-digit",
						hour12: false,
					}).format(dt);
				return `No data: ${fmt(d.start)} ~ ${fmt(d.end)}`;
			});

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
				const i = bisectDate(displayData, x0, 1);
				const d0 = displayData[i - 1];
				const d1 = displayData[i];
				const d =
					d1 &&
					x0.getTime() - d0.timestamp.getTime() >
						d1.timestamp.getTime() - x0.getTime()
						? d1
						: d0;

				if (d) {
					// 使用 Asia/Taipei 時區格式化提示訊息
					const taiwanTime = new Intl.DateTimeFormat("zh-TW", {
						timeZone: "Asia/Taipei",
						year: "numeric",
						month: "2-digit",
						day: "2-digit",
						hour: "2-digit",
						minute: "2-digit",
						second: "2-digit",
						hour12: false,
					}).format(d.timestamp);

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
								width="800"
								height="500"
								className="max-w-[800px]"
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
									size: 800×500px
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
