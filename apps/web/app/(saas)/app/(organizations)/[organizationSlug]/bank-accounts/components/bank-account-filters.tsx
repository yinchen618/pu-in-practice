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
import type { BankAccountRecord } from "./columns";

export interface BankAccountFilters {
	bankName?: string;
	currency?: string;
	status?: string;
	search?: string;
}

interface BankAccountFiltersProps {
	data: BankAccountRecord[];
	onFilterChange: (filteredData: BankAccountRecord[]) => void;
	onFiltersChange: (filters: BankAccountFilters) => void;
}

export function BankAccountFilters({
	data,
	onFilterChange,
	onFiltersChange,
}: BankAccountFiltersProps) {
	const [filters, setFilters] = useState<BankAccountFilters>({});
	const [isExpanded, setIsExpanded] = useState(false);

	// 從資料中提取唯一值
	const uniqueBankNames = Array.from(
		new Set(data.map((item) => item.bankName).filter(Boolean)),
	);
	const uniqueCurrencies = Array.from(
		new Set(data.map((item) => item.currency).filter(Boolean)),
	);

	// 狀態選項
	const statusOptions = [
		{ value: "active", label: "使用中" },
		{ value: "inactive", label: "已停用" },
	];

	// 應用篩選器
	const applyFilters = useMemo(() => {
		return data.filter((item) => {
			// 搜尋
			if (filters.search) {
				const searchTerm = filters.search.toLowerCase();
				if (
					!item.bankName.toLowerCase().includes(searchTerm) &&
					!item.accountName.toLowerCase().includes(searchTerm) &&
					!item.accountNumber.toLowerCase().includes(searchTerm)
				) {
					return false;
				}
			}
			// 銀行名稱
			if (
				filters.bankName &&
				filters.bankName !== "all" &&
				item.bankName !== filters.bankName
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

	const updateFilter = (key: keyof BankAccountFilters, value: any) => {
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
						placeholder="搜尋銀行名稱、帳戶名稱或帳號..."
						value={filters.search || ""}
						onChange={(e) => updateFilter("search", e.target.value)}
						className="w-64"
					/>
				</div>
			</div>

			{/* 展開的篩選器 */}
			{isExpanded && (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/20">
					<div className="space-y-2">
						<Label className="text-sm font-medium">銀行名稱</Label>
						<Select
							value={filters.bankName || ""}
							onValueChange={(value) =>
								updateFilter(
									"bankName",
									value === "all" ? undefined : value,
								)
							}
						>
							<SelectTrigger>
								<SelectValue placeholder="選擇銀行" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">全部銀行</SelectItem>
								{uniqueBankNames.map((bankName) => (
									<SelectItem key={bankName} value={bankName}>
										{bankName}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

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
								<SelectItem value="all">全部幣別</SelectItem>
								{uniqueCurrencies.map((currency) => (
									<SelectItem key={currency} value={currency}>
										{currency}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label className="text-sm font-medium">狀態</Label>
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
								<SelectItem value="all">全部狀態</SelectItem>
								{statusOptions.map((status) => (
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
					{filters.bankName && filters.bankName !== "all" && (
						<Badge status="info" className="gap-1">
							銀行: {filters.bankName}
							<button
								type="button"
								onClick={() =>
									updateFilter("bankName", undefined)
								}
								className="ml-1 hover:bg-destructive/20 rounded-full"
							>
								<X className="size-3" />
							</button>
						</Badge>
					)}
					{filters.currency && filters.currency !== "all" && (
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
					{filters.status && filters.status !== "all" && (
						<Badge status="info" className="gap-1">
							狀態:{" "}
							{
								statusOptions.find(
									(s) => s.value === filters.status,
								)?.label
							}
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
				</div>
			)}
		</div>
	);
}
