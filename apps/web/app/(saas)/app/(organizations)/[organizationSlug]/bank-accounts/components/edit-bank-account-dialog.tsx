"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@ui/components/alert-dialog";
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
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { BankAccountRecord } from "./columns";

const editBankAccountSchema = z.object({
	bankName: z.string().min(1, "銀行名稱是必填的"),
	accountName: z.string().min(1, "帳戶名稱是必填的"),
	accountNumber: z.string().min(1, "帳號是必填的"),
	currency: z.string().min(1, "幣別是必填的"),
	balance: z.number().min(0, "餘額不能為負數"),
	status: z.enum(["active", "inactive"]),
});

type EditBankAccountFormData = z.infer<typeof editBankAccountSchema>;

interface EditBankAccountDialogProps {
	bankAccountRecord: BankAccountRecord;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

export function EditBankAccountDialog({
	bankAccountRecord,
	open,
	onOpenChange,
	onSuccess,
}: EditBankAccountDialogProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
		setValue,
		watch,
	} = useForm<EditBankAccountFormData>({
		resolver: zodResolver(editBankAccountSchema),
		defaultValues: {
			bankName: bankAccountRecord.bankName,
			accountName: bankAccountRecord.accountName,
			accountNumber: bankAccountRecord.accountNumber,
			currency: bankAccountRecord.currency,
			balance: bankAccountRecord.balance,
			status: bankAccountRecord.status,
		},
	});

	const statusValue = watch("status");
	const currencyValue = watch("currency");

	useEffect(() => {
		if (open) {
			setValue("bankName", bankAccountRecord.bankName);
			setValue("accountName", bankAccountRecord.accountName);
			setValue("accountNumber", bankAccountRecord.accountNumber);
			setValue("currency", bankAccountRecord.currency);
			setValue("balance", bankAccountRecord.balance);
			setValue("status", bankAccountRecord.status);
		}
	}, [open, bankAccountRecord, setValue]);

	const onSubmit = async (data: EditBankAccountFormData) => {
		setIsLoading(true);
		try {
			const response = await fetch(
				`/api/organizations/bank-accounts/${bankAccountRecord.id}`,
				{
					method: "PUT",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(data),
				},
			);

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || "更新失敗");
			}

			onOpenChange(false);
			onSuccess?.();
		} catch (error) {
			console.error("更新銀行帳戶失敗:", error);
			// 這裡可以添加 toast 通知
		} finally {
			setIsLoading(false);
		}
	};

	const handleDelete = async () => {
		setIsDeleting(true);
		try {
			const response = await fetch(
				`/api/organizations/bank-accounts/${bankAccountRecord.id}`,
				{
					method: "DELETE",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
					},
				},
			);

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || "刪除失敗");
			}

			onOpenChange(false);
			onSuccess?.();
		} catch (error) {
			console.error("刪除銀行帳戶失敗:", error);
			// 這裡可以添加 toast 通知
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>編輯銀行帳戶</DialogTitle>
					<DialogDescription>修改銀行帳戶的資訊。</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit(onSubmit)}>
					<div className="grid gap-4 py-4">
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="bankName" className="text-right">
								銀行名稱 *
							</Label>
							<div className="col-span-3">
								<Input
									id="bankName"
									{...register("bankName")}
									placeholder="輸入銀行名稱"
								/>
								{errors.bankName && (
									<p className="mt-1 text-sm text-red-500">
										{errors.bankName.message}
									</p>
								)}
							</div>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="accountName" className="text-right">
								帳戶名稱 *
							</Label>
							<div className="col-span-3">
								<Input
									id="accountName"
									{...register("accountName")}
									placeholder="輸入帳戶名稱"
								/>
								{errors.accountName && (
									<p className="mt-1 text-sm text-red-500">
										{errors.accountName.message}
									</p>
								)}
							</div>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label
								htmlFor="accountNumber"
								className="text-right"
							>
								帳號 *
							</Label>
							<div className="col-span-3">
								<Input
									id="accountNumber"
									{...register("accountNumber")}
									placeholder="輸入帳號"
								/>
								{errors.accountNumber && (
									<p className="mt-1 text-sm text-red-500">
										{errors.accountNumber.message}
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
							<Label htmlFor="balance" className="text-right">
								餘額 *
							</Label>
							<div className="col-span-3">
								<Input
									id="balance"
									type="number"
									step="0.01"
									min="0"
									placeholder="0.00"
									{...register("balance", {
										valueAsNumber: true,
									})}
								/>
								{errors.balance && (
									<p className="mt-1 text-sm text-red-500">
										{errors.balance.message}
									</p>
								)}
							</div>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="status" className="text-right">
								狀態 *
							</Label>
							<div className="col-span-3">
								<Select
									value={statusValue}
									onValueChange={(value) =>
										setValue(
											"status",
											value as "active" | "inactive",
										)
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="選擇狀態" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="active">
											使用中
										</SelectItem>
										<SelectItem value="inactive">
											已停用
										</SelectItem>
									</SelectContent>
								</Select>
								{errors.status && (
									<p className="mt-1 text-sm text-red-500">
										{errors.status.message}
									</p>
								)}
							</div>
						</div>
					</div>
					<DialogFooter className="flex justify-between items-center">
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button
									type="button"
									variant="error"
									size="sm"
									disabled={isDeleting || isLoading}
								>
									<Trash2 className="mr-2 size-4" />
									刪除
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>
										確認刪除
									</AlertDialogTitle>
									<AlertDialogDescription>
										你確定要刪除銀行帳戶「
										{bankAccountRecord.accountName}」嗎？
										此操作無法復原。
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>取消</AlertDialogCancel>
									<AlertDialogAction
										onClick={handleDelete}
										disabled={isDeleting}
										className="bg-red-600 hover:bg-red-700"
									>
										{isDeleting ? "刪除中..." : "確認刪除"}
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>

						<div className="flex gap-2 ml-auto">
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
								disabled={isLoading || isDeleting}
							>
								取消
							</Button>
							<Button
								type="submit"
								disabled={isLoading || isDeleting}
							>
								{isLoading ? "更新中..." : "更新"}
							</Button>
						</div>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
