"use client";

import { DataTableFacetedFilter } from "@saas/shared/components/DataTable/DataTableFacetedFilter";
import { DataTableViewOptions } from "@saas/shared/components/DataTable/DataTableViewOptions";
import type { Table } from "@tanstack/react-table";
import { Input } from "@ui/components/input";

interface DataTableToolbarProps<TData> {
	table: Table<TData>;
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

export function DataTableToolbar<TData>({
	table,
	filterableColumns = [],
	searchableColumns = [],
}: DataTableToolbarProps<TData>) {
	const isFiltered = table.getState().columnFilters.length > 0;

	return (
		<div className="flex items-center justify-between">
			<div className="flex flex-1 items-center space-x-2">
				{searchableColumns.length > 0 &&
					searchableColumns.map(
						(column) =>
							table.getColumn(column.id) && (
								<Input
									key={column.id}
									placeholder={`搜尋${column.title}...`}
									value={
										(table
											.getColumn(column.id)
											?.getFilterValue() as string) ?? ""
									}
									onChange={(event) =>
										table
											.getColumn(column.id)
											?.setFilterValue(event.target.value)
									}
									className="h-8 w-[150px] lg:w-[250px]"
								/>
							),
					)}
				{filterableColumns.length > 0 &&
					filterableColumns.map(
						(column) =>
							table.getColumn(column.id) && (
								<DataTableFacetedFilter
									key={column.id}
									column={table.getColumn(column.id)}
									title={column.title}
									options={column.options}
								/>
							),
					)}
				{isFiltered && (
					<button
						type="button"
						onClick={() => table.resetColumnFilters()}
						className="text-sm text-muted-foreground"
					>
						重置篩選
					</button>
				)}
			</div>
			<DataTableViewOptions table={table} />
		</div>
	);
}
