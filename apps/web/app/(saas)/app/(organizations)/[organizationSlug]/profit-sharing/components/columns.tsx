"use client";

import { DataTableColumnHeader } from "@saas/shared/components/DataTable/DataTableColumnHeader";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@ui/components/badge";

export interface ProfitSharingRecord {
	id: string;
	date: string;
	customerName: string;
	productName: string;
	amount: number;
	rmName: string;
	status: "pending" | "completed" | "failed";
}

export const columns: ColumnDef<ProfitSharingRecord>[] = [
	{
		accessorKey: "date",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="日期" />
		),
	},
	{
		accessorKey: "customerName",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="客戶名稱" />
		),
	},
	{
		accessorKey: "productName",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="產品名稱" />
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
		accessorKey: "rmName",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="RM 名稱" />
		),
	},
	{
		accessorKey: "status",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="狀態" />
		),
		cell: ({ row }) => {
			const status = row.getValue("status") as string;
			return (
				<Badge
					status={
						status === "completed"
							? "success"
							: status === "pending"
								? "warning"
								: "error"
					}
				>
					{status === "completed"
						? "已完成"
						: status === "pending"
							? "處理中"
							: "失敗"}
				</Badge>
			);
		},
	},
];
