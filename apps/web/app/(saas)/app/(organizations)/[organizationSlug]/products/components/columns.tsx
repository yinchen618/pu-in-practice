"use client";

import { DataTableColumnHeader } from "@saas/shared/components/DataTable/DataTableColumnHeader";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Edit2 } from "lucide-react";
import {
	CURRENCY_OPTIONS,
	DISTRIBUTION_TYPE_OPTIONS,
	type ProductCategory,
	type ProductStatus,
} from "../../constants";

export interface ProductRecord {
	id: string;
	name: string;
	code: string;
	category: ProductCategory;
	description: string | null;
	status: ProductStatus;
	price: number | null;
	currency: string;
	distributionType: string;
	organizationId: string;
	createdAt: string;
	updatedAt: string;
}

export function createColumns(
	onEdit: (record: ProductRecord) => void,
): ColumnDef<ProductRecord>[] {
	return [
		{
			accessorKey: "category",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="類別" />
			),
			cell: ({ row }) => {
				const category = row.getValue("category") as string;
				console.log(category);
				const getCategoryLabel = (category: string) => {
					switch (category) {
						case "AQ":
							return "AQ";
						case "Bond":
							return "債券";
						case "DCI":
							return "DCI";
						case "EQ":
							return "股票";
						case "FCN":
							return "FCN";
						case "Fund":
							return "基金";
						case "FX":
							return "外匯";
						default:
							return category;
					}
				};
				const getCategoryStatus = (category: string) => {
					switch (category) {
						case "AQ":
						case "DCI":
						case "FCN":
							return "warning";
						case "Bond":
						case "Fund":
							return "info";
						case "EQ":
							return "success";
						case "FX":
							return "error";
						default:
							return "info";
					}
				};
				return (
					<Badge status={getCategoryStatus(category)}>
						{getCategoryLabel(category)}
					</Badge>
				);
			},
		},
		{
			accessorKey: "name",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="產品名稱" />
			),
		},
		{
			accessorKey: "code",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="產品代碼" />
			),
		},
		{
			accessorKey: "currency",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="幣別" />
			),
			cell: ({ row }) => {
				const currency = row.getValue("currency") as string;
				const option = CURRENCY_OPTIONS.find(
					(opt) => opt.value === currency,
				);
				return option?.label || currency;
			},
		},
		{
			accessorKey: "distributionType",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="配息方式" />
			),
			cell: ({ row }) => {
				const type = row.getValue("distributionType") as string;
				const option = DISTRIBUTION_TYPE_OPTIONS.find(
					(opt) => opt.value === type,
				);
				return option?.label || type;
			},
		},
		{
			accessorKey: "description",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="描述" />
			),
			cell: ({ row }) => {
				const description = row.getValue("description") as
					| string
					| null;
				return description || "-";
			},
		},
		{
			accessorKey: "createdAt",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="新增日期" />
			),
			cell: ({ row }) => {
				const date = row.getValue("createdAt") as string;
				return new Date(date).toLocaleDateString("zh-TW");
			},
		},
		{
			accessorKey: "status",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="狀態" />
			),
			cell: ({ row }) => {
				const status = row.getValue("status") as string;
				return (
					<Badge status={status === "active" ? "success" : "info"}>
						{status === "active" ? "銷售中" : "已下架"}
					</Badge>
				);
			},
		},
		{
			id: "actions",
			header: "操作",
			cell: ({ row }) => {
				const record = row.original;
				return (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onEdit(record)}
					>
						<Edit2 className="size-4" />
					</Button>
				);
			},
		},
	];
}
