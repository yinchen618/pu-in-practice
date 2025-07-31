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
	sgdAmount: number;
	usdRate: number;
	usdAmount: number;
	receiptUrl?: string | null; // 保留舊欄位以支援向後相容
	receiptUrls?: string[]; // 新的多檔案支援
	description?: string | null;
	date: Date;
	rmId?: string | null;
	rm?: {
		id: string;
		name: string;
	} | null;
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
	t?: (key: string) => string,
): ColumnDef<ExpenseRecord>[] {
	return [
		{
			accessorKey: "date",
			header: ({ column }) => (
				<DataTableColumnHeader
					column={column}
					title={t?.("table.date") || "日期"}
				/>
			),
			cell: ({ row }) => {
				const date = row.getValue("date") as Date;
				return new Date(date).toLocaleDateString("zh-TW");
			},
		},
		{
			accessorKey: "category",
			header: ({ column }) => (
				<DataTableColumnHeader
					column={column}
					title={t?.("table.category") || "類別"}
				/>
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
				<DataTableColumnHeader
					column={column}
					title={t?.("table.description") || "描述"}
				/>
			),
			cell: ({ row }) => {
				const description = row.getValue("description") as
					| string
					| null;
				return description || "-";
			},
		},
		{
			accessorKey: "rm",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="RM" />
			),
			cell: ({ row }) => {
				const rm = row.original.rm;
				return rm ? rm.name : "-";
			},
		},
		{
			accessorKey: "currency",
			header: ({ column }) => (
				<DataTableColumnHeader
					column={column}
					title={t?.("table.currency") || "幣別"}
				/>
			),
		},
		{
			accessorKey: "amount",
			header: ({ column }) => (
				<DataTableColumnHeader
					column={column}
					title={t?.("table.amount") || "金額"}
				/>
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
			accessorKey: "exchangeRate",
			header: ({ column }) => (
				<DataTableColumnHeader
					column={column}
					title={t?.("table.exchangeRate") || "匯率"}
				/>
			),
			cell: ({ row }) => {
				const exchangeRate = row.getValue("exchangeRate") as number;
				const rate = Number(exchangeRate);
				return Number.isNaN(rate) ? "1.00" : rate.toFixed(4);
			},
		},
		{
			accessorKey: "sgdAmount",
			header: ({ column }) => (
				<DataTableColumnHeader
					column={column}
					title={t?.("table.sgdAmount") || "新幣金額"}
				/>
			),
			cell: ({ row }) => {
				const sgdAmount = row.original.sgdAmount;
				return new Intl.NumberFormat("zh-TW", {
					style: "currency",
					currency: "SGD",
				}).format(sgdAmount);
			},
		},
		{
			accessorKey: "usdRate",
			header: ({ column }) => (
				<DataTableColumnHeader
					column={column}
					title={t?.("table.usdRate") || "美元匯率"}
				/>
			),
			cell: ({ row }) => {
				const usdRate = row.getValue("usdRate") as number;
				const rate = Number(usdRate);
				return Number.isNaN(rate) ? "1.00" : rate.toFixed(4);
			},
		},
		{
			accessorKey: "usdAmount",
			header: ({ column }) => (
				<DataTableColumnHeader
					column={column}
					title={t?.("table.usdAmount") || "美元金額"}
				/>
			),
			cell: ({ row }) => {
				const usdAmount = row.original.usdAmount;
				return new Intl.NumberFormat("zh-TW", {
					style: "currency",
					currency: "USD",
				}).format(usdAmount);
			},
		},
		{
			accessorKey: "receiptUrl",
			header: ({ column }) => (
				<DataTableColumnHeader
					column={column}
					title={t?.("table.receipt") || "收據"}
				/>
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
						{t?.("table.uploaded") || "已上傳"}{" "}
						{totalReceipts > 1
							? `(${totalReceipts}${t?.("table.items") || "個"})`
							: ""}
					</Badge>
				) : (
					<Badge status="warning">
						{t?.("table.notUploaded") || "未上傳"}
					</Badge>
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
			header: t?.("table.actions") || "操作",
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
