"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { DataTable } from "@saas/shared/components/DataTable";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { useEffect, useState } from "react";
import { createColumns } from "./components/columns";
import type { RMRecord } from "./components/columns";
import { CreateRMDialog } from "./components/create-rm-dialog";
import { EditRMDialog } from "./components/edit-rm-dialog";

export default function RelationshipManagersPage() {
	const { activeOrganization, loaded } = useActiveOrganization();
	const [data, setData] = useState<RMRecord[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [editingRM, setEditingRM] = useState<RMRecord | null>(null);
	const [editDialogOpen, setEditDialogOpen] = useState(false);

	const fetchData = async () => {
		if (!activeOrganization?.id) return;

		setIsLoading(true);
		try {
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

			if (response.ok) {
				const result = await response.json();
				setData(result.relationshipManagers || []);
			} else {
				console.error("獲取 RM 數據失敗", await response.text());
				setData([]);
			}
		} catch (error) {
			console.error("獲取數據失敗:", error);
			setData([]);
		} finally {
			setIsLoading(false);
		}
	};

	const handleEdit = (rmRecord: RMRecord) => {
		setEditingRM(rmRecord);
		setEditDialogOpen(true);
	};

	const handleEditSuccess = () => {
		fetchData();
		setEditingRM(null);
	};

	// 創建 columns，傳入編輯函數
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
				title="RM 列表"
				subtitle="管理所有客戶關係經理"
				actions={
					activeOrganization && (
						<CreateRMDialog
							organizationId={activeOrganization.id}
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
				searchPlaceholder="搜尋 RM 名稱"
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
