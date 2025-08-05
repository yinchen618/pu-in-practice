import { useCallback, useEffect, useState } from "react";
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

	// 載入狀態
	const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
	const [isLoadingProducts, setIsLoadingProducts] = useState(false);
	const [isLoadingBankAccounts, setIsLoadingBankAccounts] = useState(false);
	const [isLoadingRMsAndFinders, setIsLoadingRMsAndFinders] = useState(false);

	// 載入所有 RM 和 Finder 資料的函數
	const fetchAllRMsAndFinders = async () => {
		if (!organizationId) {
			console.error("❌ 缺少 organizationId，無法載入 RM 和 Finder 資料");
			return;
		}

		// console.log("🔄 開始載入 RM 和 Finder 資料...", { organizationId });
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

			// console.log("📡 RM API 回應狀態:", {
			// 	status: rmsResponse.status,
			// 	ok: rmsResponse.ok,
			// });
			// console.log("📡 Finder API 回應狀態:", {
			// 	status: findersResponse.status,
			// 	ok: findersResponse.ok,
			// });

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

			// console.log("✅ RM 資料載入成功:", {
			// 	count: rmsData.relationshipManagers?.length || 0,
			// 	data: rmsData,
			// });
			// console.log("✅ Finder 資料載入成功:", {
			// 	count: findersData.relationshipManagers?.length || 0,
			// 	data: findersData,
			// });

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
			console.log("❌ 缺少 organizationId，無法載入基礎資料");
			return;
		}

		// console.log("🔄 開始載入基礎資料...", { organizationId });
		setIsLoadingCustomers(true);
		setIsLoadingProducts(true);

		try {
			const [customersRes, productsRes] = await Promise.all([
				fetch(
					`/api/organizations/customers?organizationId=${organizationId}`,
				),
				fetch(
					`/api/organizations/products?organizationId=${organizationId}`,
				),
			]);

			// console.log("📡 客戶 API 回應狀態:", {
			// 	status: customersRes.status,
			// 	ok: customersRes.ok,
			// });
			// console.log("📡 產品 API 回應狀態:", {
			// 	status: productsRes.status,
			// 	ok: productsRes.ok,
			// });

			if (customersRes.ok) {
				const customersData = await customersRes.json();
				// console.log("✅ 客戶資料載入成功:", {
				// 	count: customersData.customers?.length || 0,
				// 	data: customersData,
				// });
				setCustomers(customersData.customers || []);
			} else {
				console.error("❌ 客戶資料載入失敗:", customersRes.status);
				setCustomers([]);
			}

			if (productsRes.ok) {
				const productsData = await productsRes.json();
				// console.log("✅ 產品資料載入成功:", {
				// 	count: productsData.products?.length || 0,
				// 	data: productsData,
				// });
				setProducts(productsData.products || []);
			} else {
				console.error("❌ 產品資料載入失敗:", productsRes.status);
				setProducts([]);
			}

			// 不在初始時載入銀行帳戶，只有選擇客戶後才載入
			// console.log("🔄 初始設定：清空銀行帳戶列表");
			setBankAccounts([]);
		} catch (error) {
			console.error("❌ 載入基礎資料時發生錯誤:", error);
			setCustomers([]);
			setProducts([]);
			setBankAccounts([]);
		} finally {
			setIsLoadingCustomers(false);
			setIsLoadingProducts(false);
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
	const fetchBankAccounts = useCallback(
		async (customerId?: string) => {
			if (!customerId || !organizationId) {
				// 如果沒有客戶ID，清空銀行帳戶列表
				setBankAccounts([]);
				setIsLoadingBankAccounts(false);
				return;
			}

			setIsLoadingBankAccounts(true);
			try {
				const url = `/api/organizations/bank-accounts?organizationId=${organizationId}&customerId=${customerId}`;
				// console.log("📡 銀行帳戶 API 請求:", url);

				const response = await fetch(url);

				// console.log("📡 銀行帳戶 API 回應狀態:", {
				// 	status: response.status,
				// 	ok: response.ok,
				// });

				if (response.ok) {
					const data = await response.json();
					// console.log("✅ 銀行帳戶原始資料:", data);
					// console.log(
					// 	"✅ 銀行帳戶類型檢查:",
					// 	typeof data,
					// 	Array.isArray(data),
					// );

					// 檢查資料結構並正確提取銀行帳戶列表
					let bankAccountsArray = [];
					if (Array.isArray(data)) {
						// 如果 data 直接是陣列
						bankAccountsArray = data;
					} else if (
						data?.bankAccounts &&
						Array.isArray(data.bankAccounts)
					) {
						// 如果 data 有 bankAccounts 屬性
						bankAccountsArray = data.bankAccounts;
					} else if (data?.data && Array.isArray(data.data)) {
						// 如果 data 有 data 屬性
						bankAccountsArray = data.data;
					}

					// console.log("✅ 最終銀行帳戶資料:", {
					// 	count: bankAccountsArray.length,
					// 	accounts: bankAccountsArray,
					// });
					setBankAccounts(bankAccountsArray);
				} else {
					// 如果請求失敗，清空列表
					console.error("❌ 銀行帳戶資料載入失敗:", response.status);
					const errorText = await response.text();
					console.error("❌ 錯誤詳情:", errorText);
					setBankAccounts([]);
				}
			} catch (error) {
				console.error("❌ 載入銀行帳戶時發生錯誤:", error);
				setBankAccounts([]);
			} finally {
				setIsLoadingBankAccounts(false);
			}
		},
		[organizationId],
	);

	// 設定客戶相關的 RM 資訊
	const fetchRMsAndFinders = useCallback(async (customer: Customer) => {
		// 這個函數可以用來設定表單的默認 RM 值
		// 暫時為空實作，可根據需要擴展
		// console.log("🔄 設定客戶的 RM 和 Finder 資訊:", customer);
	}, []);

	return {
		customers,
		products,
		bankAccounts,
		allRMs,
		allFinders,
		// 載入狀態
		isLoadingCustomers,
		isLoadingProducts,
		isLoadingBankAccounts,
		isLoadingRMsAndFinders,
		// 函數
		fetchBankAccounts,
		fetchRMsAndFinders,
	};
};
