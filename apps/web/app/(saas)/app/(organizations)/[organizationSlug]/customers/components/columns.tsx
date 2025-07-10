"use client";

import { DataTableColumnHeader } from "@saas/shared/components/DataTable/DataTableColumnHeader";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@ui/components/button";
import { Edit2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { BankAccountRecord } from "../../bank-accounts/components/columns";

export interface CustomerRecord {
	id: string;
	name: string;
	code: string;
	email: string;
	phone: string | null;
	organizationId: string;
	bankAccounts?: {
		id: string;
		bankName: string;
		// accountName: string; // 已隱藏
		accountNumber: string;
		currency: string;
		balance: number;
		status: string;
	}[];
	rm1Id: string | null;
	rm1ProfitShare: number | null;
	rm2Id: string | null;
	rm2ProfitShare: number | null;
	finder1Id: string | null;
	finder1ProfitShare: number | null;
	finder2Id: string | null;
	finder2ProfitShare: number | null;
	rm1Name: string | null;
	rm2Name: string | null;
	finder1Name: string | null;
	finder2Name: string | null;
	createdAt: Date;
	updatedAt: Date;
}

export const createColumns = (
	onEdit: (customerRecord: CustomerRecord) => void,
	onEditBankAccount: (bankAccountRecord: BankAccountRecord) => void,
): ColumnDef<CustomerRecord>[] => {
	const params = useParams();
	const organizationSlug = params.organizationSlug as string;

	return [
		{
			accessorKey: "code",
			size: 120,
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="客戶編號" />
			),
		},
		{
			accessorKey: "name",
			size: 150,
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="客戶名稱" />
			),
			cell: ({ row }) => {
				const name = row.getValue("name") as string;
				const customerId = row.original.id;
				return (
					<Link
						href={`/app/${organizationSlug}/customers/${customerId}`}
						className="text-primary hover:underline"
					>
						{name}
					</Link>
				);
			},
		},
		{
			accessorKey: "bankAccounts",
			size: 180,
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="銀行帳戶" />
			),
			cell: ({ row }) => {
				const bankAccounts = row.getValue(
					"bankAccounts",
				) as CustomerRecord["bankAccounts"];
				const count = bankAccounts?.length || 0;

				if (count === 0) {
					return "無銀行帳戶";
				}

				return (
					<div className="space-y-1">
						<div>{`${count} 個帳戶`}</div>
						<div className="flex gap-1">
							{bankAccounts?.map((account) => (
								<Button
									key={account.id}
									variant="ghost"
									size="sm"
									onClick={() =>
										onEditBankAccount(
											account as BankAccountRecord,
										)
									}
									className="h-6 px-2 text-xs"
								>
									<Edit2 className="mr-1 size-3" />
									{account.bankName} - {account.accountNumber}
								</Button>
							))}
						</div>
					</div>
				);
			},
		},
		{
			accessorKey: "email",
			size: 200,
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="電子郵件" />
			),
		},
		{
			accessorKey: "phone",
			size: 120,
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="電話" />
			),
		},
		{
			accessorKey: "rm1Name",
			size: 140,
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="負責 RM1" />
			),
			cell: ({ row }) => {
				const rm1Name = row.getValue("rm1Name") as string | null;
				const rm1ProfitShare = row.original.rm1ProfitShare;
				const displayText = rm1Name || "-";
				const profitShare = rm1ProfitShare
					? `(${rm1ProfitShare}%)`
					: "";
				return (
					<div>
						<div>{displayText}</div>
						{profitShare && (
							<div className="text-xs text-gray-500">
								{profitShare}
							</div>
						)}
					</div>
				);
			},
		},
		// {
		// 	accessorKey: "rm1ProfitShare",
		// 	size: 160,
		// 	header: ({ column }) => (
		// 		<DataTableColumnHeader column={column} title="RM1 利潤分享 (%)" />
		// 	),
		// 	cell: ({ row }) => {
		// 		const rm1ProfitShare = row.original.rm1ProfitShare;
		// 		const profitShare = rm1ProfitShare ? `(${rm1ProfitShare}%)` : "";
		// 		return <div>{profitShare}</div>;
		// 	},
		// },
		{
			accessorKey: "rm2Name",
			size: 140,
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="負責 RM2" />
			),
			cell: ({ row }) => {
				const rm2Name = row.getValue("rm2Name") as string | null;
				const rm2ProfitShare = row.original.rm2ProfitShare;
				const displayText = rm2Name || "-";
				const profitShare = rm2ProfitShare
					? `(${rm2ProfitShare}%)`
					: "";
				return (
					<div>
						<div>{displayText}</div>
						{profitShare && (
							<div className="text-xs text-gray-500">
								{profitShare}
							</div>
						)}
					</div>
				);
			},
		},
		// {
		// 	accessorKey: "rm2ProfitShare",
		// 	size: 160,
		// 	header: ({ column }) => (
		// 		<DataTableColumnHeader column={column} title="RM2 利潤分享 (%)" />
		// 	),
		// 	cell: ({ row }) => {
		// 		const rm2ProfitShare = row.original.rm2ProfitShare;
		// 		const profitShare = rm2ProfitShare ? `(${rm2ProfitShare}%)` : "";
		// 		return <div>{profitShare}</div>;
		// 	},
		// },
		{
			accessorKey: "finder1Name",
			size: 150,
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="負責 Finder1" />
			),
			cell: ({ row }) => {
				const finder1Name = row.getValue("finder1Name") as
					| string
					| null;
				const finder1ProfitShare = row.original.finder1ProfitShare;
				const displayText = finder1Name || "-";
				const profitShare = finder1ProfitShare
					? `(${finder1ProfitShare}%)`
					: "";
				return (
					<div>
						<div>{displayText}</div>
						{profitShare && (
							<div className="text-xs text-gray-500">
								{profitShare}
							</div>
						)}
					</div>
				);
			},
		},
		// {
		// 	accessorKey: "finder1ProfitShare",
		// 	size: 170,
		// 	header: ({ column }) => (
		// 		<DataTableColumnHeader
		// 			column={column}
		// 			title="Finder1 利潤分享 (%)"
		// 		/>
		// 	),
		// 	cell: ({ row }) => {
		// 		const finder1ProfitShare = row.original.finder1ProfitShare;
		// 		const profitShare = finder1ProfitShare
		// 			? `(${finder1ProfitShare}%)`
		// 			: "";
		// 		return <div>{profitShare}</div>;
		// 	},
		// },
		{
			accessorKey: "finder2Name",
			size: 150,
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="負責 Finder2" />
			),
			cell: ({ row }) => {
				const finder2Name = row.getValue("finder2Name") as
					| string
					| null;
				const finder2ProfitShare = row.original.finder2ProfitShare;
				const displayText = finder2Name || "-";
				const profitShare = finder2ProfitShare
					? `(${finder2ProfitShare}%)`
					: "";
				return (
					<div>
						<div>{displayText}</div>
						{profitShare && (
							<div className="text-xs text-gray-500">
								{profitShare}
							</div>
						)}
					</div>
				);
			},
		},
		// {
		// 	accessorKey: "finder2ProfitShare",
		// 	size: 170,
		// 	header: ({ column }) => (
		// 		<DataTableColumnHeader
		// 			column={column}
		// 			title="Finder2 利潤分享 (%)"
		// 		/>
		// 	),
		// 	cell: ({ row }) => {
		// 		const finder2ProfitShare = row.original.finder2ProfitShare;
		// 		const profitShare = finder2ProfitShare
		// 			? `(${finder2ProfitShare}%)`
		// 			: "";
		// 		return <div>{profitShare}</div>;
		// 	},
		// },
		{
			id: "actions",
			size: 80,
			header: "操作",
			cell: ({ row }) => {
				const customerRecord = row.original;

				return (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onEdit(customerRecord)}
					>
						<Edit2 className="size-4" />
					</Button>
				);
			},
		},
	];
};
