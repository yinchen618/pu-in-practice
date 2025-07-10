"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SearchableSelect } from "@shared/components/SearchableSelect";
import { Button } from "@ui/components/button";
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
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
	rmProfitSharePercent: z.number().min(0).max(100),
	finderProfitSharePercent: z.number().min(0).max(100),
	companyProfitSharePercent: z.number().min(0).max(100),
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
	const [customers, setCustomers] = useState<Customer[]>([]);
	const [products, setProducts] = useState<Product[]>([]);
	const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

	const form = useForm<CreateFormData>({
		resolver: zodResolver(createSchema),
		defaultValues: {
			currency: "USD",
			companyRevenue: 0,
			directTradeBookingFee: 0,
			rmProfitSharePercent: 50,
			finderProfitSharePercent: 0,
			companyProfitSharePercent: 50,
			fxRate: 1,
			amount: 0,
			profitDate: new Date().toISOString().split("T")[0], // 預設為今天
		},
	});

	// 獲取客戶、產品和銀行帳戶列表
	useEffect(() => {
		if (open) {
			fetchCustomers();
			fetchProducts();
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
		if (customerId) {
			fetchBankAccounts(customerId);
		} else {
			setBankAccounts([]);
			form.setValue("bankAccountId", "");
		}
	}, [form.watch("customerId")]);

	const onSubmit = async (data: CreateFormData) => {
		setIsLoading(true);
		try {
			const response = await fetch("/api/organizations/profit-sharing", {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ...data, organizationId }),
			});

			if (!response.ok) {
				let errorMessage = "新增失敗";
				try {
					const responseText = await response.text();
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
	const currencyOptions = [
		{ value: "USD", label: "USD" },
		{ value: "TWD", label: "TWD" },
		{ value: "SGD", label: "SGD" },
		{ value: "HKD", label: "HKD" },
		{ value: "EUR", label: "EUR" },
		{ value: "GBP", label: "GBP" },
		{ value: "JPY", label: "JPY" },
	];

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
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
							</div>

							{/* 第三行：收入欄位 */}
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
													step="0.01"
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
													step="0.01"
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
									name="amount"
									render={({ field }) => (
										<FormItem>
											<FormLabel>金額 *</FormLabel>
											<FormControl>
												<Input
													type="number"
													step="0.01"
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
							</div>

							{/* 第四行：分潤比例 */}
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<FormField
									control={form.control}
									name="rmProfitSharePercent"
									render={({ field }) => (
										<FormItem>
											<FormLabel>RM分潤 (%)</FormLabel>
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

								<FormField
									control={form.control}
									name="finderProfitSharePercent"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Finder分潤 (%)
											</FormLabel>
											<FormControl>
												<Input
													type="number"
													step="0.01"
													min="0"
													max="100"
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
									name="companyProfitSharePercent"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Company分潤 (%)
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

							{/* 第五行：FX Rate */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="fxRate"
									render={({ field }) => (
										<FormItem>
											<FormLabel>FX Rate *</FormLabel>
											<FormControl>
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
