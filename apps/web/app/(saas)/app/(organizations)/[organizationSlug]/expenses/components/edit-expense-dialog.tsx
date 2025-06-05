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
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
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

const editExpenseSchema = z.object({
	category: z.enum(["餐飲", "機票", "酒店", "快遞", "交通"], {
		required_error: "類別是必填的",
	}),
	amount: z.number().min(0, "金額不能為負數"),
	currency: z.string().min(1, "幣別是必填的"),
	exchangeRate: z.number().min(0, "匯率不能為負數").optional(),
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

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
		setValue,
		watch,
	} = useForm<EditExpenseFormData>({
		resolver: zodResolver(editExpenseSchema),
	});

	const categoryValue = watch("category");
	const currencyValue = watch("currency");

	// 當對話框打開時，設置表單的初始值
	useEffect(() => {
		if (open && expenseRecord) {
			setValue("category", expenseRecord.category as any);
			setValue("amount", Number(expenseRecord.amount));
			setValue("currency", expenseRecord.currency);
			setValue("exchangeRate", Number(expenseRecord.exchangeRate));
			setValue("description", expenseRecord.description || "");
			// 將日期轉換為YYYY-MM-DD格式的字符串
			const dateStr = new Date(expenseRecord.date)
				.toISOString()
				.split("T")[0];
			setValue("date", dateStr);
		}
	}, [open, expenseRecord, setValue]);

	const onSubmit = async (data: EditExpenseFormData) => {
		setIsLoading(true);
		try {
			// 準備發送給API的數據，確保日期格式正確
			const submitData = {
				...data,
				date: data.date ? new Date(data.date) : undefined,
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
			reset();
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
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>編輯支出</DialogTitle>
					<DialogDescription>
						修改下方資訊來更新支出記錄。
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit(onSubmit)}>
					<div className="grid gap-4 py-4">
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="category" className="text-right">
								類別 *
							</Label>
							<div className="col-span-3">
								<Select
									value={categoryValue}
									onValueChange={(value) =>
										setValue("category", value as any)
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
								{errors.category && (
									<p className="mt-1 text-sm text-red-500">
										{errors.category.message}
									</p>
								)}
							</div>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="amount" className="text-right">
								金額 *
							</Label>
							<div className="col-span-3">
								<Input
									id="amount"
									type="number"
									step="0.01"
									min="0"
									placeholder="0.00"
									{...register("amount", {
										valueAsNumber: true,
									})}
								/>
								{errors.amount && (
									<p className="mt-1 text-sm text-red-500">
										{errors.amount.message}
									</p>
								)}
							</div>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="currency" className="text-right">
								幣別 *
							</Label>
							<div className="col-span-3">
								<Select
									value={currencyValue}
									onValueChange={(value) =>
										setValue("currency", value)
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
								{errors.currency && (
									<p className="mt-1 text-sm text-red-500">
										{errors.currency.message}
									</p>
								)}
							</div>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label
								htmlFor="exchangeRate"
								className="text-right"
							>
								匯率
							</Label>
							<div className="col-span-3">
								<Input
									id="exchangeRate"
									type="number"
									step="0.0001"
									min="0"
									placeholder="1.0000"
									{...register("exchangeRate", {
										valueAsNumber: true,
									})}
								/>
								{errors.exchangeRate && (
									<p className="mt-1 text-sm text-red-500">
										{errors.exchangeRate.message}
									</p>
								)}
							</div>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="date" className="text-right">
								日期
							</Label>
							<div className="col-span-3">
								<Input
									id="date"
									type="date"
									{...register("date")}
								/>
								{errors.date && (
									<p className="mt-1 text-sm text-red-500">
										{errors.date.message}
									</p>
								)}
							</div>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="description" className="text-right">
								描述
							</Label>
							<div className="col-span-3">
								<Textarea
									id="description"
									placeholder="輸入支出描述"
									{...register("description")}
								/>
								{errors.description && (
									<p className="mt-1 text-sm text-red-500">
										{errors.description.message}
									</p>
								)}
							</div>
						</div>
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
			</DialogContent>
		</Dialog>
	);
}
