"use client";

import {
	type ColumnDef,
	type ColumnFiltersState,
	type PaginationState,
	type SortingState,
	type VisibilityState,
	flexRender,
	getCoreRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import * as React from "react";

import { DataTablePagination } from "@saas/shared/components/DataTable/DataTablePagination";
import { DataTableToolbar } from "@saas/shared/components/DataTable/DataTableToolbar";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
	filterableColumns?: {
		id: string;
		title: string;
		options: {
			label: string;
			value: string;
		}[];
	}[];
	searchableColumns?: {
		id: string;
		title: string;
	}[];
	isLoading?: boolean;
}

export function DataTable<TData, TValue>({
	columns,
	data,
	isLoading,
	filterableColumns = [],
	searchableColumns = [],
}: DataTableProps<TData, TValue>) {
	const t = useTranslations("common.dataTable");
	const [rowSelection, setRowSelection] = React.useState({});
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>({});
	const [columnFilters, setColumnFilters] =
		React.useState<ColumnFiltersState>([]);
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [pagination, setPagination] = React.useState<PaginationState>({
		pageIndex: 0,
		pageSize: 10,
	});

	const table = useReactTable({
		data,
		columns,
		state: {
			sorting,
			columnVisibility,
			rowSelection,
			columnFilters,
			pagination,
		},
		enableRowSelection: true,
		onRowSelectionChange: setRowSelection,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		onPaginationChange: setPagination,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
		manualPagination: false,
	});

	// 調試信息
	console.log("🔍 DataTable 調試信息:", {
		dataLength: data.length,
		pageCount: table.getPageCount(),
		currentPage: table.getState().pagination.pageIndex + 1,
		pageSize: table.getState().pagination.pageSize,
		rowsOnCurrentPage: table.getRowModel().rows.length,
	});

	return (
		<div className="flex flex-col gap-4">
			{/* 調試：檢查資料狀態 */}
			<div
				style={{
					border: "2px solid green",
					padding: "10px",
					marginBottom: "10px",
				}}
			>
				🔍 Table 狀態：
				<pre>
					{JSON.stringify(
						{
							總資料筆數: table.getRowModel().rows.length,
							目前頁碼: table.getState().pagination.pageIndex + 1,
							每頁筆數: table.getState().pagination.pageSize,
							總頁數: table.getPageCount(),
						},
						null,
						2,
					)}
				</pre>
			</div>

			<DataTableToolbar
				table={table}
				filterableColumns={filterableColumns}
				searchableColumns={searchableColumns}
			/>
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									return (
										<TableHead key={header.id}>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef
															.header,
														header.getContext(),
													)}
										</TableHead>
									);
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={
										row.getIsSelected() && "selected"
									}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center"
								>
									{t("noResults")}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			{/* 測試：確認這個位置能否渲染 */}
			<div style={{ border: "2px solid red", padding: "10px" }}>
				📄 分頁應該在這裡顯示 (總頁數: {table.getPageCount()})
			</div>
			<DataTablePagination table={table} />
		</div>
	);
}
