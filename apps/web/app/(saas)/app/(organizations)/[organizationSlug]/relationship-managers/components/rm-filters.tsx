"use client";

import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Activity, Filter, Users, X } from "lucide-react";
import { useState } from "react";
import type { RMRecord } from "./columns";

export interface RMFilters {
	search?: string;
	category?: "FINDER" | "RM" | "BOTH";
	status?: "active" | "inactive";
}

interface RMFiltersProps {
	data: RMRecord[];
	onFilterChange: (filteredData: RMRecord[]) => void;
	onFiltersChange?: (filters: RMFilters) => void;
}

export function RMFilters({
	data,
	onFilterChange,
	onFiltersChange,
}: RMFiltersProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const [filters, setFilters] = useState<RMFilters>({});

	const applyFilters = (newFilters: RMFilters) => {
		setFilters(newFilters);
		onFiltersChange?.(newFilters);

		let filteredData = [...data];

		// 搜尋篩選
		if (newFilters.search) {
			const searchTerm = newFilters.search.toLowerCase();
			filteredData = filteredData.filter(
				(item) =>
					item.name.toLowerCase().includes(searchTerm) ||
					item.email.toLowerCase().includes(searchTerm) ||
					item.phone?.toLowerCase().includes(searchTerm),
			);
		}

		// 類別篩選
		if (newFilters.category) {
			filteredData = filteredData.filter(
				(item) => item.category === newFilters.category,
			);
		}

		// 狀態篩選
		if (newFilters.status) {
			filteredData = filteredData.filter(
				(item) => item.status === newFilters.status,
			);
		}

		onFilterChange(filteredData);
	};

	const updateFilter = (key: keyof RMFilters, value: any) => {
		const newFilters = { ...filters, [key]: value };
		applyFilters(newFilters);
	};

	const clearFilters = () => {
		setFilters({});
		onFiltersChange?.({});
		onFilterChange(data);
	};

	const hasActiveFilters = Object.values(filters).some(
		(value) =>
			value !== undefined &&
			value !== null &&
			value !== "" &&
			value !== "all",
	);

	const getCategoryLabel = (category: string) => {
		switch (category) {
			case "FINDER":
				return "FINDER";
			case "RM":
				return "RM";
			case "BOTH":
				return "BOTH";
			default:
				return category;
		}
	};

	const getStatusLabel = (status: string) => {
		switch (status) {
			case "active":
				return "在職";
			case "inactive":
				return "離職";
			default:
				return status;
		}
	};

	return (
		<div className="space-y-4">
			{/* 篩選器控制列 */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setIsExpanded(!isExpanded)}
						className="gap-2"
					>
						<Filter className="size-4" />
						篩選器{" "}
						{hasActiveFilters &&
							`(${
								Object.values(filters).filter(
									(v) =>
										v !== undefined &&
										v !== null &&
										v !== "" &&
										v !== "all",
								).length
							})`}
					</Button>
					{hasActiveFilters && (
						<Button
							variant="ghost"
							size="sm"
							onClick={clearFilters}
						>
							<X className="size-4 mr-1" />
							清除篩選
						</Button>
					)}
				</div>

				{/* 主要搜尋框 */}
				<div className="flex items-center gap-2">
					<Input
						placeholder="搜尋 RM 名稱、電子郵件或電話..."
						value={filters.search || ""}
						onChange={(e) => updateFilter("search", e.target.value)}
						className="w-80"
					/>
				</div>
			</div>

			{/* 展開的篩選器 */}
			{isExpanded && (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/20">
					{/* RM 類別篩選 */}
					<div className="space-y-2">
						<Label className="text-sm font-medium flex items-center gap-1">
							<Users className="size-4" />
							RM 類別
						</Label>
						<Select
							value={filters.category || ""}
							onValueChange={(value) =>
								updateFilter(
									"category",
									value === "all" ? undefined : value,
								)
							}
						>
							<SelectTrigger>
								<SelectValue placeholder="選擇類別" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">全部</SelectItem>
								<SelectItem value="FINDER">FINDER</SelectItem>
								<SelectItem value="RM">RM</SelectItem>
								<SelectItem value="BOTH">BOTH</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* 狀態篩選 */}
					<div className="space-y-2">
						<Label className="text-sm font-medium flex items-center gap-1">
							<Activity className="size-4" />
							狀態
						</Label>
						<Select
							value={filters.status || ""}
							onValueChange={(value) =>
								updateFilter(
									"status",
									value === "all" ? undefined : value,
								)
							}
						>
							<SelectTrigger>
								<SelectValue placeholder="選擇狀態" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">全部</SelectItem>
								<SelectItem value="active">在職</SelectItem>
								<SelectItem value="inactive">離職</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			)}

			{/* 已選擇的篩選條件標籤 */}
			{hasActiveFilters && (
				<div className="flex flex-wrap gap-2">
					{filters.category && (
						<Badge status="info" className="gap-1">
							類別: {getCategoryLabel(filters.category)}
							<button
								type="button"
								onClick={() =>
									updateFilter("category", undefined)
								}
								className="ml-1 hover:bg-destructive/20 rounded-full"
							>
								<X className="size-3" />
							</button>
						</Badge>
					)}
					{filters.status && (
						<Badge status="info" className="gap-1">
							狀態: {getStatusLabel(filters.status)}
							<button
								type="button"
								onClick={() =>
									updateFilter("status", undefined)
								}
								className="ml-1 hover:bg-destructive/20 rounded-full"
							>
								<X className="size-3" />
							</button>
						</Badge>
					)}
					{filters.search && (
						<Badge status="info" className="gap-1">
							搜尋: {filters.search}
							<button
								type="button"
								onClick={() =>
									updateFilter("search", undefined)
								}
								className="ml-1 hover:bg-destructive/20 rounded-full"
							>
								<X className="size-3" />
							</button>
						</Badge>
					)}
				</div>
			)}
		</div>
	);
}
