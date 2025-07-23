"use client";

import { DataTableColumnHeader } from "@saas/shared/components/DataTable/DataTableColumnHeader";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@ui/components/button";
import { Edit2 } from "lucide-react";

// 格式化函數
const formatCurrency = (value: number, currency: string) => {
	return `${currency} ${value.toLocaleString("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})}`;
};

const formatPercentage = (value: number) => {
	return `${value.toFixed(2)}%`;
};

const formatNumber = (value: number, decimals = 2) => {
	return value.toLocaleString("en-US", {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
	});
};

export interface ProfitSharingRecord {
	id: string;
	customerId: string;
	productId: string;
	bankAccountId?: string | null;
	amount: number;
	profitDate: Date;
	organizationId: string;
	createdAt: Date;
	updatedAt: Date;

	// 基本欄位
	currency: string;
	companyRevenue: number;
	directTradeBookingFee: number;
	bankRetroPercent: number; // 新增 Bank Retro(%)
	shareable: number;

	// 分潤比例
	rmProfitSharePercent: number;
	finderProfitSharePercent: number;
	companyProfitSharePercent: number;

	// RM1 資訊
	rm1Id?: string;
	rm1Name?: string;
	rm1ProfitSharePercent?: number;
	rm1RevenueOriginal?: number;
	rm1RevenueUSD?: number;

	// RM2 資訊
	rm2Id?: string;
	rm2Name?: string;
	rm2ProfitSharePercent?: number;
	rm2RevenueOriginal?: number;
	rm2RevenueUSD?: number;

	// Finder1 資訊
	finder1Id?: string;
	finder1Name?: string;
	finder1ProfitSharePercent?: number;
	finder1RevenueOriginal?: number;
	finder1RevenueUSD?: number;

	// Finder2 資訊
	finder2Id?: string;
	finder2Name?: string;
	finder2ProfitSharePercent?: number;
	finder2RevenueOriginal?: number;
	finder2RevenueUSD?: number;

	// 原幣金額
	rmRevenueOriginal: number;
	findersRevenueOriginal: number;
	companyRevenueOriginal: number;

	// 美金金額
	rmRevenueUSD: number;
	findersRevenueUSD: number;

	// 匯率
	fxRate: number;

	// 關聯資料
	customerName: string;
	customerCode: string;
	productName: string;
	productCode: string;
	productCategory: string;
}

