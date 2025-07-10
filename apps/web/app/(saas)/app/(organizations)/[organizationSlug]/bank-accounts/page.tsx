"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { DataTable } from "@saas/shared/components/DataTable";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { useEffect, useState } from "react";
import {
	BankAccountFilters,
	type BankAccountFilters as BankAccountFiltersType,
} from "./components/bank-account-filters";
import type { BankAccountRecord } from "./components/columns";
import { createColumns } from "./components/columns";
import { CreateBankAccountDialog } from "./components/create-bank-account-dialog";
import { EditBankAccountDialog } from "./components/edit-bank-account-dialog";

export default function BankAccountsPage() {
	const { activeOrganization, loaded } = useActiveOrganization();
	const [allData, setAllData] = useState<BankAccountRecord[]>([]);
	const [filteredData, setFilteredData] = useState<BankAccountRecord[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [editingBankAccount, setEditingBankAccount] =
		useState<BankAccountRecord | null>(null);
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [currentFilters, setCurrentFilters] =
		useState<BankAccountFiltersType>({});

	const fetchData = async () => {
		if (!activeOrganization?.id) return;

		setIsLoading(true);
		try {
			const response = await fetch(
				`/api/organizations/bank-accounts?organizationId=${activeOrganization.id}`,
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
				const bankAccounts = result.data || [];
				setAllData(bankAccounts);
				setFilteredData(bankAccounts);
			} else {
				console.error("獲取銀行帳戶數據失敗", await response.text());
				setAllData([]);
				setFilteredData([]);
			}
		} catch (error) {
			console.error("獲取數據失敗:", error);
			setAllData([]);
			setFilteredData([]);
		} finally {
			setIsLoading(false);
		}
	};

	const handleEdit = (bankAccountRecord: BankAccountRecord) => {
		setEditingBankAccount(bankAccountRecord);
		setEditDialogOpen(true);
	};

	const handleEditSuccess = () => {
		fetchData();
		setEditingBankAccount(null);
	};

	const handleFilterChange = (newFilteredData: BankAccountRecord[]) => {
		setFilteredData(newFilteredData);
	};

	const handleFiltersChange = (filters: BankAccountFiltersType) => {
		setCurrentFilters(filters);
	};

	// 新增 columns，傳入編輯函數
	const columns = createColumns(handleEdit);

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
		<div className="container max-w-6xl space-y-8 py-6">
			<PageHeader
				title="銀行帳戶列表"
				subtitle="管理所有銀行帳戶"
				actions={
					activeOrganization && (
						<CreateBankAccountDialog
							organizationId={activeOrganization.id}
							onSuccess={fetchData}
						/>
					)
				}
			/>

			{/* 篩選器組件 */}
			<BankAccountFilters
				data={allData}
				onFilterChange={handleFilterChange}
				onFiltersChange={handleFiltersChange}
			/>

			<DataTable
				columns={columns}
				data={filteredData}
				isLoading={isLoading}
			/>

			{editingBankAccount && (
				<EditBankAccountDialog
					bankAccountRecord={editingBankAccount}
					open={editDialogOpen}
					onOpenChange={setEditDialogOpen}
					onSuccess={handleEditSuccess}
				/>
			)}
		</div>
	);
}
