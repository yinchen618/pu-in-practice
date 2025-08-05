import type { MeterData } from "@/hooks/use-testbed-data";
import { fetchMeterData } from "@/hooks/use-testbed-data";
import { useEffect, useState } from "react";
import { DataStatistics } from "./data-statistics";
import { ExplorerControls } from "./explorer-controls";
import { SimpleTimeChart } from "./simple-time-chart";

export function ExplorerTab() {
	// 所有狀態在這裡管理
	const [selectedBuilding, setSelectedBuilding] = useState<string>("a");
	const [selectedUnit, setSelectedUnit] = useState<string>("");
	const [selectedMeter, setSelectedMeter] = useState<string>("main");
	const [startDate, setStartDate] = useState<string>("");
	const [endDate, setEndDate] = useState<string>("");
	const [meterData, setMeterData] = useState<MeterData | null>(null);
	const [chartLoading, setChartLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Set default date range (last 7 days)
	useEffect(() => {
		const today = new Date();
		const lastWeek = new Date(today);
		lastWeek.setDate(today.getDate() - 7);

		const formatDate = (date: Date) => date.toISOString().split("T")[0];
		setEndDate(formatDate(today));
		setStartDate(formatDate(lastWeek));
	}, []);

	// 載入電表資料
	const loadMeterData = async (
		building: string,
		unit: string,
		meter: string,
		start: string,
		end: string,
	) => {
		if (!unit || !start || !end) {
			return;
		}

		setChartLoading(true);
		setError(null);

		try {
			const data = await fetchMeterData(
				building,
				unit,
				meter,
				start,
				end,
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
						selectedBuilding={selectedBuilding}
						setSelectedBuilding={setSelectedBuilding}
						selectedUnit={selectedUnit}
						setSelectedUnit={setSelectedUnit}
						selectedMeter={selectedMeter}
						setSelectedMeter={setSelectedMeter}
						startDate={startDate}
						setStartDate={setStartDate}
						endDate={endDate}
						setEndDate={setEndDate}
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
						startDate={startDate}
						endDate={endDate}
					/>

					{/* Statistics */}
					{meterData && <DataStatistics meterData={meterData} />}
				</div>
			</div>
		</div>
	);
}
