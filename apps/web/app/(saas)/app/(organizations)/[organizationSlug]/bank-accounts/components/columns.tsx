"use client";

import { DataTableColumnHeader } from "@saas/shared/components/DataTable/DataTableColumnHeader";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@ui/components/badge";

export interface BankAccountRecord {
	id: string;
	bankName: string;
	accountName: string;
	accountNumber: string;
	currency: string;
	balance: number;
	status: "active" | "inactive";
}

export const columns: ColumnDef<BankAccountRecord>[] = [
	{
		accessorKey: "bankName",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="銀行名稱" />
		),
	},
	{
		accessorKey: "accountName",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="帳戶名稱" />
		),
	},
	{
		accessorKey: "accountNumber",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="帳號" />
		),
	},
	{
		accessorKey: "currency",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="幣別" />
		),
	},
	{
		accessorKey: "balance",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="餘額" />
		),
		cell: ({ row }) => {
			const balance = row.getValue("balance") as number;
			const currency = row.getValue("currency") as string;
			return new Intl.NumberFormat("zh-TW", {
				style: "currency",
				currency: currency,
			}).format(balance);
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
					{status === "active" ? "使用中" : "已停用"}
				</Badge>
			);
		},
	},
];
