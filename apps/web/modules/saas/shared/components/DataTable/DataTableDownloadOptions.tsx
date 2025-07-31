"use client";

import type { Table } from "@tanstack/react-table";
import { Button } from "@ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import { saveAs } from "file-saver";
import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import * as XLSX from "xlsx";

interface DataTableDownloadOptionsProps<TData> {
	table: Table<TData>;
	data: TData[];
	filename?: string;
}

export function DataTableDownloadOptions<TData>({
	table,
	data,
	filename = "data",
}: DataTableDownloadOptionsProps<TData>) {
	const t = useTranslations("common.dataTable");

	const downloadCSV = () => {
		// 獲取可見的列
		const visibleColumns = table
			.getAllColumns()
			.filter((column) => column.getIsVisible())
			.filter((column) => typeof column.accessorFn !== "undefined");

		// 準備 CSV 數據
		const headers = visibleColumns.map((column) => {
			// 嘗試從 column.columnDef.header 獲取標題
			const header = column.columnDef.header;
			if (typeof header === "string") {
				return header;
			}
			// 如果無法獲取標題，使用列 ID
			return column.id;
		});

		// 為分潤數據添加詳細欄位
		const extendedHeaders = [
			...headers,
			// Company 詳細欄位
			"Company Revenue %",
			"Company Fee %",
			"Company Revenue Amount",
			"Company Fee Amount",
			"Company Original Amount",
			"Company USD Amount",
			// RM1 詳細欄位
			"RM1 Name",
			"RM1 Revenue %",
			"RM1 Fee %",
			"RM1 Revenue Amount",
			"RM1 Fee Amount",
			"RM1 Original Amount",
			"RM1 USD Amount",
			// RM2 詳細欄位
			"RM2 Name",
			"RM2 Revenue %",
			"RM2 Fee %",
			"RM2 Revenue Amount",
			"RM2 Fee Amount",
			"RM2 Original Amount",
			"RM2 USD Amount",
			// Finder1 詳細欄位
			"Finder1 Name",
			"Finder1 Revenue %",
			"Finder1 Fee %",
			"Finder1 Revenue Amount",
			"Finder1 Fee Amount",
			"Finder1 Original Amount",
			"Finder1 USD Amount",
			// Finder2 詳細欄位
			"Finder2 Name",
			"Finder2 Revenue %",
			"Finder2 Fee %",
			"Finder2 Revenue Amount",
			"Finder2 Fee Amount",
			"Finder2 Original Amount",
			"Finder2 USD Amount",
		];

		const csvData = data.map((row) => {
			// 基本欄位數據
			const basicData = visibleColumns.map((column) => {
				// 使用 accessorFn 來獲取值
				const value = column.accessorFn
					? column.accessorFn(row, 0)
					: "";
				// 處理特殊值
				if (value === null || value === undefined) {
					return "";
				}
				if (typeof value === "object") {
					return JSON.stringify(value);
				}
				return String(value);
			});

			// 計算每個人的詳細數據
			const rowData = row as any; // 類型斷言以訪問分潤數據
			const companyRevenue = rowData.companyRevenue || 0;
			const directTradeBookingFee = rowData.directTradeBookingFee || 0;
			const bankRetroPercent = rowData.bankRetroPercent || 50;
			const fxRate = rowData.fxRate || 1;

			// 計算個人分潤金額的輔助函數
			const calculatePersonAmounts = (
				revenuePercent: number,
				feePercent: number,
			) => {
				const revenueAmount = (companyRevenue * revenuePercent) / 100;
				const feeAmount =
					(directTradeBookingFee * bankRetroPercent * feePercent) /
					10000;
				const totalAmount = revenueAmount + feeAmount;
				return {
					revenueAmount,
					feeAmount,
					totalAmount,
					usdAmount: totalAmount * fxRate,
				};
			};

			// Company 數據
			const companyData = calculatePersonAmounts(
				rowData.companyRevenuePercent || 0,
				rowData.companyFeePercent || 0,
			);

			// RM1 數據
			const rm1Data = calculatePersonAmounts(
				rowData.rm1RevenuePercent || 0,
				rowData.rm1FeePercent || 0,
			);

			// RM2 數據
			const rm2Data = calculatePersonAmounts(
				rowData.rm2RevenuePercent || 0,
				rowData.rm2FeePercent || 0,
			);

			// Finder1 數據
			const finder1Data = calculatePersonAmounts(
				rowData.finder1RevenuePercent || 0,
				rowData.finder1FeePercent || 0,
			);

			// Finder2 數據
			const finder2Data = calculatePersonAmounts(
				rowData.finder2RevenuePercent || 0,
				rowData.finder2FeePercent || 0,
			);

			// 擴展數據
			const extendedData = [
				// Company 詳細數據
				rowData.companyRevenuePercent || 0,
				rowData.companyFeePercent || 0,
				companyData.revenueAmount,
				companyData.feeAmount,
				companyData.totalAmount,
				companyData.usdAmount,
				// RM1 詳細數據
				rowData.rm1Name || "",
				rowData.rm1RevenuePercent || 0,
				rowData.rm1FeePercent || 0,
				rm1Data.revenueAmount,
				rm1Data.feeAmount,
				rm1Data.totalAmount,
				rm1Data.usdAmount,
				// RM2 詳細數據
				rowData.rm2Name || "",
				rowData.rm2RevenuePercent || 0,
				rowData.rm2FeePercent || 0,
				rm2Data.revenueAmount,
				rm2Data.feeAmount,
				rm2Data.totalAmount,
				rm2Data.usdAmount,
				// Finder1 詳細數據
				rowData.finder1Name || "",
				rowData.finder1RevenuePercent || 0,
				rowData.finder1FeePercent || 0,
				finder1Data.revenueAmount,
				finder1Data.feeAmount,
				finder1Data.totalAmount,
				finder1Data.usdAmount,
				// Finder2 詳細數據
				rowData.finder2Name || "",
				rowData.finder2RevenuePercent || 0,
				rowData.finder2FeePercent || 0,
				finder2Data.revenueAmount,
				finder2Data.feeAmount,
				finder2Data.totalAmount,
				finder2Data.usdAmount,
			];

			return [...basicData, ...extendedData];
		});

		// 正確處理 CSV 格式，包括引號和逗號
		const escapeCSV = (str: any) => {
			// 確保 str 是字符串
			const stringValue = String(str);
			if (
				stringValue.includes(",") ||
				stringValue.includes('"') ||
				stringValue.includes("\n")
			) {
				return `"${stringValue.replace(/"/g, '""')}"`;
			}
			return stringValue;
		};

		// 組合 CSV 內容
		const csvContent = [
			extendedHeaders.map(escapeCSV).join(","),
			...csvData.map((row) => row.map(escapeCSV).join(",")),
		].join("\n");

		// 添加 BOM 以支援中文
		const BOM = "\uFEFF";
		const csvContentWithBOM = BOM + csvContent;

		// 創建 Blob 並下載
		const blob = new Blob([csvContentWithBOM], {
			type: "text/csv;charset=utf-8;",
		});
		saveAs(blob, `${filename}.csv`);
	};

	const downloadExcel = () => {
		// 獲取可見的列
		const visibleColumns = table
			.getAllColumns()
			.filter((column) => column.getIsVisible())
			.filter((column) => typeof column.accessorFn !== "undefined");

		// 準備 Excel 數據
		const headers = visibleColumns.map((column) => {
			// 嘗試從 column.columnDef.header 獲取標題
			const header = column.columnDef.header;
			if (typeof header === "string") {
				return header;
			}
			// 如果無法獲取標題，使用列 ID
			return column.id;
		});

		// 為分潤數據添加詳細欄位
		const extendedHeaders = [
			...headers,
			// Company 詳細欄位
			"Company Revenue %",
			"Company Fee %",
			"Company Revenue Amount",
			"Company Fee Amount",
			"Company Original Amount",
			"Company USD Amount",
			// RM1 詳細欄位
			"RM1 Name",
			"RM1 Revenue %",
			"RM1 Fee %",
			"RM1 Revenue Amount",
			"RM1 Fee Amount",
			"RM1 Original Amount",
			"RM1 USD Amount",
			// RM2 詳細欄位
			"RM2 Name",
			"RM2 Revenue %",
			"RM2 Fee %",
			"RM2 Revenue Amount",
			"RM2 Fee Amount",
			"RM2 Original Amount",
			"RM2 USD Amount",
			// Finder1 詳細欄位
			"Finder1 Name",
			"Finder1 Revenue %",
			"Finder1 Fee %",
			"Finder1 Revenue Amount",
			"Finder1 Fee Amount",
			"Finder1 Original Amount",
			"Finder1 USD Amount",
			// Finder2 詳細欄位
			"Finder2 Name",
			"Finder2 Revenue %",
			"Finder2 Fee %",
			"Finder2 Revenue Amount",
			"Finder2 Fee Amount",
			"Finder2 Original Amount",
			"Finder2 USD Amount",
		];

		const excelData = data.map((row) => {
			// 基本欄位數據
			const basicData = visibleColumns.map((column) => {
				// 使用 accessorFn 來獲取值
				const value = column.accessorFn
					? column.accessorFn(row, 0)
					: "";
				// 處理特殊值
				if (value === null || value === undefined) {
					return "";
				}
				if (typeof value === "object") {
					return JSON.stringify(value);
				}
				return value;
			});

			// 計算每個人的詳細數據
			const rowData = row as any; // 類型斷言以訪問分潤數據
			const companyRevenue = rowData.companyRevenue || 0;
			const directTradeBookingFee = rowData.directTradeBookingFee || 0;
			const bankRetroPercent = rowData.bankRetroPercent || 50;
			const fxRate = rowData.fxRate || 1;

			// 計算個人分潤金額的輔助函數
			const calculatePersonAmounts = (
				revenuePercent: number,
				feePercent: number,
			) => {
				const revenueAmount = (companyRevenue * revenuePercent) / 100;
				const feeAmount =
					(directTradeBookingFee * bankRetroPercent * feePercent) /
					10000;
				const totalAmount = revenueAmount + feeAmount;
				return {
					revenueAmount,
					feeAmount,
					totalAmount,
					usdAmount: totalAmount * fxRate,
				};
			};

			// Company 數據
			const companyData = calculatePersonAmounts(
				rowData.companyRevenuePercent || 0,
				rowData.companyFeePercent || 0,
			);

			// RM1 數據
			const rm1Data = calculatePersonAmounts(
				rowData.rm1RevenuePercent || 0,
				rowData.rm1FeePercent || 0,
			);

			// RM2 數據
			const rm2Data = calculatePersonAmounts(
				rowData.rm2RevenuePercent || 0,
				rowData.rm2FeePercent || 0,
			);

			// Finder1 數據
			const finder1Data = calculatePersonAmounts(
				rowData.finder1RevenuePercent || 0,
				rowData.finder1FeePercent || 0,
			);

			// Finder2 數據
			const finder2Data = calculatePersonAmounts(
				rowData.finder2RevenuePercent || 0,
				rowData.finder2FeePercent || 0,
			);

			// 擴展數據
			const extendedData = [
				// Company 詳細數據
				rowData.companyRevenuePercent || 0,
				rowData.companyFeePercent || 0,
				companyData.revenueAmount,
				companyData.feeAmount,
				companyData.totalAmount,
				companyData.usdAmount,
				// RM1 詳細數據
				rowData.rm1Name || "",
				rowData.rm1RevenuePercent || 0,
				rowData.rm1FeePercent || 0,
				rm1Data.revenueAmount,
				rm1Data.feeAmount,
				rm1Data.totalAmount,
				rm1Data.usdAmount,
				// RM2 詳細數據
				rowData.rm2Name || "",
				rowData.rm2RevenuePercent || 0,
				rowData.rm2FeePercent || 0,
				rm2Data.revenueAmount,
				rm2Data.feeAmount,
				rm2Data.totalAmount,
				rm2Data.usdAmount,
				// Finder1 詳細數據
				rowData.finder1Name || "",
				rowData.finder1RevenuePercent || 0,
				rowData.finder1FeePercent || 0,
				finder1Data.revenueAmount,
				finder1Data.feeAmount,
				finder1Data.totalAmount,
				finder1Data.usdAmount,
				// Finder2 詳細數據
				rowData.finder2Name || "",
				rowData.finder2RevenuePercent || 0,
				rowData.finder2FeePercent || 0,
				finder2Data.revenueAmount,
				finder2Data.feeAmount,
				finder2Data.totalAmount,
				finder2Data.usdAmount,
			];

			return [...basicData, ...extendedData];
		});

		// 創建工作表
		const ws = XLSX.utils.aoa_to_sheet([extendedHeaders, ...excelData]);

		// 創建工作簿
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

		// 生成 Excel 文件並下載
		const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
		const blob = new Blob([excelBuffer], {
			type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		});
		saveAs(blob, `${filename}.xlsx`);
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="sm" className="h-8">
					<Download className="mr-2 h-4 w-4" />
					{t("download")}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem onClick={downloadCSV}>
					{t("downloadCSV")}
				</DropdownMenuItem>
				<DropdownMenuItem onClick={downloadExcel}>
					{t("downloadExcel")}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
