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
import { useDebounce } from "use-debounce";
import { z } from "zod";
import type { ProfitSharingRecord } from "./columns";

const editSchema = z.object({
	revenueType: z.string(),
	category: z.string(),
	productCode: z.string().min(1, "產品代碼是必填的"),
	productName: z.string().min(1, "產品名稱是必填的"),
	customerId: z.string().min(1, "客戶編號是必填的"),
	customerName: z.string().min(1, "客戶名稱是必填的"),
	bankAccountId: z.string().min(1, "銀行帳號是必填的"),
	bankRetro: z.number().min(0).max(100),
	companyRevenue: z.number().min(0).max(100),
	rmRevenue: z.number().min(0).max(100),
	findersRevenue: z.number().min(0).max(100),
});

type EditFormData = z.infer<typeof editSchema>;

interface Product {
	code: string;
	name: string;
	category: string;
}

interface Customer {
	id: string;
	name: string;
	code: string;
}

interface BankAccount {
	id: string;
	accountNumber: string;
	bankName: string;
}

interface EditDialogProps {
	profitSharingRecord: ProfitSharingRecord;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

export function EditProfitSharingDialog({
	profitSharingRecord,
	open,
	onOpenChange,
	onSuccess,
}: EditDialogProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [products, setProducts] = useState<Product[]>([]);
	const [customers, setCustomers] = useState<Customer[]>([]);
	const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
	const [productSearch, setProductSearch] = useState("");
	const [customerSearch, setCustomerSearch] = useState("");
	const [debouncedProductSearch] = useDebounce(productSearch, 300);
	const [debouncedCustomerSearch] = useDebounce(customerSearch, 300);
	const [selectedCategory, setSelectedCategory] = useState<string>(
		profitSharingRecord.category,
	);

	const form = useForm<EditFormData>({
		resolver: zodResolver(editSchema),
		defaultValues: {
			revenueType: profitSharingRecord.revenueType,
			category: profitSharingRecord.category,
			productCode: profitSharingRecord.productCode,
			productName: profitSharingRecord.productName,
			customerId: profitSharingRecord.customerId,
			customerName: profitSharingRecord.customerName,
			bankAccountId: profitSharingRecord.bankAccountId,
			bankRetro: profitSharingRecord.bankRetro,
			companyRevenue: profitSharingRecord.companyRevenue,
			rmRevenue: profitSharingRecord.rmRevenue,
			findersRevenue: profitSharingRecord.findersRevenue,
		},
	});

	// 獲取產品建議
	useEffect(() => {
		if (debouncedProductSearch && selectedCategory) {
			fetch(
				`/api/organizations/products/search?q=${debouncedProductSearch}&category=${selectedCategory}`,
			)
				.then((res) => res.json())
				.then((data) => setProducts(data.products));
		}
	}, [debouncedProductSearch, selectedCategory]);

	// 獲取客戶建議
	useEffect(() => {
		if (debouncedCustomerSearch) {
			fetch(
				`/api/organizations/customers/search?q=${debouncedCustomerSearch}`,
			)
				.then((res) => res.json())
				.then((data) => setCustomers(data.customers));
		}
	}, [debouncedCustomerSearch]);

	// 獲取銀行帳號
	useEffect(() => {
		const customerId = form.watch("customerId");
		if (customerId) {
			fetch(`/api/organizations/bank-accounts?customerId=${customerId}`)
				.then((res) => res.json())
				.then((data) => setBankAccounts(data.bankAccounts));
		}
	}, [form.watch("customerId")]);

	const onSubmit = async (data: EditFormData) => {
		setIsLoading(true);
		try {
			const response = await fetch(
				`/api/organizations/profit-sharing/${profitSharingRecord.id}`,
				{
					method: "PUT",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data),
				},
			);

			if (!response.ok) {
				throw new Error("更新失敗");
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
		if (!window.confirm("確定要刪除這筆分潤記錄嗎？")) {
			return;
		}

		setIsDeleting(true);
		try {
			const response = await fetch(
				`/api/organizations/profit-sharing/${profitSharingRecord.id}`,
				{
					method: "DELETE",
					credentials: "include",
				},
			);

			if (!response.ok) {
				throw new Error("刪除失敗");
			}

			onOpenChange(false);
			onSuccess?.();
		} catch (error) {
			console.error("刪除失敗:", error);
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>編輯分潤</DialogTitle>
					<DialogDescription>修改分潤記錄的資訊。</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="space-y-4"
					>
						<div className="grid grid-cols-2 gap-4">
							{/* Revenue Type */}
							<FormField
								control={form.control}
								name="revenueType"
								render={({ field }) => (
									<FormItem>
										<FormLabel>收入類型 *</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="選擇收入類型" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="Bank Retro">
													Bank Retro
												</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* Category */}
							<FormField
								control={form.control}
								name="category"
								render={({ field }) => (
									<FormItem>
										<FormLabel>類別 *</FormLabel>
										<Select
											onValueChange={(value) => {
												field.onChange(value);
												setSelectedCategory(value);
												form.setValue(
													"productCode",
													"",
												);
												form.setValue(
													"productName",
													"",
												);
											}}
											value={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="選擇類別" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="AQ">
													AQ
												</SelectItem>
												<SelectItem value="Bond">
													Bond
												</SelectItem>
												<SelectItem value="DCI">
													DCI
												</SelectItem>
												<SelectItem value="EQ">
													EQ
												</SelectItem>
												<SelectItem value="FCN">
													FCN
												</SelectItem>
												<SelectItem value="Fund">
													Fund
												</SelectItem>
												<SelectItem value="FX">
													FX
												</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* Product Code */}
							<FormField
								control={form.control}
								name="productCode"
								render={({ field }) => (
									<FormItem>
										<FormLabel>產品代碼 *</FormLabel>
										<FormControl>
											<Input
												{...field}
												placeholder="輸入產品代碼"
												onChange={(e) => {
													field.onChange(
														e.target.value,
													);
													setProductSearch(
														e.target.value,
													);
												}}
											/>
										</FormControl>
										{products.length > 0 &&
											productSearch && (
												<div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md">
													{products.map((product) => (
														<div
															key={product.code}
															className="cursor-pointer rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
															onClick={() => {
																form.setValue(
																	"productCode",
																	product.code,
																);
																form.setValue(
																	"productName",
																	product.name,
																);
																setProductSearch(
																	"",
																);
															}}
														>
															{product.code} -{" "}
															{product.name}
														</div>
													))}
												</div>
											)}
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* Product Name */}
							<FormField
								control={form.control}
								name="productName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>產品名稱 *</FormLabel>
										<Select
											onValueChange={(value) => {
												const product = products.find(
													(p) => p.name === value,
												);
												if (product) {
													field.onChange(value);
													form.setValue(
														"productCode",
														product.code,
													);
												}
											}}
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
														key={product.code}
														value={product.name}
													>
														{product.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* Customer Code */}
							<FormField
								control={form.control}
								name="customerId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>客戶編號 *</FormLabel>
										<FormControl>
											<Input
												placeholder="輸入客戶編號"
												onChange={(e) => {
													field.onChange(
														e.target.value,
													);
													setCustomerSearch(
														e.target.value,
													);
												}}
												value={field.value}
											/>
										</FormControl>
										{customers.length > 0 &&
											customerSearch && (
												<div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md">
													{customers.map(
														(customer) => (
															<div
																key={
																	customer.id
																}
																className="cursor-pointer rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
																onClick={() => {
																	form.setValue(
																		"customerId",
																		customer.id,
																	);
																	form.setValue(
																		"customerName",
																		customer.name,
																	);
																	setCustomerSearch(
																		"",
																	);
																}}
															>
																{customer.code}{" "}
																-{" "}
																{customer.name}
															</div>
														),
													)}
												</div>
											)}
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* Customer Name */}
							<FormField
								control={form.control}
								name="customerName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>客戶名稱 *</FormLabel>
										<Select
											onValueChange={(value) => {
												const customer = customers.find(
													(c) => c.name === value,
												);
												if (customer) {
													field.onChange(value);
													form.setValue(
														"customerId",
														customer.id,
													);
												}
											}}
											value={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="選擇客戶" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{customers.map((customer) => (
													<SelectItem
														key={customer.id}
														value={customer.name}
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

							{/* Bank Account */}
							<FormField
								control={form.control}
								name="bankAccountId"
								render={({ field }) => (
									<FormItem className="col-span-2">
										<FormLabel>銀行帳號 *</FormLabel>
										<Select
											onValueChange={field.onChange}
											value={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="選擇銀行帳號" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{bankAccounts.map((account) => (
													<SelectItem
														key={account.id}
														value={account.id}
													>
														{account.bankName} -{" "}
														{account.accountNumber}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* Bank Retro */}
							<FormField
								control={form.control}
								name="bankRetro"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Bank Retro (%) *</FormLabel>
										<FormControl>
											<Input
												type="number"
												step="0.01"
												placeholder="輸入 Bank Retro 百分比"
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
							/>

							{/* Company Revenue */}
							<FormField
								control={form.control}
								name="companyRevenue"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											Company Revenue (%) *
										</FormLabel>
										<FormControl>
											<Input
												type="number"
												step="0.01"
												placeholder="輸入 Company Revenue 百分比"
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
							/>

							{/* RM Revenue */}
							<FormField
								control={form.control}
								name="rmRevenue"
								render={({ field }) => (
									<FormItem>
										<FormLabel>RM Revenue (%) *</FormLabel>
										<FormControl>
											<Input
												type="number"
												step="0.01"
												placeholder="輸入 RM Revenue 百分比"
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
							/>

							{/* Finders Revenue */}
							<FormField
								control={form.control}
								name="findersRevenue"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											Finders Revenue (%) *
										</FormLabel>
										<FormControl>
											<Input
												type="number"
												step="0.01"
												placeholder="輸入 Finders Revenue 百分比"
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
