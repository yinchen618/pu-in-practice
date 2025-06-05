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
import type { BankAccountRecord } from "./columns";

const editBankAccountSchema = z.object({
	customerId: z.string().optional(),
	bankName: z.string().min(1, "銀行名稱是必填的"),
	accountName: z.string().min(1, "帳戶名稱是必填的"),
	accountNumber: z.string().min(1, "帳號是必填的"),
	currency: z.string().min(1, "幣別是必填的"),
	balance: z.number().min(0, "餘額不能為負數"),
	status: z.enum(["active", "inactive"]),
});

type EditBankAccountFormData = z.infer<typeof editBankAccountSchema>;

interface Customer {
	id: string;
	name: string;
	email: string;
}

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
	const [customers, setCustomers] = useState<Customer[]>([]);

	const form = useForm<EditBankAccountFormData>({
		resolver: zodResolver(editBankAccountSchema),
		defaultValues: {
			customerId: bankAccountRecord.customerId || "none",
			bankName: bankAccountRecord.bankName,
			accountName: bankAccountRecord.accountName,
			accountNumber: bankAccountRecord.accountNumber,
			currency: bankAccountRecord.currency,
			balance: bankAccountRecord.balance,
			status: bankAccountRecord.status,
		},
	});

	// 獲取客戶列表
	const fetchCustomers = async () => {
		try {
			const response = await fetch(
				`/api/organizations/customers?organizationId=${bankAccountRecord.organizationId}`,
				{
					method: "GET",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
					},
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

	useEffect(() => {
		if (open) {
			form.reset({
				customerId: bankAccountRecord.customerId || "none",
				bankName: bankAccountRecord.bankName,
				accountName: bankAccountRecord.accountName,
				accountNumber: bankAccountRecord.accountNumber,
				currency: bankAccountRecord.currency,
				balance: bankAccountRecord.balance,
				status: bankAccountRecord.status,
			});
			fetchCustomers();
		}
	}, [open, bankAccountRecord, form]);

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
					body: JSON.stringify({
						...data,
						customerId:
							data.customerId === "none" ? null : data.customerId,
					}),
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
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)}>
						<div className="grid gap-4 py-4">
							<FormField
								control={form.control}
								name="customerId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>客戶</FormLabel>
										<Select
											onValueChange={field.onChange}
											value={field.value || "none"}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="選擇客戶（可選）" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="none">
													未指定客戶
												</SelectItem>
												{customers.map((customer) => (
													<SelectItem
														key={customer.id}
														value={customer.id}
													>
														{customer.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="bankName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>銀行名稱 *</FormLabel>
										<FormControl>
											<Input
												placeholder="輸入銀行名稱"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="accountName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>帳戶名稱 *</FormLabel>
										<FormControl>
											<Input
												placeholder="輸入帳戶名稱"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="accountNumber"
								render={({ field }) => (
									<FormItem>
										<FormLabel>帳號 *</FormLabel>
										<FormControl>
											<Input
												placeholder="輸入帳號"
												{...field}
											/>
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
										<FormLabel>幣別 *</FormLabel>
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
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="balance"
								render={({ field }) => (
									<FormItem>
										<FormLabel>餘額 *</FormLabel>
										<FormControl>
											<Input
												type="number"
												step="0.01"
												min="0"
												placeholder="0.00"
												{...field}
												onChange={(e) =>
													field.onChange(
														e.target.value
															? Number.parseFloat(
																	e.target
																		.value,
																)
															: 0,
													)
												}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="status"
								render={({ field }) => (
									<FormItem>
										<FormLabel>狀態 *</FormLabel>
										<Select
											onValueChange={field.onChange}
											value={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="選擇狀態" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="active">
													使用中
												</SelectItem>
												<SelectItem value="inactive">
													已停用
												</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<DialogFooter className="gap-2">
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button
										type="button"
										variant="error"
										size="sm"
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
											您確定要刪除這個銀行帳戶嗎？此操作無法復原。
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>
											取消
										</AlertDialogCancel>
										<AlertDialogAction
											onClick={handleDelete}
											disabled={isDeleting}
										>
											{isDeleting
												? "刪除中..."
												: "確認刪除"}
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
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
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
