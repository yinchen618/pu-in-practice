"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PercentageInput } from "@shared/components/PercentageInput";
import { SearchableSelect } from "@shared/components/SearchableSelect";
import { Button } from "@ui/components/button";
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
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CURRENCY_OPTIONS } from "../../constants";
import type { ProfitSharingRecord } from "./columns";

const editSchema = z.object({
	customerId: z.string().min(1, "客戶是必填的"),
	productId: z.string().min(1, "產品是必填的"),
	bankAccountId: z.string().min(1, "銀行帳戶是必填的"),
	profitDate: z.string().min(1, "分潤日期是必填的"),
	currency: z.string().min(1, "幣別是必填的"),
	companyRevenue: z.number().min(0, "Company revenue 不能為負數"),
	directTradeBookingFee: z
		.number()
		.min(0, "Direct trade booking fee 不能為負數"),
	shareable: z.number().min(0),
	rmProfitSharePercent: z.number().min(0).max(100),
	finderProfitSharePercent: z.number().min(0).max(100),
	companyProfitSharePercent: z.number().min(0).max(100),
	fxRate: z.number().min(0, "FX Rate 不能為負數"),
	rmRevenueOriginal: z.number().min(0),
	findersRevenueOriginal: z.number().min(0),
	companyRevenueOriginal: z.number().min(0),
	rmRevenueUSD: z.number().min(0),
	findersRevenueUSD: z.number().min(0),
});

type EditFormData = z.infer<typeof editSchema>;

