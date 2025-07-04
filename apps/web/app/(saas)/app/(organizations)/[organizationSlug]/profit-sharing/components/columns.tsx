"use client";

import { DataTableColumnHeader } from "@saas/shared/components/DataTable/DataTableColumnHeader";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@ui/components/button";
import { Edit2 } from "lucide-react";

export interface ProfitSharingRecord {
	id: string;
	customerId: string;
	productId: string;
	amount: number;
	profitDate: Date;
	organizationId: string;
	createdAt: Date;
	updatedAt: Date;

	// 新增欄位
	currency: string;
	companyRevenue: number;
	directTradeBookingFee: number;
	shareable: number;
	rmProfitSharePercent: number;
	finderProfitSharePercent: number;
	companyProfitSharePercent: number;
	rmRevenueOriginal: number;
	findersRevenueOriginal: number;
	companyRevenueOriginal: number;
	fxRate: number;
	rmRevenueUSD: number;
	findersRevenueUSD: number;

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
			accessorKey: "productName",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="產品名稱" />
			),
		},
		{
			accessorKey: "productCode",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="產品代碼" />
			),
		},
		{
			accessorKey: "productCategory",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="產品類別" />
			),
		},
		{
			accessorKey: "currency",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="幣別" />
			),
		},
		{
			accessorKey: "companyRevenue",
			header: ({ column }) => (
				<DataTableColumnHeader
					column={column}
					title="Company Revenue"
				/>
			),
			cell: ({ row }) => {
				const value = row.getValue("companyRevenue") as number;
				const currency = row.getValue("currency") as string;
				return `${currency} ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
			},
		},
		{
			accessorKey: "directTradeBookingFee",
			header: ({ column }) => (
				<DataTableColumnHeader
					column={column}
					title="Direct Trade Booking Fee"
				/>
			),
			cell: ({ row }) => {
				const value = row.getValue("directTradeBookingFee") as number;
				const currency = row.getValue("currency") as string;
				return `${currency} ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
			},
		},
		{
			accessorKey: "shareable",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Shareable" />
			),
			cell: ({ row }) => {
				const value = row.getValue("shareable") as number;
				const currency = row.getValue("currency") as string;
				return `${currency} ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
			},
		},
		{
			accessorKey: "rmProfitSharePercent",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="RM分潤%" />
			),
			cell: ({ row }) => {
				const value = row.getValue("rmProfitSharePercent") as number;
				return `${value.toFixed(2)}%`;
			},
		},
		{
			accessorKey: "finderProfitSharePercent",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Finder分潤%" />
			),
			cell: ({ row }) => {
				const value = row.getValue(
					"finderProfitSharePercent",
				) as number;
				return `${value.toFixed(2)}%`;
			},
		},
		{
			accessorKey: "companyProfitSharePercent",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Company分潤%" />
			),
			cell: ({ row }) => {
				const value = row.getValue(
					"companyProfitSharePercent",
				) as number;
				return `${value.toFixed(2)}%`;
			},
		},
		{
			accessorKey: "rmRevenueOriginal",
			header: ({ column }) => (
				<DataTableColumnHeader
					column={column}
					title="RM Revenue (原幣)"
				/>
			),
			cell: ({ row }) => {
				const value = row.getValue("rmRevenueOriginal") as number;
				const currency = row.getValue("currency") as string;
				return `${currency} ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
			},
		},
		{
			accessorKey: "findersRevenueOriginal",
			header: ({ column }) => (
				<DataTableColumnHeader
					column={column}
					title="Finders Revenue (原幣)"
				/>
			),
			cell: ({ row }) => {
				const value = row.getValue("findersRevenueOriginal") as number;
				const currency = row.getValue("currency") as string;
				return `${currency} ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
			},
		},
		{
			accessorKey: "companyRevenueOriginal",
			header: ({ column }) => (
				<DataTableColumnHeader
					column={column}
					title="Company Revenue (原幣)"
				/>
			),
			cell: ({ row }) => {
				const value = row.getValue("companyRevenueOriginal") as number;
				const currency = row.getValue("currency") as string;
				return `${currency} ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
			},
		},
		{
			accessorKey: "fxRate",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="FX Rate" />
			),
			cell: ({ row }) => {
				const value = row.getValue("fxRate") as number;
				return value.toFixed(5);
			},
		},
		{
			accessorKey: "rmRevenueUSD",
			header: ({ column }) => (
				<DataTableColumnHeader
					column={column}
					title="RM Revenue (USD)"
				/>
			),
			cell: ({ row }) => {
				const value = row.getValue("rmRevenueUSD") as number;
				return `USD ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
			},
		},
		{
			accessorKey: "findersRevenueUSD",
			header: ({ column }) => (
				<DataTableColumnHeader
					column={column}
					title="Finders Revenue (USD)"
				/>
			),
			cell: ({ row }) => {
				const value = row.getValue("findersRevenueUSD") as number;
				return `USD ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
			},
		},
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
