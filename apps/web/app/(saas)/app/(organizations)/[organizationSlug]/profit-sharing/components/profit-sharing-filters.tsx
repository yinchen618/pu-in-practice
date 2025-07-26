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
import { useTranslations } from "next-intl";
import { useQueryState } from "nuqs";
import { useEffect, useMemo, useState } from "react";
import type { ProfitSharingRecord } from "./columns";

export interface ProfitSharingFilters {
	search?: string;
	productCategory?: string;
	dateFrom?: string;
	dateTo?: string;
	year?: string;
	month?: string;
	rmName?: string;
	finderName?: string;
	currency?: string;
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
	const t = useTranslations("organization.profitSharing.filters");

	// 使用 nuqs 管理 URL 參數
	const [search, setSearch] = useQueryState("search");
	const [productCategory, setProductCategory] =
		useQueryState("productCategory");
	const [dateFrom, setDateFrom] = useQueryState("dateFrom");
	const [dateTo, setDateTo] = useQueryState("dateTo");
	const [year, setYear] = useQueryState("year");
	const [month, setMonth] = useQueryState("month");
	const [currency, setCurrency] = useQueryState("currency");
	const [rmName, setRmName] = useQueryState("rmName");
	const [finderName, setFinderName] = useQueryState("finderName");

	const [isExpanded, setIsExpanded] = useState(false);

	// 用 useMemo 產生 filters 物件，只有參數變動才會變
	const filters = useMemo(
		() => ({
			search: search || undefined,
			productCategory: productCategory || undefined,
			dateFrom: dateFrom || undefined,
			dateTo: dateTo || undefined,
			year: year || undefined,
			month: month || undefined,
			currency: currency || undefined,
			rmName: rmName || undefined,
			finderName: finderName || undefined,
		}),
		[
			search,
			productCategory,
			dateFrom,
			dateTo,
			year,
			month,
			currency,
			rmName,
			finderName,
		],
	);

	// 從 URL 參數構建篩選器狀態
	// const filters: ProfitSharingFilters = {
	// 	search: search || undefined,
	// 	productCategory: productCategory || undefined,
	// 	dateFrom: dateFrom || undefined,
	// 	dateTo: dateTo || undefined,
	// 	year: year || undefined,
	// 	month: month || undefined,
	// 	rmFinder: rmFinder || undefined,
	// 	rmFinderType: (rmFinderType as "rm" | "finder") || undefined,
	// 	currency: currency || undefined,
	// };

	// 從資料中提取唯一值
	const uniqueProductCategories = Array.from(
		new Set(data.map((item) => item.productCategory).filter(Boolean)),
	);

	// 從資料中提取所有 RM 和 Finder 名稱
	const allRMNames = new Set<string>();
	const allFinderNames = new Set<string>();

	data.forEach((item) => {
		if (item.rm1Name) {
			allRMNames.add(item.rm1Name);
		}
		if (item.rm2Name) {
			allRMNames.add(item.rm2Name);
		}
		if (item.finder1Name) {
			allFinderNames.add(item.finder1Name);
		}
		if (item.finder2Name) {
			allFinderNames.add(item.finder2Name);
		}
	});

	const uniqueRMNames = Array.from(allRMNames).sort();
	const uniqueFinderNames = Array.from(allFinderNames).sort();

	// 從資料中提取所有原幣
	const uniqueCurrencies = Array.from(
		new Set(data.map((item) => item.currency).filter(Boolean)),
	).sort();

