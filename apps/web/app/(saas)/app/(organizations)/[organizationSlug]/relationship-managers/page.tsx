"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { DataTable } from "@saas/shared/components/DataTable";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createColumns } from "./components/columns";
import type { RMRecord } from "./components/columns";
import { CreateRMDialog } from "./components/create-rm-dialog";
import { EditRMDialog } from "./components/edit-rm-dialog";
import {
	RMFilters,
	type RMFilters as RMFiltersType,
} from "./components/rm-filters";

export default function RelationshipManagersPage() {
	const t = useTranslations("organization.relationshipManagers");
	const { activeOrganization, loaded } = useActiveOrganization();
	const params = useParams();
	const [allData, setAllData] = useState<RMRecord[]>([]);
	const [filteredData, setFilteredData] = useState<RMRecord[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [editingRM, setEditingRM] = useState<RMRecord | null>(null);
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [currentFilters, setCurrentFilters] = useState<RMFiltersType>({});
	const [error, setError] = useState<string | null>(null);

	const fetchData = async () => {
		if (!activeOrganization?.id) {
			return;
		}

		setIsLoading(true);
		setError(null);
		try {
			console.log("正在獲取 RM 資料...", activeOrganization.id);
			const response = await fetch(
				`/api/organizations/relationship-managers?organizationId=${activeOrganization.id}`,
				{
					method: "GET",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
					},
				},
			);

			console.log("API 回應狀態:", response.status);

			if (response.ok) {
				const result = await response.json();
				console.log("API 回應資料:", result);
				const data = result.relationshipManagers || [];
				setAllData(data);
				setFilteredData(data);
			} else {
				const errorText = await response.text();
				console.error("獲取 RM 數據失敗", errorText);
				setError(`API 錯誤: ${response.status} - ${errorText}`);
				setAllData([]);
				setFilteredData([]);
			}
		} catch (error) {
			console.error("獲取數據失敗:", error);
			setError(
				`網路錯誤: ${error instanceof Error ? error.message : "未知錯誤"}`,
			);
			setAllData([]);
			setFilteredData([]);
		} finally {
			setIsLoading(false);
		}
	};

	const handleFilterChange = (newFilteredData: RMRecord[]) => {
		setFilteredData(newFilteredData);
	};

	const handleFiltersChange = (filters: RMFiltersType) => {
		setCurrentFilters(filters);
	};

	const handleEdit = (rmRecord: RMRecord) => {
		setEditingRM(rmRecord);
		setEditDialogOpen(true);
	};

	const handleEditSuccess = () => {
		fetchData();
		setEditingRM(null);
	};

	// 新增 columns，傳入編輯函數和翻譯函數
	const columns = createColumns(
		handleEdit,
		{
			table: (key: string) => t(`table.${key}`),
			category: (key: string) => t(`category.${key}`),
			statusLabels: (key: string) => t(`statusLabels.${key}`),
		},
		params.organizationSlug as string,
	);

	useEffect(() => {
		if (activeOrganization?.id && loaded) {
			fetchData();
		}
	}, [activeOrganization?.id, loaded]);

	if (!loaded) {
		return (
			<div className="container max-w-6xl space-y-8 py-6">
				<div className="animate-pulse">
					<div className="h-8 bg-muted rounded w-1/4 mb-2" />
					<div className="h-4 bg-muted rounded w-1/2" />
				</div>
			</div>
		);
	}

	return (
		<div className="container max-w-6xl space-y-8 py-6">
			<PageHeader
				title={t("title")}
				subtitle={t("subtitle")}
				actions={
					activeOrganization && (
						<CreateRMDialog
							organizationId={activeOrganization.id}
							onSuccess={fetchData}
						/>
					)
				}
			/>

			{/* 錯誤狀態顯示 */}
			{error && (
				<div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
					<p className="text-destructive">
						{t("error")}: {error}
					</p>
					<button
						type="button"
						onClick={fetchData}
						className="mt-2 px-4 py-2 bg-destructive/20 text-destructive rounded hover:bg-destructive/30"
					>
						{t("retry")}
					</button>
				</div>
			)}
			{/* 篩選器組件 */}
			<RMFilters
				data={allData}
				onFilterChange={handleFilterChange}
				onFiltersChange={handleFiltersChange}
			/>

			<DataTable
				columns={columns}
				data={filteredData}
				isLoading={isLoading}
				searchableColumns={[]} // 禁用內建搜尋，使用自定義篩選器
				showDownloadOptions={true}
				filename="relationship-managers-data"
			/>

			{editingRM && (
				<EditRMDialog
					rmRecord={editingRM}
					open={editDialogOpen}
					onOpenChange={setEditDialogOpen}
					onSuccess={handleEditSuccess}
				/>
			)}
		</div>
	);
}
