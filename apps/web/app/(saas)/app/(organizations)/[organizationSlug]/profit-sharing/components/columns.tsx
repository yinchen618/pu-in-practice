"use client";

import { DataTableColumnHeader } from "@saas/shared/components/DataTable/DataTableColumnHeader";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@ui/components/button";
import { Edit2 } from "lucide-react";

export interface ProfitSharingRecord {
	id: string;
	revenueType: string;
	category: string;
	productCode: string;
	productName: string;
	customerId: string;
	customerName: string;
	bankAccountId: string;
	bankRetro: number;
	companyRevenue: number;
	rmRevenue: number;
	findersRevenue: number;
	createdAt: Date;
	updatedAt: Date;
}

export function createColumns(
	onEdit: (record: ProfitSharingRecord) => void,
): ColumnDef<ProfitSharingRecord>[] {
	return [
		{
			accessorKey: "revenueType",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="收入類型" />
			),
		},
		{
			accessorKey: "category",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="類別" />
			),
		},
		{
			accessorKey: "productCode",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="產品代碼" />
			),
		},
		{
			accessorKey: "productName",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="產品名稱" />
			),
		},
		{
			accessorKey: "customerName",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="客戶名稱" />
			),
		},
		{
			accessorKey: "bankRetro",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Bank Retro (%)" />
			),
			cell: ({ row }) => {
				const value = row.getValue("bankRetro") as number;
				return value.toFixed(2);
			},
		},
		{
			accessorKey: "companyRevenue",
			header: ({ column }) => (
				<DataTableColumnHeader
					column={column}
					title="Company Revenue (%)"
				/>
			),
			cell: ({ row }) => {
				const value = row.getValue("companyRevenue") as number;
				return value.toFixed(2);
			},
		},
		{
			accessorKey: "rmRevenue",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="RM Revenue (%)" />
			),
			cell: ({ row }) => {
				const value = row.getValue("rmRevenue") as number;
				return value.toFixed(2);
			},
		},
		{
			accessorKey: "findersRevenue",
			header: ({ column }) => (
				<DataTableColumnHeader
					column={column}
					title="Finders Revenue (%)"
				/>
			),
			cell: ({ row }) => {
				const value = row.getValue("findersRevenue") as number;
				return value.toFixed(2);
			},
		},
		{
			id: "actions",
			header: "操作",
			cell: ({ row }) => {
				const record = row.original;
				return (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onEdit(record)}
					>
						<Edit2 className="size-4" />
					</Button>
				);
			},
		},
	];
}
