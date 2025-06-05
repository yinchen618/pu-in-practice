"use client";

import { DataTableColumnHeader } from "@saas/shared/components/DataTable/DataTableColumnHeader";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Edit2 } from "lucide-react";

export interface BankAccountRecord {
	id: string;
	bankName: string;
	accountName: string;
	accountNumber: string;
	currency: string;
	balance: number;
	status: "active" | "inactive";
	organizationId: string;
	customerId?: string;
	customer?: {
		id: string;
		name: string;
		email: string;
	};
	createdAt: Date;
	updatedAt: Date;
}

export const createColumns = (
	onEdit: (bankAccountRecord: BankAccountRecord) => void,
): ColumnDef<BankAccountRecord>[] => [
	{
		accessorKey: "customer",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="客戶" />
		),
		cell: ({ row }) => {
			const customer = row.getValue(
				"customer",
			) as BankAccountRecord["customer"];
			return customer ? customer.name : "未指定客戶";
		},
	},
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
	// {
	// 	accessorKey: "balance",
	// 	header: ({ column }) => (
	// 		<DataTableColumnHeader column={column} title="餘額" />
	// 	),
	// 	cell: ({ row }) => {
	// 		const balance = row.getValue("balance") as number;
	// 		const currency = row.getValue("currency") as string;
	// 		return new Intl.NumberFormat("zh-TW", {
	// 			style: "currency",
	// 			currency: currency,
	// 		}).format(balance);
	// 	},
	// },
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
	{
		accessorKey: "createdAt",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="建立日期" />
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
			const bankAccountRecord = row.original;

			return (
				<Button
					variant="ghost"
					size="sm"
					onClick={() => onEdit(bankAccountRecord)}
				>
					<Edit2 className="size-4" />
				</Button>
			);
		},
	},
];
