"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { Button } from "@ui/components/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { Edit2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useQueryState } from "nuqs";
import { useEffect, useMemo, useState } from "react";
import type { BankAccountRecord } from "../../bank-accounts/components/columns";
import { createColumns } from "../../profit-sharing/components/columns";
import type { ProfitSharingRecord } from "../../profit-sharing/components/columns";
import type { CustomerRecord } from "../components/columns";
import { EditCustomerDialog } from "../components/edit-customer-dialog";
import { CustomerAssetsTab } from "./components/customer-assets-tab";
import { CustomerBalanceSummaryCard } from "./components/customer-balance-summary-card";
import { CustomerBankAccountsTab } from "./components/customer-bank-accounts-tab";
import { CustomerBasicInfoCard } from "./components/customer-basic-info-card";
import { CustomerProfitSharingTab } from "./components/customer-profit-sharing-tab";
import { CustomerRMInfoCard } from "./components/customer-rm-info-card";

interface Product {
	id: string;
	name: string;
	code: string;
	category: string;
	currency: string;
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
		defaultValue: "profit-sharing",
		parse: (value) => {
			if (["profit-sharing", "accounts", "assets"].includes(value)) {
				return value;
			}
			return "profit-sharing";
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

	// 分潤一覽專用 state
	const [allProfitData, setAllProfitData] = useState<ProfitSharingRecord[]>(
		[],
	);
	const [filteredProfitData, setFilteredProfitData] = useState<
		ProfitSharingRecord[]
	>([]);
	const [isProfitLoading, setIsProfitLoading] = useState(true);

	const [assetSummary, setAssetSummary] = useState<
		{
			currency: string;
			balance: number;
			inAmount: number;
			outAmount: number;
		}[]
	>([]);
	const [isAssetSummaryLoading, setIsAssetSummaryLoading] = useState(false);

	const fetchCustomerData = async () => {
		if (!activeOrganization?.id) {
			return;
		}

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
		if (!activeOrganization?.id) {
			return;
		}

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
		if (!activeOrganization?.id) {
			return;
		}

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
		if (!activeOrganization?.id) {
			return;
		}
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

	const fetchAssetSummary = async () => {
		if (!activeOrganization?.id) return;
		setIsAssetSummaryLoading(true);
		try {
			const response = await fetch(
				`/api/organizations/asset-summary?organizationId=${activeOrganization.id}&customerId=${customerId}`,
				{
					method: "GET",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
				},
			);
			if (response.ok) {
				const result = await response.json();
				setAssetSummary(result.summary || []);
			}
		} catch (e) {
			setAssetSummary([]);
		} finally {
			setIsAssetSummaryLoading(false);
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

	useEffect(() => {
		if (!activeOrganization?.id || !customerId) return;
		setIsProfitLoading(true);
		fetch(
			`/api/organizations/profit-sharing?organizationId=${activeOrganization.id}&customerId=${customerId}`,
			{
				credentials: "include",
			},
		)
			.then((res) => res.json())
			.then((res) => {
				setAllProfitData(res.data || []);
				setFilteredProfitData(res.data || []);
			})
			.finally(() => setIsProfitLoading(false));
	}, [activeOrganization?.id, customerId]);

	useEffect(() => {
		if (activeOrganization?.id && customerId) {
			fetchAssetSummary();
		}
	}, [activeOrganization?.id, customerId]);

	const columns = useMemo(() => {
		const all = createColumns(() => {}, params.organizationSlug as string);

		return [
			...all.filter(
				(col) =>
					(col as any).accessorKey !== "customerName" &&
					(col as any).accessorKey !== "customerCode" &&
					(col as any).id !== "customerName" &&
					(col as any).id !== "customerCode",
			),
		];
	}, [params.organizationSlug]);

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
				title={customer?.name || ""}
				subtitle={`客戶編號: ${customer?.code || ""}`}
				actions={
					<Button onClick={() => setEditDialogOpen(true)}>
						<Edit2 className="mr-2 size-4" />
						編輯資料
					</Button>
				}
			/>

			<div className="grid gap-6">
				<CustomerBasicInfoCard customer={customer} />
				<CustomerRMInfoCard customer={customer} />
				<CustomerBalanceSummaryCard
					balances={assetSummary}
					isLoading={isAssetSummaryLoading}
				/>
				<Tabs
					value={activeTab}
					onValueChange={setActiveTab}
					className="w-full"
				>
					<TabsList>
						<TabsTrigger value="profit-sharing">
							分潤一覽
						</TabsTrigger>
						<TabsTrigger value="accounts">銀行帳戶</TabsTrigger>
						<TabsTrigger value="assets">資產總表</TabsTrigger>
					</TabsList>
					<TabsContent value="profit-sharing">
						<CustomerProfitSharingTab
							allProfitData={allProfitData}
							filteredProfitData={filteredProfitData}
							isProfitLoading={isProfitLoading}
							columns={columns}
							onFilterChange={setFilteredProfitData}
						/>
					</TabsContent>
					<TabsContent value="accounts">
						<CustomerBankAccountsTab
							bankAccounts={bankAccounts}
							isLoading={isBankAccountsLoading}
							onEdit={(record) => {
								setEditBankAccount(record);
								setEditDialogOpen(true);
							}}
							onCreate={fetchBankAccounts}
							activeOrganizationId={activeOrganization?.id || ""}
							customerId={customerId}
							customerCode={customer?.code || ""}
							customerName={customer?.name || ""}
							editDialogOpen={editDialogOpen}
							setEditDialogOpen={setEditDialogOpen}
							editBankAccount={editBankAccount}
							onEditSuccess={() => {
								fetchBankAccounts();
								setEditBankAccount(null);
							}}
						/>
					</TabsContent>
					<TabsContent value="assets">
						<CustomerAssetsTab customerId={customerId} />
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
