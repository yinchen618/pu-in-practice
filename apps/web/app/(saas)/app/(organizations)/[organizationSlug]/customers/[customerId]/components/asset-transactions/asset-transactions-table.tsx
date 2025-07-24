"use client";

import { DataTable } from "@saas/shared/components/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { useEffect, useState } from "react";
import { BalanceSummary } from "./balance-summary";
import type { AssetTransactionRecord } from "./columns";
import { createColumns } from "./columns";
import { CreateAssetTransactionDialog } from "./create-asset-transaction-dialog";
import { EditAssetTransactionDialog } from "./edit-asset-transaction-dialog";

interface AssetTransactionsTableProps {
	customerId: string;
}

export function AssetTransactionsTable({
	customerId,
}: AssetTransactionsTableProps) {
	const [data, setData] = useState<AssetTransactionRecord[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [editingRecord, setEditingRecord] =
		useState<AssetTransactionRecord | null>(null);
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [balances, setBalances] = useState<any[]>([]); // Changed from CurrencyBalance[] to any[]

	const calculateBalances = (transactions: AssetTransactionRecord[]) => {
		const currencyMap = new Map<string, any>(); // Changed from CurrencyBalance to any

		transactions.forEach((transaction) => {
			const { currency, type, amount } = transaction;

			if (!currencyMap.has(currency)) {
				currencyMap.set(currency, {
					currency,
					balance: 0,
					inAmount: 0,
					outAmount: 0,
				});
			}

			const currencyData = currencyMap.get(currency);
			if (!currencyData) {
				return null;
			}

			if (type === "IN") {
				currencyData.inAmount += amount;
				currencyData.balance += amount;
			} else {
				currencyData.outAmount += amount;
				currencyData.balance -= amount;
			}
		});

		return Array.from(currencyMap.values()).sort((a, b) =>
			a.currency.localeCompare(b.currency),
		);
	};

	const fetchData = async () => {
		setIsLoading(true);
		try {
			const response = await fetch(
				`/api/organizations/asset-transactions?customerId=${customerId}`,
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
				const transactions = result.data || [];
				setData(transactions);
				setBalances(calculateBalances(transactions));
			}
		} catch (error) {
			console.error("獲取資產交易數據失敗:", error);
			setData([]);
			setBalances([]);
		} finally {
			setIsLoading(false);
		}
	};

	const handleEdit = (record: AssetTransactionRecord) => {
		setEditingRecord(record);
		setEditDialogOpen(true);
	};

	const handleEditSuccess = () => {
		fetchData();
		setEditingRecord(null);
	};

	const columns = createColumns(handleEdit);

	useEffect(() => {
		if (customerId) {
			fetchData();
		}
	}, [customerId]);

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle>資產總表</CardTitle>
				<CreateAssetTransactionDialog
					customerId={customerId}
					onSuccess={fetchData}
				/>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* 結餘統計 */}
				<BalanceSummary balances={balances} isLoading={isLoading} />
				{/* 交易記錄表格 */}
				<div className="space-y-2">
					<h3 className="text-sm font-medium text-gray-700">
						交易記錄
					</h3>
					<DataTable
						columns={columns}
						data={data}
						isLoading={isLoading}
						searchKey="description"
						searchPlaceholder="搜尋說明"
					/>
				</div>
			</CardContent>

			{editingRecord && (
				<EditAssetTransactionDialog
					record={editingRecord}
					open={editDialogOpen}
					onOpenChange={setEditDialogOpen}
					onSuccess={handleEditSuccess}
				/>
			)}
		</Card>
	);
}
