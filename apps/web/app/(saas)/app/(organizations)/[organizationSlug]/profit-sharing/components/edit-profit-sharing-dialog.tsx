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
import type { ProfitSharingRecord } from "./columns";

const editSchema = z.object({
	customerId: z.string().min(1, "客戶是必填的"),
	productId: z.string().min(1, "產品是必填的"),
	amount: z.number().min(0, "金額不能為負數"),
	profitDate: z.string().min(1, "分潤日期是必填的"),
	currency: z.string().min(1, "幣別是必填的"),
	companyRevenue: z.number().min(0, "Company revenue 不能為負數"),
	directTradeBookingFee: z
		.number()
		.min(0, "Direct trade booking fee 不能為負數"),
	rmProfitSharePercent: z.number().min(0).max(100),
	finderProfitSharePercent: z.number().min(0).max(100),
	companyProfitSharePercent: z.number().min(0).max(100),
	fxRate: z.number().min(0, "FX Rate 不能為負數"),
});

type EditFormData = z.infer<typeof editSchema>;

interface EditDialogProps {
	record: ProfitSharingRecord;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

interface Customer {
	id: string;
	name: string;
	code: string;
}

interface Product {
	id: string;
	name: string;
	code: string;
	category: string;
}

export function EditProfitSharingDialog({
	record,
	open,
	onOpenChange,
	onSuccess,
}: EditDialogProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [customers, setCustomers] = useState<Customer[]>([]);
	const [products, setProducts] = useState<Product[]>([]);

	const form = useForm<EditFormData>({
		resolver: zodResolver(editSchema),
		defaultValues: {
			customerId: record.customerId,
			productId: record.productId,
			amount: record.amount,
			profitDate: new Date(record.profitDate).toISOString().split("T")[0],
			currency: record.currency,
			companyRevenue: record.companyRevenue,
			directTradeBookingFee: record.directTradeBookingFee,
			rmProfitSharePercent: record.rmProfitSharePercent,
			finderProfitSharePercent: record.finderProfitSharePercent,
			companyProfitSharePercent: record.companyProfitSharePercent,
			fxRate: record.fxRate,
		},
	});

	// 當記錄改變時重置表單
	useEffect(() => {
		if (record) {
			form.reset({
				customerId: record.customerId,
				productId: record.productId,
				amount: record.amount,
				profitDate: new Date(record.profitDate)
					.toISOString()
					.split("T")[0],
				currency: record.currency,
				companyRevenue: record.companyRevenue,
				directTradeBookingFee: record.directTradeBookingFee,
				rmProfitSharePercent: record.rmProfitSharePercent,
				finderProfitSharePercent: record.finderProfitSharePercent,
				companyProfitSharePercent: record.companyProfitSharePercent,
				fxRate: record.fxRate,
			});
		}
	}, [record, form]);

	// 獲取客戶和產品列表
	useEffect(() => {
		if (open) {
			fetchCustomers();
			fetchProducts();
		}
	}, [open]);

	const fetchCustomers = async () => {
		try {
			const response = await fetch(
				`/api/organizations/customers?organizationId=${record.organizationId}`,
				{
					method: "GET",
					credentials: "include",
				},
			);
			if (response.ok) {
				const result = await response.json();
				setCustomers(result.data || []);
			}
		} catch (error) {
			console.error("獲取客戶列表失敗:", error);
		}
	};

	const fetchProducts = async () => {
		try {
			const response = await fetch(
				`/api/organizations/products?organizationId=${record.organizationId}`,
				{
					method: "GET",
					credentials: "include",
				},
			);
			if (response.ok) {
				const result = await response.json();
				setProducts(result.data || []);
			}
		} catch (error) {
			console.error("獲取產品列表失敗:", error);
		}
	};

	const onSubmit = async (data: EditFormData) => {
		setIsLoading(true);
		try {
			const response = await fetch(
				`/api/organizations/profit-sharing/${record.id}`,
				{
					method: "PUT",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data),
				},
			);

			if (!response.ok) {
				let errorMessage = "更新失敗";
				try {
					const responseText = await response.text();
					try {
						const error = JSON.parse(responseText);
						errorMessage = error.message || errorMessage;
					} catch {
						errorMessage = responseText || errorMessage;
					}
				} catch {
					errorMessage = "更新失敗";
				}
				throw new Error(errorMessage);
			}

			onOpenChange(false);
			onSuccess?.();
		} catch (error) {
			console.error("更新失敗:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleDelete = async () => {
		if (!confirm("確定要刪除這筆分潤記錄嗎？此操作無法撤銷。")) {
			return;
		}

		setIsDeleting(true);
		try {
			const response = await fetch(
				`/api/organizations/profit-sharing/${record.id}`,
				{
					method: "DELETE",
					credentials: "include",
				},
			);

			if (!response.ok) {
				let errorMessage = "刪除失敗";
				try {
					const responseText = await response.text();
					try {
						const error = JSON.parse(responseText);
						errorMessage = error.message || errorMessage;
					} catch {
						errorMessage = responseText || errorMessage;
					}
				} catch {
					errorMessage = "刪除失敗";
				}
				throw new Error(errorMessage);
			}

			onOpenChange(false);
			onSuccess?.();
		} catch (error) {
			console.error("刪除失敗:", error);
		} finally {
			setIsDeleting(false);
		}
	};

	// 幣別選項
	const currencyOptions = [
		{ value: "USD", label: "USD" },
		{ value: "TWD", label: "TWD" },
		{ value: "SGD", label: "SGD" },
		{ value: "HKD", label: "HKD" },
		{ value: "EUR", label: "EUR" },
		{ value: "GBP", label: "GBP" },
		{ value: "JPY", label: "JPY" },
	];

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>編輯分潤記錄</DialogTitle>
					<DialogDescription>
						修改分潤記錄資訊。自動計算欄位會根據輸入的資料自動計算。
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)}>
						<div className="grid gap-6 py-4">
							{/* 第一行：客戶和產品 */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="customerId"
									render={({ field }) => (
										<FormItem>
											<FormLabel>客戶 *</FormLabel>
											<Select
												onValueChange={field.onChange}
												value={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="選擇客戶" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
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
																{customer.name}{" "}
																({customer.code}
																)
															</SelectItem>
														),
													)}
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="productId"
									render={({ field }) => (
										<FormItem>
											<FormLabel>產品 *</FormLabel>
											<Select
												onValueChange={field.onChange}
												value={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="選擇產品" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{products.map((product) => (
														<SelectItem
															key={product.id}
															value={product.id}
														>
															{product.name} (
															{product.code})
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							{/* 第二行：日期和幣別 */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="profitDate"
									render={({ field }) => (
										<FormItem>
											<FormLabel>分潤日期 *</FormLabel>
											<FormControl>
												<Input type="date" {...field} />
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
																{option.label}
															</SelectItem>
														),
													)}
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							{/* 第三行：收入欄位 */}
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<FormField
									control={form.control}
									name="companyRevenue"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Company Revenue *
											</FormLabel>
											<FormControl>
												<Input
													type="number"
													step="0.01"
													placeholder="0.00"
													{...field}
													onChange={(e) => {
														const value =
															e.target.value;
														field.onChange(
															value === ""
																? 0
																: Number(value),
														);
													}}
													value={field.value || ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="directTradeBookingFee"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Direct Trade Booking Fee *
											</FormLabel>
											<FormControl>
												<Input
													type="number"
													step="0.01"
													placeholder="0.00"
													{...field}
													onChange={(e) => {
														const value =
															e.target.value;
														field.onChange(
															value === ""
																? 0
																: Number(value),
														);
													}}
													value={field.value || ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="amount"
									render={({ field }) => (
										<FormItem>
											<FormLabel>金額 *</FormLabel>
											<FormControl>
												<Input
													type="number"
													step="0.01"
													placeholder="0.00"
													{...field}
													onChange={(e) => {
														const value =
															e.target.value;
														field.onChange(
															value === ""
																? 0
																: Number(value),
														);
													}}
													value={field.value || ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							{/* 第四行：分潤比例 */}
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<FormField
									control={form.control}
									name="rmProfitSharePercent"
									render={({ field }) => (
										<FormItem>
											<FormLabel>RM分潤 (%)</FormLabel>
											<FormControl>
												<Input
													type="number"
													step="0.01"
													min="0"
													max="100"
													placeholder="50.00"
													{...field}
													onChange={(e) => {
														const value =
															e.target.value;
														field.onChange(
															value === ""
																? 50
																: Number(value),
														);
													}}
													value={field.value || ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="finderProfitSharePercent"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Finder分潤 (%)
											</FormLabel>
											<FormControl>
												<Input
													type="number"
													step="0.01"
													min="0"
													max="100"
													placeholder="0.00"
													{...field}
													onChange={(e) => {
														const value =
															e.target.value;
														field.onChange(
															value === ""
																? 0
																: Number(value),
														);
													}}
													value={field.value || ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="companyProfitSharePercent"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Company分潤 (%)
											</FormLabel>
											<FormControl>
												<Input
													type="number"
													step="0.01"
													min="0"
													max="100"
													placeholder="50.00"
													{...field}
													onChange={(e) => {
														const value =
															e.target.value;
														field.onChange(
															value === ""
																? 50
																: Number(value),
														);
													}}
													value={field.value || ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							{/* 第五行：FX Rate */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="fxRate"
									render={({ field }) => (
										<FormItem>
											<FormLabel>FX Rate *</FormLabel>
											<FormControl>
												<Input
													type="number"
													step="0.00001"
													placeholder="1.00000"
													{...field}
													onChange={(e) => {
														const value =
															e.target.value;
														field.onChange(
															value === ""
																? 1
																: Number(value),
														);
													}}
													value={field.value || ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
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
