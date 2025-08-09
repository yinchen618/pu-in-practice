"use client";
import type { MeterData } from "@/hooks/use-testbed-data";
import { fetchMeterData } from "@/hooks/use-testbed-data";
import Link from "next/link";
import { useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { DataStatistics } from "./data-statistics";
import { ExplorerControls } from "./explorer-controls";
import { SimpleTimeChart } from "./simple-time-chart";

export function ExplorerTab() {
	// 預設時間範圍（過去7天），以台北時間的當下計算，再轉成 UTC ISO 存入狀態
	const defaultEndIso = useMemo(() => {
		const now = new Date();
		// 取現在的 UTC epoch，等效於台北現在 - 8h
		return now.toISOString();
	}, []);
	const defaultStartIso = useMemo(() => {
		const now = new Date();
		now.setDate(now.getDate() - 7);
		return now.toISOString();
	}, []);

	// 與網址列同步的狀態（nuqs）
	const [selectedBuilding, setSelectedBuilding] = useQueryState("building", {
		defaultValue: "a",
		shallow: false,
	});
	const [selectedUnit, setSelectedUnit] = useQueryState("unit", {
		defaultValue: "",
		shallow: false,
	});
	const [selectedMeter, setSelectedMeter] = useQueryState("meter", {
		defaultValue: "main",
		shallow: false,
	});
	const [startDateTime, setStartDateTime] = useQueryState("start", {
		defaultValue: defaultStartIso,
		shallow: false,
	});
	// end 允許為空（非 custom 模式不寫入 URL）
	const [endDateTime, setEndDateTime] = useQueryState<string | null>("end", {
		shallow: false,
	});
	// 快速區間：用 URL range 參數保存；custom 時不寫入 URL
	const [rangeParam, setRangeParam] = useQueryState<string | null>("range", {
		shallow: false,
	});
	type RangeMode = "6h" | "12h" | "1d" | "3d" | "1w" | "custom";
	const rangeMode: RangeMode = (rangeParam as RangeMode) || "custom";
	const setRangeMode = (mode: RangeMode) =>
		setRangeParam(mode === "custom" ? null : mode);
	const [meterData, setMeterData] = useState<MeterData | null>(null);
	const [chartLoading, setChartLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// 無需額外 useEffect，預設值由 nuqs defaultValue 提供

	// 載入電表資料
	const loadMeterData = async (
		building: string,
		unit: string,
		meter: string,
		startIso: string,
		endIso: string,
	) => {
		if (!unit || !startIso || !endIso) {
			return;
		}

		setChartLoading(true);
		setError(null);

		try {
			// 後端：日期為必填保留相容；同時傳 datetime（UTC ISO）供精準裁切
			const start = new Date(startIso).toISOString().split("T")[0];
			const end = new Date(endIso).toISOString().split("T")[0];
			const data = await fetchMeterData(
				building,
				unit,
				meter,
				start,
				end,
				startIso,
				endIso,
			);
			setMeterData(data);
		} catch (err) {
			setError("Failed to load smart meter data");
			console.error("Failed to load meter data:", err);
		} finally {
			setChartLoading(false);
		}
	};
	// 計算圖表顯示的有效起訖時間
	const effectiveStart = startDateTime || defaultStartIso;
	const effectiveEnd = (() => {
		if (!effectiveStart) {
			return defaultEndIso;
		}
		const start = new Date(effectiveStart);
		const add = (ms: number) =>
			new Date(start.getTime() + ms).toISOString();
		switch (rangeMode) {
			case "6h": {
				return add(6 * 60 * 60 * 1000);
			}
			case "12h": {
				return add(12 * 60 * 60 * 1000);
			}
			case "1d": {
				return add(24 * 60 * 60 * 1000);
			}
			case "3d": {
				return add(3 * 24 * 60 * 60 * 1000);
			}
			case "1w": {
				return add(7 * 24 * 60 * 60 * 1000);
			}
			default: {
				return endDateTime || add(24 * 60 * 60 * 1000);
			}
		}
	})();

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
				{/* Control Panel */}
				<div className="lg:col-span-1">
					<ExplorerControls
						selectedBuilding={selectedBuilding || "a"}
						setSelectedBuilding={(v) => setSelectedBuilding(v)}
						selectedUnit={selectedUnit || ""}
						setSelectedUnit={(v) => setSelectedUnit(v)}
						selectedMeter={selectedMeter || "main"}
						setSelectedMeter={(v) => setSelectedMeter(v)}
						startDateTime={startDateTime || defaultStartIso}
						setStartDateTime={(v) => setStartDateTime(v)}
						endDateTime={endDateTime || ""}
						setEndDateTime={(v) => setEndDateTime(v)}
						rangeMode={rangeMode}
						setRangeMode={setRangeMode}
						onLoadData={loadMeterData}
					/>
				</div>

				{/* Chart Area */}
				<div className="lg:col-span-3">
					<SimpleTimeChart
						chartLoading={chartLoading}
						error={error}
						meterData={meterData}
						selectedMeter={selectedMeter}
						startDate={effectiveStart}
						endDate={effectiveEnd}
					/>

					{/* Statistics */}
					{meterData && <DataStatistics meterData={meterData} />}

					{/* Sidebar/Action */}
					<div className="pt-4">
						<Link
							className="text-sm text-blue-700 hover:underline"
							href="/case-study?tab=data-exploration"
						>
							Open this event in labeling view →
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
