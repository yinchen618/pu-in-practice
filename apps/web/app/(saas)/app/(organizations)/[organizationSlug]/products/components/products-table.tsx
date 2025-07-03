import { DataTable } from "@saas/shared/components/DataTable";
import { DataTableColumnHeader } from "@saas/shared/components/DataTable/DataTableColumnHeader";
import type { ColumnDef } from "@tanstack/react-table";

interface Product {
	id: string;
	name: string;
	code: string;
	category: string;
	price: number | null;
	currency: string | null;
	status: string;
}

interface ProductsTableProps {
	products: Product[];
}

const columns: ColumnDef<Product>[] = [
	{
		accessorKey: "name",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="產品名稱" />
		),
	},
	{
		accessorKey: "code",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="代碼" />
		),
	},
	{
		accessorKey: "category",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="類別" />
		),
	},
	{
		id: "price",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="價格" />
		),
		cell: ({ row }) => {
			const price = row.original.price;
			const currency = row.original.currency;
			return price ? `${price} ${currency}` : "-";
		},
	},
	{
		accessorKey: "status",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="狀態" />
		),
		cell: ({ row }) => {
			const status = row.getValue("status") as string;
			return status === "active" ? "銷售中" : "已下架";
		},
	},
];

export function ProductsTable({ products }: ProductsTableProps) {
	return (
		<DataTable
			columns={columns}
			data={products}
			searchKey="name"
			searchPlaceholder="搜尋產品..."
		/>
	);
}
