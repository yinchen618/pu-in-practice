"use client";

import { SearchableSelect } from "@shared/components/SearchableSelect";
import {
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
import type { UseFormReturn } from "react-hook-form";
import { CURRENCY_OPTIONS } from "../../../constants";
import type {
	BankAccount,
	Customer,
	Product,
	ProfitSharingFormData,
} from "../shared/types";

interface BasicFormFieldsProps {
	form: UseFormReturn<ProfitSharingFormData>;
	customers: Customer[];
	products: Product[];
	bankAccounts: BankAccount[];
	isLoadingCustomers?: boolean;
	isLoadingProducts?: boolean;
	isLoadingBankAccounts?: boolean;
}

export function BasicFormFields({
	form,
	customers,
	products,
	bankAccounts,
	isLoadingCustomers = false,
	isLoadingProducts = false,
	isLoadingBankAccounts = false,
}: BasicFormFieldsProps) {
	const selectedCustomerId = form.watch("customerId");

	return (
		<>
			{/* 第一行：客戶、產品和銀行帳戶 */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
					name="customerId"
					render={({ field }) => (
						<SearchableSelect
							field={field}
							label="客戶"
							placeholder={
								isLoadingCustomers ? "讀取中..." : "選擇客戶"
							}
							searchPlaceholder="搜尋客戶..."
							emptyText={
								isLoadingCustomers
									? "讀取中..."
									: "找不到客戶。"
							}
							options={customers}
							getDisplayValue={(customer) =>
								customer
									? `${customer.name} (${customer.code})`
									: ""
							}
							getSearchValue={(customer) =>
								`${customer.name} ${customer.code}`
							}
							getOptionDisplayValue={(customer) =>
								`${customer.name} (${customer.code})`
							}
							required
						/>
					)}
				/>

				<FormField
					control={form.control}
					name="bankAccountId"
					render={({ field }) => (
						<SearchableSelect<BankAccount>
							field={field}
							label="銀行帳戶"
							placeholder={
								isLoadingBankAccounts
									? "讀取中..."
									: selectedCustomerId
										? "選擇銀行帳戶"
										: "請先選擇客戶"
							}
							searchPlaceholder="搜尋銀行帳戶..."
							emptyText={
								isLoadingBankAccounts
									? "讀取中..."
									: selectedCustomerId
										? "該客戶沒有銀行帳戶。"
										: "請先選擇客戶。"
							}
							options={bankAccounts}
							getDisplayValue={(account) =>
								account
									? `${account.bankName} - ${account.accountNumber}`
									: ""
							}
							getSearchValue={(account) =>
								`${account.bankName} ${account.accountNumber}`
							}
							getOptionDisplayValue={(account) =>
								`${account.bankName} - ${account.accountNumber}`
							}
							required
							disabled={
								!selectedCustomerId || isLoadingBankAccounts
							}
						/>
					)}
				/>

				<FormField
					control={form.control}
					name="productId"
					render={({ field }) => (
						<SearchableSelect
							field={field}
							label="產品"
							placeholder={
								isLoadingProducts ? "讀取中..." : "選擇產品"
							}
							searchPlaceholder="搜尋產品..."
							emptyText={
								isLoadingProducts ? "讀取中..." : "找不到產品。"
							}
							options={products}
							getDisplayValue={(product) =>
								product
									? `${product.name} (${product.code})`
									: ""
							}
							getSearchValue={(product) =>
								`${product.name} ${product.code}`
							}
							getOptionDisplayValue={(product) =>
								`${product.name} (${product.code})`
							}
							required
						/>
					)}
				/>
			</div>

			{/* 第二行：幣別和金額 */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<FormField
					control={form.control}
					name="currency"
					render={({ field }) => (
						<FormItem>
							<FormLabel>幣別</FormLabel>
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
									{CURRENCY_OPTIONS.map((currency) => (
										<SelectItem
											key={currency.value}
											value={currency.value}
										>
											{currency.label}
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
					name="companyRevenue"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Company Revenue *</FormLabel>
							<FormControl>
								<Input
									type="number"
									step="1"
									placeholder="0.00"
									{...field}
									onChange={(e) => {
										const value = Number.parseFloat(
											e.target.value,
										);
										field.onChange(
											Number.isNaN(value) ? 0 : value,
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
							<FormLabel>Direct Trade Booking Fee *</FormLabel>
							<FormControl>
								<Input
									type="number"
									step="1"
									placeholder="0.00"
									{...field}
									onChange={(e) => {
										const value = Number.parseFloat(
											e.target.value,
										);
										field.onChange(
											Number.isNaN(value) ? 0 : value,
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
					name="bankRetroPercent"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Bank Retro(%) *</FormLabel>
							<FormControl>
								<Input
									type="number"
									step="1"
									min="0"
									max="100"
									placeholder="50.00"
									{...field}
									onChange={(e) => {
										const value = Number.parseFloat(
											e.target.value,
										);
										field.onChange(
											Number.isNaN(value) ? 0 : value,
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
		</>
	);
}
