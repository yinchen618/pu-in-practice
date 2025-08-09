"use client";
import type { MeterData } from "@/hooks/use-testbed-data";
import { fetchMeterData } from "@/hooks/use-testbed-data";
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
	const [endDateTime, setEndDateTime] = useQueryState("end", {
		defaultValue: defaultEndIso,
		shallow: false,
	});
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
						endDateTime={endDateTime || defaultEndIso}
						setEndDateTime={(v) => setEndDateTime(v)}
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
						startDate={startDateTime}
						endDate={endDateTime}
					/>

					{/* Statistics */}
					{meterData && <DataStatistics meterData={meterData} />}
				</div>
			</div>
		</div>
	);
}
