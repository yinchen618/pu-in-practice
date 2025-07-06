import { DataTableColumnHeader } from "@saas/shared/components/DataTable/DataTableColumnHeader";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Edit2 } from "lucide-react";

export interface AssetTransactionRecord {
	id: string;
	customerId: string;
	date: Date;
	currency: string;
	type: "IN" | "OUT";
	amount: number;
	description?: string | null;
	createdAt: Date;
	updatedAt: Date;
}

export function createColumns(
	onEdit: (record: AssetTransactionRecord) => void,
): ColumnDef<AssetTransactionRecord>[] {
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
			accessorKey: "currency",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="幣別" />
			),
			cell: ({ row }) => {
				const currency = row.getValue("currency") as string;
				return (
					<Badge status="info" className="font-mono">
						{currency}
					</Badge>
				);
			},
		},
		{
			accessorKey: "type",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="類型" />
			),
			cell: ({ row }) => {
				const type = row.getValue("type") as "IN" | "OUT";
				return (
					<Badge
						status={type === "IN" ? "success" : "error"}
						className="font-medium"
					>
						{type === "IN" ? "入金" : "出金"}
					</Badge>
				);
			},
		},
		{
			accessorKey: "amount",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="金額" />
			),
			cell: ({ row }) => {
				const amount = row.getValue("amount") as number;
				const type = row.getValue("type") as "IN" | "OUT";
				const currency = row.getValue("currency") as string;
				return (
					<div className="text-right font-mono">
						<span
							className={
								type === "IN"
									? "text-green-600"
									: "text-red-600"
							}
						>
							{type === "IN" ? "+" : "-"}
							{amount.toLocaleString()} {currency}
						</span>
					</div>
				);
			},
		},
		{
			accessorKey: "description",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="說明" />
			),
			cell: ({ row }) => {
				const description = row.getValue("description") as
					| string
					| null;
				return (
					<div
						className="max-w-[200px] truncate"
						title={description || ""}
					>
						{description || "-"}
					</div>
				);
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
						className="h-8 w-8 p-0"
					>
						<Edit2 className="size-4" />
					</Button>
				);
			},
		},
	];
}
