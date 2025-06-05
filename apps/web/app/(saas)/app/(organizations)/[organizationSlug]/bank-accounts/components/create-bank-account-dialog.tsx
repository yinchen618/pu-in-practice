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
	accountName: z.string().min(1, "帳戶名稱是必填的"),
	accountNumber: z.string().min(1, "帳號是必填的"),
	currency: z.string().min(1, "幣別是必填的"),
	balance: z.number().min(0, "餘額不能為負數").optional(),
});

type CreateBankAccountFormData = z.infer<typeof createBankAccountSchema>;

interface Customer {
	id: string;
	name: string;
	email: string;
}

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
	const [customers, setCustomers] = useState<Customer[]>([]);

	const form = useForm<CreateBankAccountFormData>({
		resolver: zodResolver(createBankAccountSchema),
		defaultValues: {
			currency: "TWD",
			balance: 0,
		},
	});

	// 獲取客戶列表
	const fetchCustomers = async () => {
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
		}
	};

	useEffect(() => {
		if (open && organizationId) {
			fetchCustomers();
		}
	}, [open, organizationId]);

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
					customerId:
						data.customerId === "none" ? null : data.customerId,
					organizationId,
				}),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || "創建失敗");
			}

			// 重置表單並關閉對話框
			form.reset();
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
										<FormLabel>初始餘額</FormLabel>
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
				</Form>
			</DialogContent>
		</Dialog>
	);
}
