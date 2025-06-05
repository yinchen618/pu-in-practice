"use client";

import { DataTableColumnHeader } from "@saas/shared/components/DataTable/DataTableColumnHeader";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Edit2 } from "lucide-react";

export interface ProductRecord {
	id: string;
	name: string;
	code: string;
	category: string;
	description: string | null;
	status: "active" | "inactive";
	price: number | null;
	currency: string;
	organizationId: string;
	createdAt: Date;
	updatedAt: Date;
}

export const createColumns = (
	onEdit: (productRecord: ProductRecord) => void,
): ColumnDef<ProductRecord>[] => [
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
		accessorKey: "category",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="類別" />
		),
		cell: ({ row }) => {
			const category = row.getValue("category") as string;
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
		accessorKey: "price",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="價格" />
		),
		cell: ({ row }) => {
			const price = row.getValue("price") as number | null;
			const currency = row.original.currency;
			if (price === null) {
				return "未設定";
			}
			return new Intl.NumberFormat("zh-TW", {
				style: "currency",
				currency: currency || "TWD",
			}).format(price);
		},
	},
	{
		accessorKey: "description",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="描述" />
		),
		cell: ({ row }) => {
			const description = row.getValue("description") as string | null;
			return description || "-";
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
		accessorKey: "createdAt",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="新增日期" />
		),
		cell: ({ row }) => {
			const date = row.getValue("createdAt") as Date;
			return new Date(date).toLocaleDateString("zh-TW");
		},
	},
	{
		id: "actions",
		header: "操作",
		cell: ({ row }) => {
			const productRecord = row.original;

			return (
				<Button
					variant="ghost"
					size="sm"
					onClick={() => onEdit(productRecord)}
				>
					<Edit2 className="size-4" />
				</Button>
			);
		},
	},
];
