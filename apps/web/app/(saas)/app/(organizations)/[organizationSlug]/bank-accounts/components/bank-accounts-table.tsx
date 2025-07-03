import { DataTable } from "@saas/shared/components/DataTable";
import { DataTableColumnHeader } from "@saas/shared/components/DataTable/DataTableColumnHeader";
import type { ColumnDef } from "@tanstack/react-table";

interface BankAccount {
	id: string;
	bankName: string;
	accountName: string;
	accountNumber: string;
	currency: string;
	balance: number;
	status: string;
}

interface BankAccountsTableProps {
	bankAccounts: BankAccount[];
}

const columns: ColumnDef<BankAccount>[] = [
	{
		accessorKey: "bankName",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="銀行名稱" />
		),
	},
	{
		accessorKey: "accountName",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="帳戶名稱" />
		),
	},
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
	{
		accessorKey: "status",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="狀態" />
		),
		cell: ({ row }) => {
			const status = row.getValue("status") as string;
			return status === "active" ? "使用中" : "已停用";
		},
	},
];

export function BankAccountsTable({ bankAccounts }: BankAccountsTableProps) {
	return (
		<DataTable
			columns={columns}
			data={bankAccounts}
			searchKey="bankName"
			searchPlaceholder="搜尋銀行帳戶..."
		/>
	);
}
