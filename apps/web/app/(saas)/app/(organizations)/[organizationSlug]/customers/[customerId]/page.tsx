"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { Edit2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { BankAccountsTable } from "../../bank-accounts/components/bank-accounts-table";
import type { BankAccountRecord } from "../../bank-accounts/components/columns";
import { CreateBankAccountDialog } from "../../bank-accounts/components/create-bank-account-dialog";
import { EditBankAccountDialog } from "../../bank-accounts/components/edit-bank-account-dialog";
import { ProductsTable } from "../../products/components/products-table";
import type { CustomerRecord } from "../components/columns";
import { EditCustomerDialog } from "../components/edit-customer-dialog";
import { AssetTransactionsTable } from "./components/asset-transactions/asset-transactions-table";

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

	// 使用 nuqs 管理分頁狀態
	const [activeTab, setActiveTab] = useQueryState("tab", {
		defaultValue: "products",
		parse: (value) => {
			// 驗證分頁值是否有效
			if (["products", "accounts", "assets"].includes(value)) {
				return value;
			}
			return "products";
		},
	});

	const [customer, setCustomer] = useState<CustomerRecord | null>(null);
	const [products, setProducts] = useState<Product[]>([]);
	const [relationshipManagers, setRelationshipManagers] = useState<
		RelationshipManager[]
	>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [bankAccounts, setBankAccounts] = useState<BankAccountRecord[]>([]);
	const [isBankAccountsLoading, setIsBankAccountsLoading] = useState(false);
	const [editBankAccount, setEditBankAccount] =
		useState<BankAccountRecord | null>(null);
	const [createDialogOpen, setCreateDialogOpen] = useState(false);

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

	const fetchBankAccounts = async () => {
		if (!activeOrganization?.id) return;
		setIsBankAccountsLoading(true);
		try {
			const response = await fetch(
				`/api/organizations/bank-accounts?customerId=${customerId}&organizationId=${activeOrganization.id}`,
			);
			if (response.ok) {
				const result = await response.json();
				setBankAccounts(result.data || []);
			}
		} catch (e) {
			console.error("獲取銀行帳戶失敗:", e);
			setBankAccounts([]);
		} finally {
			setIsBankAccountsLoading(false);
		}
	};

	useEffect(() => {
		if (activeOrganization?.id) {
			fetchCustomerData();
			fetchCustomerProducts();
			fetchRelationshipManagers();
			fetchBankAccounts();
		}
	}, [activeOrganization?.id, customerId]);

	const handleEditSuccess = () => {
		fetchCustomerData();
		setEditDialogOpen(false);
	};

	// 處理分頁變更
	const handleTabChange = (value: string) => {
		setActiveTab(value);
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
				subtitle={`客戶編號: ${customer.code}`}
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
									客戶編號
								</dt>
								<dd className="mt-1 text-sm text-gray-900 font-mono">
									{customer.code}
								</dd>
							</div>
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

				{/* 銀行帳戶、產品和資產總表標籤頁 */}
				<Tabs
					value={activeTab}
					onValueChange={handleTabChange}
					className="w-full"
				>
					<TabsList>
						<TabsTrigger value="products">持有產品</TabsTrigger>
						<TabsTrigger value="accounts">銀行帳戶</TabsTrigger>
						<TabsTrigger value="assets">資產總表</TabsTrigger>
					</TabsList>
					<TabsContent value="accounts">
						<Card>
							<CardHeader className="flex flex-row items-center justify-between">
								<CardTitle>銀行帳戶</CardTitle>
								{activeOrganization?.id && (
									<CreateBankAccountDialog
										onSuccess={fetchBankAccounts}
										organizationId={activeOrganization.id}
										customerId={customerId}
										customerCode={customer.code}
										dialogTitle="新增銀行帳戶"
									/>
								)}
							</CardHeader>
							<CardContent className="pt-6">
								<BankAccountsTable
									bankAccounts={bankAccounts}
									onEdit={(record) => {
										setEditBankAccount(record);
										setEditDialogOpen(true);
									}}
									customerId={customerId}
								/>
							</CardContent>
						</Card>
						{editBankAccount && (
							<EditBankAccountDialog
								bankAccountRecord={editBankAccount}
								open={editDialogOpen}
								onOpenChange={setEditDialogOpen}
								onSuccess={() => {
									fetchBankAccounts();
									setEditBankAccount(null);
								}}
								customerCode={customer.code}
								customerName={customer.name}
								dialogTitle="編輯銀行帳戶"
							/>
						)}
					</TabsContent>
					<TabsContent value="products">
						<Card>
							<CardContent className="pt-6">
								<ProductsTable products={products} />
							</CardContent>
						</Card>
					</TabsContent>
					<TabsContent value="assets">
						<AssetTransactionsTable customerId={customerId} />
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
