"use client";

import { DataTableColumnHeader } from "@saas/shared/components/DataTable/DataTableColumnHeader";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Edit2 } from "lucide-react";
import {
	CURRENCY_OPTIONS,
	DISTRIBUTION_TYPE_OPTIONS,
	type ProductCategory,
	type ProductStatus,
} from "../../constants";

export interface ProductRecord {
	id: string;
	name: string;
	code: string;
	category: ProductCategory;
	description: string | null;
	status: ProductStatus;
	price: number | null;
	currency: string;
	distributionType: string;
	organizationId: string;
	createdAt: string;
	updatedAt: string;
}

export function createColumns(
	onEdit: (record: ProductRecord) => void,
	t: (key: string) => string,
): ColumnDef<ProductRecord>[] {
	const getCategoryLabel = (category: string) => {
		switch (category) {
			case "AQ":
				return "AQ";
			case "Bond":
				return t("table.categoryBond");
			case "DCI":
				return "DCI";
			case "EQ":
				return t("table.categoryEQ");
			case "FCN":
				return "FCN";
			case "Fund":
				return t("table.categoryFund");
			case "FX":
				return t("table.categoryFX");
			default:
				return category;
		}
	};

	return [
		{
			accessorKey: "category",
			header: ({ column }) => (
				<DataTableColumnHeader
					column={column}
					title={t("table.category")}
				/>
			),
			cell: ({ row }) => {
				const category = row.getValue("category") as string;
				const getCategoryStatus = (category: string) => {
					switch (category) {
						case "AQ":
						case "DCI":
						case "FCN":
							return "warning";
						case "Bond":
						case "Fund":
							return "info";
						case "EQ":
							return "success";
						case "FX":
							return "error";
						default:
							return "info";
					}
				};
				return (
					<Badge status={getCategoryStatus(category)}>
						{getCategoryLabel(category)}
					</Badge>
				);
			},
		},
		{
			accessorKey: "name",
			header: ({ column }) => (
				<DataTableColumnHeader
					column={column}
					title={t("table.name")}
				/>
			),
		},
		{
			accessorKey: "code",
			header: ({ column }) => (
				<DataTableColumnHeader
					column={column}
					title={t("table.code")}
				/>
			),
		},
		{
			accessorKey: "currency",
			header: ({ column }) => (
				<DataTableColumnHeader
					column={column}
					title={t("table.currency")}
				/>
			),
			cell: ({ row }) => {
				const currency = row.getValue("currency") as string;
				const option = CURRENCY_OPTIONS.find(
					(opt) => opt.value === currency,
				);
				return option?.label || currency;
			},
		},
		{
			accessorKey: "distributionType",
			header: ({ column }) => (
				<DataTableColumnHeader
					column={column}
					title={t("table.distributionType")}
				/>
			),
			cell: ({ row }) => {
				const type = row.getValue("distributionType") as string;
				const option = DISTRIBUTION_TYPE_OPTIONS.find(
					(opt) => opt.value === type,
				);
				return option?.label || type;
			},
		},
		{
			accessorKey: "description",
			header: ({ column }) => (
				<DataTableColumnHeader
					column={column}
					title={t("table.description")}
				/>
			),
			cell: ({ row }) => {
				const description = row.getValue("description") as
					| string
					| null;
				return description || "-";
			},
		},
		{
			accessorKey: "createdAt",
			header: ({ column }) => (
				<DataTableColumnHeader
					column={column}
					title={t("table.createdAt")}
				/>
			),
			cell: ({ row }) => {
				const date = row.getValue("createdAt") as string;
				return new Date(date).toLocaleDateString("zh-TW");
			},
		},
		{
			accessorKey: "status",
			header: ({ column }) => (
				<DataTableColumnHeader
					column={column}
					title={t("table.status")}
				/>
			),
			cell: ({ row }) => {
				const status = row.getValue("status") as string;
				return (
					<Badge status={status === "active" ? "success" : "info"}>
						{status === "active"
							? t("table.statusActive")
							: t("table.statusInactive")}
					</Badge>
				);
			},
		},
		{
			id: "actions",
			header: t("table.actions"),
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
