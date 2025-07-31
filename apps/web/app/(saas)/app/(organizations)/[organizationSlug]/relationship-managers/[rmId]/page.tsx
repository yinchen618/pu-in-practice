"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { Button } from "@ui/components/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { Edit2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useQueryState } from "nuqs";
import { useCallback, useEffect, useState } from "react";
import type { ExpenseRecord } from "../../expenses/components/columns";
import type { ProfitSharingRecord } from "../../profit-sharing/components/columns";
import type { RMRecord } from "../components/columns";
import { EditRMDialog } from "../components/edit-rm-dialog";
import { RMBasicInfoCard } from "./components/rm-basic-info-card";
import { RMExpensesTab } from "./components/rm-expenses-tab";
import { RMProfitSharingTab } from "./components/rm-profit-sharing-tab";

export default function RMProfilePage() {
	const t = useTranslations("organization.relationshipManagers");
	const { activeOrganization } = useActiveOrganization();
	const params = useParams();
	const rmId = params.rmId as string;

	// 使用 nuqs 管理分頁狀態
	const [activeTab, setActiveTab] = useQueryState("tab", {
		defaultValue: "profit-sharing",
		parse: (value) => {
			if (["profit-sharing", "expenses"].includes(value)) {
				return value;
			}
			return "profit-sharing";
		},
	});

	const [rmRecord, setRmRecord] = useState<RMRecord | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [editDialogOpen, setEditDialogOpen] = useState(false);

	// 分潤資料狀態
	const [filteredProfitData, setFilteredProfitData] = useState<
		ProfitSharingRecord[]
	>([]);
	const [isProfitLoading, setIsProfitLoading] = useState(true);

	// 支出資料狀態
	const [filteredExpenseData, setFilteredExpenseData] = useState<
		ExpenseRecord[]
	>([]);
	const [isExpenseLoading, setIsExpenseLoading] = useState(true);

	const fetchRMData = useCallback(async () => {
		if (!activeOrganization?.id) {
			return;
		}

		setIsLoading(true);
		try {
			const response = await fetch(
				`/api/organizations/relationship-managers/${rmId}?organizationId=${activeOrganization.id}`,
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
				setRmRecord(result.relationshipManager);
			}
		} catch (error) {
			console.error("獲取 RM 資料失敗:", error);
		} finally {
			setIsLoading(false);
		}
	}, [activeOrganization?.id, rmId]);

	const fetchProfitData = useCallback(async () => {
		if (!activeOrganization?.id) {
			return;
		}

		setIsProfitLoading(true);
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
				const allData = result.data || [];
				// 過濾出該 RM 參與的分潤記錄
				const rmData = allData.filter((record: ProfitSharingRecord) => {
					return (
						record.rm1Id === rmId ||
						record.rm2Id === rmId ||
						record.finder1Id === rmId ||
						record.finder2Id === rmId
					);
				});
				setFilteredProfitData(rmData);
			}
		} catch (error) {
			console.error("獲取分潤記錄失敗:", error);
			setFilteredProfitData([]);
		} finally {
			setIsProfitLoading(false);
		}
	}, [activeOrganization?.id, rmId]);

	const fetchExpenseData = useCallback(async () => {
		if (!activeOrganization?.id) {
			return;
		}

		setIsExpenseLoading(true);
		try {
			const response = await fetch(
				`/api/organizations/expenses?organizationId=${activeOrganization.id}`,
				{
					method: "GET",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
				},
			);

			if (response.ok) {
				const result = await response.json();
				const allData = result.data || [];
				// 過濾出該 RM 的支出記錄
				const rmData = allData.filter(
					(record: ExpenseRecord) => record.rmId === rmId,
				);
				setFilteredExpenseData(rmData);
			}
		} catch (error) {
			console.error("獲取支出記錄失敗:", error);
			setFilteredExpenseData([]);
		} finally {
			setIsExpenseLoading(false);
		}
	}, [activeOrganization?.id, rmId]);

	const handleEditSuccess = useCallback(() => {
		fetchRMData();
		setEditDialogOpen(false);
	}, [fetchRMData]);

	useEffect(() => {
		if (activeOrganization?.id) {
			fetchRMData();
			fetchProfitData();
			fetchExpenseData();
		}
	}, [
		activeOrganization?.id,
		fetchRMData,
		fetchProfitData,
		fetchExpenseData,
	]);

	if (isLoading || !rmRecord) {
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
				title={rmRecord?.name || ""}
				subtitle={`${t("table.email")}: ${rmRecord?.email || ""}`}
				actions={
					<Button onClick={() => setEditDialogOpen(true)}>
						<Edit2 className="mr-2 size-4" />
						{t("editData")}
					</Button>
				}
			/>

			<div className="grid gap-6">
				<RMBasicInfoCard rmRecord={rmRecord} />

				<Tabs
					value={activeTab}
					onValueChange={setActiveTab}
					className="w-full"
				>
					<TabsList>
						<TabsTrigger value="profit-sharing">
							{t("profitSharing")}
						</TabsTrigger>
						<TabsTrigger value="expenses">
							{t("expenses")}
						</TabsTrigger>
					</TabsList>

					<TabsContent value="profit-sharing">
						<RMProfitSharingTab
							filteredProfitData={filteredProfitData}
							isProfitLoading={isProfitLoading}
							organizationSlug={params.organizationSlug as string}
						/>
					</TabsContent>

					<TabsContent value="expenses">
						<RMExpensesTab
							filteredExpenseData={filteredExpenseData}
							isExpenseLoading={isExpenseLoading}
						/>
					</TabsContent>
				</Tabs>
			</div>

			{rmRecord && (
				<EditRMDialog
					rmRecord={rmRecord}
					open={editDialogOpen}
					onOpenChange={setEditDialogOpen}
					onSuccess={handleEditSuccess}
				/>
			)}
		</div>
	);
}
