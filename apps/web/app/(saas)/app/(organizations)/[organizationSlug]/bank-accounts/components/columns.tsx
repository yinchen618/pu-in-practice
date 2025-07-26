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
	t,
}: {
	customer: BankAccountRecord["customer"];
	t: (key: string) => string;
}) {
	const { activeOrganization } = useActiveOrganization();

	if (!customer) {
		return <span>{t("unspecifiedCustomer")}</span>;
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
	t: (key: string) => string,
): ColumnDef<BankAccountRecord>[] => [
	{
		accessorKey: "customer",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title={t("customer")} />
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
						title={t("clickToEdit")}
					>
						{t("unspecifiedCustomer")}
					</button>
				);
			}

			return <CustomerLink customer={customer} t={t} />;
		},
	},
	{
		accessorKey: "bankName",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title={t("bankName")} />
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
			<DataTableColumnHeader column={column} title={t("accountNumber")} />
		),
	},
	{
		accessorKey: "currency",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title={t("currency")} />
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
			<DataTableColumnHeader column={column} title={t("status")} />
		),
		cell: ({ row }) => {
			const status = row.getValue("status") as string;
			return (
				<Badge status={status === "active" ? "success" : "info"}>
					{status === "active" ? t("active") : t("inactive")}
				</Badge>
			);
		},
	},
	{
		accessorKey: "createdAt",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title={t("createdDate")} />
		),
		cell: ({ row }) => {
			const date = row.getValue("createdAt") as Date;
			return new Date(date).toLocaleDateString("zh-TW");
		},
	},
	{
		id: "actions",
		header: t("actions"),
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
