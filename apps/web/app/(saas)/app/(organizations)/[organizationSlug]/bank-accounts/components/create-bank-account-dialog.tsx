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
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const createBankAccountSchema = z.object({
	customerId: z.string().optional(),
	bankName: z.string().min(1, "銀行名稱是必填的"),
	// accountName: z.string().min(1, "帳戶名稱是必填的"), // 已隱藏
	accountNumber: z.string().min(1, "帳號是必填的"),
	currency: z.string().min(1, "幣別是必填的"),
	balance: z.number().min(0, "餘額不能為負數").optional(),
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
	customerName,
}: CreateBankAccountDialogProps) {
	const [open, setOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [customers, setCustomers] = useState<Customer[]>([]);
	const [isCustomersLoading, setIsCustomersLoading] = useState(false);

	const form = useForm<CreateBankAccountFormData>({
		resolver: zodResolver(createBankAccountSchema),
		defaultValues: {
			customerId: "none",
			bankName: "",
			// accountName: "", // 已隱藏
			accountNumber: "",
			currency: "TWD",
			balance: 0,
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
					{dialogTitle}
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>
						{dialogTitle}
						{customerCode ? `（客戶編號：${customerCode}）` : ""}
					</DialogTitle>
					<DialogDescription>
						填寫下方資訊來新增一個銀行帳戶。
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)}>
						<div className="grid gap-4 py-4">
							{/* 客戶欄位：只有沒有 customerId 時才顯示 */}
							{!customerId && (
								<FormField
									control={form.control}
									name="customerId"
									render={({ field }) => (
										<FormItem>
											<FormLabel>客戶</FormLabel>
											<FormControl>
												<Select
													onValueChange={
														field.onChange
													}
													value={
														field.value || "none"
													}
													disabled={!!customerId}
												>
													<SelectTrigger>
														<SelectValue placeholder="選擇客戶（可選）" />
													</SelectTrigger>
													<SelectContent>
														{isCustomersLoading ? (
															<SelectItem
																value="loading"
																disabled
															>
																載入中...
															</SelectItem>
														) : (
															<>
																<SelectItem value="none">
																	未指定客戶
																</SelectItem>
																{customers.map(
																	(
																		customer,
																	) => (
																		<SelectItem
																			key={
																				customer.id
																			}
																			value={
																				customer.id
																			}
																		>
																			<span className="inline-flex items-center gap-2">
																				<span className="bg-gray-100 text-gray-600 text-xs font-mono px-2 py-0.5 rounded">
																					{
																						customer.code
																					}
																				</span>
																				<span>
																					{
																						customer.name
																					}
																				</span>
																			</span>
																		</SelectItem>
																	),
																)}
															</>
														)}
													</SelectContent>
												</Select>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							)}
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
										<FormControl>
											<Select
												onValueChange={field.onChange}
												value={field.value}
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
									</FormItem>
								)}
							/>
						</div>
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => handleOpenChange(false)}
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
