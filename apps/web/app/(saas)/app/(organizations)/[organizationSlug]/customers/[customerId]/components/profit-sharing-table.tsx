"use client";

import { DataTable } from "@saas/shared/components/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { Input } from "@ui/components/input";
import { Filter } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

interface ProfitSharingRecord {
	productName: string;
	productCode: string;
	productCategory: string;
	currency: string;
	productStatus: string;
	profitDate: string;
	shareable: number;
	companyRevenue: number;
	rmRevenueOriginal: number;
	findersRevenueOriginal: number;
}

interface ProfitSharingTableProps {
	customerId: string;
	organizationId: string;
}

interface Filters {
	productName: string;
	dateFrom: string;
	dateTo: string;
	minShareable: string;
	maxShareable: string;
}

export function ProfitSharingTable({
	customerId,
	organizationId,
}: ProfitSharingTableProps) {
	const t = useTranslations("organization.profitSharing");
	const tCommon = useTranslations("common");
	const [data, setData] = useState<ProfitSharingRecord[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [filters, setFilters] = useState<Filters>({
		productName: "",
		dateFrom: "",
		dateTo: "",
		minShareable: "",
		maxShareable: "",
	});

	useEffect(() => {
		if (!organizationId || !customerId) return;
		setIsLoading(true);
		fetch(
			`/api/organizations/profit-sharing?organizationId=${organizationId}&customerId=${customerId}`,
			{
				credentials: "include",
			},
		)
			.then((res) => res.json())
			.then((res) => setData(res.data || []))
			.finally(() => setIsLoading(false));
	}, [organizationId, customerId]);

	// 前端自訂篩選
	const filteredData = useMemo(() => {
		return data.filter((row) => {
			if (
				filters.productName &&
				!row.productName?.includes(filters.productName)
			)
				return false;
			if (
				filters.dateFrom &&
				new Date(row.profitDate) < new Date(filters.dateFrom)
			)
				return false;
			if (
				filters.dateTo &&
				new Date(row.profitDate) > new Date(filters.dateTo)
			)
				return false;
			if (
				filters.minShareable &&
				Number(row.shareable) < Number(filters.minShareable)
			)
				return false;
			if (
				filters.maxShareable &&
				Number(row.shareable) > Number(filters.maxShareable)
			)
				return false;
			return true;
		});
	}, [data, filters]);

	// 預設分潤日期新到舊排序
	const sortedData = useMemo(() => {
		return [...filteredData].sort(
			(a, b) =>
				new Date(b.profitDate).getTime() -
				new Date(a.profitDate).getTime(),
		);
	}, [filteredData]);

	const columns: ColumnDef<ProfitSharingRecord>[] = [
		{ accessorKey: "productName", header: t("productName") },
		{ accessorKey: "productCode", header: t("productCode") },
		{ accessorKey: "productCategory", header: t("productCategory") },
		{ accessorKey: "currency", header: tCommon("currency") },
		{ accessorKey: "productStatus", header: tCommon("status") },
		{
			accessorKey: "profitDate",
			header: t("profitDate"),
			cell: ({ row }) => {
				const date = row.original.profitDate;
				return date ? new Date(date).toLocaleDateString("zh-TW") : "-";
			},
		},
		{
			accessorKey: "shareable",
			header: t("totalProfitAmount"),
			cell: ({ row }) =>
				Number(row.original.shareable ?? 0).toLocaleString("en-US", {
					minimumFractionDigits: 2,
				}),
		},
		{
			accessorKey: "companyRevenue",
			header: t("companyProfit"),
			cell: ({ row }) =>
				Number(row.original.companyRevenue ?? 0).toLocaleString(
					"en-US",
					{ minimumFractionDigits: 2 },
				),
		},
		{
			accessorKey: "rmRevenueOriginal",
			header: t("rmProfit"),
			cell: ({ row }) =>
				Number(row.original.rmRevenueOriginal ?? 0).toLocaleString(
					"en-US",
					{ minimumFractionDigits: 2 },
				),
		},
		{
			accessorKey: "findersRevenueOriginal",
			header: t("finderProfit"),
			cell: ({ row }) =>
				Number(row.original.findersRevenueOriginal ?? 0).toLocaleString(
					"en-US",
					{ minimumFractionDigits: 2 },
				),
		},
	];

	return (
		<div className="space-y-4">
			{/* 篩選器 */}
			<div className="flex flex-wrap gap-2 items-center mb-2">
				<Filter className="size-4 text-muted-foreground" />
				<Input
					placeholder={t("filters.productName")}
					value={filters.productName}
					onChange={(e) =>
						setFilters((f) => ({
							...f,
							productName: e.target.value,
						}))
					}
					className="w-40"
				/>
				<Input
					type="date"
					placeholder={t("filters.startDate")}
					value={filters.dateFrom}
					onChange={(e) =>
						setFilters((f) => ({ ...f, dateFrom: e.target.value }))
					}
					className="w-36"
				/>
				<Input
					type="date"
					placeholder={t("filters.endDate")}
					value={filters.dateTo}
					onChange={(e) =>
						setFilters((f) => ({ ...f, dateTo: e.target.value }))
					}
					className="w-36"
				/>
				<Input
					type="number"
					placeholder={t("filters.minProfit")}
					value={filters.minShareable}
					onChange={(e) =>
						setFilters((f) => ({
							...f,
							minShareable: e.target.value,
						}))
					}
					className="w-28"
				/>
				<Input
					type="number"
					placeholder={t("filters.maxProfit")}
					value={filters.maxShareable}
					onChange={(e) =>
						setFilters((f) => ({
							...f,
							maxShareable: e.target.value,
						}))
					}
					className="w-28"
				/>
			</div>
			<DataTable
				columns={columns}
				data={sortedData}
				isLoading={isLoading}
				searchKey="productName"
				searchPlaceholder={t("filters.searchProducts")}
				searchableColumns={[
					{ id: "productName", title: t("productName") },
				]}
			/>
		</div>
	);
}
