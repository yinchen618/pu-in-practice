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
import { Calendar, Filter, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { ProfitSharingRecord } from "./columns";

export interface ProfitSharingFilters {
	search?: string;
	productCategory?: string;
	dateFrom?: string;
	dateTo?: string;
}

interface ProfitSharingFiltersProps {
	data: ProfitSharingRecord[];
	onFilterChange: (filteredData: ProfitSharingRecord[]) => void;
	onFiltersChange?: (filters: ProfitSharingFilters) => void;
}

export function ProfitSharingFilters({
	data,
	onFilterChange,
	onFiltersChange,
}: ProfitSharingFiltersProps) {
	const [filters, setFilters] = useState<ProfitSharingFilters>({});
	const [isExpanded, setIsExpanded] = useState(false);

	// 從資料中提取唯一值
	const uniqueProductCategories = Array.from(
		new Set(data.map((item) => item.productCategory).filter(Boolean)),
	);

	const applyFilters = (newFilters: ProfitSharingFilters) => {
		setFilters(newFilters);
		onFiltersChange?.(newFilters);

		let filteredData = [...data];

		// 搜尋篩選
		if (newFilters.search) {
			const searchTerm = newFilters.search.toLowerCase();
			filteredData = filteredData.filter(
				(item) =>
					item.productName.toLowerCase().includes(searchTerm) ||
					item.productCode.toLowerCase().includes(searchTerm) ||
					item.customerName.toLowerCase().includes(searchTerm),
			);
		}

		// 產品類別篩選
		if (newFilters.productCategory) {
			filteredData = filteredData.filter(
				(item) => item.productCategory === newFilters.productCategory,
			);
		}

		// 日期範圍篩選
		if (newFilters.dateFrom) {
			const fromDate = new Date(newFilters.dateFrom);
			filteredData = filteredData.filter(
				(item) => new Date(item.profitDate) >= fromDate,
			);
		}
		if (newFilters.dateTo) {
			const toDate = new Date(newFilters.dateTo);
			toDate.setHours(23, 59, 59, 999); // 包含整天
			filteredData = filteredData.filter(
				(item) => new Date(item.profitDate) <= toDate,
			);
		}

		onFilterChange(filteredData);
	};

	// 當篩選器改變時更新結果
	useEffect(() => {
		applyFilters(filters);
	}, [filters]);

	const updateFilter = (key: keyof ProfitSharingFilters, value: any) => {
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
						placeholder="搜尋產品名稱、代碼或客戶名稱..."
						value={filters.search || ""}
						onChange={(e) => updateFilter("search", e.target.value)}
						className="w-64"
					/>
				</div>
			</div>

			{/* 展開的篩選器 */}
			{isExpanded && (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/20">
					{/* 產品類別篩選 */}
					<div className="space-y-2">
						<Label className="text-sm font-medium">產品類別</Label>
						<Select
							value={filters.productCategory || ""}
							onValueChange={(value) =>
								updateFilter(
									"productCategory",
									value === "all" ? undefined : value,
								)
							}
						>
							<SelectTrigger>
								<SelectValue placeholder="選擇產品類別" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">全部類別</SelectItem>
								{uniqueProductCategories.map((category) => (
									<SelectItem key={category} value={category}>
										{category}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* 日期範圍篩選 */}
					<div className="space-y-2">
						<Label className="text-sm font-medium flex items-center gap-1">
							<Calendar className="size-4" />
							日期區間
						</Label>
						<div className="space-y-2">
							<Input
								type="date"
								placeholder="開始日期"
								value={filters.dateFrom || ""}
								onChange={(e) =>
									updateFilter("dateFrom", e.target.value)
								}
							/>
							<Input
								type="date"
								placeholder="結束日期"
								value={filters.dateTo || ""}
								onChange={(e) =>
									updateFilter("dateTo", e.target.value)
								}
							/>
						</div>
					</div>
				</div>
			)}

			{/* 已選擇的篩選條件標籤 */}
			{hasActiveFilters && (
				<div className="flex flex-wrap gap-2">
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
					{filters.productCategory &&
						filters.productCategory !== "all" && (
							<Badge status="info" className="gap-1">
								類別: {filters.productCategory}
								<button
									type="button"
									onClick={() =>
										updateFilter(
											"productCategory",
											undefined,
										)
									}
									className="ml-1 hover:bg-destructive/20 rounded-full"
								>
									<X className="size-3" />
								</button>
							</Badge>
						)}
					{filters.dateFrom && (
						<Badge status="info" className="gap-1">
							開始: {filters.dateFrom}
							<button
								type="button"
								onClick={() =>
									updateFilter("dateFrom", undefined)
								}
								className="ml-1 hover:bg-destructive/20 rounded-full"
							>
								<X className="size-3" />
							</button>
						</Badge>
					)}
					{filters.dateTo && (
						<Badge status="info" className="gap-1">
							結束: {filters.dateTo}
							<button
								type="button"
								onClick={() =>
									updateFilter("dateTo", undefined)
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
