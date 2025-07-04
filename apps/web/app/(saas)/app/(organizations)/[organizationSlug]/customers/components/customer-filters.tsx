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
import type { CustomerRecord } from "./columns";

export interface CustomerFilters {
	search?: string;
	rm1Id?: string;
	rm2Id?: string;
	finder1Id?: string;
	finder2Id?: string;
}

interface RelationshipManager {
	id: string;
	name: string;
	category: "RM" | "FINDER" | "BOTH";
}

interface CustomerFiltersProps {
	data: CustomerRecord[];
	relationshipManagers: RelationshipManager[];
	onFilterChange: (filteredData: CustomerRecord[]) => void;
	onFiltersChange: (filters: CustomerFilters) => void;
}

export function CustomerFilters({
	data,
	relationshipManagers,
	onFilterChange,
	onFiltersChange,
}: CustomerFiltersProps) {
	const [filters, setFilters] = useState<CustomerFilters>({});
	const [isExpanded, setIsExpanded] = useState(false);

	// 根據角色類型過濾 RM 列表
	const rmOptions = relationshipManagers.filter(
		(rm) => rm.category === "RM" || rm.category === "BOTH",
	);
	const finderOptions = relationshipManagers.filter(
		(rm) => rm.category === "FINDER" || rm.category === "BOTH",
	);

	// 應用篩選器
	const applyFilters = useMemo(() => {
		return data.filter((item) => {
			// 搜尋
			if (filters.search) {
				const searchTerm = filters.search.toLowerCase();
				if (
					!item.name.toLowerCase().includes(searchTerm) &&
					!item.email.toLowerCase().includes(searchTerm) &&
					!item.phone?.toLowerCase().includes(searchTerm)
				) {
					return false;
				}
			}
			// RM1 篩選
			if (
				filters.rm1Id &&
				filters.rm1Id !== "all" &&
				item.rm1Id !== filters.rm1Id
			) {
				return false;
			}
			// RM2 篩選
			if (
				filters.rm2Id &&
				filters.rm2Id !== "all" &&
				item.rm2Id !== filters.rm2Id
			) {
				return false;
			}
			// Finder1 篩選
			if (
				filters.finder1Id &&
				filters.finder1Id !== "all" &&
				item.finder1Id !== filters.finder1Id
			) {
				return false;
			}
			// Finder2 篩選
			if (
				filters.finder2Id &&
				filters.finder2Id !== "all" &&
				item.finder2Id !== filters.finder2Id
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

	const updateFilter = (key: keyof CustomerFilters, value: any) => {
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

	// 獲取篩選器標籤顯示名稱
	const getFilterLabel = (id: string | undefined, type: string) => {
		if (!id) return "";
		const rm = relationshipManagers.find((rm) => rm.id === id);
		return rm ? `${type}: ${rm.name}` : "";
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
						placeholder="搜尋客戶名稱、電話或電子郵件..."
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
						<Label className="text-sm font-medium">RM1</Label>
						<Select
							value={filters.rm1Id || ""}
							onValueChange={(value) =>
								updateFilter(
									"rm1Id",
									value === "all" ? undefined : value,
								)
							}
						>
							<SelectTrigger>
								<SelectValue placeholder="選擇 RM1" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">全部 RM1</SelectItem>
								{rmOptions.map((rm) => (
									<SelectItem key={rm.id} value={rm.id}>
										{rm.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label className="text-sm font-medium">RM2</Label>
						<Select
							value={filters.rm2Id || ""}
							onValueChange={(value) =>
								updateFilter(
									"rm2Id",
									value === "all" ? undefined : value,
								)
							}
						>
							<SelectTrigger>
								<SelectValue placeholder="選擇 RM2" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">全部 RM2</SelectItem>
								{rmOptions.map((rm) => (
									<SelectItem key={rm.id} value={rm.id}>
										{rm.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label className="text-sm font-medium">Finder1</Label>
						<Select
							value={filters.finder1Id || ""}
							onValueChange={(value) =>
								updateFilter(
									"finder1Id",
									value === "all" ? undefined : value,
								)
							}
						>
							<SelectTrigger>
								<SelectValue placeholder="選擇 Finder1" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">
									全部 Finder1
								</SelectItem>
								{finderOptions.map((rm) => (
									<SelectItem key={rm.id} value={rm.id}>
										{rm.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label className="text-sm font-medium">Finder2</Label>
						<Select
							value={filters.finder2Id || ""}
							onValueChange={(value) =>
								updateFilter(
									"finder2Id",
									value === "all" ? undefined : value,
								)
							}
						>
							<SelectTrigger>
								<SelectValue placeholder="選擇 Finder2" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">
									全部 Finder2
								</SelectItem>
								{finderOptions.map((rm) => (
									<SelectItem key={rm.id} value={rm.id}>
										{rm.name}
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
					{filters.rm1Id && filters.rm1Id !== "all" && (
						<Badge status="info" className="gap-1">
							{getFilterLabel(filters.rm1Id, "RM1")}
							<button
								type="button"
								onClick={() => updateFilter("rm1Id", undefined)}
								className="ml-1 hover:bg-destructive/20 rounded-full"
							>
								<X className="size-3" />
							</button>
						</Badge>
					)}
					{filters.rm2Id && filters.rm2Id !== "all" && (
						<Badge status="info" className="gap-1">
							{getFilterLabel(filters.rm2Id, "RM2")}
							<button
								type="button"
								onClick={() => updateFilter("rm2Id", undefined)}
								className="ml-1 hover:bg-destructive/20 rounded-full"
							>
								<X className="size-3" />
							</button>
						</Badge>
					)}
					{filters.finder1Id && filters.finder1Id !== "all" && (
						<Badge status="info" className="gap-1">
							{getFilterLabel(filters.finder1Id, "Finder1")}
							<button
								type="button"
								onClick={() =>
									updateFilter("finder1Id", undefined)
								}
								className="ml-1 hover:bg-destructive/20 rounded-full"
							>
								<X className="size-3" />
							</button>
						</Badge>
					)}
					{filters.finder2Id && filters.finder2Id !== "all" && (
						<Badge status="info" className="gap-1">
							{getFilterLabel(filters.finder2Id, "Finder2")}
							<button
								type="button"
								onClick={() =>
									updateFilter("finder2Id", undefined)
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
