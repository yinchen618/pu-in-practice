import { useEffect, useState } from "react";
import type {
	BankAccount,
	Customer,
	Product,
	RelationshipManager,
} from "./types";

interface UseBaseDataProps {
	organizationId: string;
	open: boolean;
}

export const useBaseData = ({ organizationId, open }: UseBaseDataProps) => {
	const [customers, setCustomers] = useState<Customer[]>([]);
	const [products, setProducts] = useState<Product[]>([]);
	const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
	const [allRMs, setAllRMs] = useState<RelationshipManager[]>([]);
	const [allFinders, setAllFinders] = useState<RelationshipManager[]>([]);
	const [isLoadingRMsAndFinders, setIsLoadingRMsAndFinders] = useState(false);

	// 載入所有 RM 和 Finder 資料的函數
	const fetchAllRMsAndFinders = async () => {
		if (!organizationId) {
			console.error("❌ 缺少 organizationId，無法載入 RM 和 Finder 資料");
			return;
		}

		setIsLoadingRMsAndFinders(true);
		try {
			// 並行載入 RM 和 Finder 資料
			const [rmsResponse, findersResponse] = await Promise.all([
				fetch(
					`/api/organizations/relationship-managers?organizationId=${organizationId}`,
				),
				fetch(
					`/api/organizations/relationship-managers?organizationId=${organizationId}&type=finder`,
				),
			]);

			if (!rmsResponse.ok) {
				throw new Error(`載入 RM 資料失敗: ${rmsResponse.status}`);
			}
			if (!findersResponse.ok) {
				throw new Error(
					`載入 Finder 資料失敗: ${findersResponse.status}`,
				);
			}

			const rmsData = await rmsResponse.json();
			const findersData = await findersResponse.json();

			setAllRMs(rmsData.relationshipManagers || []);
			setAllFinders(findersData.relationshipManagers || []);
		} catch (error) {
			console.error("❌ 載入 RM 和 Finder 資料時發生錯誤:", error);
			setAllRMs([]);
			setAllFinders([]);
		} finally {
			setIsLoadingRMsAndFinders(false);
		}
	};

	// 載入其他基礎資料的函數
	const fetchInitialData = async () => {
		if (!organizationId) {
			return;
		}

		try {
			const [customersRes, productsRes, bankAccountsRes] =
				await Promise.all([
					fetch(
						`/api/organizations/customers?organizationId=${organizationId}`,
					),
					fetch(
						`/api/organizations/products?organizationId=${organizationId}`,
					),
					fetch(
						`/api/organizations/bank-accounts?organizationId=${organizationId}`,
					),
				]);

			if (customersRes.ok) {
				const customersData = await customersRes.json();
				setCustomers(customersData.customers || []);
			}

			if (productsRes.ok) {
				const productsData = await productsRes.json();
				setProducts(productsData.products || []);
			}

			if (bankAccountsRes.ok) {
				const bankAccountsData = await bankAccountsRes.json();
				setBankAccounts(bankAccountsData.bankAccounts || []);
			}
		} catch (error) {
			console.error("載入基礎資料時發生錯誤:", error);
		}
	};

	// 當對話框打開且有 organizationId 時載入資料
	useEffect(() => {
		if (open && organizationId) {
			fetchAllRMsAndFinders();
			fetchInitialData();
		}
	}, [open, organizationId]);

	// 載入特定客戶的銀行帳戶
	const fetchBankAccounts = async (customerId?: string) => {
		if (!customerId || !organizationId) {
			return;
		}

		try {
			const response = await fetch(
				`/api/organizations/bank-accounts?organizationId=${organizationId}&customerId=${customerId}`,
			);

			if (response.ok) {
				const data = await response.json();
				setBankAccounts(data.bankAccounts || []);
			}
		} catch (error) {
			console.error("載入銀行帳戶時發生錯誤:", error);
		}
	};

	// 設定客戶相關的 RM 資訊
	const fetchRMsAndFinders = async (_customer: Customer) => {
		// 這個函數可以用來設定表單的默認 RM 值
		// 暫時為空實作，可根據需要擴展
	};

	return {
		customers,
		products,
		bankAccounts,
		allRMs,
		allFinders,
		isLoadingRMsAndFinders,
		fetchBankAccounts,
		fetchRMsAndFinders,
	};
};
