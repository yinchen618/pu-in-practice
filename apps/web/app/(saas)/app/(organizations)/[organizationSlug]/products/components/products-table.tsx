import { DataTable } from "@saas/shared/components/DataTable";
import { DataTableColumnHeader } from "@saas/shared/components/DataTable/DataTableColumnHeader";
import type { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";

interface Product {
	id: string;
	name: string;
	code: string;
	category: string;
	currency: string;
	status: string;
}

interface ProductsTableProps {
	products: Product[];
}

export function ProductsTable({ products }: ProductsTableProps) {
	const t = useTranslations("organization.products.table");

	const columns: ColumnDef<Product>[] = [
		{
			accessorKey: "name",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title={t("name")} />
			),
		},
		{
			accessorKey: "code",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title={t("code")} />
			),
		},
		{
			accessorKey: "category",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title={t("category")} />
			),
		},
		{
			accessorKey: "currency",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title={t("currency")} />
			),
		},
		{
			accessorKey: "status",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title={t("status")} />
			),
			cell: ({ row }) => {
				const status = row.getValue("status") as string;
				return status === "active"
					? t("statusActive")
					: t("statusInactive");
			},
		},
	];

	return (
		<DataTable
			columns={columns}
			data={products}
			searchKey="name"
			searchPlaceholder={t("searchPlaceholder")}
		/>
	);
}
