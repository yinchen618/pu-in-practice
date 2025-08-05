import { useEffect, useState } from "react";

// 定義類型接口
export interface TestbedOverview {
	unitCount: number;
	activeUnits: number;
	totalPower: number;
	avgPower: number;
	status: "healthy" | "warning" | "error";
	lastUpdate: string;
	dataQuality: {
		completeness: number;
		accuracy: number;
		freshness: number;
	};
	alerts: Array<{
		id: string;
		type: "warning" | "error" | "info";
		message: string;
		timestamp: string;
	}>;
}

export interface TestbedUnit {
	id: string;
	name: string;
	location: string;
	status: "active" | "inactive" | "maintenance";
	powerConsumption: number;
	lastReading: string;
	meterTypes: string[];
	coordinates: [number, number];
	electricMeterNumber?: string;
	isAppliance?: boolean;
}

export interface MeterData {
	timeSeries: Array<{
		timestamp: string;
		power: number;
		voltage: number;
		current: number;
	}>;
	statistics: {
		totalDataPoints: number;
		averagePower: number;
		maxPower: number;
		minPower: number;
		powerFactor: number;
	};
	events: {
		anomalies: Array<{
			timestamp: string;
			power: number;
			description: string;
		}>;
		highUsagePeriods: Array<{
			startTime: string;
			endTime: string;
			averagePower: number;
		}>;
	};
	applianceTimeSeries?: Array<{
		timestamp: string;
		power: number;
		voltage: number;
		current: number;
	}>;
	applianceStatistics?: {
		totalDataPoints: number;
		averagePower: number;
		maxPower: number;
		minPower: number;
		powerFactor: number;
	};
	meterType?: "main" | "appliance" | "both";
}

// API 客戶端
class TestbedAPIClient {
	private baseUrl = "/api";

	async getTestbedOverview(): Promise<TestbedOverview> {
		const response = await fetch(`${this.baseUrl}/testbed/overview`, {
			method: "GET",
			credentials: "include",
			headers: {
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			throw new Error(
				`Failed to fetch testbed overview: ${response.status}`,
			);
		}

		// Hono API 直接返回數據對象，不包裝在 {success, data} 格式中
		return await response.json();
	}

	async getMeterData(
		unitId: string,
		meterType: string,
		startDate?: string,
		endDate?: string,
	): Promise<MeterData> {
		const params = new URLSearchParams({
			unit_id: unitId,
			meter_type: meterType,
			...(startDate && { start_date: startDate }),
			...(endDate && { end_date: endDate }),
		});

		const response = await fetch(
			`${this.baseUrl}/testbed/meter-data?${params}`,
			{
				method: "GET",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
			},
		);

		if (!response.ok) {
			throw new Error(`Failed to fetch meter data: ${response.status}`);
		}

		// Hono API 直接返回數據對象，不包裝在 {success, data} 格式中
		return await response.json();
	}
}

const testbedAPI = new TestbedAPIClient();

export function useTestbedData() {
	// Overview 資料狀態
	const [overview, setOverview] = useState<TestbedOverview | null>(null);
	const [overviewLoading, setOverviewLoading] = useState(true);

	// 載入概覽資料
	useEffect(() => {
		const loadOverviewData = async () => {
			setOverviewLoading(true);
			try {
				const data = await testbedAPI.getTestbedOverview();
				setOverview(data);
			} catch (err) {
				console.error("Failed to load overview data:", err);
			} finally {
				setOverviewLoading(false);
			}
		};

		loadOverviewData();
	}, []);

	return {
		// Overview data
		overview,
		overviewLoading,
	};
}
const getAmmeterHistoryData = async (
	building: string,
	electricMeterNumber: string,
	startDate: string,
	endDate: string,
): Promise<MeterData> => {
	const params = new URLSearchParams({
		building: building,
		meter_number: electricMeterNumber,
		start_date: startDate,
		end_date: endDate,
	});

	const response = await fetch(`/api/testbed/ammeter-history?${params}`, {
		method: "GET",
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
		},
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch ammeter history: ${response.status}`);
	}

	// Hono API 直接返回數據對象，不包裝在 {success, data} 格式中
	return await response.json();
};

// API 調用函數
export const fetchMeterData = async (
	building: string,
	unit: string,
	meterType: string,
	startDate: string,
	endDate: string,
): Promise<MeterData> => {
	// 根據 building 和 unit 構建電表號碼
	const mainMeterName = `${unit}`;
	const applianceMeterName = `${unit}a`;

	// 模擬從 meter.csv 獲取電表號碼的邏輯
	// 這裡可以根據實際需求調整

	if (meterType === "both") {
		const [mainData, applianceData] = await Promise.all([
			getAmmeterHistoryData(building, mainMeterName, startDate, endDate),
			getAmmeterHistoryData(
				building,
				applianceMeterName,
				startDate,
				endDate,
			),
		]);

		return {
			...mainData,
			applianceTimeSeries: applianceData.timeSeries,
			applianceStatistics: applianceData.statistics,
			meterType: "both" as const,
		};
	}

	const targetMeterName =
		meterType === "appliance" ? applianceMeterName : mainMeterName;
	const data = await getAmmeterHistoryData(
		building,
		targetMeterName,
		startDate,
		endDate,
	);
	return {
		...data,
		meterType: meterType as "main" | "appliance",
	};
};
