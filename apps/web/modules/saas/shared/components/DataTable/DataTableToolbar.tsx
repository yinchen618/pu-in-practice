"use client";

import { DataTableDownloadOptions } from "@saas/shared/components/DataTable/DataTableDownloadOptions";
import { DataTableFacetedFilter } from "@saas/shared/components/DataTable/DataTableFacetedFilter";
import { DataTableViewOptions } from "@saas/shared/components/DataTable/DataTableViewOptions";
import type { Table } from "@tanstack/react-table";
import { Input } from "@ui/components/input";
import { useTranslations } from "next-intl";

interface DataTableToolbarProps<TData> {
	table: Table<TData>;
	data: TData[];
	filename?: string;
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
	showDownloadOptions?: boolean;
}

export function DataTableToolbar<TData>({
	table,
	data,
	filename,
	filterableColumns = [],
	searchableColumns = [],
	showDownloadOptions = false,
}: DataTableToolbarProps<TData>) {
	const t = useTranslations();
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
									placeholder={t(
										"common.dataTable.searchPlaceholder",
										{ column: column.title },
									)}
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
						{t("common.dataTable.resetFilters")}
					</button>
				)}
			</div>
			<div className="flex items-center space-x-2">
				{showDownloadOptions && (
					<DataTableDownloadOptions
						table={table}
						data={data}
						filename={filename}
					/>
				)}
				<DataTableViewOptions table={table} />
			</div>
		</div>
	);
}
