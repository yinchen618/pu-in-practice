"use client";

import type { Column } from "@tanstack/react-table";
import { Button } from "@ui/components/button";
import { cn } from "@ui/lib";
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon } from "lucide-react";

interface DataTableColumnHeaderProps<TData, TValue>
	extends React.HTMLAttributes<HTMLDivElement> {
	column: Column<TData, TValue>;
	title: string;
}

export function DataTableColumnHeader<TData, TValue>({
	column,
	title,
	className,
}: DataTableColumnHeaderProps<TData, TValue>) {
	if (!column.getCanSort()) {
		return <div className={cn(className)}>{title}</div>;
	}

	return (
		<div className={cn("flex items-center space-x-2", className)}>
			<Button
				variant="ghost"
				size="sm"
				className="-ml-3 h-8 data-[state=open]:bg-accent"
				onClick={() => column.toggleSorting()}
			>
				<span>{title}</span>
				{column.getIsSorted() === "desc" ? (
					<ArrowDownIcon className="ml-2 h-4 w-4" />
				) : column.getIsSorted() === "asc" ? (
					<ArrowUpIcon className="ml-2 h-4 w-4" />
				) : (
					<ChevronsUpDownIcon className="ml-2 h-4 w-4" />
				)}
			</Button>
		</div>
	);
}
