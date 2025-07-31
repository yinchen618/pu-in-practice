"use client";

import { DataTable } from "@saas/shared/components/DataTable";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { ExpenseRecord } from "../../../expenses/components/columns";
import { createColumns } from "../../../expenses/components/columns";

interface RMExpensesTabProps {
	filteredExpenseData: ExpenseRecord[];
	isExpenseLoading: boolean;
}

export function RMExpensesTab({
	filteredExpenseData,
	isExpenseLoading,
}: RMExpensesTabProps) {
	const t = useTranslations("organization.expenses");

	// 資料已經在父組件中過濾，直接使用
	const rmFilteredExpenseData = filteredExpenseData;

	const columns = useMemo(() => {
		return createColumns(
			() => {}, // 不需要編輯功能
			(key: string) => t(key),
		);
	}, [t]);

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h3 className="text-lg font-semibold">
					{t("title")} ({rmFilteredExpenseData.length})
				</h3>
			</div>

			<DataTable
				columns={columns}
				data={rmFilteredExpenseData}
				isLoading={isExpenseLoading}
				searchableColumns={[]}
				showDownloadOptions={true}
				filename="rm-expenses-data"
			/>
		</div>
	);
}
