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
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useExchangeRate } from "../../../../../../../hooks/use-exchange-rate";
import { CURRENCY_OPTIONS } from "../../constants";
import type { ProfitSharingRecord } from "./columns";

// 格式化函數 - 從 create dialog 複製
const formatCurrency = (value: number, currency: string) => {
	return `${currency} ${value.toLocaleString("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})}`;
};

// 計算分潤金額的函數
const calculateProfitShare = (
	totalAmount: number,
	profitSharePercent: number,
) => {
	return Math.round(totalAmount * (profitSharePercent / 100) * 100) / 100;
};

const editSchema = z.object({
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

type EditFormData = z.infer<typeof editSchema>;

interface Customer {
	id: string;
	name: string;
	code: string;
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

interface EditDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizationId: string;
	data: ProfitSharingRecord | null;
	onSuccess?: () => void;
}

export function EditProfitSharingDialog({
	open,
	onOpenChange,
	organizationId,
	data,
	onSuccess,
}: EditDialogProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [isLoadingRMsAndFinders, setIsLoadingRMsAndFinders] = useState(false);
	const [customers, setCustomers] = useState<Customer[]>([]);
	const [products, setProducts] = useState<Product[]>([]);
	const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
	const [allRMs, setAllRMs] = useState<RelationshipManager[]>([]);
	const [allFinders, setAllFinders] = useState<RelationshipManager[]>([]);

	const form = useForm<EditFormData>({
		resolver: zodResolver(editSchema),
		defaultValues: {
			currency: "USD",
			companyRevenue: 0,
			directTradeBookingFee: 0,
			bankRetroPercent: 50,
			shareable: 0,
			rmProfitSharePercent: 50,
			finderProfitSharePercent: 0,
			companyProfitSharePercent: 50,
			rm1ProfitSharePercent: 0,
			rm2ProfitSharePercent: 0,
			finder1ProfitSharePercent: 0,
			finder2ProfitSharePercent: 0,
			rmRevenueOriginal: 0,
			findersRevenueOriginal: 0,
			companyRevenueOriginal: 0,
			rmRevenueUSD: 0,
			findersRevenueUSD: 0,
			fxRate: 1,
		},
	});

	// 取得目前選擇的幣別
	const currentCurrency = form.watch("currency");
	// 使用自定義 hook 取得匯率
	const {
		data: exchangeRateData,
		loading: exchangeRateLoading,
		error: exchangeRateError,
	} = useExchangeRate({
		date:
			form.watch("profitDate") || new Date().toISOString().split("T")[0],
		enabled: open, // 只有當對話框打開時才啟用
		useUsdRates: true, // 使用 USD 匯率
	});

	// 監聽匯率變化並自動填入 fxRate
	useEffect(() => {
		if (currentCurrency === "USD") {
			// 如果是USD，直接設定匯率為1
			form.setValue("fxRate", 1);
		} else if (exchangeRateData?.rates && open) {
			// 如果是其他幣別，使用對應的匯率
			const rate = exchangeRateData.rates[currentCurrency];
			if (rate && typeof rate === "number") {
				form.setValue("fxRate", rate);
			}
		}
	}, [exchangeRateData, currentCurrency, form, open]);

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

	// 當 data 更新時，重新設定表單預設值
	useEffect(() => {
		if (data) {
			form.reset({
				customerId: data.customerId,
				productId: data.productId,
				bankAccountId: data.bankAccountId || "",
				amount: data.amount,
				profitDate:
					data.profitDate instanceof Date
						? data.profitDate.toISOString().split("T")[0]
						: data.profitDate,
				currency: data.currency,
				companyRevenue: data.companyRevenue,
				directTradeBookingFee: data.directTradeBookingFee,
				bankRetroPercent: data.bankRetroPercent,
				shareable: data.shareable,
				rmProfitSharePercent: data.rmProfitSharePercent,
				finderProfitSharePercent: data.finderProfitSharePercent,
				companyProfitSharePercent: data.companyProfitSharePercent,

				// RM1 資訊
				rm1Id: data.rm1Id || undefined,
				rm1Name: data.rm1Name || undefined,
				rm1ProfitSharePercent: data.rm1ProfitSharePercent || 0,
				rm1RevenueOriginal: data.rm1RevenueOriginal || 0,
				rm1RevenueUSD: data.rm1RevenueUSD || 0,

				// RM2 資訊
				rm2Id: data.rm2Id || undefined,
				rm2Name: data.rm2Name || undefined,
				rm2ProfitSharePercent: data.rm2ProfitSharePercent || 0,
				rm2RevenueOriginal: data.rm2RevenueOriginal || 0,
				rm2RevenueUSD: data.rm2RevenueUSD || 0,

				// Finder1 資訊
				finder1Id: data.finder1Id || undefined,
				finder1Name: data.finder1Name || undefined,
				finder1ProfitSharePercent: data.finder1ProfitSharePercent || 0,
				finder1RevenueOriginal: data.finder1RevenueOriginal || 0,
				finder1RevenueUSD: data.finder1RevenueUSD || 0,

				// Finder2 資訊
				finder2Id: data.finder2Id || undefined,
				finder2Name: data.finder2Name || undefined,
				finder2ProfitSharePercent: data.finder2ProfitSharePercent || 0,
				finder2RevenueOriginal: data.finder2RevenueOriginal || 0,
				finder2RevenueUSD: data.finder2RevenueUSD || 0,

				// 原幣金額
				rmRevenueOriginal: data.rmRevenueOriginal,
				findersRevenueOriginal: data.findersRevenueOriginal,
				companyRevenueOriginal: data.companyRevenueOriginal,

				// 美金金額
				rmRevenueUSD: data.rmRevenueUSD,
				findersRevenueUSD: data.findersRevenueUSD,

				// 匯率
				fxRate: data.fxRate,
			});
		}
	}, [data, form]);

	const onSubmit = async (formData: EditFormData) => {
		if (!data) {
			return;
		}

		setIsLoading(true);
		try {
			const response = await fetch(
				`/api/organizations/profit-sharing/${data.id}`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						...formData,
						organizationId: organizationId,
					}),
				},
			);

			if (!response.ok) {
				let errorMessage = "更新失敗";
				try {
					const errorData = await response.json();
					errorMessage = errorData.error || errorMessage;
				} catch {
					// 如果無法解析 JSON，使用狀態文字
					errorMessage = `HTTP ${response.status}: ${response.statusText}`;
				}
				throw new Error(errorMessage);
			}

			const result = await response.json();

			onOpenChange(false);
			onSuccess?.();
		} catch (error) {
			console.error("❌ 更新分潤記錄時發生錯誤:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleDelete = async () => {
		if (!data) {
			return;
		}

		setIsDeleting(true);
		try {
			const response = await fetch(
				`/api/organizations/profit-sharing/${data.id}`,
				{
					method: "DELETE",
				},
			);

			if (!response.ok) {
				let errorMessage = "刪除失敗";
				try {
					const errorData = await response.json();
					errorMessage = errorData.error || errorMessage;
				} catch {
					// 如果無法解析 JSON，使用狀態文字
					errorMessage = `HTTP ${response.status}: ${response.statusText}`;
				}
				throw new Error(errorMessage);
			}

			onOpenChange(false);
			onSuccess?.();
		} catch (error) {
			console.error("❌ 刪除分潤記錄時發生錯誤:", error);
		} finally {
			setIsDeleting(false);
		}
	};

	if (!data) {
		return null;
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="min-w-6xl max-h-[95vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>編輯分潤記錄</DialogTitle>
					<DialogDescription>
						修改現有的分潤記錄資訊
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form
						onSubmit={(e) => {
							form.handleSubmit(onSubmit)(e);
						}}
						className="space-y-6"
					>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							{/* 第一行：客戶、產品、銀行帳戶 */}
							<FormField
								control={form.control}
								name="customerId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>客戶</FormLabel>
										<Select
											onValueChange={field.onChange}
											value={field.value}
											disabled={
												!customers ||
												customers.length === 0
											}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="選擇客戶" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{(customers || []).map(
													(customer) => (
														<SelectItem
															key={customer.id}
															value={customer.id}
														>
															{customer.name}
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
								name="productId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>產品</FormLabel>
										<Select
											onValueChange={field.onChange}
											value={field.value}
											disabled={
												!products ||
												products.length === 0
											}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="選擇產品" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{(products || []).map(
													(product) => (
														<SelectItem
															key={product.id}
															value={product.id}
														>
															{product.name}
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
								name="bankAccountId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>銀行帳戶</FormLabel>
										<Select
											onValueChange={field.onChange}
											value={field.value}
											disabled={
												!bankAccounts ||
												bankAccounts.length === 0
											}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="選擇銀行帳戶" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{(bankAccounts || []).map(
													(account) => (
														<SelectItem
															key={account.id}
															value={account.id}
														>
															{account.bankName} -{" "}
															{
																account.accountName
															}
														</SelectItem>
													),
												)}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
							{/* 第二行：金額、日期、幣別、FX Rate */}
							<FormField
								control={form.control}
								name="amount"
								render={({ field }) => (
									<FormItem>
										<FormLabel>金額</FormLabel>
										<FormControl>
											<Input
												type="number"
												step="0.01"
												placeholder="0.00"
												{...field}
												onChange={(e) => {
													const value =
														Number.parseFloat(
															e.target.value,
														);
													field.onChange(
														Number.isNaN(value)
															? 0
															: value,
													);
												}}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="profitDate"
								render={({ field }) => (
									<FormItem>
										<FormLabel>分潤日期</FormLabel>
										<FormControl>
											<Input type="date" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

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
												{CURRENCY_OPTIONS.map(
													(currency) => (
														<SelectItem
															key={currency.value}
															value={
																currency.value
															}
														>
															{currency.label}
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
								name="fxRate"
								render={({ field }) => (
									<FormItem>
										<FormLabel>FX Rate</FormLabel>
										<FormControl>
											<Input
												type="number"
												step="0.01"
												placeholder="1.00"
												{...field}
												onChange={(e) => {
													const value =
														Number.parseFloat(
															e.target.value,
														);
													field.onChange(
														Number.isNaN(value)
															? 1
															: value,
													);
												}}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
							{/* 第三行：Company Revenue、Direct Trade Booking Fee、Bank Retro(%)、Shareable */}
							<FormField
								control={form.control}
								name="companyRevenue"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Company Revenue</FormLabel>
										<FormControl>
											<Input
												type="number"
												step="0.01"
												placeholder="0.00"
												{...field}
												onChange={(e) => {
													const value =
														Number.parseFloat(
															e.target.value,
														);
													field.onChange(
														Number.isNaN(value)
															? 0
															: value,
													);
												}}
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
											Direct Trade Booking Fee
										</FormLabel>
										<FormControl>
											<Input
												type="number"
												step="0.01"
												placeholder="0.00"
												{...field}
												onChange={(e) => {
													const value =
														Number.parseFloat(
															e.target.value,
														);
													field.onChange(
														Number.isNaN(value)
															? 0
															: value,
													);
												}}
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
										<FormLabel>Bank Retro (%)</FormLabel>
										<FormControl>
											<PercentageInput
												placeholder="0.00"
												{...field}
												value={field.value || 0}
												onChange={(value) => {
													field.onChange(value);
												}}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="shareable"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Shareable</FormLabel>
										<FormControl>
											<Input
												type="number"
												step="0.01"
												placeholder="0.00"
												{...field}
												onChange={(e) => {
													const value =
														Number.parseFloat(
															e.target.value,
														);
													field.onChange(
														Number.isNaN(value)
															? 0
															: value,
													);
												}}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						{/* 第六行：分潤比例分配 Card */}
						<Card>
							<CardHeader>
								<CardTitle>分潤比例分配</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								{/* Company 分潤 */}
								<div className="grid grid-cols-8 gap-4 items-end border-b pb-4">
									<div className="col-span-2">
										<FormLabel className="text-sm font-medium">
											Company 分潤
										</FormLabel>
										<div className="text-xs text-gray-500 mt-1">
											公司利潤
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
															placeholder="0.00"
															{...field}
															value={
																field.value || 0
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
										<FormLabel className="text-xs">
											對象
										</FormLabel>
										<div className="h-10 flex items-center text-sm text-gray-500">
											公司
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
														(form.watch("fxRate") ||
															1)
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
																field.value || 0
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
														onChange: (value) => {
															field.onChange(
																value,
															);
															const selectedRM = (
																allRMs || []
															).find(
																(rm) =>
																	rm.id ===
																	value,
															);
															if (selectedRM) {
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
													options={allRMs || []}
													getDisplayValue={(rm) =>
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
														(form.watch("fxRate") ||
															1)
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
																field.value || 0
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
														onChange: (value) => {
															field.onChange(
																value,
															);
															const selectedRM = (
																allRMs || []
															).find(
																(rm) =>
																	rm.id ===
																	value,
															);
															if (selectedRM) {
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
													options={allRMs || []}
													getDisplayValue={(rm) =>
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
														(form.watch("fxRate") ||
															1)
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
											介紹人 1
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
																field.value || 0
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
														onChange: (value) => {
															field.onChange(
																value,
															);
															const selectedFinder =
																(
																	allFinders ||
																	[]
																).find(
																	(finder) =>
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
													options={allFinders || []}
													getDisplayValue={(
														finder,
													) =>
														finder
															? finder.name
															: ""
													}
													getSearchValue={(finder) =>
														finder.name
													}
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
														(form.watch("fxRate") ||
															1)
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
											介紹人 2
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
																field.value || 0
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
														onChange: (value) => {
															field.onChange(
																value,
															);
															const selectedFinder =
																(
																	allFinders ||
																	[]
																).find(
																	(finder) =>
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
													options={allFinders || []}
													getDisplayValue={(
														finder,
													) =>
														finder
															? finder.name
															: ""
													}
													getSearchValue={(finder) =>
														finder.name
													}
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
														(form.watch("fxRate") ||
															1)
													}
												/>
											</FormControl>
										</FormItem>
									</div>
								</div>

								{/* 總計驗證 */}
								<div className="border-t pt-4">
									<div className="flex justify-between items-center">
										<span className="text-sm font-medium">
											總計比例:
										</span>
										<span
											className={cn(
												"text-sm font-mono",
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
													: "text-red-500",
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
											% / 100%
										</span>
									</div>
								</div>
							</CardContent>
						</Card>

						<DialogFooter className="!justify-between">
							<Button
								type="button"
								variant="error"
								onClick={handleDelete}
								disabled={isDeleting}
							>
								<Trash2 className="mr-2 size-4" />
								{isDeleting ? "刪除中..." : "刪除"}
							</Button>
							<div className="flex gap-2">
								<Button
									type="button"
									variant="outline"
									onClick={() => onOpenChange(false)}
								>
									取消
								</Button>
								<Button type="submit" disabled={isLoading}>
									{isLoading ? "更新中..." : "更新"}
								</Button>
							</div>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
