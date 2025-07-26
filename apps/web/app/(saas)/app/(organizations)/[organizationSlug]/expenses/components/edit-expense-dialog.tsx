"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import { Textarea } from "@ui/components/textarea";
import { RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useExchangeRate } from "../../../../../../../hooks/use-exchange-rate";
import { CURRENCY_OPTIONS } from "../../constants";
import type { ExpenseRecord } from "./columns";
import { ReceiptUpload } from "./receipt-upload";

const createEditExpenseSchema = (t: any) =>
	z.object({
		category: z.enum(["餐飲", "機票", "酒店", "快遞", "交通"], {
			required_error: t("form.categoryRequired"),
		}),
		amount: z.number().min(0, t("form.amountNegative")),
		currency: z.string().min(1, t("form.currencyRequired")),
		exchangeRate: z
			.number()
			.min(0, t("form.exchangeRateNegative"))
			.optional(),
		usdRate: z.number().min(0, t("form.usdRateNegative")).optional(),
		receiptUrls: z.array(z.string()).optional(),
		description: z.string().optional(),
		date: z.string().optional(),
		rmId: z.string().optional().nullable(),
	});

const editExpenseSchema = z.object({
	category: z.enum(["餐飲", "機票", "酒店", "快遞", "交通"], {
		required_error: "類別是必填的",
	}),
	amount: z.number().min(0, "金額不能為負數"),
	currency: z.string().min(1, "幣別是必填的"),
	exchangeRate: z.number().min(0, "匯率不能為負數").optional(),
	usdRate: z.number().min(0, "美元匯率不能為負數").optional(),
	receiptUrls: z.array(z.string()).optional(),
	description: z.string().optional(),
	date: z.string().optional(),
	rmId: z.string().optional().nullable(),
});

type EditExpenseFormData = z.infer<typeof editExpenseSchema>;

interface RelationshipManager {
	id: string;
	name: string;
	category: "RM" | "FINDER" | "BOTH";
}

