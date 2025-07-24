"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PercentageInput } from "@shared/components/PercentageInput";
import { SearchableSelect } from "@shared/components/SearchableSelect";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@ui/components/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@ui/components/form";
import { Input } from "@ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { cn } from "@ui/lib";
import { Plus, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useExchangeRate } from "../../../../../../../hooks/use-exchange-rate";
import { CURRENCY_OPTIONS } from "../../constants";

// 格式化函數
const formatCurrency = (value: number, currency: string) => {
	return `${currency} ${value.toLocaleString("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})}`;
};

const formatPercentage = (value: number) => {
	return `${value.toFixed(2)}%`;
};

const formatNumber = (value: number, decimals = 2) => {
	return value.toLocaleString("en-US", {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
	});
};

// 計算分潤金額的函數
const calculateProfitShare = (
	totalAmount: number,
	profitSharePercent: number,
) => {
	return Math.round(totalAmount * (profitSharePercent / 100) * 100) / 100;
};

// 添加驗證函數
const validateRMProfitSharePercentages = (rm1Share = 0, rm2Share = 0) => {
	const total = rm1Share + rm2Share;
	return Math.abs(total - 100) < 0.01;
};

const validateFinderProfitSharePercentages = (
	finder1Share = 0,
	finder2Share = 0,
) => {
	const total = finder1Share + finder2Share;
	return Math.abs(total - 100) < 0.01;
};

// 修改驗證函數，返回總和
const validateProfitSharePercentages = (
	companyPercent: number,
	rmPercent: number,
	finderPercent: number,
) => {
	const total = companyPercent + rmPercent + finderPercent;
	return {
		isValid: Math.abs(total - 100) < 0.01,
		total: total,
	};
};

const createSchema = z.object({
	customerId: z.string().min(1, "客戶是必填的"),
	productId: z.string().min(1, "產品是必填的"),
	bankAccountId: z.string().min(1, "銀行帳戶是必填的"),
	amount: z.number().min(0, "金額不能為負數"),
	profitDate: z.string().min(1, "分潤日期是必填的"),
	currency: z.string().min(1, "幣別是必填的"),
	companyRevenue: z.number().min(0, "Company revenue 不能為負數"),
	directTradeBookingFee: z
		.number()
		.min(0, "Direct trade booking fee 不能為負數"),
	bankRetroPercent: z.number().min(0).max(100), // 新增 Bank Retro(%)

	// 自動計算欄位
	shareable: z.number().min(0),
	rmProfitSharePercent: z.number().min(0).max(100),
	finderProfitSharePercent: z.number().min(0).max(100),
	companyProfitSharePercent: z.number().min(0).max(100),

	// RM1 資訊
	rm1Id: z.string().optional(),
	rm1Name: z.string().optional(),
	rm1ProfitSharePercent: z.number().min(0).max(100).optional(),
	rm1RevenueOriginal: z.number().min(0).optional(),
	rm1RevenueUSD: z.number().min(0).optional(),

	// RM2 資訊
	rm2Id: z.string().optional(),
	rm2Name: z.string().optional(),
	rm2ProfitSharePercent: z.number().min(0).max(100).optional(),
	rm2RevenueOriginal: z.number().min(0).optional(),
	rm2RevenueUSD: z.number().min(0).optional(),

	// Finder1 資訊
	finder1Id: z.string().optional(),
	finder1Name: z.string().optional(),
	finder1ProfitSharePercent: z.number().min(0).max(100).optional(),
	finder1RevenueOriginal: z.number().min(0).optional(),
	finder1RevenueUSD: z.number().min(0).optional(),

	// Finder2 資訊
	finder2Id: z.string().optional(),
	finder2Name: z.string().optional(),
	finder2ProfitSharePercent: z.number().min(0).max(100).optional(),
	finder2RevenueOriginal: z.number().min(0).optional(),
	finder2RevenueUSD: z.number().min(0).optional(),

	// 原幣金額
	rmRevenueOriginal: z.number().min(0),
	findersRevenueOriginal: z.number().min(0),
	companyRevenueOriginal: z.number().min(0),

	// 美金金額
	rmRevenueUSD: z.number().min(0),
	findersRevenueUSD: z.number().min(0),

	// 匯率
	fxRate: z.number().min(0, "FX Rate 不能為負數"),
});

type CreateFormData = z.infer<typeof createSchema>;

interface CreateDialogProps {
	organizationId: string;
	onSuccess?: () => void;
}

interface Customer {
	id: string;
	name: string;
	code: string;
	rm1Id: string | null;
	rm1ProfitShare: number | null;
	rm2Id: string | null;
	rm2ProfitShare: number | null;
	finder1Id: string | null;
	finder1ProfitShare: number | null;
	finder2Id: string | null;
	finder2ProfitShare: number | null;
	rm1Name?: string;
	finder1Name?: string;
	finder2Name?: string;
	rm2Name?: string;
}

interface RelationshipManager {
	id: string;
	name: string;
}

interface Product {
	id: string;
	name: string;
	code: string;
	category: string;
}

interface BankAccount {
	id: string;
	bankName: string;
	accountName: string;
	accountNumber: string;
	currency: string;
	status: string;
}

