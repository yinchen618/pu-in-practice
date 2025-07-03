"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { Edit2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BankAccountsTable } from "../../bank-accounts/components/bank-accounts-table";
import { ProductsTable } from "../../products/components/products-table";
import type { CustomerRecord } from "../components/columns";
import { EditCustomerDialog } from "../components/edit-customer-dialog";

interface Product {
	id: string;
	name: string;
	code: string;
	category: string;
	price: number | null;
	currency: string | null;
	status: string;
}

interface RelationshipManager {
	id: string;
	name: string;
	category: "RM" | "FINDER" | "BOTH";
}

export default function CustomerProfilePage() {
	const { activeOrganization } = useActiveOrganization();
	const params = useParams();
	const customerId = params.customerId as string;

	const [customer, setCustomer] = useState<CustomerRecord | null>(null);
	const [products, setProducts] = useState<Product[]>([]);
	const [relationshipManagers, setRelationshipManagers] = useState<
		RelationshipManager[]
	>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [editDialogOpen, setEditDialogOpen] = useState(false);

	const fetchCustomerData = async () => {
		if (!activeOrganization?.id) return;

		setIsLoading(true);
		try {
			const response = await fetch(
				`/api/organizations/customers/${customerId}?organizationId=${activeOrganization.id}`,
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
				setCustomer(result.customer);
			}
		} catch (error) {
			console.error("獲取客戶資料失敗:", error);
		}
	};

	const fetchCustomerProducts = async () => {
		if (!activeOrganization?.id) return;

		try {
			const response = await fetch(
				`/api/organizations/customers/${customerId}/products?organizationId=${activeOrganization.id}`,
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
				setProducts(result.data || []);
			}
		} catch (error) {
			console.error("獲取客戶產品失敗:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const fetchRelationshipManagers = async () => {
		if (!activeOrganization?.id) return;

		try {
			const response = await fetch(
				`/api/organizations/customers?organizationId=${activeOrganization.id}`,
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
				setRelationshipManagers(result.relationshipManagers || []);
			}
		} catch (error) {
			console.error("獲取關係經理列表失敗:", error);
		}
	};

	useEffect(() => {
		if (activeOrganization?.id) {
			fetchCustomerData();
			fetchCustomerProducts();
			fetchRelationshipManagers();
		}
	}, [activeOrganization?.id, customerId]);

	const handleEditSuccess = () => {
		fetchCustomerData();
		setEditDialogOpen(false);
	};

	if (isLoading || !customer) {
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
		<div className="container space-y-8 py-6">
			<PageHeader
				title={customer.name}
				subtitle={`客戶資料 #${customer.id}`}
				actions={
					<Button onClick={() => setEditDialogOpen(true)}>
						<Edit2 className="mr-2 size-4" />
						編輯資料
					</Button>
				}
			/>

			<div className="grid gap-6">
				{/* 基本資料卡片 */}
				<Card>
					<CardHeader>
						<CardTitle>基本資料</CardTitle>
					</CardHeader>
					<CardContent>
						<dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div>
								<dt className="text-sm font-medium text-gray-500">
									電子郵件
								</dt>
								<dd className="mt-1 text-sm text-gray-900">
									{customer.email}
								</dd>
							</div>
							<div>
								<dt className="text-sm font-medium text-gray-500">
									電話
								</dt>
								<dd className="mt-1 text-sm text-gray-900">
									{customer.phone || "-"}
								</dd>
							</div>
						</dl>
					</CardContent>
				</Card>

				{/* 客戶關係經理卡片 */}
				<Card>
					<CardHeader>
						<CardTitle>客戶關係經理</CardTitle>
					</CardHeader>
					<CardContent>
						<dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div>
								<dt className="text-sm font-medium text-gray-500">
									負責 RM1
								</dt>
								<dd className="mt-1 text-sm text-gray-900">
									{customer.rm1Name || "-"}
									{customer.rm1ProfitShare && (
										<span className="text-gray-500 ml-2">
											({customer.rm1ProfitShare}%)
										</span>
									)}
								</dd>
							</div>
							<div>
								<dt className="text-sm font-medium text-gray-500">
									負責 RM2
								</dt>
								<dd className="mt-1 text-sm text-gray-900">
									{customer.rm2Name || "-"}
									{customer.rm2ProfitShare && (
										<span className="text-gray-500 ml-2">
											({customer.rm2ProfitShare}%)
										</span>
									)}
								</dd>
							</div>
							<div>
								<dt className="text-sm font-medium text-gray-500">
									負責 Finder1
								</dt>
								<dd className="mt-1 text-sm text-gray-900">
									{customer.finder1Name || "-"}
									{customer.finder1ProfitShare && (
										<span className="text-gray-500 ml-2">
											({customer.finder1ProfitShare}%)
										</span>
									)}
								</dd>
							</div>
							<div>
								<dt className="text-sm font-medium text-gray-500">
									負責 Finder2
								</dt>
								<dd className="mt-1 text-sm text-gray-900">
									{customer.finder2Name || "-"}
									{customer.finder2ProfitShare && (
										<span className="text-gray-500 ml-2">
											({customer.finder2ProfitShare}%)
										</span>
									)}
								</dd>
							</div>
						</dl>
					</CardContent>
				</Card>

				{/* 銀行帳戶和產品標籤頁 */}
				<Tabs defaultValue="accounts" className="w-full">
					<TabsList>
						<TabsTrigger value="products">產品</TabsTrigger>
						<TabsTrigger value="accounts">銀行帳戶</TabsTrigger>
					</TabsList>
					<TabsContent value="accounts">
						<Card>
							<CardContent className="pt-6">
								<BankAccountsTable
									bankAccounts={customer.bankAccounts || []}
								/>
							</CardContent>
						</Card>
					</TabsContent>
					<TabsContent value="products">
						<Card>
							<CardContent className="pt-6">
								<ProductsTable products={products} />
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>

			<EditCustomerDialog
				customerRecord={customer}
				relationshipManagers={relationshipManagers}
				open={editDialogOpen}
				onOpenChange={setEditDialogOpen}
				onSuccess={handleEditSuccess}
			/>
		</div>
	);
}
