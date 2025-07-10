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
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CURRENCY_OPTIONS } from "../../constants";
import type { BankAccountRecord } from "./columns";

const editBankAccountSchema = z.object({
	customerId: z.string().optional(),
	bankName: z.string().min(1, "銀行名稱是必填的"),
	// accountName: z.string().min(1, "帳戶名稱是必填的"), // 已隱藏
	accountNumber: z.string().min(1, "帳號是必填的"),
	currency: z.string().min(1, "幣別是必填的"),
	status: z.enum(["active", "inactive"]),
	// balance: z.number().min(0, "餘額不能為負數").optional(),
});

type EditBankAccountFormData = z.infer<typeof editBankAccountSchema>;

interface Customer {
	id: string;
	name: string;
	email: string;
	code: string;
}

interface EditBankAccountDialogProps {
	bankAccountRecord: BankAccountRecord;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
	dialogTitle?: string;
	customerCode?: string;
	customerName?: string;
}

export function EditBankAccountDialog({
	bankAccountRecord,
	open,
	onOpenChange,
	onSuccess,
	dialogTitle = "編輯銀行帳戶",
	customerCode,
	customerName,
}: EditBankAccountDialogProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [customers, setCustomers] = useState<Customer[]>([]);
	const [isCustomersLoading, setIsCustomersLoading] = useState(false);

	const form = useForm<EditBankAccountFormData>({
		resolver: zodResolver(editBankAccountSchema),
		defaultValues: {
			customerId: bankAccountRecord.customerId || "none",
			bankName: bankAccountRecord.bankName,
			accountNumber: bankAccountRecord.accountNumber,
			currency: bankAccountRecord.currency,
			status: bankAccountRecord.status,
		},
	});

	// 獲取客戶列表 - 只在真正需要時才調用
	const fetchCustomers = async () => {
		// 如果有 customerCode 和 customerName，不需要獲取客戶列表
		if (customerCode && customerName) {
			return;
		}

		setIsCustomersLoading(true);
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
		} finally {
			setIsCustomersLoading(false);
		}
	};

	useEffect(() => {
		if (open) {
			form.reset({
				customerId: bankAccountRecord.customerId || "none",
				bankName: bankAccountRecord.bankName,
				accountNumber: bankAccountRecord.accountNumber,
				currency: bankAccountRecord.currency,
				status: bankAccountRecord.status,
			});

			console.log("customerCode", customerCode);
			// 只有在沒有指定客戶資訊時才需要載入客戶列表
			if (!customerCode && !customerName) {
				fetchCustomers();
			}
		}
	}, [open, bankAccountRecord, form, customerCode, customerName]);

	useEffect(() => {
		if (bankAccountRecord.customerId && customers.length > 0) {
			form.setValue("customerId", bankAccountRecord.customerId);
		}
	}, [bankAccountRecord.customerId, customers, form]);

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
		if (!confirm("您確定要刪除這個銀行帳戶嗎？此操作無法復原。")) {
			return;
		}

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
					<DialogTitle>
						{dialogTitle}
						{customerCode ? `（客戶編號：${customerCode}）` : ""}
					</DialogTitle>
					<DialogDescription>修改銀行帳戶的資訊。</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)}>
						<div className="grid gap-4 py-4">
							{/* 客戶欄位：根據是否有客戶資訊來決定顯示方式 */}
							<FormItem>
								<FormLabel>客戶</FormLabel>
								{customerCode && customerName ? (
									<Input
										value={`[${customerCode}] ${customerName}`}
										disabled
										className="bg-muted/50 cursor-not-allowed"
									/>
								) : (
									<FormField
										control={form.control}
										name="customerId"
										render={({ field }) => (
											<FormControl>
												<Select
													onValueChange={
														field.onChange
													}
													value={
														field.value || "none"
													}
													disabled={
														isCustomersLoading
													}
												>
													<SelectTrigger>
														<SelectValue placeholder="選擇客戶" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="none">
															無
														</SelectItem>
														{customers.map(
															(customer) => (
																<SelectItem
																	key={
																		customer.id
																	}
																	value={
																		customer.id
																	}
																>
																	[
																	{
																		customer.code
																	}
																	]{" "}
																	{
																		customer.name
																	}
																</SelectItem>
															),
														)}
													</SelectContent>
												</Select>
											</FormControl>
										)}
									/>
								)}
								<FormMessage />
							</FormItem>
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
							{/* <FormField
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
							/> */}
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
