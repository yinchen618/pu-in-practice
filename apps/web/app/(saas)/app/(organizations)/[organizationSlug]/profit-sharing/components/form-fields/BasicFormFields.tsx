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
import { useTranslations } from "next-intl";
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
	const t = useTranslations("organization.profitSharing");
	const tCommon = useTranslations("common");
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
							<FormLabel>{t("profitDate")} *</FormLabel>
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
							label={tCommon("customer")}
							placeholder={
								isLoadingCustomers
									? t("loading")
									: t("selectCustomer")
							}
							searchPlaceholder={t("searchCustomer")}
							emptyText={
								isLoadingCustomers
									? t("loading")
									: t("noCustomersFound")
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
							label={t("bankAccount")}
							placeholder={
								isLoadingBankAccounts
									? t("loading")
									: selectedCustomerId
										? t("selectBankAccount")
										: t("selectCustomerFirst")
							}
							searchPlaceholder={t("searchBankAccount")}
							emptyText={
								isLoadingBankAccounts
									? t("loading")
									: selectedCustomerId
										? t("noBankAccountsFound")
										: t("selectCustomerFirst")
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
							label={t("product")}
							placeholder={
								isLoadingProducts
									? t("loading")
									: t("selectProduct")
							}
							searchPlaceholder={t("searchProduct")}
							emptyText={
								isLoadingProducts
									? t("loading")
									: t("noProductsFound")
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
							<FormLabel>{tCommon("currency")}</FormLabel>
							<Select
								onValueChange={field.onChange}
								value={field.value}
							>
								<FormControl>
									<SelectTrigger>
										<SelectValue
											placeholder={t("selectCurrency")}
										/>
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
