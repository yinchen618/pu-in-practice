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
import * as React from "react";

import { DataTablePagination } from "@saas/shared/components/DataTable/DataTablePagination";
import { DataTableToolbar } from "@saas/shared/components/DataTable/DataTableToolbar";
import { Skeleton } from "@ui/components/skeleton";
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
	searchKey?: string;
	searchPlaceholder?: string;
	isLoading?: boolean;
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
}

export function DataTable<TData, TValue>({
	columns,
	data,
	searchKey,
	searchPlaceholder,
	isLoading = false,
	filterableColumns = [],
	searchableColumns = [],
}: DataTableProps<TData, TValue>) {
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

	const renderTableBody = () => {
		if (isLoading) {
			return (
				<>
					{Array.from({ length: 5 }).map((_, index) => (
						<TableRow key={`loading-${index}`}>
							{columns.map((_, cellIndex) => (
								<TableCell key={`loading-cell-${cellIndex}`}>
									<Skeleton className="h-4 w-full" />
								</TableCell>
							))}
						</TableRow>
					))}
				</>
			);
		}

		if (table.getRowModel().rows?.length) {
			return table.getRowModel().rows.map((row) => (
				<TableRow
					key={row.id}
					data-state={row.getIsSelected() && "selected"}
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
			));
		}

		return (
			<TableRow>
				<TableCell
					colSpan={columns.length}
					className="h-24 text-center"
				>
					暫無資料
				</TableCell>
			</TableRow>
		);
	};

	// 合併 searchableColumns，優先使用傳入的 searchableColumns，如果沒有則使用 searchKey
	const finalSearchableColumns =
		searchableColumns.length > 0
			? searchableColumns
			: searchKey
				? [{ id: searchKey, title: searchPlaceholder ?? "內容" }]
				: [];

	return (
		<div className="space-y-4">
			<DataTableToolbar
				table={table}
				filterableColumns={filterableColumns}
				searchableColumns={finalSearchableColumns}
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
					<TableBody>{renderTableBody()}</TableBody>
				</Table>
			</div>
			<DataTablePagination table={table} />
		</div>
	);
}
