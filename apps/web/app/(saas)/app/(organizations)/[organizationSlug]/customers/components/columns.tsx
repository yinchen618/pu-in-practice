"use client";

import { DataTableColumnHeader } from "@saas/shared/components/DataTable/DataTableColumnHeader";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@ui/components/badge";

export interface CustomerRecord {
	id: string;
	name: string;
	email: string;
	phone: string;
	rmName: string;
	status: "active" | "inactive";
	joinDate: string;
}

export const columns: ColumnDef<CustomerRecord>[] = [
	{
		accessorKey: "name",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="客戶名稱" />
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
		accessorKey: "rmName",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="負責 RM" />
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
					{status === "active" ? "活躍" : "非活躍"}
				</Badge>
			);
		},
	},
	{
		accessorKey: "joinDate",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="加入日期" />
		),
	},
];
