"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { DataTable } from "@saas/shared/components/DataTable";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import type { ExpenseRecord } from "./components/columns";
import { createColumns } from "./components/columns";
import { CreateExpenseDialog } from "./components/create-expense-dialog";
import { EditExpenseDialog } from "./components/edit-expense-dialog";
import {
	ExpenseFilters,
	type ExpenseFilters as ExpenseFiltersType,
} from "./components/expense-filters";
import { ExpenseSummaryTable } from "./components/expense-summary-table";

interface RelationshipManager {
	id: string;
	name: string;
	category: "RM" | "FINDER" | "BOTH";
}

export default function ExpensesPage() {
	const t = useTranslations("organization.expenses");
	const tTable = useTranslations("organization.expenses.table");
	const { activeOrganization, loaded } = useActiveOrganization();
	const [allData, setAllData] = useState<ExpenseRecord[]>([]);
	const [filteredData, setFilteredData] = useState<ExpenseRecord[]>([]);
	const [relationshipManagers, setRelationshipManagers] = useState<
		RelationshipManager[]
	>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(
		null,
	);
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [currentFilters, setCurrentFilters] = useState<ExpenseFiltersType>(
		{},
	);

	const fetchData = async () => {
		if (!activeOrganization?.id) {
			return;
		}

		setIsLoading(true);
		try {
			const response = await fetch(
				`/api/organizations/expenses?organizationId=${activeOrganization.id}`,
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
				const expenses = result.expenses || [];
				setAllData(expenses);
				setFilteredData(expenses);
				setRelationshipManagers(result.relationshipManagers || []);
			} else {
				console.error(t("form.updateFailed"), await response.text());
				setAllData([]);
				setFilteredData([]);
				setRelationshipManagers([]);
			}
		} catch (error) {
			console.error(t("form.fetchDataFailed"), error);
			setAllData([]);
			setFilteredData([]);
			setRelationshipManagers([]);
		} finally {
			setIsLoading(false);
		}
	};

	const handleEdit = (expenseRecord: ExpenseRecord) => {
		setEditingExpense(expenseRecord);
		setEditDialogOpen(true);
	};

	const handleEditSuccess = () => {
		fetchData();
		setEditingExpense(null);
	};

	const handleFilterChange = (newFilteredData: ExpenseRecord[]) => {
		setFilteredData(newFilteredData);
	};

	const handleFiltersChange = (filters: ExpenseFiltersType) => {
		setCurrentFilters(filters);
	};

	// 新增 columns，傳入編輯函數
	const columns = createColumns(handleEdit, tTable);

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
				title={t("title")}
				subtitle={t("subtitle")}
				actions={
					activeOrganization && (
						<CreateExpenseDialog
							organizationId={activeOrganization.id}
							relationshipManagers={relationshipManagers}
							onSuccess={fetchData}
						/>
					)
				}
			/>

			{/* 篩選器組件 */}
			<ExpenseFilters
				data={allData}
				onFilterChange={handleFilterChange}
				onFiltersChange={handleFiltersChange}
			/>

			<DataTable
				columns={columns}
				data={filteredData}
				isLoading={isLoading}
				searchableColumns={[]} // 禁用內建搜尋，使用自定義篩選器
			/>

			{/* 支出統計表格 */}
			<ExpenseSummaryTable data={filteredData} />

			{editingExpense && (
				<EditExpenseDialog
					expenseRecord={editingExpense}
					relationshipManagers={relationshipManagers}
					open={editDialogOpen}
					onOpenChange={setEditDialogOpen}
					onSuccess={handleEditSuccess}
				/>
			)}
		</div>
	);
}