interface EditExpenseDialogProps {
	expenseRecord: ExpenseRecord;
	relationshipManagers: RelationshipManager[];
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

export function EditExpenseDialog({
	expenseRecord,
	relationshipManagers,
	open,
	onOpenChange,
	onSuccess,
}: EditExpenseDialogProps) {
	const t = useTranslations("organization.expenses");
	const [isLoading, setIsLoading] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	// 根據角色類型過濾 RM 列表
	const rmOptions = relationshipManagers.filter(
		(rm) => rm.category === "RM" || rm.category === "BOTH",
	);

	const form = useForm<EditExpenseFormData>({
		resolver: zodResolver(createEditExpenseSchema(t)),
	});

	// 監聽表單中的日期和幣別變化
	const watchedDate = form.watch("date");
	const watchedCurrency = form.watch("currency");

	// 使用匯率hook - SGD匯率
	const {
		data: exchangeRateData,
		loading: exchangeRateLoading,
		error: exchangeRateError,
		refetch: refetchExchangeRate,
	} = useExchangeRate({
		date: watchedDate || new Date().toISOString().split("T")[0],
		enabled: false, // 預設不啟用，只在需要時手動載入
	});

	// 使用匯率hook - USD匯率
	const {
		data: usdExchangeRateData,
		loading: usdExchangeRateLoading,
		error: usdExchangeRateError,
		refetch: refetchUsdExchangeRate,
	} = useExchangeRate({
		date: watchedDate || new Date().toISOString().split("T")[0],
		enabled: false, // 預設不啟用，只在需要時手動載入
		useUsdRates: true,
	});

	// 監聽幣別和日期變更，手動載入匯率
	useEffect(() => {
		if (!open || !watchedCurrency || !watchedDate) {
			return;
		}

		// 如果幣別不是 SGD，載入 SGD 匯率
		if (watchedCurrency !== "SGD") {
			refetchExchangeRate();
		}

		// 載入 USD 匯率
		refetchUsdExchangeRate();
	}, [
		watchedCurrency,
		watchedDate,
		open,
		refetchExchangeRate,
		refetchUsdExchangeRate,
	]);

	// 當幣別變化時，自動更新匯率
	useEffect(() => {
		if (watchedCurrency === "SGD") {
			// 如果是SGD，直接設定匯率為1
			form.setValue("exchangeRate", 1);
		} else if (watchedCurrency === "USD") {
			// 如果是USD，匯率為1
			form.setValue("exchangeRate", 1);
		} else if (exchangeRateData?.rates?.[watchedCurrency] && open) {
			// 其他幣別則使用一般匯率API
			const rate = exchangeRateData.rates[watchedCurrency];
			if (rate) {
				form.setValue("exchangeRate", Number(rate.toFixed(4)));
			}
		}

		// 設定 USD 匯率
		if (watchedCurrency === "USD") {
			form.setValue("usdRate", 1);
		} else if (usdExchangeRateData?.rates?.USD && open) {
			const usdRate = usdExchangeRateData.rates.USD;
			if (usdRate) {
				form.setValue("usdRate", Number(usdRate.toFixed(4)));
			}
		}
	}, [exchangeRateData, usdExchangeRateData, form, open, watchedCurrency]);

	// 當對話框打開時，設置表單的初始值
	useEffect(() => {
		if (open && expenseRecord) {
			// 處理收據URL的向後相容性
			const receiptUrls = expenseRecord.receiptUrls || [];
			const legacyReceiptUrl = expenseRecord.receiptUrl;
			const allReceiptUrls =
				legacyReceiptUrl && !receiptUrls.includes(legacyReceiptUrl)
					? [...receiptUrls, legacyReceiptUrl]
					: receiptUrls;

			// 將日期轉換為YYYY-MM-DD格式的字符串
			const dateStr = new Date(expenseRecord.date)
				.toISOString()
				.split("T")[0];

			form.reset({
				category: expenseRecord.category as any,
				amount: Number(expenseRecord.amount),
				currency: expenseRecord.currency,
				exchangeRate: Number(expenseRecord.exchangeRate),
				usdRate: Number(expenseRecord.usdRate),
				receiptUrls: allReceiptUrls,
				description: expenseRecord.description || "",
				date: dateStr,
				rmId: expenseRecord.rmId || undefined,
			});
		}
	}, [open, expenseRecord, form]);

	const onSubmit = async (data: EditExpenseFormData) => {
		setIsLoading(true);
		try {
			// 準備發送給API的數據，確保日期格式正確
			const submitData = {
				...data,
				date: data.date ? new Date(data.date) : undefined,
				// 確保 receiptUrls 被正確發送
				receiptUrls: data.receiptUrls || [],
				// 處理 rmId，將 "none" 轉換為 null
				rmId: data.rmId === "none" ? null : data.rmId,
			};

			console.log("編輯支出 - 提交資料:", submitData);

			const response = await fetch(
				`/api/organizations/expenses/${expenseRecord.id}`,
				{
					method: "PUT",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(submitData),
				},
			);

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || "更新失敗");
			}

			// 重置表單並關閉對話框
			form.reset();
			onOpenChange(false);
			onSuccess?.();
		} catch (error) {
			console.error(t("form.updateFailed"), error);
			// 這裡可以添加 toast 通知
		} finally {
			setIsLoading(false);
		}
	};

	const handleDelete = async () => {
		if (!confirm(t("form.confirmDelete"))) {
			return;
		}

		setIsDeleting(true);
		try {
			const response = await fetch(
				`/api/organizations/expenses/${expenseRecord.id}`,
				{
					method: "DELETE",
					credentials: "include",
				},
			);

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || "刪除失敗");
			}

			onOpenChange(false);
			onSuccess?.();
		} catch (error) {
			console.error(t("form.deleteFailed"), error);
			// 這裡可以添加 toast 通知
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{t("edit")}</DialogTitle>
					<DialogDescription>
						修改下方資訊來更新支出記錄。
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)}>
						<div className="grid gap-4 py-4">
							<FormField
								control={form.control}
								name="date"
								render={({ field }) => (
									<FormItem className="grid grid-cols-4 items-center gap-4">
										<FormLabel className="text-right">
											{t("date")}
										</FormLabel>
										<div className="col-span-3">
											<FormControl>
												<Input type="date" {...field} />
											</FormControl>
											<FormMessage />
										</div>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="rmId"
								render={({ field }) => (
									<FormItem className="grid grid-cols-4 items-center gap-4">
										<FormLabel className="text-right">
											{t("rmId")}
										</FormLabel>
										<div className="col-span-3">
											<FormControl>
												<Select
													value={
														field.value || "none"
													}
													onValueChange={(value) =>
														field.onChange(
															value === "none"
																? undefined
																: value,
														)
													}
												>
													<SelectTrigger>
														<SelectValue
															placeholder={t(
																"form.selectRm",
															)}
														/>
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="none">
															{t("form.none")}
														</SelectItem>
														{rmOptions.map((rm) => (
															<SelectItem
																key={rm.id}
																value={rm.id}
															>
																{rm.name}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</FormControl>
											<FormMessage />
										</div>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="category"
								render={({ field }) => (
									<FormItem className="grid grid-cols-4 items-center gap-4">
										<FormLabel className="text-right">
											{t("category")} *
										</FormLabel>
										<div className="col-span-3">
											<FormControl>
												<Select
													value={field.value}
													onValueChange={
														field.onChange
													}
												>
													<SelectTrigger>
														<SelectValue
															placeholder={t(
																"form.selectCategory",
															)}
														/>
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="餐飲">
															{t(
																"categories.餐飲",
															)}
														</SelectItem>
														<SelectItem value="機票">
															{t(
																"categories.機票",
															)}
														</SelectItem>
														<SelectItem value="酒店">
															{t(
																"categories.酒店",
															)}
														</SelectItem>
														<SelectItem value="快遞">
															{t(
																"categories.快遞",
															)}
														</SelectItem>
														<SelectItem value="交通">
															{t(
																"categories.交通",
															)}
														</SelectItem>
													</SelectContent>
												</Select>
											</FormControl>
											<FormMessage />
										</div>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="currency"
								render={({ field }) => (
									<FormItem className="grid grid-cols-4 items-center gap-4">
										<FormLabel className="text-right">
											{t("currency")} *
										</FormLabel>
										<div className="col-span-3">
											<FormControl>
												<Select
													value={field.value}
													onValueChange={
														field.onChange
													}
												>
													<SelectTrigger>
														<SelectValue
															placeholder={t(
																"form.selectCurrency",
															)}
														/>
													</SelectTrigger>
													<SelectContent>
														{CURRENCY_OPTIONS.map(
															(option) => (
																<SelectItem
																	key={
																		option.value
																	}
																	value={
																		option.value
																	}
																>
																	{
																		option.label
																	}
																</SelectItem>
															),
														)}
													</SelectContent>
												</Select>
											</FormControl>
											<FormMessage />
										</div>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="amount"
								render={({ field }) => (
									<FormItem className="grid grid-cols-4 items-center gap-4">
										<FormLabel className="text-right">
											{t("amount")} *
										</FormLabel>
										<div className="col-span-3">
											<FormControl>
												<Input
													type="number"
													step="1"
													min="0"
													placeholder={t(
														"form.enterAmount",
													)}
													{...field}
													onChange={(e) =>
														field.onChange(
															Number.parseFloat(
																e.target.value,
															) || 0,
														)
													}
												/>
											</FormControl>
											<FormMessage />
										</div>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="exchangeRate"
								render={({ field }) => (
									<FormItem className="grid grid-cols-4 items-center gap-4">
										<FormLabel className="text-right">
											{t("exchangeRate")}
										</FormLabel>
										<div className="col-span-3">
											<div className="flex gap-2">
												<FormControl>
													<Input
														type="number"
														step="1"
														min="0"
														placeholder="1.00"
														{...field}
														onChange={(e) =>
															field.onChange(
																Number.parseFloat(
																	e.target
																		.value,
																) || undefined,
															)
														}
														disabled={
															watchedCurrency ===
															"SGD"
														}
														className={
															exchangeRateLoading
																? "bg-muted"
																: ""
														}
													/>
												</FormControl>
												{watchedCurrency !== "SGD" && (
													<Button
														type="button"
														variant="outline"
														size="sm"
														onClick={async () => {
															await refetchExchangeRate();
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
											{watchedCurrency === "SGD" && (
												<p className="text-sm text-gray-600 mt-1">
													{t("form.sgdRateFixed")}
												</p>
											)}
											{exchangeRateError &&
												watchedCurrency !== "SGD" && (
													<p className="text-sm text-red-600 mt-1">
														{t(
															"form.exchangeRateError",
														)}
														: {exchangeRateError}
													</p>
												)}
											{exchangeRateData &&
												!exchangeRateError &&
												watchedCurrency !== "SGD" && (
													<p className="text-sm text-green-600 mt-1">
														{exchangeRateData.date}{" "}
														{t(
															"form.exchangeRateUpdated",
														)}
													</p>
												)}
											<FormMessage />
										</div>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="usdRate"
								render={({ field }) => (
									<FormItem className="grid grid-cols-4 items-center gap-4">
										<FormLabel className="text-right">
											{t("usdRate")}
										</FormLabel>
										<div className="col-span-3">
											<div className="flex gap-2">
												<FormControl>
													<Input
														type="number"
														step="1"
														min="0"
														placeholder="1.00"
														{...field}
														onChange={(e) =>
															field.onChange(
																Number.parseFloat(
																	e.target
																		.value,
																) || undefined,
															)
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
												</FormControl>
												{watchedCurrency !== "USD" && (
													<Button
														type="button"
														variant="outline"
														size="sm"
														onClick={async () => {
															await refetchUsdExchangeRate();
														}}
														disabled={
															usdExchangeRateLoading
														}
														className="px-3"
													>
														{usdExchangeRateLoading ? (
															<RefreshCw className="size-4 animate-spin" />
														) : (
															<RefreshCw className="size-4" />
														)}
													</Button>
												)}
											</div>
											{watchedCurrency === "USD" && (
												<p className="text-sm text-gray-600 mt-1">
													{t("form.usdRateFixed")}
												</p>
											)}
											{usdExchangeRateError &&
												watchedCurrency !== "USD" && (
													<p className="text-sm text-red-600 mt-1">
														{t("form.usdRateError")}
														: {usdExchangeRateError}
													</p>
												)}
											{usdExchangeRateData &&
												!usdExchangeRateError &&
												watchedCurrency !== "USD" && (
													<p className="text-sm text-green-600 mt-1">
														{
															usdExchangeRateData.date
														}{" "}
														{t(
															"form.usdRateUpdated",
														)}
													</p>
												)}
											<FormMessage />
										</div>
									</FormItem>
								)}
							/>

							{/* 新幣金額預覽 */}
							<div className="grid grid-cols-4 items-center gap-4">
								<FormLabel className="text-right">
									{t("sgdAmount")}
								</FormLabel>
								<div className="col-span-3">
									<Input
										type="text"
										disabled
										value={(() => {
											const amount =
												form.watch("amount") || 0;
											const exchangeRate =
												form.watch("exchangeRate") || 1;
											const sgdAmount =
												amount * exchangeRate;
											return new Intl.NumberFormat(
												"zh-TW",
												{
													style: "currency",
													currency: "SGD",
												},
											).format(sgdAmount);
										})()}
										className="bg-muted"
									/>
								</div>
							</div>

							{/* 美元金額預覽 */}
							<div className="grid grid-cols-4 items-center gap-4">
								<FormLabel className="text-right">
									{t("usdAmount")}
								</FormLabel>
								<div className="col-span-3">
									<Input
										type="text"
										disabled
										value={(() => {
											const amount =
												form.watch("amount") || 0;
											const usdRate =
												form.watch("usdRate") || 1;
											const usdAmount = amount * usdRate;
											return new Intl.NumberFormat(
												"zh-TW",
												{
													style: "currency",
													currency: "USD",
												},
											).format(usdAmount);
										})()}
										className="bg-muted"
									/>
								</div>
							</div>

							<FormField
								control={form.control}
								name="description"
								render={({ field }) => (
									<FormItem className="grid grid-cols-4 items-start gap-4">
										<FormLabel className="text-right pt-2">
											{t("description")}
										</FormLabel>
										<div className="col-span-3">
											<FormControl>
												<Textarea
													placeholder={t(
														"form.enterDescription",
													)}
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</div>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="receiptUrls"
								render={({ field }) => (
									<FormItem className="grid grid-cols-4 items-start gap-4">
										<FormLabel className="text-right pt-2">
											{t("receipts")}
										</FormLabel>
										<div className="col-span-3">
											<FormControl>
												<ReceiptUpload
													value={field.value}
													onChange={field.onChange}
												/>
											</FormControl>
											<FormMessage />
										</div>
									</FormItem>
								)}
							/>
						</div>
						<DialogFooter className="!justify-between">
							<Button
								type="button"
								variant="error"
								onClick={handleDelete}
								disabled={isDeleting}
							>
								{isDeleting ? t("form.deleting") : t("delete")}
							</Button>
							<div className="flex gap-2">
								<Button
									type="button"
									variant="outline"
									onClick={() => onOpenChange(false)}
								>
									{t("form.cancel")}
								</Button>
								<Button type="submit" disabled={isLoading}>
									{isLoading
										? t("form.updating")
										: t("form.update")}
								</Button>
							</div>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
