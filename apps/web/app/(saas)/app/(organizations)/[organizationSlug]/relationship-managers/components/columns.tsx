"use client";

import { DataTableColumnHeader } from "@saas/shared/components/DataTable/DataTableColumnHeader";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Edit2 } from "lucide-react";

export interface RMRecord {
	id: string;
	name: string;
	email: string;
	phone: string | null;
	customerCount: number;
	status: "active" | "inactive";
	category: "FINDER" | "RM" | "BOTH";
	joinDate: Date;
	organizationId: string;
	createdAt: Date;
	updatedAt: Date;
}

export const createColumns = (
	onEdit: (rmRecord: RMRecord) => void,
): ColumnDef<RMRecord>[] => [
	// {
	// 	accessorKey: "id",
	// 	header: ({ column }) => (
	// 		<DataTableColumnHeader column={column} title="ID" />
	// 	),
	// 	cell: ({ row }) => {
	// 		return <div>{row.original.id}</div>;
	// 	},
	// },
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
		accessorKey: "category",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="RM 類別" />
		),
		cell: ({ row }) => {
			const category = row.getValue("category") as string;
			const getCategoryLabel = (category: string) => {
				switch (category) {
					case "FINDER":
						return "FINDER";
					case "RM":
						return "RM";
					case "BOTH":
						return "BOTH";
					default:
						return category;
				}
			};
			const getCategoryStatus = (category: string) => {
				switch (category) {
					case "FINDER":
						return "warning";
					case "RM":
						return "info";
					case "BOTH":
						return "success";
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
	// {
	// 	accessorKey: "customerCount",
	// 	header: ({ column }) => (
	// 		<DataTableColumnHeader column={column} title="客戶數量" />
	// 	),
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
		cell: ({ row }) => {
			const date = row.getValue("joinDate") as Date;
			return new Date(date).toLocaleDateString("zh-TW");
		},
	},
	{
		id: "actions",
		header: "操作",
		cell: ({ row }) => {
			const rmRecord = row.original;

			return (
				<Button
					variant="ghost"
					size="sm"
					onClick={() => onEdit(rmRecord)}
				>
					<Edit2 className="size-4" />
				</Button>
			);
		},
	},
];
