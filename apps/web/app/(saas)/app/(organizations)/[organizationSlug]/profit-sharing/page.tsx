"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { DataTable } from "@saas/shared/components/DataTable";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ProfitSharingRecord } from "./components/columns";
import { createColumns } from "./components/columns";
import { CreateProfitSharingDialog } from "./components/create-profit-sharing-dialog";
import { EditProfitSharingDialog } from "./components/edit-profit-sharing-dialog";
import { ProfitSharingFilters } from "./components/profit-sharing-filters";
import { ProfitStatsCards } from "./components/profit-stats-cards";

export default function ProfitSharingPage() {
	const { activeOrganization, loaded } = useActiveOrganization();
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

	const handleFilterChange = (newFilteredData: ProfitSharingRecord[]) => {
		setFilteredData(newFilteredData);
	};

	const columns = useMemo(() => createColumns(handleEdit), [handleEdit]);

	useEffect(() => {
		if (activeOrganization?.id && loaded) {
			fetchData();
		}
	}, [activeOrganization?.id, loaded, fetchData]);

	if (!loaded) {
		return <div className="container py-6">載入中...</div>;
	}

	return (
		<div className="space-y-8 py-6">
			<PageHeader
				title="分潤記錄"
				subtitle="管理所有分潤記錄"
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
