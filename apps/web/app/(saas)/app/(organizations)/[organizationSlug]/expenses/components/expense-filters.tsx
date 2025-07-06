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
import { Calendar, DollarSign, Filter, Paperclip, X } from "lucide-react";
import { useState } from "react";
import type { ExpenseRecord } from "./columns";

export interface ExpenseFilters {
	dateFrom?: string;
	dateTo?: string;
	category?: string;
	amountMin?: number;
	amountMax?: number;
	sgdAmountMin?: number;
	sgdAmountMax?: number;
	usdAmountMin?: number;
	usdAmountMax?: number;
	currency?: string;
	hasReceipt?: boolean | null;
	description?: string;
}

interface ExpenseFiltersProps {
	data: ExpenseRecord[];
	onFilterChange: (filteredData: ExpenseRecord[]) => void;
	onFiltersChange?: (filters: ExpenseFilters) => void;
}

export function ExpenseFilters({
	data,
	onFilterChange,
	onFiltersChange,
}: ExpenseFiltersProps) {
	const [filters, setFilters] = useState<ExpenseFilters>({});
	const [isExpanded, setIsExpanded] = useState(false);

	// 從資料中提取唯一值
	const uniqueCategories = Array.from(
		new Set(data.map((item) => item.category).filter(Boolean)),
	);
	const uniqueCurrencies = Array.from(
		new Set(data.map((item) => item.currency).filter(Boolean)),
	);

	const applyFilters = (newFilters: ExpenseFilters) => {
		setFilters(newFilters);
		onFiltersChange?.(newFilters);

		let filteredData = [...data];

		// 日期篩選
		if (newFilters.dateFrom) {
			const fromDate = new Date(newFilters.dateFrom);
			filteredData = filteredData.filter(
				(item) => new Date(item.date) >= fromDate,
			);
		}
		if (newFilters.dateTo) {
			const toDate = new Date(newFilters.dateTo);
			toDate.setHours(23, 59, 59, 999); // 包含整天
			filteredData = filteredData.filter(
				(item) => new Date(item.date) <= toDate,
			);
		}

		// 類別篩選
		if (newFilters.category) {
			filteredData = filteredData.filter(
				(item) => item.category === newFilters.category,
			);
		}

		// 金額範圍篩選
		if (newFilters.amountMin !== undefined) {
			filteredData = filteredData.filter(
				(item) => item.amount >= newFilters.amountMin!,
			);
		}
		if (newFilters.amountMax !== undefined) {
			filteredData = filteredData.filter(
				(item) => item.amount <= newFilters.amountMax!,
			);
		}

		// 新幣金額範圍篩選
		if (newFilters.sgdAmountMin !== undefined) {
			filteredData = filteredData.filter(
				(item) => item.sgdAmount >= newFilters.sgdAmountMin!,
			);
		}
		if (newFilters.sgdAmountMax !== undefined) {
			filteredData = filteredData.filter(
				(item) => item.sgdAmount <= newFilters.sgdAmountMax!,
			);
		}

		// 美元金額範圍篩選
		if (newFilters.usdAmountMin !== undefined) {
			filteredData = filteredData.filter(
				(item) => item.usdAmount >= newFilters.usdAmountMin!,
			);
		}
		if (newFilters.usdAmountMax !== undefined) {
			filteredData = filteredData.filter(
				(item) => item.usdAmount <= newFilters.usdAmountMax!,
			);
		}

		// 幣別篩選
		if (newFilters.currency) {
			filteredData = filteredData.filter(
				(item) => item.currency === newFilters.currency,
			);
		}

		// 附件篩選
		if (
			newFilters.hasReceipt !== null &&
			newFilters.hasReceipt !== undefined
		) {
			filteredData = filteredData.filter((item) => {
				const hasReceipt = Boolean(
					item.receiptUrl ||
						(item.receiptUrls && item.receiptUrls.length > 0),
				);
				return hasReceipt === newFilters.hasReceipt;
			});
		}

		// 描述搜尋
		if (newFilters.description) {
			const searchTerm = newFilters.description.toLowerCase();
			filteredData = filteredData.filter(
				(item) =>
					item.description?.toLowerCase().includes(searchTerm) ||
					item.category.toLowerCase().includes(searchTerm),
			);
		}

		onFilterChange(filteredData);
	};

	const updateFilter = (key: keyof ExpenseFilters, value: any) => {
		const newFilters = { ...filters, [key]: value };
		applyFilters(newFilters);
	};

	const clearFilters = () => {
		setFilters({});
		onFiltersChange?.({});
		onFilterChange(data);
	};

	const hasActiveFilters = Object.values(filters).some(
		(value) => value !== undefined && value !== null && value !== "",
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
							`(${Object.values(filters).filter((v) => v !== undefined && v !== null && v !== "").length})`}
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
						placeholder="搜尋描述或類別..."
						value={filters.description || ""}
						onChange={(e) =>
							updateFilter("description", e.target.value)
						}
						className="w-64"
					/>
				</div>
			</div>

			{/* 展開的篩選器 */}
			{isExpanded && (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4 border rounded-lg bg-muted/20">
					{/* 日期區間 */}
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

					{/* 類別、幣別、附件狀態 */}
					<div className="space-y-4">
						{/* 類別 */}
						<div className="space-y-2">
							<Label className="text-sm font-medium">類別</Label>
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
									<SelectItem value="all">
										全部類別
									</SelectItem>
									{uniqueCategories.map((category) => (
										<SelectItem
											key={category}
											value={category}
										>
											{category}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* 幣別 */}
						<div className="space-y-2">
							<Label className="text-sm font-medium">幣別</Label>
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
									<SelectValue placeholder="選擇幣別" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">
										全部幣別
									</SelectItem>
									{uniqueCurrencies.map((currency) => (
										<SelectItem
											key={currency}
											value={currency}
										>
											{currency}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* 附件狀態 */}
						<div className="space-y-2">
							<Label className="text-sm font-medium flex items-center gap-1">
								<Paperclip className="size-4" />
								附件狀態
							</Label>
							<Select
								value={
									filters.hasReceipt === null ||
									filters.hasReceipt === undefined
										? "all"
										: filters.hasReceipt.toString()
								}
								onValueChange={(value) => {
									if (value === "all") {
										updateFilter("hasReceipt", null);
									} else {
										updateFilter(
											"hasReceipt",
											value === "true",
										);
									}
								}}
							>
								<SelectTrigger>
									<SelectValue placeholder="選擇附件狀態" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">全部</SelectItem>
									<SelectItem value="true">已上傳</SelectItem>
									<SelectItem value="false">
										未上傳
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* 金額範圍 */}
					<div className="space-y-2">
						<Label className="text-sm font-medium flex items-center gap-1">
							<DollarSign className="size-4" />
							金額範圍
						</Label>
						<div className="space-y-2">
							<Input
								type="number"
								placeholder="最小金額"
								value={filters.amountMin || ""}
								onChange={(e) => {
									const value = e.target.value;
									updateFilter(
										"amountMin",
										value === ""
											? undefined
											: Number(value),
									);
								}}
							/>
							<Input
								type="number"
								placeholder="最大金額"
								value={filters.amountMax || ""}
								onChange={(e) => {
									const value = e.target.value;
									updateFilter(
										"amountMax",
										value === ""
											? undefined
											: Number(value),
									);
								}}
							/>
						</div>
					</div>

					{/* 新幣金額範圍 */}
					<div className="space-y-2">
						<Label className="text-sm font-medium flex items-center gap-1">
							<DollarSign className="size-4" />
							新幣金額範圍
						</Label>
						<div className="space-y-2">
							<Input
								type="number"
								placeholder="最小新幣金額"
								value={filters.sgdAmountMin || ""}
								onChange={(e) => {
									const value = e.target.value;
									updateFilter(
										"sgdAmountMin",
										value === ""
											? undefined
											: Number(value),
									);
								}}
							/>
							<Input
								type="number"
								placeholder="最大新幣金額"
								value={filters.sgdAmountMax || ""}
								onChange={(e) => {
									const value = e.target.value;
									updateFilter(
										"sgdAmountMax",
										value === ""
											? undefined
											: Number(value),
									);
								}}
							/>
						</div>
					</div>

					{/* 美元金額範圍 */}
					<div className="space-y-2">
						<Label className="text-sm font-medium flex items-center gap-1">
							<DollarSign className="size-4" />
							美元金額範圍
						</Label>
						<div className="space-y-2">
							<Input
								type="number"
								placeholder="最小美元金額"
								value={filters.usdAmountMin || ""}
								onChange={(e) => {
									const value = e.target.value;
									updateFilter(
										"usdAmountMin",
										value === ""
											? undefined
											: Number(value),
									);
								}}
							/>
							<Input
								type="number"
								placeholder="最大美元金額"
								value={filters.usdAmountMax || ""}
								onChange={(e) => {
									const value = e.target.value;
									updateFilter(
										"usdAmountMax",
										value === ""
											? undefined
											: Number(value),
									);
								}}
							/>
						</div>
					</div>
				</div>
			)}

			{/* 活躍篩選器標籤 */}
			{hasActiveFilters && (
				<div className="flex flex-wrap gap-2">
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
					{filters.category && (
						<Badge status="info" className="gap-1">
							類別: {filters.category}
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
					{filters.amountMin !== undefined && (
						<Badge status="info" className="gap-1">
							最小: {filters.amountMin}
							<button
								type="button"
								onClick={() =>
									updateFilter("amountMin", undefined)
								}
								className="ml-1 hover:bg-destructive/20 rounded-full"
							>
								<X className="size-3" />
							</button>
						</Badge>
					)}
					{filters.amountMax !== undefined && (
						<Badge status="info" className="gap-1">
							最大: {filters.amountMax}
							<button
								type="button"
								onClick={() =>
									updateFilter("amountMax", undefined)
								}
								className="ml-1 hover:bg-destructive/20 rounded-full"
							>
								<X className="size-3" />
							</button>
						</Badge>
					)}
					{filters.sgdAmountMin !== undefined && (
						<Badge status="info" className="gap-1">
							新幣最小: {filters.sgdAmountMin}
							<button
								type="button"
								onClick={() =>
									updateFilter("sgdAmountMin", undefined)
								}
								className="ml-1 hover:bg-destructive/20 rounded-full"
							>
								<X className="size-3" />
							</button>
						</Badge>
					)}
					{filters.sgdAmountMax !== undefined && (
						<Badge status="info" className="gap-1">
							新幣最大: {filters.sgdAmountMax}
							<button
								type="button"
								onClick={() =>
									updateFilter("sgdAmountMax", undefined)
								}
								className="ml-1 hover:bg-destructive/20 rounded-full"
							>
								<X className="size-3" />
							</button>
						</Badge>
					)}
					{filters.usdAmountMin !== undefined && (
						<Badge status="info" className="gap-1">
							美元最小: {filters.usdAmountMin}
							<button
								type="button"
								onClick={() =>
									updateFilter("usdAmountMin", undefined)
								}
								className="ml-1 hover:bg-destructive/20 rounded-full"
							>
								<X className="size-3" />
							</button>
						</Badge>
					)}
					{filters.usdAmountMax !== undefined && (
						<Badge status="info" className="gap-1">
							美元最大: {filters.usdAmountMax}
							<button
								type="button"
								onClick={() =>
									updateFilter("usdAmountMax", undefined)
								}
								className="ml-1 hover:bg-destructive/20 rounded-full"
							>
								<X className="size-3" />
							</button>
						</Badge>
					)}
					{filters.currency && (
						<Badge status="info" className="gap-1">
							幣別: {filters.currency}
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
					{filters.hasReceipt !== null &&
						filters.hasReceipt !== undefined && (
							<Badge status="info" className="gap-1">
								附件: {filters.hasReceipt ? "已上傳" : "未上傳"}
								<button
									type="button"
									onClick={() =>
										updateFilter("hasReceipt", null)
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
