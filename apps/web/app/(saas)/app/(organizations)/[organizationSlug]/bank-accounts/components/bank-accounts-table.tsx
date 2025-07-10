import { DataTable } from "@saas/shared/components/DataTable";
import { DataTableColumnHeader } from "@saas/shared/components/DataTable/DataTableColumnHeader";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@ui/components/button";
import { Edit2 } from "lucide-react";
import type { BankAccountRecord } from "./columns";

interface BankAccountsTableProps {
	bankAccounts: BankAccountRecord[];
	onEdit?: (record: BankAccountRecord) => void;
	customerId?: string;
}

const columns = (
	onEdit?: (record: BankAccountRecord) => void,
	customerId?: string,
): ColumnDef<BankAccountRecord>[] => {
	const cols: ColumnDef<BankAccountRecord>[] = [];

	// 只有在沒有指定 customerId 時才顯示客戶欄位
	if (!customerId) {
		cols.push({
			accessorKey: "customer",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="客戶" />
			),
			cell: ({ row }) => {
				const record = row.original as BankAccountRecord;
				if (!record.customer) {
					return (
						<button
							type="button"
							className="text-gray-400 cursor-pointer underline bg-transparent border-none p-0 text-left"
							onClick={() => onEdit?.(record)}
							title="點擊編輯"
						>
							未指定客戶
						</button>
					);
				}
				// 原本有客戶的顯示
				return <span>{record.customer.name}</span>;
			},
		});
	}

	// 添加其他欄位
	cols.push(
		{
			accessorKey: "bankName",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="銀行名稱" />
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
	);

	// 添加操作欄位
	if (onEdit) {
		cols.push({
			id: "actions",
			header: "操作",
			cell: ({ row }) => {
				const record = row.original as BankAccountRecord;
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
		});
	}

	return cols;
};

export function BankAccountsTable({
	bankAccounts,
	onEdit,
	customerId,
}: BankAccountsTableProps) {
	return (
		<DataTable
			columns={columns(onEdit, customerId)}
			data={bankAccounts}
			searchKey="bankName"
			searchPlaceholder="搜尋銀行帳戶..."
		/>
	);
}
