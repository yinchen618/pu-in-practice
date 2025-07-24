import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { BankAccountsTable } from "../../../bank-accounts/components/bank-accounts-table";
import type { BankAccountRecord } from "../../../bank-accounts/components/columns";
import { CreateBankAccountDialog } from "../../../bank-accounts/components/create-bank-account-dialog";
import { EditBankAccountDialog } from "../../../bank-accounts/components/edit-bank-account-dialog";

interface Props {
	bankAccounts: BankAccountRecord[];
	isLoading: boolean;
	onEdit: (record: BankAccountRecord) => void;
	onCreate: () => void;
	activeOrganizationId: string;
	customerId: string;
	customerCode: string;
	customerName: string;
	editDialogOpen: boolean;
	setEditDialogOpen: (open: boolean) => void;
	editBankAccount: BankAccountRecord | null;
	onEditSuccess: () => void;
}

export function CustomerBankAccountsTab({
	bankAccounts,
	isLoading,
	onEdit,
	onCreate,
	activeOrganizationId,
	customerId,
	customerCode,
	customerName,
	editDialogOpen,
	setEditDialogOpen,
	editBankAccount,
	onEditSuccess,
}: Props) {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle>銀行帳戶</CardTitle>
				{activeOrganizationId && (
					<CreateBankAccountDialog
						onSuccess={onCreate}
						organizationId={activeOrganizationId}
						customerId={customerId}
						customerCode={customerCode}
						dialogTitle="新增銀行帳戶"
					/>
				)}
			</CardHeader>
			<CardContent className="pt-6">
				<BankAccountsTable
					bankAccounts={bankAccounts}
					onEdit={onEdit}
					customerId={customerId}
				/>
			</CardContent>
			{editBankAccount && (
				<EditBankAccountDialog
					bankAccountRecord={editBankAccount}
					open={editDialogOpen}
					onOpenChange={setEditDialogOpen}
					onSuccess={onEditSuccess}
					customerCode={customerCode}
					customerName={customerName}
					dialogTitle="編輯銀行帳戶"
				/>
			)}
		</Card>
	);
}