export function CreateProfitSharingDialog({
	organizationId,
	onSuccess,
}: CreateDialogProps) {
	const [open, setOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isLoadingRMsAndFinders, setIsLoadingRMsAndFinders] = useState(false);
	const [customers, setCustomers] = useState<Customer[]>([]);
	const [products, setProducts] = useState<Product[]>([]);
	const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
	const [allRMs, setAllRMs] = useState<RelationshipManager[]>([]);
	const [allFinders, setAllFinders] = useState<RelationshipManager[]>([]);

	const [selectedCustomerRMs, setSelectedCustomerRMs] = useState<{
		rm1?: { id: string; name: string; profitShare: number };
		rm2?: { id: string; name: string; profitShare: number };
		finder1?: { id: string; name: string; profitShare: number };
		finder2?: { id: string; name: string; profitShare: number };
	}>({});

	// 獲取今天的日期字符串（YYYY-MM-DD格式）
	const today = new Date().toISOString().split("T")[0];

	const form = useForm<CreateFormData>({
		resolver: zodResolver(createSchema),
		defaultValues: {
			currency: "USD",
			companyRevenue: 0,
			directTradeBookingFee: 0,
			bankRetroPercent: 50, // 新增 Bank Retro(%) 預設值
			shareable: 0,
			rmProfitSharePercent: 50,
			finderProfitSharePercent: 0,
			companyProfitSharePercent: 50,
			fxRate: 1,
			amount: 0,
			rmRevenueOriginal: 0,
			findersRevenueOriginal: 0,
			companyRevenueOriginal: 0,
			rmRevenueUSD: 0,
			findersRevenueUSD: 0,
			profitDate: today,

			// RM1 資訊
			rm1Id: undefined,
			rm1Name: undefined,
			rm1ProfitSharePercent: undefined,
			rm1RevenueOriginal: 0,
			rm1RevenueUSD: 0,

			// RM2 資訊
			rm2Id: undefined,
			rm2Name: undefined,
			rm2ProfitSharePercent: undefined,
			rm2RevenueOriginal: 0,
			rm2RevenueUSD: 0,

			// Finder1 資訊
			finder1Id: undefined,
			finder1Name: undefined,
			finder1ProfitSharePercent: undefined,
			finder1RevenueOriginal: 0,
			finder1RevenueUSD: 0,

			// Finder2 資訊
			finder2Id: undefined,
			finder2Name: undefined,
			finder2ProfitSharePercent: undefined,
			finder2RevenueOriginal: 0,
			finder2RevenueUSD: 0,
		},
	});

	// 監聽表單中的日期和幣別變化
	const watchedDate = form.watch("profitDate");
	const watchedCurrency = form.watch("currency");

	// 使用匯率hook
	const {
		data: exchangeRateData,
		loading: exchangeRateLoading,
		error: exchangeRateError,
	} = useExchangeRate({
		date: watchedDate || today,
		enabled: open, // 只有當對話框打開時才啟用
		useUsdRates: true, // 使用 USD 匯率
	});

	// 當匯率數據變化時，自動更新表單中的匯率欄位
	useEffect(() => {
		if (watchedCurrency === "USD") {
			// 如果是USD，直接設定匯率為1
			form.setValue("fxRate", 1);
		} else if (exchangeRateData?.rates && open) {
			// 其他幣別則直接使用API獲取的匯率
			const rate = exchangeRateData.rates[watchedCurrency];
			if (rate) {
				form.setValue("fxRate", Number(rate.toFixed(5)));
			}
		}
	}, [exchangeRateData, form, open, watchedCurrency]);

	// 監聽收入和費用的變化，計算總分潤金額
	useEffect(() => {
		const companyRevenue = form.watch("companyRevenue");
		const directTradeBookingFee = form.watch("directTradeBookingFee");
		const bankRetroPercent = form.watch("bankRetroPercent") || 50;

		// 新的計算邏輯
		// 可分潤金額1 = Company Revenue - Direct Trade Booking Fee
		const shareable1 = companyRevenue - directTradeBookingFee;
		// 可分潤金額2 = Direct Trade Booking Fee * Bank Retro(%)
		const shareable2 = (directTradeBookingFee * bankRetroPercent) / 100;
		// 總分潤金額 = 可分潤金額1 + 可分潤金額2
		const totalShareable = shareable1 + shareable2;

		form.setValue("shareable", totalShareable >= 0 ? totalShareable : 0);
	}, [
		form.watch("companyRevenue"),
		form.watch("directTradeBookingFee"),
		form.watch("bankRetroPercent"),
	]);

	// 監聽分潤比例的變化，即時更新各方的分潤金額
	useEffect(() => {
		const shareable = form.watch("shareable");
		const companyProfitSharePercent =
			form.watch("companyProfitSharePercent") || 0;
		const rmProfitSharePercent = form.watch("rmProfitSharePercent") || 0;
		const finderProfitSharePercent =
			form.watch("finderProfitSharePercent") || 0;
		const fxRate = form.watch("fxRate") || 1;

		// 計算各方分潤金額
		const rmRevenue = (shareable * rmProfitSharePercent) / 100;
		const findersRevenue = (shareable * finderProfitSharePercent) / 100;
		const companyRevenue = (shareable * companyProfitSharePercent) / 100;

		// 更新原幣分潤金額
		form.setValue("rmRevenueOriginal", Math.round(rmRevenue * 100) / 100);
		form.setValue(
			"findersRevenueOriginal",
			Math.round(findersRevenue * 100) / 100,
		);
		form.setValue(
			"companyRevenueOriginal",
			Math.round(companyRevenue * 100) / 100,
		);

		// 更新美金分潤金額
		form.setValue(
			"rmRevenueUSD",
			Math.round(rmRevenue * fxRate * 100) / 100,
		);
		form.setValue(
			"findersRevenueUSD",
			Math.round(findersRevenue * fxRate * 100) / 100,
		);

		// 更新個別 RM 和 Finder 的分潤金額
		const rm1ProfitSharePercent = form.watch("rm1ProfitSharePercent") || 0;
		const rm2ProfitSharePercent = form.watch("rm2ProfitSharePercent") || 0;
		const finder1ProfitSharePercent =
			form.watch("finder1ProfitSharePercent") || 0;
		const finder2ProfitSharePercent =
			form.watch("finder2ProfitSharePercent") || 0;

		// 計算並更新 RM1 的分潤金額
		const rm1Revenue = (rmRevenue * rm1ProfitSharePercent) / 100;
		form.setValue("rm1RevenueOriginal", Math.round(rm1Revenue * 100) / 100);
		form.setValue(
			"rm1RevenueUSD",
			Math.round(rm1Revenue * fxRate * 100) / 100,
		);

		// 計算並更新 RM2 的分潤金額
		const rm2Revenue = (rmRevenue * rm2ProfitSharePercent) / 100;
		form.setValue("rm2RevenueOriginal", Math.round(rm2Revenue * 100) / 100);
		form.setValue(
			"rm2RevenueUSD",
			Math.round(rm2Revenue * fxRate * 100) / 100,
		);

		// 計算並更新 Finder1 的分潤金額
		const finder1Revenue =
			(findersRevenue * finder1ProfitSharePercent) / 100;
		form.setValue(
			"finder1RevenueOriginal",
			Math.round(finder1Revenue * 100) / 100,
		);
		form.setValue(
			"finder1RevenueUSD",
			Math.round(finder1Revenue * fxRate * 100) / 100,
		);

		// 計算並更新 Finder2 的分潤金額
		const finder2Revenue =
			(findersRevenue * finder2ProfitSharePercent) / 100;
		form.setValue(
			"finder2RevenueOriginal",
			Math.round(finder2Revenue * 100) / 100,
		);
		form.setValue(
			"finder2RevenueUSD",
			Math.round(finder2Revenue * fxRate * 100) / 100,
		);
	}, [
		form.watch("shareable"),
		form.watch("companyProfitSharePercent"),
		form.watch("rmProfitSharePercent"),
		form.watch("finderProfitSharePercent"),
		form.watch("fxRate"),
		form.watch("rm1ProfitSharePercent"),
		form.watch("rm2ProfitSharePercent"),
		form.watch("finder1ProfitSharePercent"),
		form.watch("finder2ProfitSharePercent"),
	]);

	// 添加新的 useEffect 來處理分潤比例計算
	// useEffect(() => {
	// 	const rm1Percent = form.watch("rm1ProfitSharePercent") || 0;
	// 	const rm2Percent = form.watch("rm2ProfitSharePercent") || 0;
	// 	const finder1Percent = form.watch("finder1ProfitSharePercent") || 0;
	// 	const finder2Percent = form.watch("finder2ProfitSharePercent") || 0;

	// 	// 計算總分潤比例
	// 	const totalRMPercent = rm1Percent + rm2Percent;
	// 	const totalFinderPercent = finder1Percent + finder2Percent;
	// 	const companyPercent = 100 - totalRMPercent - totalFinderPercent;

	// 	// 更新分潤比例
	// 	form.setValue("rmProfitSharePercent", totalRMPercent);
	// 	form.setValue("finderProfitSharePercent", totalFinderPercent);
	// 	form.setValue("companyProfitSharePercent", companyPercent);
	// }, [
	// 	form,
	// 	form.watch("rm1ProfitSharePercent"),
	// 	form.watch("rm2ProfitSharePercent"),
	// 	form.watch("finder1ProfitSharePercent"),
	// 	form.watch("finder2ProfitSharePercent"),
	// ]);

	// 在 useEffect 中更新分潤金額
	useEffect(() => {
		const shareable = form.watch("shareable") || 0;
		const currency = form.watch("currency");
		const fxRate = form.watch("fxRate") || 1;
		const companyProfitSharePercent =
			form.watch("companyProfitSharePercent") || 0;
		const rmProfitSharePercent = form.watch("rmProfitSharePercent") || 0;
		const finderProfitSharePercent =
			form.watch("finderProfitSharePercent") || 0;

		// 計算原幣分潤金額
		const rmRevenue = (shareable * rmProfitSharePercent) / 100;
		const findersRevenue = (shareable * finderProfitSharePercent) / 100;
		const companyRevenue = (shareable * companyProfitSharePercent) / 100;
		// console.log(companyRevenue, shareable, companyProfitSharePercent);

		// 更新原幣分潤金額（四捨五入到小數點後兩位）
		form.setValue("rmRevenueOriginal", Math.round(rmRevenue * 100) / 100);
		form.setValue(
			"findersRevenueOriginal",
			Math.round(findersRevenue * 100) / 100,
		);
		form.setValue(
			"companyRevenueOriginal",
			Math.round(companyRevenue * 100) / 100,
		);

		// 計算美金分潤金額（四捨五入到小數點後兩位）
		form.setValue(
			"rmRevenueUSD",
			Math.round(rmRevenue * fxRate * 100) / 100,
		);
		form.setValue(
			"findersRevenueUSD",
			Math.round(findersRevenue * fxRate * 100) / 100,
		);

		// 計算個別 RM 和 Finder 的美金分潤金額
		const rm1ProfitSharePercent = form.watch("rm1ProfitSharePercent") || 0;
		const rm2ProfitSharePercent = form.watch("rm2ProfitSharePercent") || 0;
		const finder1ProfitSharePercent =
			form.watch("finder1ProfitSharePercent") || 0;
		const finder2ProfitSharePercent =
			form.watch("finder2ProfitSharePercent") || 0;

		if (rmProfitSharePercent > 0) {
			const rm1Revenue =
				(rmRevenue * rm1ProfitSharePercent) / rmProfitSharePercent;
			const rm2Revenue =
				(rmRevenue * rm2ProfitSharePercent) / rmProfitSharePercent;
			form.setValue(
				"rm1RevenueOriginal",
				Math.round(rm1Revenue * 100) / 100,
			);
			form.setValue(
				"rm2RevenueOriginal",
				Math.round(rm2Revenue * 100) / 100,
			);
			form.setValue(
				"rm1RevenueUSD",
				Math.round(rm1Revenue * fxRate * 100) / 100,
			);
			form.setValue(
				"rm2RevenueUSD",
				Math.round(rm2Revenue * fxRate * 100) / 100,
			);
		}

		if (finderProfitSharePercent > 0) {
			const finder1Revenue =
				(findersRevenue * finder1ProfitSharePercent) /
				finderProfitSharePercent;
			const finder2Revenue =
				(findersRevenue * finder2ProfitSharePercent) /
				finderProfitSharePercent;
			form.setValue(
				"finder1RevenueOriginal",
				Math.round(finder1Revenue * 100) / 100,
			);
			form.setValue(
				"finder2RevenueOriginal",
				Math.round(finder2Revenue * 100) / 100,
			);
			form.setValue(
				"finder1RevenueUSD",
				Math.round(finder1Revenue * fxRate * 100) / 100,
			);
			form.setValue(
				"finder2RevenueUSD",
				Math.round(finder2Revenue * fxRate * 100) / 100,
			);
		}
	}, [form]);

	// 獲取客戶、產品和銀行帳戶列表
	useEffect(() => {
		if (open) {
			fetchCustomers();
			fetchProducts();
			fetchAllRMsAndFinders();
		}
	}, [open]);

	const fetchCustomers = async () => {
		try {
			const response = await fetch(
				`/api/organizations/customers?organizationId=${organizationId}`,
				{
					method: "GET",
					credentials: "include",
				},
			);
			if (response.ok) {
				const result = await response.json();
				setCustomers(result.customers || []);

				// // 檢查是否有預設選擇的客戶
				// const customerId = form.getValues("customerId");
				// if (customerId) {
				// 	const selectedCustomer = result.customers?.find(
				// 		(c: Customer) => c.id === customerId,
				// 	);
				// 	if (selectedCustomer) {
				// 		const newSelectedRMs: typeof selectedCustomerRMs = {};

				// 		if (
				// 			selectedCustomer.finder1Id &&
				// 			selectedCustomer.finder1Name
				// 		) {
				// 			newSelectedRMs.finder1 = {
				// 				id: selectedCustomer.finder1Id,
				// 				name: selectedCustomer.finder1Name,
				// 				profitShare:
				// 					selectedCustomer.finder1ProfitShare || 0,
				// 			};
				// 		}

				// 		if (
				// 			selectedCustomer.finder2Id &&
				// 			selectedCustomer.finder2Name
				// 		) {
				// 			newSelectedRMs.finder2 = {
				// 				id: selectedCustomer.finder2Id,
				// 				name: selectedCustomer.finder2Name,
				// 				profitShare:
				// 					selectedCustomer.finder2ProfitShare || 0,
				// 			};
				// 		}

				// 		setSelectedCustomerRMs(newSelectedRMs);
				// 	}
				// }
			}
		} catch (error) {
			console.error("獲取客戶列表失敗:", error);
		}
	};

	const fetchProducts = async () => {
		try {
			const response = await fetch(
				`/api/organizations/products?organizationId=${organizationId}`,
				{
					method: "GET",
					credentials: "include",
				},
			);
			if (response.ok) {
				const result = await response.json();
				setProducts(result.products || []);
			}
		} catch (error) {
			console.error("獲取產品列表失敗:", error);
		}
	};

	const fetchAllRMsAndFinders = async () => {
		setIsLoadingRMsAndFinders(true);

		try {
			const url = `/api/organizations/relationship-managers?organizationId=${organizationId}`;

			const response = await fetch(url, {
				method: "GET",
				credentials: "include",
			});

			if (response.ok) {
				const result = await response.json();

				// 修正：API 回應的是 relationshipManagers，不是 data
				const data = result.relationshipManagers || result.data || [];

				// 分離 RM 和 Finder
				const rms = data.filter(
					(item: any) =>
						item.category === "RM" || item.category === "BOTH",
				);
				const finders = data.filter(
					(item: any) =>
						item.category === "FINDER" || item.category === "BOTH",
				);
				setAllRMs(rms);
				setAllFinders(finders);
			} else {
				console.error(
					"❌ API Response not ok:",
					response.status,
					response.statusText,
				);
			}
		} catch (error) {
			console.error("❌ 獲取 RM 和 Finder 列表失敗:", error);
		} finally {
			setIsLoadingRMsAndFinders(false);
		}
	};

	const fetchBankAccounts = async (customerId?: string) => {
		if (!customerId) {
			setBankAccounts([]);
			form.setValue("bankAccountId", "");
			return;
		}

		try {
			const response = await fetch(
				`/api/organizations/bank-accounts?organizationId=${organizationId}&customerId=${customerId}`,
				{
					method: "GET",
					credentials: "include",
				},
			);
			if (response.ok) {
				const result = await response.json();
				// 只顯示狀態為 active 的銀行帳戶
				const activeBankAccounts = (result.data || []).filter(
					(account: BankAccount) => account.status === "active",
				);
				setBankAccounts(activeBankAccounts);

				// 如果有可用的銀行帳戶，自動選擇第一個
				if (activeBankAccounts.length > 0) {
					form.setValue("bankAccountId", activeBankAccounts[0].id);
				} else {
					form.setValue("bankAccountId", "");
				}
			}
		} catch (error) {
			console.error("獲取銀行帳戶列表失敗:", error);
			setBankAccounts([]);
			form.setValue("bankAccountId", "");
		}
	};

	// 監聽客戶選擇變更
	useEffect(() => {
		const customerId = form.watch("customerId");
		console.log("客戶選擇變更:", customerId);

		if (customerId) {
			fetchBankAccounts(customerId);
			// 找到選中的客戶
			const selectedCustomer = customers.find((c) => c.id === customerId);
			console.log("選中的客戶:", selectedCustomer);

			if (selectedCustomer) {
				// 獲取 RM 和 Finder 資訊
				fetchRMsAndFinders(selectedCustomer);

				// 設置 RM 和 Finder 信息到表單
				console.log("=== 設置 RM 和 Finder 信息到表單 ===");

				// 設定 RM1 資訊
				if (selectedCustomer.rm1Id && selectedCustomer.rm1Name) {
					console.log("設置 RM1 信息到表單:", {
						id: selectedCustomer.rm1Id,
						name: selectedCustomer.rm1Name,
						profitShare: selectedCustomer.rm1ProfitShare || 0,
					});
					form.setValue("rm1Id", selectedCustomer.rm1Id);
					form.setValue("rm1Name", selectedCustomer.rm1Name);
					form.setValue(
						"rm1ProfitSharePercent",
						selectedCustomer.rm1ProfitShare || 0,
					);
				}

				// 設定 RM2 資訊
				if (selectedCustomer.rm2Id && selectedCustomer.rm2Name) {
					console.log("設置 RM2 信息到表單:", {
						id: selectedCustomer.rm2Id,
						name: selectedCustomer.rm2Name,
						profitShare: selectedCustomer.rm2ProfitShare || 0,
					});
					form.setValue("rm2Id", selectedCustomer.rm2Id);
					form.setValue("rm2Name", selectedCustomer.rm2Name);
					form.setValue(
						"rm2ProfitSharePercent",
						selectedCustomer.rm2ProfitShare || 0,
					);
				}

				// 設定 Finder1 資訊
				if (
					selectedCustomer.finder1Id &&
					selectedCustomer.finder1Name
				) {
					console.log("設置 Finder1 信息到表單:", {
						id: selectedCustomer.finder1Id,
						name: selectedCustomer.finder1Name,
						profitShare: selectedCustomer.finder1ProfitShare || 0,
					});
					form.setValue("finder1Id", selectedCustomer.finder1Id);
					form.setValue("finder1Name", selectedCustomer.finder1Name);
					form.setValue(
						"finder1ProfitSharePercent",
						selectedCustomer.finder1ProfitShare || 0,
					);
				}

				// 設定 Finder2 資訊
				if (
					selectedCustomer.finder2Id &&
					selectedCustomer.finder2Name
				) {
					console.log("設置 Finder2 信息到表單:", {
						id: selectedCustomer.finder2Id,
						name: selectedCustomer.finder2Name,
						profitShare: selectedCustomer.finder2ProfitShare || 0,
					});
					form.setValue("finder2Id", selectedCustomer.finder2Id);
					form.setValue("finder2Name", selectedCustomer.finder2Name);
					form.setValue(
						"finder2ProfitSharePercent",
						selectedCustomer.finder2ProfitShare || 0,
					);
				}
			}
		} else {
			setBankAccounts([]);
			form.setValue("bankAccountId", "");
			setSelectedCustomerRMs({});

			// 清空 RM 和 Finder 信息
			form.setValue("rm1Id", undefined);
			form.setValue("rm1Name", undefined);
			form.setValue("rm1ProfitSharePercent", undefined);
			form.setValue("rm2Id", undefined);
			form.setValue("rm2Name", undefined);
			form.setValue("rm2ProfitSharePercent", undefined);
			form.setValue("finder1Id", undefined);
			form.setValue("finder1Name", undefined);
			form.setValue("finder1ProfitSharePercent", undefined);
			form.setValue("finder2Id", undefined);
			form.setValue("finder2Name", undefined);
			form.setValue("finder2ProfitSharePercent", undefined);
		}
	}, [form.watch("customerId"), customers]);

	const fetchRMsAndFinders = async (customer: Customer) => {
		const newSelectedRMs: typeof selectedCustomerRMs = {};

		if (customer.rm1Id && customer.rm1Name) {
			newSelectedRMs.rm1 = {
				id: customer.rm1Id,
				name: customer.rm1Name,
				profitShare: customer.rm1ProfitShare || 0,
			};
		}

		if (customer.rm2Id && customer.rm2Name) {
			newSelectedRMs.rm2 = {
				id: customer.rm2Id,
				name: customer.rm2Name,
				profitShare: customer.rm2ProfitShare || 0,
			};
		}

		if (customer.finder1Id && customer.finder1Name) {
			newSelectedRMs.finder1 = {
				id: customer.finder1Id,
				name: customer.finder1Name,
				profitShare: customer.finder1ProfitShare || 0,
			};
		}

		if (customer.finder2Id && customer.finder2Name) {
			newSelectedRMs.finder2 = {
				id: customer.finder2Id,
				name: customer.finder2Name,
				profitShare: customer.finder2ProfitShare || 0,
			};
		}

		setSelectedCustomerRMs(newSelectedRMs);
	};

	const onSubmit = async (data: CreateFormData) => {
		console.log("=== 新增分潤記錄 - 提交數據 ===");
		console.log("完整表單數據:", data);
		console.log("RM1 相關欄位:", {
			rm1Id: data.rm1Id,
			rm1Name: data.rm1Name,
			rm1ProfitSharePercent: data.rm1ProfitSharePercent,
			rm1RevenueOriginal: data.rm1RevenueOriginal,
			rm1RevenueUSD: data.rm1RevenueUSD,
		});
		console.log("RM2 相關欄位:", {
			rm2Id: data.rm2Id,
			rm2Name: data.rm2Name,
			rm2ProfitSharePercent: data.rm2ProfitSharePercent,
			rm2RevenueOriginal: data.rm2RevenueOriginal,
			rm2RevenueUSD: data.rm2RevenueUSD,
		});
		console.log("Finder1 相關欄位:", {
			finder1Id: data.finder1Id,
			finder1Name: data.finder1Name,
			finder1ProfitSharePercent: data.finder1ProfitSharePercent,
			finder1RevenueOriginal: data.finder1RevenueOriginal,
			finder1RevenueUSD: data.finder1RevenueUSD,
		});
		console.log("Finder2 相關欄位:", {
			finder2Id: data.finder2Id,
			finder2Name: data.finder2Name,
			finder2ProfitSharePercent: data.finder2ProfitSharePercent,
			finder2RevenueOriginal: data.finder2RevenueOriginal,
			finder2RevenueUSD: data.finder2RevenueUSD,
		});

		setIsLoading(true);
		try {
			const requestData = { ...data, organizationId };
			console.log("發送到 API 的數據:", requestData);

			const response = await fetch("/api/organizations/profit-sharing", {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(requestData),
			});

			if (!response.ok) {
				let errorMessage = "新增失敗";
				try {
					const responseText = await response.text();
					console.log("API 錯誤回應:", responseText);
					try {
						const error = JSON.parse(responseText);
						errorMessage = error.message || errorMessage;
					} catch {
						errorMessage = responseText || errorMessage;
					}
				} catch {
					errorMessage = "新增失敗";
				}
				throw new Error(errorMessage);
			}

			const result = await response.json();
			console.log("API 成功回應:", result);

			form.reset();
			setOpen(false);
			onSuccess?.();
		} catch (error) {
			console.error("新增失敗:", error);
		} finally {
			setIsLoading(false);
		}
	};

	// 幣別選項
	const currencyOptions = CURRENCY_OPTIONS;

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button>
					<Plus className="mr-2 size-4" />
					新增分潤記錄
				</Button>
			</DialogTrigger>
			<DialogContent className="min-w-6xl max-h-[95vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>新增分潤記錄</DialogTitle>
					<DialogDescription>
						填寫下方資訊來新增分潤記錄。自動計算欄位會根據輸入的資料自動計算。
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)}>
						<div className="grid gap-6 py-4">
							{/* 第一行：客戶、產品和銀行帳戶 */}
							<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
								<FormField
									control={form.control}
									name="profitDate"
									render={({ field }) => (
										<FormItem>
											<FormLabel>分潤日期 *</FormLabel>
											<FormControl>
												<Input type="date" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="customerId"
									render={({ field }) => (
										<SearchableSelect
											field={field}
											label="客戶"
											placeholder="選擇客戶"
											searchPlaceholder="搜尋客戶..."
											emptyText="找不到客戶。"
											options={customers}
											getDisplayValue={(customer) =>
												customer
													? `${customer.name} (${customer.code})`
													: ""
											}
											getSearchValue={(customer) =>
												`${customer.name} ${customer.code}`
											}
											getOptionDisplayValue={(customer) =>
												`${customer.name} (${customer.code})`
											}
											required
										/>
									)}
								/>

								<FormField
									control={form.control}
									name="bankAccountId"
									render={({ field }) => (
										<SearchableSelect<BankAccount>
											field={field}
											label="銀行帳戶"
											placeholder={
												form.watch("customerId")
													? "選擇銀行帳戶"
													: "請先選擇客戶"
											}
											searchPlaceholder="搜尋銀行帳戶..."
											emptyText={
												form.watch("customerId")
													? "找不到銀行帳戶。"
													: "請先選擇客戶"
											}
											options={bankAccounts}
											getDisplayValue={(account) =>
												account
													? `${account.bankName} - ${account.accountNumber}`
													: ""
											}
											getSearchValue={(account) =>
												`${account.bankName} ${account.accountNumber}`
											}
											getOptionDisplayValue={(account) =>
												`${account.bankName} - ${account.accountNumber}`
											}
											required
											disabled={!form.watch("customerId")}
										/>
									)}
								/>

								<FormField
									control={form.control}
									name="productId"
									render={({ field }) => (
										<SearchableSelect
											field={field}
											label="產品"
											placeholder="選擇產品"
											searchPlaceholder="搜尋產品..."
											emptyText="找不到產品。"
											options={products}
											getDisplayValue={(product) =>
												product
													? `${product.name} (${product.code})`
													: ""
											}
											getSearchValue={(product) =>
												`${product.name} ${product.code}`
											}
											getOptionDisplayValue={(product) =>
												`${product.name} (${product.code})`
											}
											required
										/>
									)}
								/>
							</div>

							{/* 第二行：日期和幣別 */}
							<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
								<FormField
									control={form.control}
									name="currency"
									render={({ field }) => (
										<FormItem>
											<FormLabel>幣別</FormLabel>
											<Select
												onValueChange={field.onChange}
												value={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="選擇幣別" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{currencyOptions.map(
														(option) => (
															<SelectItem
																key={
																	option.value
																}
																value={
																	option.value
																}
															>
																{option.label}
															</SelectItem>
														),
													)}
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="companyRevenue"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Company Revenue *
											</FormLabel>
											<FormControl>
												<Input
													type="number"
													step="1"
													placeholder="0.00"
													{...field}
													onChange={(e) => {
														const value =
															e.target.value;
														field.onChange(
															value === ""
																? 0
																: Number(value),
														);
													}}
													value={field.value || ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="directTradeBookingFee"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Direct Trade Booking Fee *
											</FormLabel>
											<FormControl>
												<Input
													type="number"
													step="1"
													placeholder="0.00"
													{...field}
													onChange={(e) => {
														const value =
															e.target.value;
														field.onChange(
															value === ""
																? 0
																: Number(value),
														);
													}}
													value={field.value || ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="bankRetroPercent"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Bank Retro(%) *
											</FormLabel>
											<FormControl>
												<Input
													type="number"
													step="0.01"
													min="0"
													max="100"
													placeholder="50.00"
													{...field}
													onChange={(e) => {
														const value =
															e.target.value;
														field.onChange(
															value === ""
																? 50
																: Number(value),
														);
													}}
													value={field.value || ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							{/* 可分潤金額顯示區域 */}
							<div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
								<div>
									<div className="text-sm font-medium text-gray-700 mb-1">
										可分潤金額1
									</div>
									<div className="text-lg font-mono text-blue-600">
										{form.watch("currency")}{" "}
										{(
											(form.watch("companyRevenue") ||
												0) -
											(form.watch(
												"directTradeBookingFee",
											) || 0)
										).toLocaleString("en-US", {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										})}
									</div>
									<div className="text-xs text-gray-500">
										Company Revenue - Direct Trade Booking
										Fee
									</div>
								</div>

								<div>
									<div className="text-sm font-medium text-gray-700 mb-1">
										可分潤金額2
									</div>
									<div className="text-lg font-mono text-green-600">
										{form.watch("currency")}{" "}
										{(
											((form.watch(
												"directTradeBookingFee",
											) || 0) *
												(form.watch(
													"bankRetroPercent",
												) || 50)) /
											100
										).toLocaleString("en-US", {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										})}
									</div>
									<div className="text-xs text-gray-500">
										Direct Trade Booking Fee × Bank Retro(%)
									</div>
								</div>

								<FormField
									control={form.control}
									name="shareable"
									render={({ field }) => (
										<FormItem>
											<FormLabel>總分潤金額</FormLabel>
											<FormControl>
												<Input
													type="number"
													step="1"
													placeholder="0.00"
													{...field}
													disabled
													value={field.value || ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="fxRate"
									render={({ field }) => (
										<FormItem>
											<FormLabel>FX Rate *</FormLabel>
											<FormControl>
												<div className="flex gap-2">
													<Input
														type="number"
														step="0.00001"
														placeholder="1.00000"
														{...field}
														onChange={(e) => {
															const value =
																e.target.value;
															field.onChange(
																value === ""
																	? 1
																	: Number(
																			value,
																		),
															);
														}}
														value={
															field.value || ""
														}
														disabled={
															watchedCurrency ===
															"USD"
														}
														className={
															exchangeRateLoading
																? "bg-muted"
																: ""
														}
													/>
													{watchedCurrency !==
														"USD" && (
														<Button
															type="button"
															variant="outline"
															size="sm"
															onClick={() => {
																if (
																	exchangeRateData?.rates
																) {
																	const rate =
																		exchangeRateData
																			.rates[
																			watchedCurrency
																		];
																	if (rate) {
																		form.setValue(
																			"fxRate",
																			Number(
																				rate.toFixed(
																					5,
																				),
																			),
																		);
																	}
																}
															}}
															disabled={
																exchangeRateLoading
															}
															className="px-3"
														>
															{exchangeRateLoading ? (
																<RefreshCw className="size-4 animate-spin" />
															) : (
																<RefreshCw className="size-4" />
															)}
														</Button>
													)}
												</div>
											</FormControl>
											{watchedCurrency === "USD" && (
												<p className="text-sm text-gray-600 mt-1">
													美元匯率固定為 1.00000
												</p>
											)}
											{exchangeRateError &&
												watchedCurrency !== "USD" && (
													<p className="text-sm text-red-600 mt-1">
														無法獲取匯率:{" "}
														{exchangeRateError}
													</p>
												)}
											{exchangeRateData &&
												!exchangeRateError &&
												watchedCurrency !== "USD" && (
													<p className="text-sm text-green-600 mt-1">
														{exchangeRateData.date}{" "}
														的匯率已自動更新
													</p>
												)}
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							{/* 分潤比例分配 - 新設計 */}
							<Card className="mt-6">
								<CardHeader>
									<CardTitle>
										分潤比例分配 (總計必須為 100%)
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									{/* Company 分潤 */}
									<div className="grid grid-cols-8 gap-4 items-end border-b pb-4">
										<div className="col-span-2">
											<FormLabel className="text-sm font-medium">
												Company 分潤
											</FormLabel>
											<div className="text-xs text-gray-500 mt-1">
												公司分潤
											</div>
										</div>
										<div className="col-span-1">
											<FormField
												control={form.control}
												name="companyProfitSharePercent"
												render={({ field }) => (
													<FormItem>
														<FormLabel className="text-xs">
															比例 (%)
														</FormLabel>
														<FormControl>
															<PercentageInput
																placeholder="50.00"
																{...field}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
										<div className="col-span-1">
											<FormLabel className="text-xs">
												人員
											</FormLabel>
											<div className="text-sm text-gray-500 mt-2">
												-
											</div>
										</div>
										<div className="col-span-2">
											<FormItem>
												<FormLabel className="text-xs">
													原幣金額
												</FormLabel>
												<FormControl>
													<Input
														type="number"
														step="0.01"
														placeholder="0.00"
														disabled
														value={
															((form.watch(
																"shareable",
															) || 0) *
																(form.watch(
																	"companyProfitSharePercent",
																) || 0)) /
															100
														}
													/>
												</FormControl>
											</FormItem>
										</div>
										<div className="col-span-2">
											<FormItem>
												<FormLabel className="text-xs">
													美金金額
												</FormLabel>
												<FormControl>
													<Input
														type="number"
														step="0.01"
														placeholder="0.00"
														disabled
														value={
															(((form.watch(
																"shareable",
															) || 0) *
																(form.watch(
																	"companyProfitSharePercent",
																) || 0)) /
																100) *
															(form.watch(
																"fxRate",
															) || 1)
														}
													/>
												</FormControl>
											</FormItem>
										</div>
									</div>

									{/* RM1 分潤 */}
									<div className="grid grid-cols-8 gap-4 items-end border-b pb-4">
										<div className="col-span-2">
											<FormLabel className="text-sm font-medium">
												RM1 分潤
											</FormLabel>
											<div className="text-xs text-gray-500 mt-1">
												關係經理 1
											</div>
										</div>
										<div className="col-span-1">
											<FormField
												control={form.control}
												name="rm1ProfitSharePercent"
												render={({ field }) => (
													<FormItem>
														<FormLabel className="text-xs">
															比例 (%)
														</FormLabel>
														<FormControl>
															<PercentageInput
																placeholder="0.00"
																{...field}
																value={
																	field.value ||
																	0
																}
																onChange={(
																	value,
																) => {
																	field.onChange(
																		value,
																	);
																}}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
										<div className="col-span-1">
											<FormField
												control={form.control}
												name="rm1Id"
												render={({ field }) => (
													<SearchableSelect<RelationshipManager>
														field={{
															...field,
															onChange: (
																value,
															) => {
																field.onChange(
																	value,
																);
																const selectedRM =
																	allRMs.find(
																		(rm) =>
																			rm.id ===
																			value,
																	);
																if (
																	selectedRM
																) {
																	form.setValue(
																		"rm1Name",
																		selectedRM.name,
																	);
																}
															},
														}}
														label="RM"
														placeholder={
															isLoadingRMsAndFinders
																? "載入中..."
																: "選擇RM"
														}
														searchPlaceholder="搜尋RM..."
														emptyText={
															isLoadingRMsAndFinders
																? "載入中..."
																: "找不到RM。"
														}
														disabled={
															isLoadingRMsAndFinders
														}
														options={allRMs}
														getDisplayValue={(
															rm,
														) =>
															rm ? rm.name : ""
														}
														getSearchValue={(rm) =>
															rm.name
														}
														getOptionDisplayValue={(
															rm,
														) => rm.name}
													/>
												)}
											/>
										</div>
										<div className="col-span-2">
											<FormItem>
												<FormLabel className="text-xs">
													原幣金額
												</FormLabel>
												<FormControl>
													<Input
														type="number"
														step="0.01"
														placeholder="0.00"
														disabled
														value={
															((form.watch(
																"shareable",
															) || 0) *
																(form.watch(
																	"rm1ProfitSharePercent",
																) || 0)) /
															100
														}
													/>
												</FormControl>
											</FormItem>
										</div>
										<div className="col-span-2">
											<FormItem>
												<FormLabel className="text-xs">
													美金金額
												</FormLabel>
												<FormControl>
													<Input
														type="number"
														step="0.01"
														placeholder="0.00"
														disabled
														value={
															(((form.watch(
																"shareable",
															) || 0) *
																(form.watch(
																	"rm1ProfitSharePercent",
																) || 0)) /
																100) *
															(form.watch(
																"fxRate",
															) || 1)
														}
													/>
												</FormControl>
											</FormItem>
										</div>
									</div>

									{/* RM2 分潤 */}
									<div className="grid grid-cols-8 gap-4 items-end border-b pb-4">
										<div className="col-span-2">
											<FormLabel className="text-sm font-medium">
												RM2 分潤
											</FormLabel>
											<div className="text-xs text-gray-500 mt-1">
												關係經理 2
											</div>
										</div>
										<div className="col-span-1">
											<FormField
												control={form.control}
												name="rm2ProfitSharePercent"
												render={({ field }) => (
													<FormItem>
														<FormLabel className="text-xs">
															比例 (%)
														</FormLabel>
														<FormControl>
															<PercentageInput
																placeholder="0.00"
																{...field}
																value={
																	field.value ||
																	0
																}
																onChange={(
																	value,
																) => {
																	field.onChange(
																		value,
																	);
																}}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
										<div className="col-span-1">
											<FormField
												control={form.control}
												name="rm2Id"
												render={({ field }) => (
													<SearchableSelect<RelationshipManager>
														field={{
															...field,
															onChange: (
																value,
															) => {
																field.onChange(
																	value,
																);
																const selectedRM =
																	allRMs.find(
																		(rm) =>
																			rm.id ===
																			value,
																	);
																if (
																	selectedRM
																) {
																	form.setValue(
																		"rm2Name",
																		selectedRM.name,
																	);
																}
															},
														}}
														label="RM"
														placeholder={
															isLoadingRMsAndFinders
																? "載入中..."
																: "選擇RM"
														}
														searchPlaceholder="搜尋RM..."
														emptyText={
															isLoadingRMsAndFinders
																? "載入中..."
																: "找不到RM。"
														}
														disabled={
															isLoadingRMsAndFinders
														}
														options={allRMs}
														getDisplayValue={(
															rm,
														) =>
															rm ? rm.name : ""
														}
														getSearchValue={(rm) =>
															rm.name
														}
														getOptionDisplayValue={(
															rm,
														) => rm.name}
													/>
												)}
											/>
										</div>
										<div className="col-span-2">
											<FormItem>
												<FormLabel className="text-xs">
													原幣金額
												</FormLabel>
												<FormControl>
													<Input
														type="number"
														step="0.01"
														placeholder="0.00"
														disabled
														value={
															((form.watch(
																"shareable",
															) || 0) *
																(form.watch(
																	"rm2ProfitSharePercent",
																) || 0)) /
															100
														}
													/>
												</FormControl>
											</FormItem>
										</div>
										<div className="col-span-2">
											<FormItem>
												<FormLabel className="text-xs">
													美金金額
												</FormLabel>
												<FormControl>
													<Input
														type="number"
														step="0.01"
														placeholder="0.00"
														disabled
														value={
															(((form.watch(
																"shareable",
															) || 0) *
																(form.watch(
																	"rm2ProfitSharePercent",
																) || 0)) /
																100) *
															(form.watch(
																"fxRate",
															) || 1)
														}
													/>
												</FormControl>
											</FormItem>
										</div>
									</div>

									{/* Finder1 分潤 */}
									<div className="grid grid-cols-8 gap-4 items-end border-b pb-4">
										<div className="col-span-2">
											<FormLabel className="text-sm font-medium">
												Finder1 分潤
											</FormLabel>
											<div className="text-xs text-gray-500 mt-1">
												尋找者 1
											</div>
										</div>
										<div className="col-span-1">
											<FormField
												control={form.control}
												name="finder1ProfitSharePercent"
												render={({ field }) => (
													<FormItem>
														<FormLabel className="text-xs">
															比例 (%)
														</FormLabel>
														<FormControl>
															<PercentageInput
																placeholder="0.00"
																{...field}
																value={
																	field.value ||
																	0
																}
																onChange={(
																	value,
																) => {
																	field.onChange(
																		value,
																	);
																}}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
										<div className="col-span-1">
											<FormField
												control={form.control}
												name="finder1Id"
												render={({ field }) => (
													<SearchableSelect<RelationshipManager>
														field={{
															...field,
															onChange: (
																value,
															) => {
																field.onChange(
																	value,
																);
																const selectedFinder =
																	allFinders.find(
																		(
																			finder,
																		) =>
																			finder.id ===
																			value,
																	);
																if (
																	selectedFinder
																) {
																	form.setValue(
																		"finder1Name",
																		selectedFinder.name,
																	);
																}
															},
														}}
														label="Finder"
														placeholder={
															isLoadingRMsAndFinders
																? "載入中..."
																: "選擇Finder"
														}
														searchPlaceholder="搜尋Finder..."
														emptyText={
															isLoadingRMsAndFinders
																? "載入中..."
																: "找不到Finder。"
														}
														disabled={
															isLoadingRMsAndFinders
														}
														options={allFinders}
														getDisplayValue={(
															finder,
														) =>
															finder
																? finder.name
																: ""
														}
														getSearchValue={(
															finder,
														) => finder.name}
														getOptionDisplayValue={(
															finder,
														) => finder.name}
													/>
												)}
											/>
										</div>
										<div className="col-span-2">
											<FormItem>
												<FormLabel className="text-xs">
													原幣金額
												</FormLabel>
												<FormControl>
													<Input
														type="number"
														step="0.01"
														placeholder="0.00"
														disabled
														value={
															((form.watch(
																"shareable",
															) || 0) *
																(form.watch(
																	"finder1ProfitSharePercent",
																) || 0)) /
															100
														}
													/>
												</FormControl>
											</FormItem>
										</div>
										<div className="col-span-2">
											<FormItem>
												<FormLabel className="text-xs">
													美金金額
												</FormLabel>
												<FormControl>
													<Input
														type="number"
														step="0.01"
														placeholder="0.00"
														disabled
														value={
															(((form.watch(
																"shareable",
															) || 0) *
																(form.watch(
																	"finder1ProfitSharePercent",
																) || 0)) /
																100) *
															(form.watch(
																"fxRate",
															) || 1)
														}
													/>
												</FormControl>
											</FormItem>
										</div>
									</div>

									{/* Finder2 分潤 */}
									<div className="grid grid-cols-8 gap-4 items-end border-b pb-4">
										<div className="col-span-2">
											<FormLabel className="text-sm font-medium">
												Finder2 分潤
											</FormLabel>
											<div className="text-xs text-gray-500 mt-1">
												尋找者 2
											</div>
										</div>
										<div className="col-span-1">
											<FormField
												control={form.control}
												name="finder2ProfitSharePercent"
												render={({ field }) => (
													<FormItem>
														<FormLabel className="text-xs">
															比例 (%)
														</FormLabel>
														<FormControl>
															<PercentageInput
																placeholder="0.00"
																{...field}
																value={
																	field.value ||
																	0
																}
																onChange={(
																	value,
																) => {
																	field.onChange(
																		value,
																	);
																}}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
										<div className="col-span-1">
											<FormField
												control={form.control}
												name="finder2Id"
												render={({ field }) => (
													<SearchableSelect<RelationshipManager>
														field={{
															...field,
															onChange: (
																value,
															) => {
																field.onChange(
																	value,
																);
																const selectedFinder =
																	allFinders.find(
																		(
																			finder,
																		) =>
																			finder.id ===
																			value,
																	);
																if (
																	selectedFinder
																) {
																	form.setValue(
																		"finder2Name",
																		selectedFinder.name,
																	);
																}
															},
														}}
														label="Finder"
														placeholder={
															isLoadingRMsAndFinders
																? "載入中..."
																: "選擇Finder"
														}
														searchPlaceholder="搜尋Finder..."
														emptyText={
															isLoadingRMsAndFinders
																? "載入中..."
																: "找不到Finder。"
														}
														disabled={
															isLoadingRMsAndFinders
														}
														options={allFinders}
														getDisplayValue={(
															finder,
														) =>
															finder
																? finder.name
																: ""
														}
														getSearchValue={(
															finder,
														) => finder.name}
														getOptionDisplayValue={(
															finder,
														) => finder.name}
													/>
												)}
											/>
										</div>
										<div className="col-span-2">
											<FormItem>
												<FormLabel className="text-xs">
													原幣金額
												</FormLabel>
												<FormControl>
													<Input
														type="number"
														step="0.01"
														placeholder="0.00"
														disabled
														value={
															((form.watch(
																"shareable",
															) || 0) *
																(form.watch(
																	"finder2ProfitSharePercent",
																) || 0)) /
															100
														}
													/>
												</FormControl>
											</FormItem>
										</div>
										<div className="col-span-2">
											<FormItem>
												<FormLabel className="text-xs">
													美金金額
												</FormLabel>
												<FormControl>
													<Input
														type="number"
														step="0.01"
														placeholder="0.00"
														disabled
														value={
															(((form.watch(
																"shareable",
															) || 0) *
																(form.watch(
																	"finder2ProfitSharePercent",
																) || 0)) /
																100) *
															(form.watch(
																"fxRate",
															) || 1)
														}
													/>
												</FormControl>
											</FormItem>
										</div>
									</div>

									{/* 總計驗證 */}
									<div className="mt-4 p-3 bg-gray-50 rounded-lg">
										<div className="flex justify-between items-center">
											<span className="text-sm font-medium">
												總分潤比例:
											</span>
											<span
												className={cn(
													"text-sm font-bold",
													Math.abs(
														(form.watch(
															"companyProfitSharePercent",
														) || 0) +
															(form.watch(
																"rm1ProfitSharePercent",
															) || 0) +
															(form.watch(
																"rm2ProfitSharePercent",
															) || 0) +
															(form.watch(
																"finder1ProfitSharePercent",
															) || 0) +
															(form.watch(
																"finder2ProfitSharePercent",
															) || 0) -
															100,
													) < 0.01
														? "text-green-600"
														: "text-red-600",
												)}
											>
												{(
													(form.watch(
														"companyProfitSharePercent",
													) || 0) +
													(form.watch(
														"rm1ProfitSharePercent",
													) || 0) +
													(form.watch(
														"rm2ProfitSharePercent",
													) || 0) +
													(form.watch(
														"finder1ProfitSharePercent",
													) || 0) +
													(form.watch(
														"finder2ProfitSharePercent",
													) || 0)
												).toFixed(2)}
												%
											</span>
										</div>
										{Math.abs(
											(form.watch(
												"companyProfitSharePercent",
											) || 0) +
												(form.watch(
													"rm1ProfitSharePercent",
												) || 0) +
												(form.watch(
													"rm2ProfitSharePercent",
												) || 0) +
												(form.watch(
													"finder1ProfitSharePercent",
												) || 0) +
												(form.watch(
													"finder2ProfitSharePercent",
												) || 0) -
												100,
										) >= 0.01 && (
											<div className="text-xs text-red-600 mt-1">
												分潤比例總和必須為 100%
											</div>
										)}
									</div>
								</CardContent>
							</Card>
						</div>

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setOpen(false)}
							>
								取消
							</Button>
							<Button type="submit" disabled={isLoading}>
								{isLoading ? "新增中..." : "新增"}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
