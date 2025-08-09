"use client";
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
import { fetchResidentialUnits } from "@/hooks/use-testbed-data";
import { Settings } from "lucide-react";
import { useEffect, useState } from "react";

interface ExplorerControlsProps {
	selectedBuilding: string;
	setSelectedBuilding: (value: string) => void;
	selectedUnit: string;
	setSelectedUnit: (value: string) => void;
	selectedMeter: string;
	setSelectedMeter: (value: string) => void;
	// UTC ISO string, e.g., 2025-01-01T00:00:00.000Z
	startDateTime: string;
	setStartDateTime: (value: string) => void;
	endDateTime: string;
	setEndDateTime: (value: string) => void;
	onLoadData: (
		building: string,
		unit: string,
		meter: string,
		start: string,
		end: string,
	) => void;
}

export function ExplorerControls({
	selectedBuilding,
	setSelectedBuilding,
	selectedUnit,
	setSelectedUnit,
	selectedMeter,
	setSelectedMeter,
	startDateTime,
	setStartDateTime,
	endDateTime,
	setEndDateTime,
	onLoadData,
}: ExplorerControlsProps) {
	// 大樓選項
	const buildingOptions = [
		{ value: "a", label: "Building A" },
		{ value: "b", label: "Building B" },
	];

	// 動態載入房間（來源：後端以 meter.csv 產生）
	const [unitOptions, setUnitOptions] = useState<
		{ value: string; label: string; hasAppliance: boolean }[]
	>([]);
	useEffect(() => {
		async function loadUnits() {
			try {
				const items = await fetchResidentialUnits(
					(selectedBuilding || "a") as "a" | "b",
				);
				const opts = items
					.filter((u) => !!u.roomNumber)
					.reduce<Record<string, boolean>>((acc, u) => {
						// 若同一房號同時有/沒有 appliance，以有為準
						acc[u.roomNumber] = acc[u.roomNumber] || u.hasAppliance;
						return acc;
					}, {});
				const sorted = Object.keys(opts)
					.sort((a, b) => Number(a) - Number(b))
					.map((room) => ({
						value: room,
						label: `${room}`,
						hasAppliance: opts[room],
					}));
				setUnitOptions(sorted);
			} catch {
				setUnitOptions([]);
			}
		}
		void loadUnits();
	}, [selectedBuilding]);

	const selectedUnitHasAppliance =
		unitOptions.find((u) => u.value === selectedUnit)?.hasAppliance ??
		false;

	// 若選到沒有 appliance 的房間，自動把 meter 類型切回 main
	useEffect(() => {
		if (
			!selectedUnitHasAppliance &&
			(selectedMeter === "appliance" || selectedMeter === "both")
		) {
			setSelectedMeter("main");
		}
	}, [selectedUnitHasAppliance, selectedMeter, setSelectedMeter]);

	const meterOptions = [
		{ value: "both", label: "Both Meters (Main + Appliance)" },
		{ value: "main", label: "Main Meter" },
		{ value: "appliance", label: "Appliance Meter" },
	];

	// 當大樓改變時，重置房間選擇
	const handleBuildingChange = (value: string) => {
		setSelectedBuilding(value);
		setSelectedUnit(""); // 重置房間選擇
	};

	// 載入資料
	const handleLoadData = () => {
		if (selectedUnit && startDateTime && endDateTime) {
			onLoadData(
				selectedBuilding,
				selectedUnit,
				selectedMeter,
				startDateTime,
				endDateTime,
			);
		}
	};

	// 當參數變更時自動載入資料
	useEffect(() => {
		if (selectedUnit && selectedMeter && startDateTime && endDateTime) {
			handleLoadData();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		selectedBuilding,
		selectedUnit,
		selectedMeter,
		startDateTime,
		endDateTime,
	]);

	// Helpers: 使用 Asia/Taipei 與 input[type=datetime-local] 互轉
	// - 顯示時：將 UTC ISO 轉為台北時區的本地值 yyyy-MM-ddTHH:mm
	// - 寫回時：把使用者輸入視為台北時區時間，再轉回 UTC ISO
	function toTaipeiInputValue(utcIso: string) {
		if (!utcIso) {
			return "";
		}
		const d = new Date(utcIso);
		// 以台北時區格式化各欄位
		const fmt = new Intl.DateTimeFormat("en-CA", {
			timeZone: "Asia/Taipei",
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		});
		const parts = fmt
			.formatToParts(d)
			.reduce<Record<string, string>>((acc, p) => {
				if (p.type !== "literal") {
					acc[p.type] = p.value;
				}
				return acc;
			}, {});
		// en-CA 產生 YYYY-MM-DD, 取 hour/minute 為 24h
		const yyyy = parts.year;
		const mm = parts.month;
		const dd = parts.day;
		const hh = parts.hour;
		const mi = parts.minute;
		return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
	}

	function taipeiLocalToUtcIso(localValue: string) {
		if (!localValue) {
			return "";
		}
		// localValue 視為台北時區的本地時間
		const [datePart, timePart] = localValue.split("T");
		const [y, m, d] = datePart.split("-").map((s) => Number(s));
		const [hh, mi] = timePart.split(":").map((s) => Number(s));
		// 構造對應的 UTC 時間：先得到台北時間的 epoch，再減去 8 小時偏移
		const taipeiEpoch = Date.UTC(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mi ?? 0);
		const utcEpoch = taipeiEpoch - 8 * 60 * 60 * 1000;
		return new Date(utcEpoch).toISOString();
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Settings className="h-5 w-5" />
					Smart Meter Data Explorer
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Building Selection */}
				<div className="space-y-2">
					<Label htmlFor="building">Building Selection</Label>
					<Select
						value={selectedBuilding || "a"}
						onValueChange={handleBuildingChange}
					>
						<SelectTrigger id="building">
							<SelectValue placeholder="Choose a building" />
						</SelectTrigger>
						<SelectContent>
							{buildingOptions.map((option) => (
								<SelectItem
									key={option.value}
									value={option.value}
								>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Residential Unit Selection */}
				<div className="space-y-2">
					<Label htmlFor="unit">Residential Unit</Label>
					<Select
						value={selectedUnit}
						onValueChange={setSelectedUnit}
						disabled={!selectedBuilding}
					>
						<SelectTrigger id="unit">
							<SelectValue placeholder="Choose a unit" />
						</SelectTrigger>
						<SelectContent>
							{unitOptions.map((room) => (
								<SelectItem key={room.value} value={room.value}>
									{room.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Meter Type Configuration */}
				<div className="space-y-2">
					<Label htmlFor="meter">Meter Configuration</Label>
					<Select
						value={selectedMeter}
						onValueChange={setSelectedMeter}
					>
						<SelectTrigger id="meter">
							<SelectValue placeholder="Choose meter type" />
						</SelectTrigger>
						<SelectContent>
							{meterOptions.map((option) => {
								const disabled =
									(option.value === "appliance" ||
										option.value === "both") &&
									!selectedUnitHasAppliance;
								return (
									<SelectItem
										key={option.value}
										value={option.value}
										disabled={disabled}
									>
										{option.label}
									</SelectItem>
								);
							})}
						</SelectContent>
					</Select>
				</div>

				{/* Temporal Range Configuration */}
				<div className="space-y-2">
					<Label htmlFor="start-datetime">
						Analysis Start DateTime
					</Label>
					<Input
						id="start-datetime"
						type="datetime-local"
						value={toTaipeiInputValue(startDateTime)}
						onChange={(e) =>
							setStartDateTime(
								taipeiLocalToUtcIso(e.target.value),
							)
						}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="end-datetime">Analysis End DateTime</Label>
					<Input
						id="end-datetime"
						type="datetime-local"
						value={toTaipeiInputValue(endDateTime)}
						onChange={(e) =>
							setEndDateTime(taipeiLocalToUtcIso(e.target.value))
						}
					/>
				</div>

				{/* Load Data Button */}
				{/* <div className="pt-4">
					<Button
						onClick={handleLoadData}
						disabled={!selectedUnit || !startDate || !endDate}
						className="w-full"
					>
						<Search className="mr-2 h-4 w-4" />
						Load Data
					</Button>
				</div> */}
			</CardContent>
		</Card>
	);
}