	// 生成年份選項（今年到後十年）
	const currentYear = new Date().getFullYear();
	const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear + i);

	// 生成月份選項
	const monthOptions = [
		{ value: "01", label: t("months.01") },
		{ value: "02", label: t("months.02") },
		{ value: "03", label: t("months.03") },
		{ value: "04", label: t("months.04") },
		{ value: "05", label: t("months.05") },
		{ value: "06", label: t("months.06") },
		{ value: "07", label: t("months.07") },
		{ value: "08", label: t("months.08") },
		{ value: "09", label: t("months.09") },
		{ value: "10", label: t("months.10") },
		{ value: "11", label: t("months.11") },
		{ value: "12", label: t("months.12") },
	];

	const applyFilters = (
		newFilters: ProfitSharingFilters & {
			rmName?: string;
			finderName?: string;
		},
	) => {
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

		// 年份篩選
		if (newFilters.year) {
			filteredData = filteredData.filter((item) => {
				const itemYear = new Date(item.profitDate)
					.getFullYear()
					.toString();
				return itemYear === newFilters.year;
			});
		}

		// 月份篩選
		if (newFilters.month) {
			filteredData = filteredData.filter((item) => {
				const itemMonth = new Date(item.profitDate).getMonth() + 1;
				const itemMonthStr = itemMonth.toString().padStart(2, "0");
				return itemMonthStr === newFilters.month;
			});
		}

		// RM 篩選
		if (newFilters.rmName) {
			filteredData = filteredData.filter(
				(item) =>
					item.rm1Name === newFilters.rmName ||
					item.rm2Name === newFilters.rmName,
			);
		}
		// Finder 篩選
		if (newFilters.finderName) {
			filteredData = filteredData.filter(
				(item) =>
					item.finder1Name === newFilters.finderName ||
					item.finder2Name === newFilters.finderName,
			);
		}

		// 原幣篩選
		if (newFilters.currency) {
			filteredData = filteredData.filter(
				(item) => item.currency === newFilters.currency,
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

	// useEffect 依賴 filters, data
	useEffect(() => {
		applyFilters(filters);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [filters, data]);

	const updateFilter = (
		key: keyof ProfitSharingFilters | "rmName" | "finderName",
		value: any,
	) => {
		// 更新對應的 URL 參數
		switch (key) {
			case "search":
				setSearch(value || null);
				break;
			case "productCategory":
				setProductCategory(value || null);
				break;
			case "dateFrom":
				setDateFrom(value || null);
				break;
			case "dateTo":
				setDateTo(value || null);
				break;
			case "year":
				setYear(value || null);
				break;
			case "month":
				setMonth(value || null);
				break;
			case "currency":
				setCurrency(value || null);
				break;
			case "rmName":
				setRmName(value || null);
				break;
			case "finderName":
				setFinderName(value || null);
				break;
		}
	};

	const clearFilters = () => {
		// 清除所有 URL 參數
		setSearch(null);
		setProductCategory(null);
		setDateFrom(null);
		setDateTo(null);
		setYear(null);
		setMonth(null);
		setCurrency(null);
		setRmName(null);
		setFinderName(null);
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
						{t("filterButton")}{" "}
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
							{t("clearFilters")}
						</Button>
					)}
				</div>

				{/* 主要搜尋框 */}
				<div className="flex items-center gap-2">
					<Input
						placeholder={t("searchPlaceholder")}
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
						<Label className="text-sm font-medium">
							{t("productCategory")}
						</Label>
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
								<SelectValue
									placeholder={t("selectProductCategory")}
								/>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">
									{t("allCategories")}
								</SelectItem>
								{uniqueProductCategories.map((category) => (
									<SelectItem key={category} value={category}>
										{category}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* 原幣篩選 */}
					<div className="space-y-2">
						<Label className="text-sm font-medium">
							{t("currency")}
						</Label>
						<Select
							value={filters.currency || ""}
							onValueChange={(value) =>
								updateFilter(
									"currency",
									value === "all" ? undefined : value,
								)
							}
						>
							<SelectTrigger>
								<SelectValue
									placeholder={t("selectCurrency")}
								/>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">
									{t("allCurrencies")}
								</SelectItem>
								{uniqueCurrencies.map((currency) => (
									<SelectItem key={currency} value={currency}>
										{currency}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* 年份篩選 */}
					<div className="space-y-2">
						<Label className="text-sm font-medium">
							{t("year")}
						</Label>
						<Select
							value={filters.year || ""}
							onValueChange={(value) =>
								updateFilter(
									"year",
									value === "all" ? undefined : value,
								)
							}
						>
							<SelectTrigger>
								<SelectValue placeholder={t("selectYear")} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">
									{t("allYears")}
								</SelectItem>
								{yearOptions.map((year) => (
									<SelectItem
										key={year}
										value={year.toString()}
									>
										{year}年
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* 月份篩選 */}
					<div className="space-y-2">
						<Label className="text-sm font-medium">
							{t("month")}
						</Label>
						<Select
							value={filters.month || ""}
							onValueChange={(value) =>
								updateFilter(
									"month",
									value === "all" ? undefined : value,
								)
							}
						>
							<SelectTrigger>
								<SelectValue placeholder={t("selectMonth")} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">
									{t("allMonths")}
								</SelectItem>
								{monthOptions.map((month) => (
									<SelectItem
										key={month.value}
										value={month.value}
									>
										{month.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					{/* 日期範圍篩選 */}
					<div className="space-y-2">
						<Label className="text-sm font-medium flex items-center gap-1">
							<Calendar className="size-4" />
							{t("dateRange")}
						</Label>
						<div className="space-y-2">
							<Input
								type="date"
								placeholder={t("dateFrom")}
								value={filters.dateFrom || ""}
								onChange={(e) =>
									updateFilter("dateFrom", e.target.value)
								}
							/>
							<Input
								type="date"
								placeholder={t("dateTo")}
								value={filters.dateTo || ""}
								onChange={(e) =>
									updateFilter("dateTo", e.target.value)
								}
							/>
						</div>
					</div>

					{/* RM 篩選 */}
					<div className="space-y-2">
						<Label className="text-sm font-medium">{t("rm")}</Label>
						<Select
							value={filters.rmName || ""}
							onValueChange={(value) =>
								updateFilter(
									"rmName",
									value === "all" ? undefined : value,
								)
							}
						>
							<SelectTrigger>
								<SelectValue placeholder={t("selectRM")} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">{t("all")}</SelectItem>
								{uniqueRMNames.map((name) => (
									<SelectItem key={name} value={name}>
										{name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					{/* Finder 篩選 */}
					<div className="space-y-2">
						<Label className="text-sm font-medium">
							{t("finder")}
						</Label>
						<Select
							value={filters.finderName || ""}
							onValueChange={(value) =>
								updateFilter(
									"finderName",
									value === "all" ? undefined : value,
								)
							}
						>
							<SelectTrigger>
								<SelectValue placeholder={t("selectFinder")} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">{t("all")}</SelectItem>
								{uniqueFinderNames.map((name) => (
									<SelectItem key={name} value={name}>
										{name}
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
					{filters.search && (
						<Badge status="info" className="gap-1">
							{t("search")}: {filters.search}
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
								{t("category")}: {filters.productCategory}
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
					{filters.currency && (
						<Badge status="info" className="gap-1">
							{t("currency")}: {filters.currency}
							<button
								type="button"
								onClick={() =>
									updateFilter("currency", undefined)
								}
								className="ml-1 hover:bg-destructive/20 rounded-full"
							>
								<X className="size-3" />
							</button>
						</Badge>
					)}
					{filters.year && (
						<Badge status="info" className="gap-1">
							{t("year")}: {filters.year}年
							<button
								type="button"
								onClick={() => updateFilter("year", undefined)}
								className="ml-1 hover:bg-destructive/20 rounded-full"
							>
								<X className="size-3" />
							</button>
						</Badge>
					)}
					{filters.month && (
						<Badge status="info" className="gap-1">
							{t("month")}:{" "}
							{
								monthOptions.find(
									(m) => m.value === filters.month,
								)?.label
							}
							<button
								type="button"
								onClick={() => updateFilter("month", undefined)}
								className="ml-1 hover:bg-destructive/20 rounded-full"
							>
								<X className="size-3" />
							</button>
						</Badge>
					)}
					{filters.dateFrom && (
						<Badge status="info" className="gap-1">
							{t("dateFrom")}: {filters.dateFrom}
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
							{t("dateTo")}: {filters.dateTo}
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
					{filters.rmName && (
						<Badge status="info" className="gap-1">
							{t("rm")}: {filters.rmName}
							<button
								type="button"
								onClick={() =>
									updateFilter("rmName", undefined)
								}
								className="ml-1 hover:bg-destructive/20 rounded-full"
							>
								<X className="size-3" />
							</button>
						</Badge>
					)}
					{filters.finderName && (
						<Badge status="info" className="gap-1">
							{t("finder")}: {filters.finderName}
							<button
								type="button"
								onClick={() =>
									updateFilter("finderName", undefined)
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
