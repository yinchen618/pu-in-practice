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
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const createBankAccountSchema = z.object({
	bankName: z.string().min(1, "銀行名稱是必填的"),
	accountName: z.string().min(1, "帳戶名稱是必填的"),
	accountNumber: z.string().min(1, "帳號是必填的"),
	currency: z.string().min(1, "幣別是必填的"),
	balance: z.number().min(0, "餘額不能為負數").optional(),
});

type CreateBankAccountFormData = z.infer<typeof createBankAccountSchema>;

interface CreateBankAccountDialogProps {
	organizationId: string;
	onSuccess?: () => void;
}

export function CreateBankAccountDialog({
	organizationId,
	onSuccess,
}: CreateBankAccountDialogProps) {
	const [open, setOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
		setValue,
		watch,
	} = useForm<CreateBankAccountFormData>({
		resolver: zodResolver(createBankAccountSchema),
		defaultValues: {
			currency: "TWD",
			balance: 0,
		},
	});

	const currencyValue = watch("currency");

	const onSubmit = async (data: CreateBankAccountFormData) => {
		setIsLoading(true);
		try {
			const response = await fetch("/api/organizations/bank-accounts", {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					...data,
					organizationId,
				}),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || "創建失敗");
			}

			// 重置表單並關閉對話框
			reset();
			setOpen(false);
			onSuccess?.();
		} catch (error) {
			console.error("創建銀行帳戶失敗:", error);
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
					新增銀行帳戶
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>新增銀行帳戶</DialogTitle>
					<DialogDescription>
						填寫下方資訊來新增一個銀行帳戶。
					</DialogDescription>
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
							<Label htmlFor="balance" className="text-right">
								初始餘額
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
							{isLoading ? "創建中..." : "創建"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
