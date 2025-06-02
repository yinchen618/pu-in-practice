"use client";

import { DataTableColumnHeader } from "@saas/shared/components/DataTable/DataTableColumnHeader";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@ui/components/badge";

export interface ProductRecord {
	id: string;
	name: string;
	code: string;
	category: string;
	price: number;
	commission: number;
	status: "active" | "inactive";
}

export const columns: ColumnDef<ProductRecord>[] = [
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
	},
	{
		accessorKey: "price",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="價格" />
		),
		cell: ({ row }) => {
			const price = row.getValue("price") as number;
			return new Intl.NumberFormat("zh-TW", {
				style: "currency",
				currency: "TWD",
			}).format(price);
		},
	},
	{
		accessorKey: "commission",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="佣金比例" />
		),
		cell: ({ row }) => {
			const commission = row.getValue("commission") as number;
			return `${commission}%`;
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
];
