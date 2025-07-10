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
import { Filter, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
	CURRENCY_OPTIONS,
	DISTRIBUTION_TYPE_OPTIONS,
	PRODUCT_CATEGORIES,
	PRODUCT_STATUSES,
} from "../../constants";
import type { ProductRecord } from "./columns";

export interface ProductFilters {
	category?: string;
	currency?: string;
	distributionType?: string;
	status?: string;
	search?: string;
}

interface ProductFiltersProps {
	data: ProductRecord[];
	onFilterChange: (filteredData: ProductRecord[]) => void;
	onFiltersChange: (filters: ProductFilters) => void;
}

export function ProductFilters({
	data,
	onFilterChange,
	onFiltersChange,
}: ProductFiltersProps) {
	const [filters, setFilters] = useState<ProductFilters>({});
	const [isExpanded, setIsExpanded] = useState(false);

	// 應用篩選器
	const applyFilters = useMemo(() => {
		return data.filter((item) => {
			// 搜尋
			if (filters.search) {
				const searchTerm = filters.search.toLowerCase();
				if (
					!item.name.toLowerCase().includes(searchTerm) &&
					!item.code.toLowerCase().includes(searchTerm) &&
					!item.description?.toLowerCase().includes(searchTerm)
				) {
					return false;
				}
			}
			// 類別
			if (
				filters.category &&
				filters.category !== "all" &&
				item.category !== filters.category
			) {
				return false;
			}
			// 幣別
			if (
				filters.currency &&
				filters.currency !== "all" &&
				item.currency !== filters.currency
			) {
				return false;
			}
			// 配息方式
			if (
				filters.distributionType &&
				filters.distributionType !== "all" &&
				item.distributionType !== filters.distributionType
			) {
				return false;
			}
			// 狀態
			if (
				filters.status &&
				filters.status !== "all" &&
				item.status !== filters.status
			) {
				return false;
			}
			return true;
		});
	}, [data, filters]);

	// 當篩選器改變時更新結果
	useEffect(() => {
		onFilterChange(applyFilters);
		onFiltersChange(filters);
	}, [applyFilters, filters, onFilterChange, onFiltersChange]);

	const updateFilter = (key: keyof ProductFilters, value: any) => {
		setFilters((prev) => ({ ...prev, [key]: value }));
	};

	const clearFilters = () => {
		setFilters({});
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
						placeholder="搜尋產品名稱、代碼或描述..."
						value={filters.search || ""}
						onChange={(e) => updateFilter("search", e.target.value)}
						className="w-64"
					/>
				</div>
			</div>

			{/* 展開的篩選器 */}
			{isExpanded && (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/20">
					<div className="space-y-2">
						<Label className="text-sm font-medium">類別</Label>
						<Select
							value={filters.category}
							onValueChange={(value) =>
								updateFilter("category", value)
							}
						>
							<SelectTrigger>
								<SelectValue placeholder="選擇類別" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">全部類別</SelectItem>
								{PRODUCT_CATEGORIES.map((category) => (
									<SelectItem
										key={category.value}
										value={category.value}
									>
										{category.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label className="text-sm font-medium">幣別</Label>
						<Select
							value={filters.currency}
							onValueChange={(value) =>
								updateFilter("currency", value)
							}
						>
							<SelectTrigger>
								<SelectValue placeholder="選擇幣別" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">全部幣別</SelectItem>
								{CURRENCY_OPTIONS.map((currency) => (
									<SelectItem
										key={currency.value}
										value={currency.value}
									>
										{currency.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label className="text-sm font-medium">配息方式</Label>
						<Select
							value={filters.distributionType}
							onValueChange={(value) =>
								updateFilter("distributionType", value)
							}
						>
							<SelectTrigger>
								<SelectValue placeholder="選擇配息方式" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">
									全部配息方式
								</SelectItem>
								{DISTRIBUTION_TYPE_OPTIONS.map((type) => (
									<SelectItem
										key={type.value}
										value={type.value}
									>
										{type.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label className="text-sm font-medium">狀態</Label>
						<Select
							value={filters.status}
							onValueChange={(value) =>
								updateFilter("status", value)
							}
						>
							<SelectTrigger>
								<SelectValue placeholder="選擇狀態" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">全部狀態</SelectItem>
								{PRODUCT_STATUSES.map((status) => (
									<SelectItem
										key={status.value}
										value={status.value}
									>
										{status.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
			)}

			{/* 已選擇的篩選條件標籤 */}
			{hasActiveFilters && (
				<div className="flex flex-wrap gap-2">
					{filters.category && filters.category !== "all" && (
						<Badge
							status="info"
							className="gap-1 cursor-pointer"
							onClick={() => updateFilter("category", "all")}
						>
							類別:{" "}
							{
								PRODUCT_CATEGORIES.find(
									(c) => c.value === filters.category,
								)?.label
							}
							<X className="size-3" />
						</Badge>
					)}
					{filters.currency && filters.currency !== "all" && (
						<Badge
							status="info"
							className="gap-1 cursor-pointer"
							onClick={() => updateFilter("currency", "all")}
						>
							幣別:{" "}
							{
								CURRENCY_OPTIONS.find(
									(c) => c.value === filters.currency,
								)?.label
							}
							<X className="size-3" />
						</Badge>
					)}
					{filters.distributionType &&
						filters.distributionType !== "all" && (
							<Badge
								status="info"
								className="gap-1 cursor-pointer"
								onClick={() =>
									updateFilter("distributionType", "all")
								}
							>
								配息方式:{" "}
								{
									DISTRIBUTION_TYPE_OPTIONS.find(
										(d) =>
											d.value ===
											filters.distributionType,
									)?.label
								}
								<X className="size-3" />
							</Badge>
						)}
					{filters.status && filters.status !== "all" && (
						<Badge
							status="info"
							className="gap-1 cursor-pointer"
							onClick={() => updateFilter("status", "all")}
						>
							狀態:{" "}
							{
								PRODUCT_STATUSES.find(
									(s) => s.value === filters.status,
								)?.label
							}
							<X className="size-3" />
						</Badge>
					)}
				</div>
			)}
		</div>
	);
}
