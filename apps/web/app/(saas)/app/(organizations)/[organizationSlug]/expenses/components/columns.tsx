"use client";

import { DataTableColumnHeader } from "@saas/shared/components/DataTable/DataTableColumnHeader";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Edit2 } from "lucide-react";

export interface ExpenseRecord {
	id: string;
	category: string;
	amount: number;
	currency: string;
	exchangeRate: number;
	receiptUrl?: string | null; // 保留舊欄位以支援向後相容
	receiptUrls?: string[]; // 新的多檔案支援
	description?: string | null;
	date: Date;
	organizationId: string;
	createdAt: Date;
	updatedAt: Date;
}

const categoryMap = {
	餐飲: "餐飲",
	機票: "機票",
	酒店: "酒店",
	快遞: "快遞",
	交通: "交通",
} as const;

function getCategoryBadgeColor(category: string) {
	switch (category) {
		case "餐飲":
			return "success";
		case "機票":
			return "info";
		case "酒店":
			return "warning";
		case "快遞":
			return "error";
		case "交通":
			return "info";
		default:
			return "error";
	}
}

export function createColumns(
	onEdit: (expenseRecord: ExpenseRecord) => void,
): ColumnDef<ExpenseRecord>[] {
	return [
		{
			accessorKey: "date",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="日期" />
			),
			cell: ({ row }) => {
				const date = row.getValue("date") as Date;
				return new Date(date).toLocaleDateString("zh-TW");
			},
		},
		{
			accessorKey: "category",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="類別" />
			),
			cell: ({ row }) => {
				const category = row.getValue("category") as string;
				return (
					<Badge status={getCategoryBadgeColor(category)}>
						{category}
					</Badge>
				);
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
			accessorKey: "amount",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="金額" />
			),
			cell: ({ row }) => {
				const amount = row.getValue("amount") as number;
				const currency = row.getValue("currency") as string;
				return new Intl.NumberFormat("zh-TW", {
					style: "currency",
					currency: currency,
				}).format(amount);
			},
		},
		{
			accessorKey: "currency",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="幣別" />
			),
		},
		{
			accessorKey: "exchangeRate",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="匯率" />
			),
			cell: ({ row }) => {
				const exchangeRate = row.getValue("exchangeRate") as number;
				const rate = Number(exchangeRate);
				return Number.isNaN(rate) ? "1.0000" : rate.toFixed(4);
			},
		},
		{
			accessorKey: "receiptUrl",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="收據" />
			),
			cell: ({ row }) => {
				const expenseRecord = row.original;
				const receiptUrls = expenseRecord.receiptUrls;
				const receiptUrl = expenseRecord.receiptUrl;

				// 計算總收據數量
				const totalReceipts =
					(receiptUrls?.length || 0) + (receiptUrl ? 1 : 0);

				return totalReceipts > 0 ? (
					<Badge status="success">
						已上傳 {totalReceipts > 1 ? `(${totalReceipts}個)` : ""}
					</Badge>
				) : (
					<Badge status="warning">未上傳</Badge>
				);
			},
		},
		// {
		// 	accessorKey: "createdAt",
		// 	header: ({ column }) => (
		// 		<DataTableColumnHeader column={column} title="建立日期" />
		// 	),
		// 	cell: ({ row }) => {
		// 		const date = row.getValue("createdAt") as Date;
		// 		return new Date(date).toLocaleDateString("zh-TW");
		// 	},
		// },
		{
			id: "actions",
			header: "操作",
			cell: ({ row }) => {
				const expenseRecord = row.original;

				return (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onEdit(expenseRecord)}
					>
						<Edit2 className="size-4" />
					</Button>
				);
			},
		},
	];
}
