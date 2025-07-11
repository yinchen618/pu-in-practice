"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { DataTable } from "@saas/shared/components/DataTable";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { useEffect, useState } from "react";
import type { BankAccountRecord } from "../bank-accounts/components/columns";
import { EditBankAccountDialog } from "../bank-accounts/components/edit-bank-account-dialog";
import { createColumns } from "./components/columns";
import type { CustomerRecord } from "./components/columns";
import { CreateCustomerDialog } from "./components/create-customer-dialog";
import type { CustomerFilters as CustomerFiltersType } from "./components/customer-filters";
import { EditCustomerDialog } from "./components/edit-customer-dialog";

interface RelationshipManager {
	id: string;
	name: string;
	category: "RM" | "FINDER" | "BOTH";
}

export default function CustomersPage() {
	const { activeOrganization, loaded } = useActiveOrganization();
	const [data, setData] = useState<CustomerRecord[]>([]);
	const [filteredData, setFilteredData] = useState<CustomerRecord[]>([]);
	const [relationshipManagers, setRelationshipManagers] = useState<
		RelationshipManager[]
	>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [editingCustomer, setEditingCustomer] =
		useState<CustomerRecord | null>(null);
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [currentFilters, setCurrentFilters] = useState<CustomerFiltersType>(
		{},
	);

	// 銀行帳戶相關狀態
	const [editingBankAccount, setEditingBankAccount] =
		useState<BankAccountRecord | null>(null);
	const [editBankAccountDialogOpen, setEditBankAccountDialogOpen] =
		useState(false);

	const fetchData = async () => {
		if (!activeOrganization?.id) {
			return;
		}

		setIsLoading(true);
		try {
			const response = await fetch(
				`/api/organizations/customers?organizationId=${activeOrganization.id}`,
				{
					method: "GET",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
					},
				},
			);

			if (response.ok) {
				const result = await response.json();
				const customers = result.customers || [];
				setData(customers);
				setFilteredData(customers);
				setRelationshipManagers(result.relationshipManagers || []);
			} else {
				console.error("獲取客戶數據失敗", await response.text());
				setData([]);
				setFilteredData([]);
				setRelationshipManagers([]);
			}
		} catch (error) {
			console.error("獲取數據失敗:", error);
			setData([]);
			setFilteredData([]);
			setRelationshipManagers([]);
		} finally {
			setIsLoading(false);
		}
	};

	const handleEdit = (customerRecord: CustomerRecord) => {
		setEditingCustomer(customerRecord);
		setEditDialogOpen(true);
	};

	const handleEditSuccess = () => {
		fetchData();
		setEditingCustomer(null);
	};

	const handleFilterChange = (newFilteredData: CustomerRecord[]) => {
		setFilteredData(newFilteredData);
	};

	const handleFiltersChange = (filters: CustomerFiltersType) => {
		setCurrentFilters(filters);
	};

	// 銀行帳戶編輯處理
	const handleEditBankAccount = (bankAccountRecord: BankAccountRecord) => {
		setEditingBankAccount(bankAccountRecord);
		setEditBankAccountDialogOpen(true);
	};

	const handleEditBankAccountSuccess = () => {
		fetchData();
		setEditingBankAccount(null);
	};

	// 新增 columns，傳入編輯函數
	const columns = createColumns(handleEdit, handleEditBankAccount);

	useEffect(() => {
		if (activeOrganization?.id && loaded) {
			fetchData();
		}
	}, [activeOrganization?.id, loaded]);

	if (!loaded) {
		return (
			<div className="container max-w-6xl space-y-8 py-6">
				<div className="animate-pulse">
					<div className="h-8 bg-gray-200 rounded w-1/4 mb-2" />
					<div className="h-4 bg-gray-200 rounded w-1/2" />
				</div>
			</div>
		);
	}

	return (
		<div className="container space-y-8 py-6">
			<PageHeader
				title="客戶列表"
				subtitle="管理所有客戶"
				actions={
					activeOrganization && (
						<CreateCustomerDialog
							organizationId={activeOrganization.id}
							relationshipManagers={relationshipManagers}
							onSuccess={fetchData}
						/>
					)
				}
			/>

			<DataTable
				columns={columns}
				data={data}
				isLoading={isLoading}
				searchKey="name"
				searchPlaceholder="搜尋客戶名稱"
			/>

			{editingCustomer && (
				<EditCustomerDialog
					customerRecord={editingCustomer}
					relationshipManagers={relationshipManagers}
					open={editDialogOpen}
					onOpenChange={setEditDialogOpen}
					onSuccess={handleEditSuccess}
				/>
			)}

			{editingBankAccount && (
				<EditBankAccountDialog
					bankAccountRecord={editingBankAccount}
					open={editBankAccountDialogOpen}
					onOpenChange={setEditBankAccountDialogOpen}
					onSuccess={handleEditBankAccountSuccess}
					customerCode={
						data.find((c) => c.id === editingBankAccount.customerId)
							?.code
					}
					customerName={
						data.find((c) => c.id === editingBankAccount.customerId)
							?.name
					}
				/>
			)}
		</div>
	);
}
