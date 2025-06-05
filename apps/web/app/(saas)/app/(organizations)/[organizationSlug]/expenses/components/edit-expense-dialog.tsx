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
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { ExpenseRecord } from "./columns";
import { ReceiptUpload } from "./receipt-upload";

const editExpenseSchema = z.object({
	category: z.enum(["餐飲", "機票", "酒店", "快遞", "交通"], {
		required_error: "類別是必填的",
	}),
	amount: z.number().min(0, "金額不能為負數"),
	currency: z.string().min(1, "幣別是必填的"),
	exchangeRate: z.number().min(0, "匯率不能為負數").optional(),
	receiptUrls: z.array(z.string()).optional(),
	description: z.string().optional(),
	date: z.string().optional(),
});

type EditExpenseFormData = z.infer<typeof editExpenseSchema>;

interface EditExpenseDialogProps {
	expenseRecord: ExpenseRecord;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

export function EditExpenseDialog({
	expenseRecord,
	open,
	onOpenChange,
	onSuccess,
}: EditExpenseDialogProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const form = useForm<EditExpenseFormData>({
		resolver: zodResolver(editExpenseSchema),
	});

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
				receiptUrls: allReceiptUrls,
				description: expenseRecord.description || "",
				date: dateStr,
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
			};

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
			console.error("更新支出失敗:", error);
			// 這裡可以添加 toast 通知
		} finally {
			setIsLoading(false);
		}
	};

	const handleDelete = async () => {
		if (!confirm("確定要刪除這筆支出記錄嗎？此操作無法復原。")) {
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
			console.error("刪除支出失敗:", error);
			// 這裡可以添加 toast 通知
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>編輯支出</DialogTitle>
					<DialogDescription>
						修改下方資訊來更新支出記錄。
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)}>
						<div className="grid gap-4 py-4">
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
														<SelectItem value="SGD">
															新加坡幣 (SGD)
														</SelectItem>
														<SelectItem value="HKD">
															港幣 (HKD)
														</SelectItem>
														<SelectItem value="TWD">
															新台幣 (TWD)
														</SelectItem>
														<SelectItem value="USD">
															美元 (USD)
														</SelectItem>
														<SelectItem value="EUR">
															歐元 (EUR)
														</SelectItem>
														<SelectItem value="JPY">
															日圓 (JPY)
														</SelectItem>
														<SelectItem value="CNY">
															人民幣 (CNY)
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
								name="exchangeRate"
								render={({ field }) => (
									<FormItem className="grid grid-cols-4 items-center gap-4">
										<FormLabel className="text-right">
											匯率
										</FormLabel>
										<div className="col-span-3">
											<FormControl>
												<Input
													type="number"
													step="0.0001"
													min="0"
													placeholder="1.0000"
													{...field}
													onChange={(e) =>
														field.onChange(
															Number.parseFloat(
																e.target.value,
															) || undefined,
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
						<DialogFooter className="flex justify-between">
							<Button
								type="button"
								variant="error"
								onClick={handleDelete}
								disabled={isDeleting}
							>
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