export function createColumns(
	onEdit: (record: ProfitSharingRecord) => void,
): ColumnDef<ProfitSharingRecord>[] {
	return [
		// 第一行：客戶和產品資訊
		{
			accessorKey: "profitDate",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="分潤日期" />
			),
			cell: ({ row }) => {
				const date = row.getValue("profitDate") as Date;
				return new Date(date).toLocaleDateString("zh-TW");
			},
		},
		{
			accessorKey: "customerName",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="客戶名稱" />
			),
		},
		{
			accessorKey: "customerCode",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="客戶代碼" />
			),
		},
		{
			accessorKey: "productCategory",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="產品類別" />
			),
		},
		{
			accessorKey: "productInfo",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="產品" />
			),
			cell: ({ row }) => {
				const code = row.original.productCode;
				const name = row.original.productName;
				return (
					<div>
						<div className="font-mono text-xs text-muted-foreground">
							{code}
						</div>
						<div className="font-medium">{name}</div>
					</div>
				);
			},
			sortingFn: (rowA, rowB) => {
				const codeA = rowA.original.productCode || "";
				const codeB = rowB.original.productCode || "";
				return codeA.localeCompare(codeB, "en", { numeric: true });
			},
		},
		// 第二行：基本資訊
		// {
		// 	accessorKey: "currency",
		// 	header: ({ column }) => (
		// 		<DataTableColumnHeader column={column} title="幣別" />
		// 	),
		// },
		// {
		// 	accessorKey: "companyRevenue",
		// 	header: ({ column }) => (
		// 		<DataTableColumnHeader
		// 			column={column}
		// 			title="Company Revenue"
		// 		/>
		// 	),
		// 	cell: ({ row }) => {
		// 		const value = row.getValue("companyRevenue") as number;
		// 		const currency = row.getValue("currency") as string;
		// 		return `${currency} ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
		// 	},
		// },
		// {
		// 	accessorKey: "directTradeBookingFee",
		// 	header: ({ column }) => (
		// 		<DataTableColumnHeader
		// 			column={column}
		// 			title="Direct Trade Booking Fee"
		// 		/>
		// 	),
		// 	cell: ({ row }) => {
		// 		const value = row.getValue("directTradeBookingFee") as number;
		// 		const currency = row.getValue("currency") as string;
		// 		return `${currency} ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
		// 	},
		// },
		{
			accessorKey: "shareable",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="總分潤金額" />
			),
			cell: ({ row }) => {
				const value = row.original.shareable;
				const currency = row.original.currency;
				return formatCurrency(value, currency);
			},
		},
		// 第三行：分潤比例與金額
		{
			accessorKey: "companyProfitShareAmount",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Company分潤" />
			),
			cell: ({ row }) => {
				// const amount = row.original.companyProfitShareAmount || 0;
				const currency = row.original.currency;
				const percent = row.original.companyProfitSharePercent || 0;
				const original = row.original.companyRevenueOriginal || 0;
				return (
					<div className="space-y-1">
						<div>{formatCurrency(original, currency)}</div>
						<div className="text-xs text-muted-foreground">
							({formatPercentage(percent)})
						</div>
						{/* <div>分潤：{formatCurrency(amount, currency)}</div> */}
					</div>
				);
			},
		},
		// 修改 RM 分潤欄位
		{
			accessorKey: "rmProfitShareAmount",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="RM分潤" />
			),
			cell: ({ row }) => {
				const currency = row.original.currency;
				const record = row.original;

				return (
					<div className="space-y-2">
						{/* RM1 資訊 */}
						{record.rm1Name && (
							<div className="space-y-1">
								<div className="font-medium">
									{record.rm1Name}
								</div>
								<div>
									{formatCurrency(
										record.rm1RevenueOriginal || 0,
										currency,
									)}
								</div>
								<div className="text-xs text-muted-foreground">
									(
									{formatPercentage(
										record.rm1ProfitSharePercent || 0,
									)}
									)
								</div>
								<div className="text-xs text-muted-foreground">
									USD:{" "}
									{formatCurrency(
										record.rm1RevenueUSD || 0,
										"USD",
									)}
								</div>
							</div>
						)}

						{/* RM2 資訊 */}
						{record.rm2Name && (
							<div className="space-y-1 mt-2 pt-2 border-t">
								<div className="font-medium">
									{record.rm2Name}
								</div>
								<div>
									{formatCurrency(
										record.rm2RevenueOriginal || 0,
										currency,
									)}
								</div>
								<div className="text-xs text-muted-foreground">
									(
									{formatPercentage(
										record.rm2ProfitSharePercent || 0,
									)}
									)
								</div>
								<div className="text-xs text-muted-foreground">
									{/* USD:{" "} */}
									{formatCurrency(
										record.rm2RevenueUSD || 0,
										"USD",
									)}
								</div>
							</div>
						)}

						{/* 總計 */}
						<div className="mt-2 pt-2 border-t">
							<div className="font-medium">總計</div>
							<div>
								{formatCurrency(
									record.rmRevenueOriginal || 0,
									currency,
								)}
							</div>
							<div className="text-xs text-muted-foreground">
								(
								{formatPercentage(
									record.rmProfitSharePercent || 0,
								)}
								)
							</div>
							<div className="text-xs text-muted-foreground">
								{/* USD:{" "} */}
								{formatCurrency(
									record.rmRevenueUSD || 0,
									"USD",
								)}
							</div>
						</div>
					</div>
				);
			},
		},
		{
			accessorKey: "finderProfitShareAmount",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Finder分潤" />
			),
			cell: ({ row }) => {
				const currency = row.original.currency;
				const record = row.original;

				return (
					<div className="space-y-2">
						{/* Finder1 資訊 */}
						{record.finder1Name && (
							<div className="space-y-1">
								<div className="font-medium">
									{record.finder1Name}
								</div>
								<div>
									{formatCurrency(
										record.finder1RevenueOriginal || 0,
										currency,
									)}
								</div>
								<div className="text-xs text-muted-foreground">
									(
									{formatPercentage(
										record.finder1ProfitSharePercent || 0,
									)}
									)
								</div>
								<div className="text-xs text-muted-foreground">
									USD:{" "}
									{formatCurrency(
										record.finder1RevenueUSD || 0,
										"USD",
									)}
								</div>
							</div>
						)}

						{/* Finder2 資訊 */}
						{record.finder2Name && (
							<div className="space-y-1 mt-2 pt-2 border-t">
								<div className="font-medium">
									{record.finder2Name}
								</div>
								<div>
									{formatCurrency(
										record.finder2RevenueOriginal || 0,
										currency,
									)}
								</div>
								<div className="text-xs text-muted-foreground">
									(
									{formatPercentage(
										record.finder2ProfitSharePercent || 0,
									)}
									)
								</div>
								<div className="text-xs text-muted-foreground">
									USD:{" "}
									{formatCurrency(
										record.finder2RevenueUSD || 0,
										"USD",
									)}
								</div>
							</div>
						)}

						{/* 總計 */}
						<div className="mt-2 pt-2 border-t">
							<div className="font-medium">總計</div>
							<div>
								{formatCurrency(
									record.findersRevenueOriginal || 0,
									currency,
								)}
							</div>
							<div className="text-xs text-muted-foreground">
								(
								{formatPercentage(
									record.finderProfitSharePercent || 0,
								)}
								)
							</div>
							<div className="text-xs text-muted-foreground">
								USD:{" "}
								{formatCurrency(
									record.findersRevenueUSD || 0,
									"USD",
								)}
							</div>
						</div>
					</div>
				);
			},
		},
		// {
		// 	accessorKey: "fxRate",
		// 	header: ({ column }) => (
		// 		<DataTableColumnHeader column={column} title="FX Rate" />
		// 	),
		// 	cell: ({ row }) => {
		// 		const value = row.getValue("fxRate") as number;
		// 		return value.toFixed(5);
		// 	},
		// },
		{
			id: "actions",
			header: "操作",
			cell: ({ row }) => {
				const record = row.original;
				return (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onEdit(record)}
					>
						<Edit2 className="size-4" />
					</Button>
				);
			},
		},
	];
}
