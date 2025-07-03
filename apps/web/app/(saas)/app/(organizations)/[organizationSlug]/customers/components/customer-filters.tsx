"use client";

import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Filter, X } from "lucide-react";
import { useState } from "react";
import type { CustomerRecord } from "./columns";

export interface CustomerFilters {
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
	onFiltersChange?: (filters: CustomerFilters) => void;
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

	const applyFilters = (newFilters: CustomerFilters) => {
		setFilters(newFilters);
		onFiltersChange?.(newFilters);

		let filteredData = [...data];

		// RM1 篩選
		if (newFilters.rm1Id) {
			filteredData = filteredData.filter(
				(item) => item.rm1Id === newFilters.rm1Id,
			);
		}

		// RM2 篩選
		if (newFilters.rm2Id) {
			filteredData = filteredData.filter(
				(item) => item.rm2Id === newFilters.rm2Id,
			);
		}

		// Finder1 篩選
		if (newFilters.finder1Id) {
			filteredData = filteredData.filter(
				(item) => item.finder1Id === newFilters.finder1Id,
			);
		}

		// Finder2 篩選
		if (newFilters.finder2Id) {
			filteredData = filteredData.filter(
				(item) => item.finder2Id === newFilters.finder2Id,
			);
		}

		onFilterChange(filteredData);
	};

	const updateFilter = (
		key: keyof CustomerFilters,
		value: string | undefined,
	) => {
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
			</div>

			{/* 展開的篩選器 */}
			{isExpanded && (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/20">
					{/* RM1 選擇器 */}
					<div className="space-y-2">
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

					{/* RM2 選擇器 */}
					<div className="space-y-2">
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

					{/* Finder1 選擇器 */}
					<div className="space-y-2">
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

					{/* Finder2 選擇器 */}
					<div className="space-y-2">
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

			{/* 活躍篩選器標籤 */}
			{hasActiveFilters && (
				<div className="flex flex-wrap gap-2">
					{filters.rm1Id && (
						<Badge status="info" className="gap-1">
							{getFilterLabel(filters.rm1Id, "RM1")}
							<X
								className="size-3 cursor-pointer"
								onClick={() => updateFilter("rm1Id", undefined)}
							/>
						</Badge>
					)}
					{filters.rm2Id && (
						<Badge status="info" className="gap-1">
							{getFilterLabel(filters.rm2Id, "RM2")}
							<X
								className="size-3 cursor-pointer"
								onClick={() => updateFilter("rm2Id", undefined)}
							/>
						</Badge>
					)}
					{filters.finder1Id && (
						<Badge status="info" className="gap-1">
							{getFilterLabel(filters.finder1Id, "Finder1")}
							<X
								className="size-3 cursor-pointer"
								onClick={() =>
									updateFilter("finder1Id", undefined)
								}
							/>
						</Badge>
					)}
					{filters.finder2Id && (
						<Badge status="info" className="gap-1">
							{getFilterLabel(filters.finder2Id, "Finder2")}
							<X
								className="size-3 cursor-pointer"
								onClick={() =>
									updateFilter("finder2Id", undefined)
								}
							/>
						</Badge>
					)}
				</div>
			)}
		</div>
	);
}
