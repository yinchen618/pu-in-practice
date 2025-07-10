"use client";

import { DataTable } from "@saas/shared/components/DataTable";
import { Badge } from "@ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { useEffect, useState } from "react";
import type { AssetTransactionRecord } from "./columns";
import { createColumns } from "./columns";
import { CreateAssetTransactionDialog } from "./create-asset-transaction-dialog";
import { EditAssetTransactionDialog } from "./edit-asset-transaction-dialog";

interface AssetTransactionsTableProps {
	customerId: string;
}

interface CurrencyBalance {
	currency: string;
	balance: number;
	inAmount: number;
	outAmount: number;
}

export function AssetTransactionsTable({
	customerId,
}: AssetTransactionsTableProps) {
	const [data, setData] = useState<AssetTransactionRecord[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [editingRecord, setEditingRecord] =
		useState<AssetTransactionRecord | null>(null);
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [balances, setBalances] = useState<CurrencyBalance[]>([]);

	const calculateBalances = (transactions: AssetTransactionRecord[]) => {
		const currencyMap = new Map<string, CurrencyBalance>();

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

			const currencyData = currencyMap.get(currency)!;

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
				{balances.length > 0 && (
					<div className="space-y-3">
						<h3 className="text-sm font-medium text-gray-700">
							目前結餘
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{balances.map((balance) => (
								<div
									key={balance.currency}
									className="p-4 border rounded-lg bg-gray-50"
								>
									<div className="flex items-center justify-between mb-2">
										<Badge
											status="info"
											className="font-mono"
										>
											{balance.currency}
										</Badge>
										<div className="text-right">
											<div
												className={`text-lg font-bold font-mono ${
													balance.balance >= 0
														? "text-green-600"
														: "text-red-600"
												}`}
											>
												{balance.balance >= 0
													? "+"
													: ""}
												{Number(
													balance.balance,
												).toLocaleString()}
											</div>
										</div>
									</div>
									<div className="text-xs text-gray-500 space-y-1">
										<div className="flex justify-between">
											<span>入金總額:</span>
											<span className="text-green-600 font-mono">
												+
												{Number(
													balance.inAmount,
												).toLocaleString()}
											</span>
										</div>
										<div className="flex justify-between">
											<span>出金總額:</span>
											<span className="text-red-600 font-mono">
												-
												{Number(
													balance.outAmount,
												).toLocaleString()}
											</span>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				)}

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
