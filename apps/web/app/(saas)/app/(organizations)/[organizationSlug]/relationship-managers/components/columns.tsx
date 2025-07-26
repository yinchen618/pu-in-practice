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
	resignDate: Date | null;
	organizationId: string;
	createdAt: Date;
	updatedAt: Date;
}

interface TranslationFunctions {
	table: (key: string) => string;
	category: (key: string) => string;
	statusLabels: (key: string) => string;
}

export const createColumns = (
	onEdit: (rmRecord: RMRecord) => void,
	t: TranslationFunctions,
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
			<DataTableColumnHeader column={column} title={t.table("rmName")} />
		),
	},
	{
		accessorKey: "email",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title={t.table("email")} />
		),
	},
	{
		accessorKey: "phone",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title={t.table("phone")} />
		),
	},
	{
		accessorKey: "category",
		header: ({ column }) => (
			<DataTableColumnHeader
				column={column}
				title={t.table("category")}
			/>
		),
		cell: ({ row }) => {
			const category = row.getValue("category") as string;
			const getCategoryLabel = (category: string) => {
				switch (category) {
					case "FINDER":
						return t.category("finder");
					case "RM":
						return t.category("rm");
					case "BOTH":
						return t.category("both");
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
			<DataTableColumnHeader column={column} title={t.table("status")} />
		),
		cell: ({ row }) => {
			const status = row.getValue("status") as string;
			return (
				<Badge status={status === "active" ? "success" : "info"}>
					{status === "active"
						? t.statusLabels("active")
						: t.statusLabels("inactive")}
				</Badge>
			);
		},
	},
	{
		accessorKey: "joinDate",
		header: ({ column }) => (
			<DataTableColumnHeader
				column={column}
				title={t.table("joinDate")}
			/>
		),
		cell: ({ row }) => {
			const date = row.getValue("joinDate") as Date;
			return new Date(date).toLocaleDateString("zh-TW");
		},
	},
	{
		accessorKey: "resignDate",
		header: ({ column }) => (
			<DataTableColumnHeader
				column={column}
				title={t.table("resignDate")}
			/>
		),
		cell: ({ row }) => {
			const date = row.getValue("resignDate") as Date | null;
			return date ? new Date(date).toLocaleDateString("zh-TW") : "-";
		},
	},
	{
		id: "actions",
		header: t.table("actions"),
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
