"use client";

import { DataTable } from "@saas/shared/components/DataTable";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { ProfitSharingRecord } from "../../../profit-sharing/components/columns";
import { createColumns } from "../../../profit-sharing/components/columns";

interface RMProfitSharingTabProps {
	filteredProfitData: ProfitSharingRecord[];
	isProfitLoading: boolean;
	organizationSlug: string;
}

export function RMProfitSharingTab({
	filteredProfitData,
	isProfitLoading,
	organizationSlug,
}: RMProfitSharingTabProps) {
	const t = useTranslations("organization.profitSharing");

	// 資料已經在父組件中過濾，直接使用
	const rmFilteredData = filteredProfitData;

	const columns = useMemo(() => {
		const allColumns = createColumns(
			() => {}, // 不需要編輯功能
			organizationSlug,
			(key: string) => t(key),
		);

		// 移除客戶相關欄位，因為這是 RM 的個人頁面
		return allColumns.filter(
			(col) =>
				(col as any).accessorKey !== "customerName" &&
				(col as any).accessorKey !== "customerCode" &&
				(col as any).id !== "customerName" &&
				(col as any).id !== "customerCode",
		);
	}, [organizationSlug, t]);

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h3 className="text-lg font-semibold">
					{t("title")} ({rmFilteredData.length})
				</h3>
			</div>

			<DataTable
				columns={columns}
				data={rmFilteredData}
				isLoading={isProfitLoading}
				searchableColumns={[]}
				showDownloadOptions={true}
				filename="rm-profit-sharing-data"
			/>
		</div>
	);
}
