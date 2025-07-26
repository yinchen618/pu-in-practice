import { DataTable } from "@saas/shared/components/DataTable";
import { DataTableColumnHeader } from "@saas/shared/components/DataTable/DataTableColumnHeader";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@ui/components/button";
import { Edit2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { BankAccountRecord } from "./columns";

interface BankAccountsTableProps {
	bankAccounts: BankAccountRecord[];
	onEdit?: (record: BankAccountRecord) => void;
	customerId?: string;
}

export function BankAccountsTable({
	bankAccounts,
	onEdit,
	customerId,
}: BankAccountsTableProps) {
	const t = useTranslations("organization.bankAccounts");
	const tCommon = useTranslations("common");

	const columns: ColumnDef<BankAccountRecord>[] = [];

	// 只有在沒有指定 customerId 時才顯示客戶欄位
	if (!customerId) {
		columns.push({
			accessorKey: "customer",
			header: ({ column }) => (
				<DataTableColumnHeader
					column={column}
					title={tCommon("customer")}
				/>
			),
			cell: ({ row }) => {
				const record = row.original as BankAccountRecord;
				if (!record.customer) {
					return (
						<button
							type="button"
							className="text-gray-400 cursor-pointer underline bg-transparent border-none p-0 text-left"
							onClick={() => onEdit?.(record)}
							title={tCommon("clickToEdit")}
						>
							{tCommon("unspecifiedCustomer")}
						</button>
					);
				}
				// 原本有客戶的顯示
				return <span>{record.customer.name}</span>;
			},
		});
	}

	// 添加其他欄位
	columns.push(
		{
			accessorKey: "bankName",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title={t("bankName")} />
			),
		},
		{
			accessorKey: "accountNumber",
			header: ({ column }) => (
				<DataTableColumnHeader
					column={column}
					title={t("accountNumber")}
				/>
			),
		},
		{
			accessorKey: "currency",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title={t("currency")} />
			),
		},
		{
			accessorKey: "status",
			header: ({ column }) => (
				<DataTableColumnHeader
					column={column}
					title={tCommon("status")}
				/>
			),
			cell: ({ row }) => {
				const status = row.getValue("status") as string;
				return status === "active"
					? t("filters.statusActive")
					: t("filters.statusInactive");
			},
		},
	);

	// 添加操作欄位
	if (onEdit) {
		columns.push({
			id: "actions",
			header: tCommon("table.actions"),
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

	return (
		<DataTable
			columns={columns}
			data={bankAccounts}
			searchKey="bankName"
			searchPlaceholder={t("filters.searchPlaceholder")}
		/>
	);
}
