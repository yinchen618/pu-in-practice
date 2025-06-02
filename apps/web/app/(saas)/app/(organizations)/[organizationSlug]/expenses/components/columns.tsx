"use client";

import { DataTableColumnHeader } from "@saas/shared/components/DataTable/DataTableColumnHeader";
import type { ColumnDef } from "@tanstack/react-table";

export interface ExpenseRecord {
	id: string;
	date: string;
	category: string;
	description: string;
	amount: number;
	paymentMethod: string;
}

export const columns: ColumnDef<ExpenseRecord>[] = [
	{
		accessorKey: "date",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="日期" />
		),
	},
	{
		accessorKey: "category",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="類別" />
		),
	},
	{
		accessorKey: "description",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="描述" />
		),
	},
	{
		accessorKey: "amount",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="金額" />
		),
		cell: ({ row }) => {
			const amount = row.getValue("amount") as number;
			return new Intl.NumberFormat("zh-TW", {
				style: "currency",
				currency: "TWD",
			}).format(amount);
		},
	},
	{
		accessorKey: "paymentMethod",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="支付方式" />
		),
	},
];
