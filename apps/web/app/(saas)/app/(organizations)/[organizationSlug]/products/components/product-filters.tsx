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
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import {
	getCurrencyOptions,
	getDistributionTypeOptions,
	getProductCategories,
	getProductStatuses,
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
	const t = useTranslations("organization.products");
	const tConstants = useTranslations("organization.constants");
	const [filters, setFilters] = useState<ProductFilters>({});
	const [isExpanded, setIsExpanded] = useState(false);

	const currencyOptions = getCurrencyOptions(tConstants);
	const distributionTypeOptions = getDistributionTypeOptions(tConstants);
	const productCategoryOptions = getProductCategories(tConstants);
	const productStatusOptions = getProductStatuses(tConstants);

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
						{t("filters.title")}{" "}
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
							{t("filters.clearFilters")}
						</Button>
					)}
				</div>

				{/* 主要搜尋框 */}
				<div className="flex items-center gap-2">
					<Input
						placeholder={t("filters.searchPlaceholder")}
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
						<Label className="text-sm font-medium">
							{tConstants("productCategory.title")}
						</Label>
						<Select
							value={filters.category}
							onValueChange={(value) =>
								updateFilter("category", value)
							}
						>
							<SelectTrigger>
								<SelectValue
									placeholder={tConstants(
										"productCategory.placeholder",
									)}
								/>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">
									{tConstants("productCategory.all")}
								</SelectItem>
								{productCategoryOptions.map((category) => (
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
						<Label className="text-sm font-medium">
							{tConstants("currency.title")}
						</Label>
						<Select
							value={filters.currency}
							onValueChange={(value) =>
								updateFilter("currency", value)
							}
						>
							<SelectTrigger>
								<SelectValue
									placeholder={tConstants(
										"currency.placeholder",
									)}
								/>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">
									{tConstants("currency.all")}
								</SelectItem>
								{currencyOptions.map((currency) => (
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
						<Label className="text-sm font-medium">
							{tConstants("distributionType.title")}
						</Label>
						<Select
							value={filters.distributionType}
							onValueChange={(value) =>
								updateFilter("distributionType", value)
							}
						>
							<SelectTrigger>
								<SelectValue
									placeholder={tConstants(
										"distributionType.placeholder",
									)}
								/>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">
									{tConstants("distributionType.all")}
								</SelectItem>
								{distributionTypeOptions.map((type) => (
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
						<Label className="text-sm font-medium">
							{tConstants("status.title")}
						</Label>
						<Select
							value={filters.status}
							onValueChange={(value) =>
								updateFilter("status", value)
							}
						>
							<SelectTrigger>
								<SelectValue
									placeholder={tConstants(
										"status.placeholder",
									)}
								/>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">
									{tConstants("status.all")}
								</SelectItem>
								{productStatusOptions.map((status) => (
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
							{tConstants("productCategory.title")}:{" "}
							{
								productCategoryOptions.find(
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
							{tConstants("currency.title")}:{" "}
							{
								currencyOptions.find(
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
								{tConstants("distributionType.title")}:{" "}
								{
									distributionTypeOptions.find(
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
							{tConstants("status.title")}:{" "}
							{
								productStatusOptions.find(
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
