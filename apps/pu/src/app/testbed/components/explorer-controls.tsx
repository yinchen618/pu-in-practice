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
import { Settings } from "lucide-react";
import { useEffect } from "react";

interface ExplorerControlsProps {
	selectedBuilding: string;
	setSelectedBuilding: (value: string) => void;
	selectedUnit: string;
	setSelectedUnit: (value: string) => void;
	selectedMeter: string;
	setSelectedMeter: (value: string) => void;
	startDate: string;
	setStartDate: (value: string) => void;
	endDate: string;
	setEndDate: (value: string) => void;
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
	startDate,
	setStartDate,
	endDate,
	setEndDate,
	onLoadData,
}: ExplorerControlsProps) {
	// 大樓選項
	const buildingOptions = [
		{ value: "a", label: "Building A" },
		{ value: "b", label: "Building B" },
	];

	// 根據 meter.csv 的實際房間號碼
	const getRoomOptions = (building: string) => {
		if (building === "a") {
			// 15學舍的房間號碼（從 meter.csv 提取，略過帶 a 的房間）
			const rooms = [
				"101",
				"102",
				"103",
				"105",
				"106",
				"107",
				"108",
				"110",
				"201",
				"202",
				"203",
				"205",
				"206",
				"207",
				"208",
				"209",
				"210",
				"211",
				"212",
				"216",
				"301",
				"302",
				"303",
				"305",
				"306",
				"307",
				"308",
				"309",
				"310",
				"311",
				"312",
				"316",
				"501",
				"502",
				"503",
				"505",
				"506",
				"507",
				"508",
				"509",
				"510",
				"511",
				"512",
				"516",
			];
			return rooms.map((room) => ({
				value: room,
				label: `${room}`,
			}));
		}
		if (building === "b") {
			// 85學舍的房間號碼（從 meter.csv 提取，略過帶 a 的房間）
			const rooms = [
				"101",
				"102",
				"103",
				"107",
				"109",
				"301",
				"302",
				"303",
				"305",
				"306",
				"307",
				"308",
				"309",
				"310",
				"311",
				"312",
				"501",
				"502",
				"503",
				"505",
				"506",
				"507",
				"508",
				"509",
				"510",
				"511",
				"512",
				"601",
				"602",
				"603",
				"605",
				"606",
				"607",
			];
			return rooms.map((room) => ({
				value: room,
				label: `${room}`,
			}));
		}
		return [];
	};

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
		if (selectedUnit && startDate && endDate) {
			onLoadData(
				selectedBuilding,
				selectedUnit,
				selectedMeter,
				startDate,
				endDate,
			);
		}
	};

	// 當參數變更時自動載入資料
	useEffect(() => {
		if (selectedUnit && selectedMeter && startDate && endDate) {
			handleLoadData();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedBuilding, selectedUnit, selectedMeter, startDate, endDate]);

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
							{getRoomOptions(selectedBuilding || "a").map(
								(room) => (
									<SelectItem
										key={room.value}
										value={room.value}
									>
										{room.label}
									</SelectItem>
								),
							)}
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
							{meterOptions.map((option) => (
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

				{/* Temporal Range Configuration */}
				<div className="space-y-2">
					<Label htmlFor="start-date">Analysis Start Date</Label>
					<Input
						id="start-date"
						type="date"
						value={startDate}
						onChange={(e) => setStartDate(e.target.value)}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="end-date">Analysis End Date</Label>
					<Input
						id="end-date"
						type="date"
						value={endDate}
						onChange={(e) => setEndDate(e.target.value)}
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
