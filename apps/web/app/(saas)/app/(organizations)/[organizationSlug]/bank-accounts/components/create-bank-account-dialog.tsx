"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SearchableSelect } from "@shared/components/SearchableSelect";
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
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { getCurrencyOptions } from "../../constants";

const createBankAccountSchema = z.object({
	customerId: z.string().optional(),
	bankName: z.string().min(1, "銀行名稱是必填的"),
	// accountName: z.string().min(1, "帳戶名稱是必填的"), // 已隱藏
	accountNumber: z.string().min(1, "帳號是必填的"),
	currency: z.string().min(1, "幣別是必填的"),
	// balance: z.number().min(0, "餘額不能為負數").optional(),
});

type CreateBankAccountFormData = z.infer<typeof createBankAccountSchema>;

interface Customer {
	id: string;
	name: string;
	email: string;
	code: string;
}

interface CreateBankAccountDialogProps {
	organizationId: string;
	onSuccess?: () => void;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	dialogTitle?: string;
	customerCode?: string;
	customerId?: string;
	customerName?: string;
}

export function CreateBankAccountDialog({
	organizationId,
	onSuccess,
	open: controlledOpen,
	onOpenChange,
	dialogTitle = "新增銀行帳戶",
	customerCode,
	customerId,
}: CreateBankAccountDialogProps) {
	const [open, setOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [customers, setCustomers] = useState<Customer[]>([]);
	const [isCustomersLoading, setIsCustomersLoading] = useState(false);
	const t = useTranslations("organization.bankAccounts");
	const tConstants = useTranslations("organization.constants");

	const currencyOptions = getCurrencyOptions(tConstants);

	const form = useForm<CreateBankAccountFormData>({
		resolver: zodResolver(createBankAccountSchema),
		defaultValues: {
			customerId: "none",
			bankName: "",
			// accountName: "", // 已隱藏
			accountNumber: "",
			currency: "TWD",
			// balance: 0,
		},
	});

	const actualOpen = controlledOpen !== undefined ? controlledOpen : open;
	const handleOpenChange = onOpenChange || setOpen;

	// 獲取客戶列表
	const fetchCustomers = async () => {
		setIsCustomersLoading(true);
		try {
			const response = await fetch(
				`/api/organizations/customers?organizationId=${organizationId}`,
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
		if (actualOpen && organizationId && !customerId) {
			fetchCustomers();
		}
	}, [actualOpen, organizationId, customerId]);

	useEffect(() => {
		if (customerId && customers.length > 0) {
			form.setValue("customerId", customerId);
		}
	}, [customerId, customers, form]);

	const onSubmit = async (data: CreateBankAccountFormData) => {
		setIsLoading(true);
		try {
			// 準備要發送的資料
			const requestData = {
				...data,
				accountName: "", // 保證有 accountName 欄位
				customerId:
					customerId ||
					(data.customerId === "none" || !data.customerId
						? null
						: data.customerId),
				organizationId,
			};

			const response = await fetch("/api/organizations/bank-accounts", {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(requestData),
			});

			if (!response.ok) {
				let errorMessage = "新增失敗";
				try {
					const error = await response.json();
					errorMessage = error.message || errorMessage;
				} catch {
					// 如果無法解析 JSON，使用預設錯誤訊息
					errorMessage = `HTTP ${response.status}: ${response.statusText}`;
				}
				throw new Error(errorMessage);
			}

			// 重置表單並關閉對話框
			form.reset();
			setOpen(false);
			onSuccess?.();
		} catch (error) {
			console.error("新增銀行帳戶失敗:", error);
			// 這裡可以添加 toast 通知
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Dialog open={actualOpen} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<Button>
					<Plus className="mr-2 size-4" />
					{t("createTitle")}
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>
						{t("createTitle")}
						{customerCode
							? ` (${t("customerCode")}: ${customerCode})`
							: ""}
					</DialogTitle>
					<DialogDescription>
						{t("createDescription")}
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)}>
						<div className="grid gap-4 py-4">
							{!customerId && (
								<FormField
									control={form.control}
									name="customerId"
									render={({ field }) => (
										<SearchableSelect<Customer>
											field={field}
											label={t("customer")}
											placeholder={t("selectCustomer")}
											searchPlaceholder={t(
												"searchCustomer",
											)}
											emptyText={t("customerNotFound")}
											options={customers}
											getDisplayValue={(option) =>
												option
													? `${option.code} - ${option.name}`
													: ""
											}
											getSearchValue={(option) =>
												`${option.code} ${option.name}`
											}
											getOptionDisplayValue={(option) =>
												`${option.code} - ${option.name}`
											}
										/>
									)}
								/>
							)}

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

							{/* <FormField
								control={form.control}
								name="balance"
								render={({ field }) => (
									<FormItem>
										<FormLabel>餘額</FormLabel>
										<FormControl>
											<Input
												type="number"
												step="1"
												placeholder="輸入餘額"
												{...field}
												onChange={(e) => {
													const value =
														e.target.value;
													field.onChange(
														value === ""
															? undefined
															: Number(value),
													);
												}}
												value={field.value || ""}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/> */}
						</div>
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => handleOpenChange(false)}
							>
								{t("cancel")}
							</Button>
							<Button type="submit" disabled={isLoading}>
								{isLoading ? t("creating") : t("create")}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
