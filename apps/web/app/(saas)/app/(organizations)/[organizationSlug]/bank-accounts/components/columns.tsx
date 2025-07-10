"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { DataTableColumnHeader } from "@saas/shared/components/DataTable/DataTableColumnHeader";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Edit2 } from "lucide-react";
import Link from "next/link";

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
		code: string;
	};
	createdAt: Date;
	updatedAt: Date;
}

// 客戶連結組件
function CustomerLink({
	customer,
}: { customer: BankAccountRecord["customer"] }) {
	const { activeOrganization } = useActiveOrganization();

	if (!customer) {
		return <span>未指定客戶</span>;
	}

	return (
		<Link
			href={`/app/${activeOrganization?.slug}/customers/${customer.id}`}
			className="text-primary hover:underline font-medium"
		>
			{customer.name} ({customer.code})
		</Link>
	);
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
			const record = row.original;

			if (!customer) {
				return (
					<button
						type="button"
						className="text-gray-400 cursor-pointer underline bg-transparent border-none p-0 text-left"
						onClick={() => onEdit(record)}
						title="點擊編輯"
					>
						未指定客戶
					</button>
				);
			}

			return <CustomerLink customer={customer} />;
		},
	},
	{
		accessorKey: "bankName",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="銀行名稱" />
		),
	},
	// {
	// 	accessorKey: "accountName",
	// 	header: ({ column }) => (
	// 		<DataTableColumnHeader column={column} title="帳戶名稱" />
	// 	),
	// },
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
