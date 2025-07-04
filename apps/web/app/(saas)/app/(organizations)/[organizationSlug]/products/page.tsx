"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { DataTable } from "@saas/shared/components/DataTable";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { useEffect, useState } from "react";
import { createColumns } from "./components/columns";
import type { ProductRecord } from "./components/columns";
import { CreateProductDialog } from "./components/create-product-dialog";
import { EditProductDialog } from "./components/edit-product-dialog";
import {
	ProductFilters,
	type ProductFilters as ProductFiltersType,
} from "./components/product-filters";

export default function ProductsPage() {
	const { activeOrganization, loaded } = useActiveOrganization();
	const [allData, setAllData] = useState<ProductRecord[]>([]);
	const [filteredData, setFilteredData] = useState<ProductRecord[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [editingProduct, setEditingProduct] = useState<ProductRecord | null>(
		null,
	);
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [currentFilters, setCurrentFilters] = useState<ProductFiltersType>(
		{},
	);

	const fetchData = async () => {
		if (!activeOrganization?.id) {
			return;
		}

		setIsLoading(true);
		try {
			const response = await fetch(
				`/api/organizations/products?organizationId=${activeOrganization.id}`,
				{
					method: "GET",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
					},
				},
			);

			if (response.ok) {
				const result = await response.json();
				const products = result.products || [];
				setAllData(products);
				setFilteredData(products);
			} else {
				console.error("獲取產品數據失敗", await response.text());
				setAllData([]);
				setFilteredData([]);
			}
		} catch (error) {
			console.error("獲取數據失敗:", error);
			setAllData([]);
			setFilteredData([]);
		} finally {
			setIsLoading(false);
		}
	};

	const handleEdit = (productRecord: ProductRecord) => {
		setEditingProduct(productRecord);
		setEditDialogOpen(true);
	};

	const handleEditSuccess = () => {
		fetchData();
		setEditingProduct(null);
	};

	const handleFilterChange = (newFilteredData: ProductRecord[]) => {
		setFilteredData(newFilteredData);
	};

	const handleFiltersChange = (filters: ProductFiltersType) => {
		setCurrentFilters(filters);
	};

	const columns = createColumns(handleEdit);

	useEffect(() => {
		if (activeOrganization?.id && loaded) {
			fetchData();
		}
	}, [activeOrganization?.id, loaded]);

	if (!loaded) {
		return (
			<div className="container max-w-6xl space-y-8 py-6">
				<div className="animate-pulse">
					<div className="h-8 bg-gray-200 rounded w-1/4 mb-2" />
					<div className="h-4 bg-gray-200 rounded w-1/2" />
				</div>
			</div>
		);
	}

	return (
		<div className="container max-w-6xl space-y-8 py-6">
			<PageHeader
				title="產品列表"
				subtitle="管理所有產品資料"
				actions={
					activeOrganization && (
						<CreateProductDialog
							organizationId={activeOrganization.id}
							onSuccess={fetchData}
						/>
					)
				}
			/>

			<ProductFilters
				data={allData}
				onFilterChange={handleFilterChange}
				onFiltersChange={handleFiltersChange}
			/>

			<DataTable
				columns={columns}
				data={filteredData}
				isLoading={isLoading}
			/>

			{editingProduct && (
				<EditProductDialog
					productRecord={editingProduct}
					open={editDialogOpen}
					onOpenChange={setEditDialogOpen}
					onSuccess={handleEditSuccess}
				/>
			)}
		</div>
	);
}
