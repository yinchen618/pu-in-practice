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
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { getCurrencyOptions } from "../../constants";
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
	customerCode,
	customerName,
}: EditBankAccountDialogProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [customers, setCustomers] = useState<Customer[]>([]);
	const [isCustomersLoading, setIsCustomersLoading] = useState(false);
	const t = useTranslations("organization.bankAccounts");
	const tConstants = useTranslations("organization.constants");

	const currencyOptions = getCurrencyOptions(tConstants);

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
			console.error("Failed to fetch customers:", error);
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

			// console.log("customerCode", customerCode);
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
				throw new Error(error.message || t("updateFailed"));
			}

			onOpenChange(false);
			onSuccess?.();
		} catch (error) {
			console.error("Failed to update bank account:", error);
			// 這裡可以添加 toast 通知
		} finally {
			setIsLoading(false);
		}
	};

	const handleDelete = async () => {
		if (!confirm(t("deleteConfirm"))) {
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
				throw new Error(error.message || t("deleteFailed"));
			}

			onOpenChange(false);
			onSuccess?.();
		} catch (error) {
			console.error("Failed to delete bank account:", error);
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
						{t("editTitle")}
						{customerCode
							? ` (${t("customerCode")}: ${customerCode})`
							: ""}
					</DialogTitle>
					<DialogDescription>
						{t("editDescription")}
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)}>
						<div className="grid gap-4 py-4">
							{/* 客戶欄位：根據是否有客戶資訊來決定顯示方式 */}
							<FormItem>
								<FormLabel>{t("customer")}</FormLabel>
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
														<SelectValue
															placeholder={t(
																"selectCustomer",
															)}
														/>
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="none">
															{t("none")}
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
										<FormLabel>{t("bankName")} *</FormLabel>
										<FormControl>
											<Input
												placeholder={t(
													"bankNamePlaceholder",
												)}
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
										<FormLabel>{t("accountName")} *</FormLabel>
										<FormControl>
											<Input
												placeholder={t("accountNamePlaceholder")}
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
										<FormLabel>
											{t("accountNumber")} *
										</FormLabel>
										<FormControl>
											<Input
												placeholder={t(
													"accountNumberPlaceholder",
												)}
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
																"selectCurrency",
															)}
														/>
													</SelectTrigger>
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
										<FormLabel>{t("status")} *</FormLabel>
										<Select
											onValueChange={field.onChange}
											value={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue
														placeholder={t(
															"selectStatus",
														)}
													/>
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="active">
													{t("active")}
												</SelectItem>
												<SelectItem value="inactive">
													{t("inactive")}
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
								{isDeleting ? t("deleting") : t("delete")}
							</Button>
							<div className="flex gap-2">
								<Button
									type="button"
									variant="outline"
									onClick={() => onOpenChange(false)}
								>
									{t("cancel")}
								</Button>
								<Button type="submit" disabled={isLoading}>
									{isLoading ? t("updating") : t("update")}
								</Button>
							</div>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
