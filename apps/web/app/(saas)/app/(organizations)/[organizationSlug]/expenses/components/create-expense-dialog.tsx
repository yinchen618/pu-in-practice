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
import { Textarea } from "@ui/components/textarea";
import { Plus, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useExchangeRate } from "../../../../../../../hooks/use-exchange-rate";
import { CURRENCY_OPTIONS } from "../../constants";
import { ReceiptUpload } from "./receipt-upload";

const createExpenseSchema = z.object({
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

type CreateExpenseFormData = z.infer<typeof createExpenseSchema>;

interface RelationshipManager {
	id: string;
	name: string;
	category: "RM" | "FINDER" | "BOTH";
}

interface CreateExpenseDialogProps {
	organizationId: string;
	relationshipManagers: RelationshipManager[];
	onSuccess?: () => void;
}

export function CreateExpenseDialog({
	organizationId,
	relationshipManagers,
	onSuccess,
}: CreateExpenseDialogProps) {
	const [open, setOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	// 根據角色類型過濾 RM 列表
	const rmOptions = relationshipManagers.filter(
		(rm) => rm.category === "RM" || rm.category === "BOTH",
	);

	// 獲取今天的日期字符串（YYYY-MM-DD格式）
	const today = new Date().toISOString().split("T")[0];

	const form = useForm<CreateExpenseFormData>({
		resolver: zodResolver(createExpenseSchema),
		defaultValues: {
			currency: "SGD",
			exchangeRate: 1,
			usdRate: 1,
			date: today,
			receiptUrls: [],
		},
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
		date: watchedDate || today,
		enabled: false, // 預設不啟用，只在需要時手動載入
	});

	// 使用匯率hook - USD匯率
	const {
		data: usdExchangeRateData,
		loading: usdExchangeRateLoading,
		error: usdExchangeRateError,
		refetch: refetchUsdExchangeRate,
	} = useExchangeRate({
		date: watchedDate || today,
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

	// 當匯率數據變化時，自動更新表單中的匯率欄位
	useEffect(() => {
		if (watchedCurrency === "SGD") {
			// 如果是SGD，直接設定匯率為1
			form.setValue("exchangeRate", 1);
		} else if (exchangeRateData?.rates) {
			// 使用選定的幣別作為基礎來獲取對 SGD 的匯率
			const rate = exchangeRateData.rates[watchedCurrency];
			if (rate) {
				// 計算: 1 選定幣別 = x SGD
				form.setValue("exchangeRate", Number((1 / rate).toFixed(4)));
			}
		}
	}, [watchedCurrency, exchangeRateData, form]);

	// 處理 USD 匯率的更新
	useEffect(() => {
		if (watchedCurrency === "USD") {
			form.setValue("usdRate", 1);
		} else if (usdExchangeRateData?.rates) {
			const rate = usdExchangeRateData.rates[watchedCurrency];
			if (rate) {
				// 計算: 1 選定幣別 = x USD
				form.setValue("usdRate", Number(rate.toFixed(4)));
			}
		}
	}, [watchedCurrency, usdExchangeRateData, form]);

	const onSubmit = async (data: CreateExpenseFormData) => {
		setIsLoading(true);
		try {
			// 準備發送給API的數據，確保日期格式正確
			const submitData = {
				...data,
				organizationId,
				date: data.date ? new Date(data.date) : new Date(),
				// 確保 receiptUrls 被正確發送
				receiptUrls: data.receiptUrls || [],
				// 處理 rmId，將 "none" 轉換為 null
				rmId: data.rmId === "none" ? null : data.rmId,
			};

			console.log("新增支出 - 提交資料:", submitData);

			const response = await fetch("/api/organizations/expenses", {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(submitData),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || "新增失敗");
			}

			// 重置表單並關閉對話框
			form.reset();
			setOpen(false);
			onSuccess?.();
		} catch (error) {
			console.error("新增支出失敗:", error);
			// 這裡可以添加 toast 通知
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button>
					<Plus className="mr-2 size-4" />
					新增支出
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>新增支出</DialogTitle>
					<DialogDescription>
						填寫下方資訊來新增一筆支出記錄。
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
											日期
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
											RM
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
														<SelectValue placeholder="選擇 RM（選填）" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="none">
															無
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
											類別 *
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
														<SelectValue placeholder="選擇類別" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="餐飲">
															餐飲
														</SelectItem>
														<SelectItem value="機票">
															機票
														</SelectItem>
														<SelectItem value="酒店">
															酒店
														</SelectItem>
														<SelectItem value="快遞">
															快遞
														</SelectItem>
														<SelectItem value="交通">
															交通
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
											幣別 *
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
														<SelectValue placeholder="選擇幣別" />
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
											金額 *
										</FormLabel>
										<div className="col-span-3">
											<FormControl>
												<Input
													type="number"
													step="0.01"
													min="0"
													placeholder="0.00"
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
											新幣匯率
										</FormLabel>
										<div className="col-span-3">
											<div className="flex gap-2">
												<FormControl>
													<Input
														type="number"
														step="0.01"
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
													新幣匯率固定為 1.00
												</p>
											)}
											{exchangeRateError &&
												watchedCurrency !== "SGD" && (
													<p className="text-sm text-red-600 mt-1">
														無法獲取匯率:{" "}
														{exchangeRateError}
													</p>
												)}
											{exchangeRateData &&
												!exchangeRateError &&
												watchedCurrency !== "SGD" && (
													<p className="text-sm text-green-600 mt-1">
														{exchangeRateData.date}{" "}
														的新幣匯率已更新
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
											美元匯率
										</FormLabel>
										<div className="col-span-3">
											<div className="flex gap-2">
												<FormControl>
													<Input
														type="number"
														step="0.01"
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
													美元匯率固定為 1.00
												</p>
											)}
											{usdExchangeRateError &&
												watchedCurrency !== "USD" && (
													<p className="text-sm text-red-600 mt-1">
														無法獲取美元匯率:{" "}
														{usdExchangeRateError}
													</p>
												)}
											{usdExchangeRateData &&
												!usdExchangeRateError &&
												watchedCurrency !== "USD" && (
													<p className="text-sm text-green-600 mt-1">
														{
															usdExchangeRateData.date
														}{" "}
														的美元匯率已更新
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
									新幣金額
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
									美元金額
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
											描述
										</FormLabel>
										<div className="col-span-3">
											<FormControl>
												<Textarea
													placeholder="輸入支出描述"
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
											收據
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
