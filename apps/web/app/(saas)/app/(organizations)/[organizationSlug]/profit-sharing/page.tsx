"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { DataTable } from "@saas/shared/components/DataTable";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ProfitSharingRecord } from "./components/columns";
import { createColumns } from "./components/columns";
import { CreateProfitSharingDialog } from "./components/create-profit-sharing-dialog";
import { EditProfitSharingDialog } from "./components/edit-profit-sharing-dialog";
import { ProfitSharingFilters } from "./components/profit-sharing-filters";
import { ProfitStatsCards } from "./components/profit-stats-cards";

export default function ProfitSharingPage() {
	const t = useTranslations("organization.profitSharing");
	const { activeOrganization, loaded } = useActiveOrganization();
	const params = useParams();
	const organizationSlug = params.organizationSlug as string;
	const [allData, setAllData] = useState<ProfitSharingRecord[]>([]);
	const [filteredData, setFilteredData] = useState<ProfitSharingRecord[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [editingRecord, setEditingRecord] =
		useState<ProfitSharingRecord | null>(null);
	const [editDialogOpen, setEditDialogOpen] = useState(false);

	const fetchData = useCallback(async () => {
		if (!activeOrganization?.id) {
			return;
		}

		setIsLoading(true);
		try {
			const response = await fetch(
				`/api/organizations/profit-sharing?organizationId=${activeOrganization.id}`,
				{
					method: "GET",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
				},
			);

			if (response.ok) {
				const result = await response.json();
				setAllData(result.data || []);
				setFilteredData(result.data || []);
			}
		} catch (error) {
			console.error("獲取分潤記錄失敗:", error);
			setAllData([]);
			setFilteredData([]);
		} finally {
			setIsLoading(false);
		}
	}, [activeOrganization?.id]);

	const handleEdit = useCallback((record: ProfitSharingRecord) => {
		setEditingRecord(record);
		setEditDialogOpen(true);
	}, []);

	const handleEditSuccess = useCallback(() => {
		fetchData();
		setEditingRecord(null);
	}, [fetchData]);

	const handleFilterChange = useCallback(
		(newFilteredData: ProfitSharingRecord[]) => {
			setFilteredData(newFilteredData);
		},
		[],
	);

	const columns = useMemo(
		() =>
			createColumns(handleEdit, organizationSlug, (key: string) =>
				t(key),
			),
		[handleEdit, organizationSlug, t],
	);

	useEffect(() => {
		if (activeOrganization?.id && loaded) {
			fetchData();
		}
	}, [activeOrganization?.id, loaded, fetchData]);

	if (!loaded) {
		return (
			<div className="container py-6">
				{t("loading", { ns: "organization.common" })}
			</div>
		);
	}

	return (
		<div className="space-y-8 py-6">
			<PageHeader
				title={t("title")}
				subtitle={t("subtitle")}
				actions={
					activeOrganization && (
						<CreateProfitSharingDialog
							organizationId={activeOrganization.id}
							onSuccess={fetchData}
						/>
					)
				}
			/>

			<ProfitSharingFilters
				data={allData}
				onFilterChange={handleFilterChange}
			/>

			{/* 統計卡片 */}
			<ProfitStatsCards data={allData} />

			<DataTable
				columns={columns}
				data={filteredData}
				isLoading={isLoading}
				searchableColumns={[]} // 禁用內建搜尋，使用自定義篩選器
			/>

			{editingRecord && activeOrganization && (
				<EditProfitSharingDialog
					data={editingRecord}
					organizationId={activeOrganization.id}
					open={editDialogOpen}
					onOpenChange={setEditDialogOpen}
					onSuccess={handleEditSuccess}
				/>
			)}
		</div>
	);
}
