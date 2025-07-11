"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { DataTable } from "@saas/shared/components/DataTable";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { useEffect, useState } from "react";
import type { ProfitSharingRecord } from "./components/columns";
import { createColumns } from "./components/columns";
import { CreateProfitSharingDialog } from "./components/create-profit-sharing-dialog";
import { EditProfitSharingDialog } from "./components/edit-profit-sharing-dialog";
import { ProfitSharingFilters } from "./components/profit-sharing-filters";
import type { ProfitSharingFilters as ProfitSharingFiltersType } from "./components/profit-sharing-filters";

// 格式化函數
const formatCurrency = (value: number, currency: string) => {
	return `${currency} ${value.toLocaleString("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})}`;
};

// 新增：統計所有 RM/Finder 的分潤金額與佔比
function aggregatePersonProfits(
	data: ProfitSharingRecord[],
	personType: "rm" | "finder",
) {
	const personMap: Record<string, { name: string; profit: number }> = {};
	let total = 0;
	for (const record of data) {
		if (personType === "rm") {
			if (record.rm1Name && record.rm1ProfitSharePercent) {
				const profit =
					(record.rmRevenueUSD || 0) *
					(record.rm1ProfitSharePercent / 100);
				personMap[record.rm1Name] = personMap[record.rm1Name]
					? {
							name: record.rm1Name,
							profit: personMap[record.rm1Name].profit + profit,
						}
					: { name: record.rm1Name, profit };
				total += profit;
			}
			if (record.rm2Name && record.rm2ProfitSharePercent) {
				const profit =
					(record.rmRevenueUSD || 0) *
					(record.rm2ProfitSharePercent / 100);
				personMap[record.rm2Name] = personMap[record.rm2Name]
					? {
							name: record.rm2Name,
							profit: personMap[record.rm2Name].profit + profit,
						}
					: { name: record.rm2Name, profit };
				total += profit;
			}
		} else if (personType === "finder") {
			if (record.finder1Name && record.finder1ProfitSharePercent) {
				const profit =
					(record.findersRevenueUSD || 0) *
					(record.finder1ProfitSharePercent / 100);
				personMap[record.finder1Name] = personMap[record.finder1Name]
					? {
							name: record.finder1Name,
							profit:
								personMap[record.finder1Name].profit + profit,
						}
					: { name: record.finder1Name, profit };
				total += profit;
			}
			if (record.finder2Name && record.finder2ProfitSharePercent) {
				const profit =
					(record.findersRevenueUSD || 0) *
					(record.finder2ProfitSharePercent / 100);
				personMap[record.finder2Name] = personMap[record.finder2Name]
					? {
							name: record.finder2Name,
							profit:
								personMap[record.finder2Name].profit + profit,
						}
					: { name: record.finder2Name, profit };
				total += profit;
			}
		}
	}
	const persons = Object.values(personMap).sort(
		(a, b) => b.profit - a.profit,
	);

	return { persons, total };
}

export default function ProfitSharingPage() {
	const { activeOrganization, loaded } = useActiveOrganization();
	const [allData, setAllData] = useState<ProfitSharingRecord[]>([]);
	const [filteredData, setFilteredData] = useState<ProfitSharingRecord[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [editingRecord, setEditingRecord] =
		useState<ProfitSharingRecord | null>(null);
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [currentFilters, setCurrentFilters] =
		useState<ProfitSharingFiltersType>({});

	// 計算統計數據
	const calculateStats = (data: ProfitSharingRecord[]) => {
		const stats = {
			totalShareable: 0,
			totalCompanyProfit: 0,
			totalRMProfit: 0,
			totalFinderProfit: 0,
		};

		data.forEach((record) => {
			// 將原幣金額轉換為美元
			const fxRate = record.fxRate || 1;

			// Shareable 總計（原幣轉美元）
			stats.totalShareable += (record.shareable || 0) * fxRate;

			// Company分潤總計（原幣轉美元）
			stats.totalCompanyProfit +=
				(record.companyRevenueOriginal || 0) * fxRate;

			// RM分潤總計（美金）
			stats.totalRMProfit += record.rmRevenueUSD || 0;

			// Finder分潤總計（美金）
			stats.totalFinderProfit += record.findersRevenueUSD || 0;
		});

		return stats;
	};

	const stats = calculateStats(filteredData);
	const rmStats = aggregatePersonProfits(filteredData, "rm");
	const finderStats = aggregatePersonProfits(filteredData, "finder");

	const fetchData = async () => {
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
	};

	const handleEdit = (record: ProfitSharingRecord) => {
		setEditingRecord(record);
		setEditDialogOpen(true);
	};

	const handleEditSuccess = () => {
		fetchData();
		setEditingRecord(null);
	};

	const handleFilterChange = (newFilteredData: ProfitSharingRecord[]) => {
		setFilteredData(newFilteredData);
	};

	const handleFiltersChange = (filters: ProfitSharingFiltersType) => {
		setCurrentFilters(filters);
	};

	const columns = createColumns(handleEdit);

	useEffect(() => {
		if (activeOrganization?.id && loaded) {
			fetchData();
		}
	}, [activeOrganization?.id, loaded]);

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
				onFiltersChange={handleFiltersChange}
			/>

			{/* 統計卡片 */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card className="text-primary">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Shareable 總計
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{formatCurrency(stats.totalShareable, "USD")}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Company分潤總計
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{formatCurrency(stats.totalCompanyProfit, "USD")}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							RM分潤總計
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{formatCurrency(stats.totalRMProfit, "USD")}
						</div>
						{/* RM 分潤明細列表 */}
						{rmStats.persons.length > 0 && (
							<div className="mt-4 space-y-2">
								{rmStats.persons.map((p) => (
									<div
										key={p.name}
										className="flex items-center justify-between text-sm"
									>
										<span>{p.name}</span>
										<span className="font-mono">
											{formatCurrency(p.profit, "USD")}（
											{(
												(p.profit /
													(rmStats.total || 1)) *
												100
											).toFixed(2)}
											%）
										</span>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Finder分潤總計
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{formatCurrency(stats.totalFinderProfit, "USD")}
						</div>
						{/* Finder 分潤明細列表 */}
						{finderStats.persons.length > 0 && (
							<div className="mt-4 space-y-2">
								{finderStats.persons.map((p) => (
									<div
										key={p.name}
										className="flex items-center justify-between text-sm"
									>
										<span>{p.name}</span>
										<span className="font-mono">
											{formatCurrency(p.profit, "USD")}（
											{(
												(p.profit /
													(finderStats.total || 1)) *
												100
											).toFixed(2)}
											%）
										</span>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			<DataTable
				columns={columns}
				data={filteredData}
				isLoading={isLoading}
			/>

			{editingRecord && (
				<EditProfitSharingDialog
					record={editingRecord}
					open={editDialogOpen}
					onOpenChange={setEditDialogOpen}
					onSuccess={handleEditSuccess}
				/>
			)}
		</div>
	);
}
