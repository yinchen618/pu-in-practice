"use client";

import { DataTableColumnHeader } from "@saas/shared/components/DataTable/DataTableColumnHeader";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@ui/components/badge";

export interface RMRecord {
	id: string;
	name: string;
	email: string;
	phone: string;
	customerCount: number;
	status: "active" | "inactive";
	joinDate: string;
}

export const columns: ColumnDef<RMRecord>[] = [
	{
		accessorKey: "name",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="RM 名稱" />
		),
	},
	{
		accessorKey: "email",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="電子郵件" />
		),
	},
	{
		accessorKey: "phone",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="電話" />
		),
	},
	{
		accessorKey: "customerCount",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="客戶數量" />
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
				<Badge status={status === "active" ? "success" : "info"}>
					{status === "active" ? "在職" : "離職"}
				</Badge>
			);
		},
	},
	{
		accessorKey: "joinDate",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="入職日期" />
		),
	},
];