interface EditDialogProps {
	record: ProfitSharingRecord;
	open: boolean;
	onOpenChange: (open: boolean) => void;
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

export function EditProfitSharingDialog({
	record,
	open,
	onOpenChange,
	onSuccess,
}: EditDialogProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [customers, setCustomers] = useState<Customer[]>([]);
	const [products, setProducts] = useState<Product[]>([]);
	const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

	const form = useForm<EditFormData>({
		resolver: zodResolver(editSchema),
		defaultValues: {
			currency: "USD",
			companyRevenue: 0,
			directTradeBookingFee: 0,
			shareable: 0,
			rmProfitSharePercent: 50,
			finderProfitSharePercent: 0,
			companyProfitSharePercent: 50,
			fxRate: 1,
			rmRevenueOriginal: 0,
			findersRevenueOriginal: 0,
			companyRevenueOriginal: 0,
			rmRevenueUSD: 0,
			findersRevenueUSD: 0,
		},
	});

	// 當記錄改變時重置表單
	useEffect(() => {
		if (record) {
			form.reset({
				customerId: record.customerId,
				productId: record.productId,
				bankAccountId: "", // 這個會在 fetchBankAccounts 後設定
				profitDate: new Date(record.profitDate)
					.toISOString()
					.split("T")[0],
				currency: record.currency,
				companyRevenue: record.companyRevenue,
				directTradeBookingFee: record.directTradeBookingFee,
				shareable: record.companyRevenue - record.directTradeBookingFee,
				rmProfitSharePercent: record.rmProfitSharePercent,
				finderProfitSharePercent: record.finderProfitSharePercent,
				companyProfitSharePercent: record.companyProfitSharePercent,
				fxRate: record.fxRate,
				rmRevenueOriginal: record.rmRevenueOriginal,
				findersRevenueOriginal: record.findersRevenueOriginal,
				companyRevenueOriginal: record.companyRevenueOriginal,
				rmRevenueUSD: record.rmRevenueUSD,
				findersRevenueUSD: record.findersRevenueUSD,
			});
		}
	}, [record, form]);

	// 監聽收入和費用的變化，計算可分潤金額
	useEffect(() => {
		const companyRevenue = form.watch("companyRevenue");
		const directTradeBookingFee = form.watch("directTradeBookingFee");
		const shareable = companyRevenue - directTradeBookingFee;
		form.setValue("shareable", shareable >= 0 ? shareable : 0);
	}, [form.watch("companyRevenue"), form.watch("directTradeBookingFee")]);

	// 監聽分潤比例和可分潤金額的變化，計算各方收入
	useEffect(() => {
		const shareable = form.watch("shareable");
		const rmPercent = form.watch("rmProfitSharePercent");
		const finderPercent = form.watch("finderProfitSharePercent");
		const companyPercent = form.watch("companyProfitSharePercent");
		const fxRate = form.watch("fxRate");

		// 計算原幣收入
		const rmRevenueOriginal = (shareable * rmPercent) / 100;
		const findersRevenueOriginal = (shareable * finderPercent) / 100;
		const companyRevenueOriginal = (shareable * companyPercent) / 100;

		// 計算美金收入
		const rmRevenueUSD = rmRevenueOriginal * fxRate;
		const findersRevenueUSD = findersRevenueOriginal * fxRate;

		// 更新表單值
		form.setValue("rmRevenueOriginal", rmRevenueOriginal);
		form.setValue("findersRevenueOriginal", findersRevenueOriginal);
		form.setValue("companyRevenueOriginal", companyRevenueOriginal);
		form.setValue("rmRevenueUSD", rmRevenueUSD);
		form.setValue("findersRevenueUSD", findersRevenueUSD);
	}, [
		form.watch("shareable"),
		form.watch("rmProfitSharePercent"),
		form.watch("finderProfitSharePercent"),
		form.watch("companyProfitSharePercent"),
		form.watch("fxRate"),
	]);

	// 獲取客戶和產品列表
	useEffect(() => {
		if (open) {
			fetchCustomers();
			fetchProducts();
		}
	}, [open]);

	const fetchCustomers = async () => {
		try {
			const response = await fetch(
				`/api/organizations/customers?organizationId=${record.organizationId}`,
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
				`/api/organizations/products?organizationId=${record.organizationId}`,
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
				`/api/organizations/bank-accounts?organizationId=${record.organizationId}&customerId=${customerId}`,
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

	const onSubmit = async (data: EditFormData) => {
		setIsLoading(true);
		try {
			const response = await fetch(
				`/api/organizations/profit-sharing/${record.id}`,
				{
					method: "PUT",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data),
				},
			);

			if (!response.ok) {
				let errorMessage = "更新失敗";
				try {
					const responseText = await response.text();
					try {
						const error = JSON.parse(responseText);
						errorMessage = error.message || errorMessage;
					} catch {
						errorMessage = responseText || errorMessage;
					}
				} catch {
					errorMessage = "更新失敗";
				}
				throw new Error(errorMessage);
			}

			onOpenChange(false);
			onSuccess?.();
		} catch (error) {
			console.error("更新失敗:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleDelete = async () => {
		if (!confirm("確定要刪除這筆分潤記錄嗎？此操作無法撤銷。")) {
			return;
		}

		setIsDeleting(true);
		try {
			const response = await fetch(
				`/api/organizations/profit-sharing/${record.id}`,
				{
					method: "DELETE",
					credentials: "include",
				},
			);

			if (!response.ok) {
				let errorMessage = "刪除失敗";
				try {
					const responseText = await response.text();
					try {
						const error = JSON.parse(responseText);
						errorMessage = error.message || errorMessage;
					} catch {
						errorMessage = responseText || errorMessage;
					}
				} catch {
					errorMessage = "刪除失敗";
				}
				throw new Error(errorMessage);
			}

			onOpenChange(false);
			onSuccess?.();
		} catch (error) {
			console.error("刪除失敗:", error);
		} finally {
			setIsDeleting(false);
		}
	};

	// 幣別選項
	const currencyOptions = CURRENCY_OPTIONS;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="min-w-6xl max-h-[95vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>編輯分潤記錄</DialogTitle>
					<DialogDescription>
						修改分潤記錄資訊。自動計算欄位會根據輸入的資料自動計算。
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

							{/* 第二行：幣別和收入 */}
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
									name="shareable"
									render={({ field }) => (
										<FormItem>
											<FormLabel>可分潤金額</FormLabel>
											<FormControl>
												<Input
													type="number"
													step="0.01"
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
							</div>

							{/* 第四行：分潤比例 */}
							<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
								<FormField
									control={form.control}
									name="companyProfitSharePercent"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Company分潤 (%)
											</FormLabel>
											<FormControl>
												<PercentageInput
													placeholder="50.00"
													{...field}
													onChange={(value) =>
														field.onChange(value)
													}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="rmProfitSharePercent"
									render={({ field }) => (
										<FormItem>
											<FormLabel>RM分潤 (%)</FormLabel>
											<FormControl>
												<PercentageInput
													placeholder="50.00"
													{...field}
													onChange={(value) =>
														field.onChange(value)
													}
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
												<PercentageInput
													placeholder="0.00"
													{...field}
													onChange={(value) =>
														field.onChange(value)
													}
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

							{/* 第五行：分潤金額（原幣） */}
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<FormField
									control={form.control}
									name="companyRevenueOriginal"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Company分潤(原幣)
											</FormLabel>
											<FormControl>
												<Input
													type="number"
													step="0.01"
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
									name="rmRevenueOriginal"
									render={({ field }) => (
										<FormItem>
											<FormLabel>RM分潤(原幣)</FormLabel>
											<FormControl>
												<Input
													type="number"
													step="0.01"
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
									name="findersRevenueOriginal"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Finder分潤(原幣)
											</FormLabel>
											<FormControl>
												<Input
													type="number"
													step="0.01"
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
							</div>

							{/* 第六行：分潤金額（美金） */}
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<FormItem>
									<FormLabel>&nbsp;</FormLabel>
									<FormControl>
										{/* <Input disabled value="" /> */}
									</FormControl>
								</FormItem>

								<FormField
									control={form.control}
									name="rmRevenueUSD"
									render={({ field }) => (
										<FormItem>
											<FormLabel>RM分潤(美金)</FormLabel>
											<FormControl>
												<Input
													type="number"
													step="0.01"
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
									name="findersRevenueUSD"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Finder分潤(美金)
											</FormLabel>
											<FormControl>
												<Input
													type="number"
													step="0.01"
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
							</div>
						</div>

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
