"use client";

import { PercentageInput } from "@shared/components/PercentageInput";
import { SearchableSelect } from "@shared/components/SearchableSelect";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@ui/components/form";
import { Input } from "@ui/components/input";
import { cn } from "@ui/lib";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import type {
	ProfitSharingFormData,
	RelationshipManager,
} from "../shared/types";
import {
	calculateTotalProfitSharePercent,
	isValidProfitSharePercent,
} from "../shared/utils";

interface ProfitShareAllocationProps {
	form: UseFormReturn<ProfitSharingFormData>;
	allRMs: RelationshipManager[];
	allFinders: RelationshipManager[];
	isLoadingRMsAndFinders: boolean;
}

export function ProfitShareAllocation({
	form,
	allRMs,
	allFinders,
	isLoadingRMsAndFinders,
}: ProfitShareAllocationProps) {
	const t = useTranslations("organization.profitSharing.allocation");

	// 計算總分潤比例
	const totalPercentages = calculateTotalProfitSharePercent(
		form.watch("companyRevenuePercent") || 0,
		form.watch("companyFeePercent") || 0,
		form.watch("rm1RevenuePercent") || 0,
		form.watch("rm1FeePercent") || 0,
		form.watch("rm2RevenuePercent") || 0,
		form.watch("rm2FeePercent") || 0,
		form.watch("finder1RevenuePercent") || 0,
		form.watch("finder1FeePercent") || 0,
		form.watch("finder2RevenuePercent") || 0,
		form.watch("finder2FeePercent") || 0,
	);

	const isValid = isValidProfitSharePercent(
		totalPercentages.revenuePercent,
		totalPercentages.feePercent,
	);

	// 計算每個人的分潤金額
	const calculatePersonAmounts = (
		revenuePercent: number,
		feePercent: number,
	) => {
		const companyRevenue = form.watch("companyRevenue") || 0;
		const directTradeBookingFee = form.watch("directTradeBookingFee") || 0;
		const bankRetroPercent = form.watch("bankRetroPercent") || 50;

		// Revenue 部分: Company Revenue × Revenue Percentage
		const revenueAmount = (companyRevenue * revenuePercent) / 100;

		// Fee 部分: Direct Trade Booking Fee × Bank Retro(%) × Fee Percentage
		const feeAmount =
			(directTradeBookingFee * bankRetroPercent * feePercent) / 10000;

		// 總金額
		const totalAmount = revenueAmount + feeAmount;

		return {
			revenueAmount,
			feeAmount,
			totalAmount,
		};
	};

	return (
		<Card className="mt-6">
			<CardHeader>
				<CardTitle>{t("title")}</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Company 分潤 */}
				<div className="grid grid-cols-8 gap-4 items-end border-b border-border pb-4">
					<div className="col-span-1">
						<FormLabel className="text-sm font-medium">
							{t("company.title")}
						</FormLabel>
						<div className="text-xs text-muted-foreground mt-1">
							{t("company.description")}
						</div>
					</div>
					<div className="col-span-1">
						<FormLabel className="text-xs">
							{t("fields.person")}
						</FormLabel>
						<div className="text-sm text-muted-foreground mt-2">
							-
						</div>
					</div>
					<div className="col-span-1">
						<FormField
							control={form.control}
							name="companyRevenuePercent"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-xs">
										{t("fields.revenuePercentage")}
									</FormLabel>
									<FormControl>
										<PercentageInput
											placeholder="100.00"
											value={field.value}
											onChange={(value) => {
												field.onChange(value);
											}}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
					<div className="col-span-1">
						<FormField
							control={form.control}
							name="companyFeePercent"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-xs">
										{t("fields.feePercentage")}
									</FormLabel>
									<FormControl>
										<PercentageInput
											placeholder="100.00"
											value={field.value}
											onChange={(value) => {
												field.onChange(value);
											}}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
					<div className="col-span-1">
						<FormItem>
							<FormLabel className="text-xs">
								{t("fields.revenueAmount")}
							</FormLabel>
							<FormControl>
								<Input
									type="number"
									step="1"
									placeholder="0.00"
									disabled
									value={calculatePersonAmounts(
										form.watch("companyRevenuePercent") ||
											0,
										form.watch("companyFeePercent") || 0,
									).revenueAmount.toFixed(2)}
								/>
							</FormControl>
						</FormItem>
					</div>
					<div className="col-span-1">
						<FormItem>
							<FormLabel className="text-xs">
								{t("fields.feeAmount")}
							</FormLabel>
							<FormControl>
								<Input
									type="number"
									step="1"
									placeholder="0.00"
									disabled
									value={calculatePersonAmounts(
										form.watch("companyRevenuePercent") ||
											0,
										form.watch("companyFeePercent") || 0,
									).feeAmount.toFixed(2)}
								/>
							</FormControl>
						</FormItem>
					</div>
					<div className="col-span-1">
						<FormItem>
							<FormLabel className="text-xs">
								{t("fields.originalCurrency")}
							</FormLabel>
							<FormControl>
								<Input
									type="number"
									step="1"
									placeholder="0.00"
									disabled
									value={calculatePersonAmounts(
										form.watch("companyRevenuePercent") ||
											0,
										form.watch("companyFeePercent") || 0,
									).totalAmount.toFixed(2)}
								/>
							</FormControl>
						</FormItem>
					</div>
					<div className="col-span-1">
						<FormItem>
							<FormLabel className="text-xs">
								{t("fields.usdAmount")}
							</FormLabel>
							<FormControl>
								<Input
									type="number"
									step="1"
									placeholder="0.00"
									disabled
									value={(
										calculatePersonAmounts(
											form.watch(
												"companyRevenuePercent",
											) || 0,
											form.watch("companyFeePercent") ||
												0,
										).totalAmount *
										(form.watch("fxRate") || 1)
									).toFixed(2)}
								/>
							</FormControl>
						</FormItem>
					</div>
				</div>

				{/* RM1 分潤 */}
				<div className="grid grid-cols-8 gap-4 items-end border-b border-border pb-4">
					<div className="col-span-1">
						<FormLabel className="text-sm font-medium">
							{t("rm1.title")}
						</FormLabel>
						<div className="text-xs text-muted-foreground mt-1">
							{t("rm1.description")}
						</div>
					</div>
					<div className="col-span-1">
						<FormField
							control={form.control}
							name="rm1Id"
							render={({ field }) => (
								<SearchableSelect<RelationshipManager>
									field={{
										...field,
										onChange: (value) => {
											field.onChange(value);
											const selectedRM = allRMs.find(
												(rm) => rm.id === value,
											);
											if (selectedRM) {
												form.setValue(
													"rm1Name",
													selectedRM.name,
												);
											}
										},
									}}
									label="RM"
									placeholder={
										isLoadingRMsAndFinders
											? t("selectors.loading")
											: t("selectors.selectRM")
									}
									searchPlaceholder={t("selectors.searchRM")}
									emptyText={
										isLoadingRMsAndFinders
											? t("selectors.loading")
											: t("selectors.noRMFound")
									}
									disabled={isLoadingRMsAndFinders}
									options={allRMs}
									getDisplayValue={(rm) =>
										rm ? rm.name : ""
									}
									getSearchValue={(rm) => rm.name}
									getOptionDisplayValue={(rm) => rm.name}
								/>
							)}
						/>
					</div>
					<div className="col-span-1">
						<FormField
							control={form.control}
							name="rm1RevenuePercent"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-xs">
										{t("fields.revenuePercentage")}
									</FormLabel>
									<FormControl>
										<PercentageInput
											placeholder="0.00"
											value={field.value}
											onChange={(value) => {
												field.onChange(value);
											}}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
					<div className="col-span-1">
						<FormField
							control={form.control}
							name="rm1FeePercent"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-xs">
										{t("fields.feePercentage")}
									</FormLabel>
									<FormControl>
										<PercentageInput
											placeholder="0.00"
											value={field.value}
											onChange={(value) => {
												field.onChange(value);
											}}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
					<div className="col-span-1">
						<FormItem>
							<FormLabel className="text-xs">
								{t("fields.revenueAmount")}
							</FormLabel>
							<FormControl>
								<Input
									type="number"
									step="1"
									placeholder="0.00"
									disabled
									value={calculatePersonAmounts(
										form.watch("rm1RevenuePercent") || 0,
										form.watch("rm1FeePercent") || 0,
									).revenueAmount.toFixed(2)}
								/>
							</FormControl>
						</FormItem>
					</div>
					<div className="col-span-1">
						<FormItem>
							<FormLabel className="text-xs">
								{t("fields.feeAmount")}
							</FormLabel>
							<FormControl>
								<Input
									type="number"
									step="1"
									placeholder="0.00"
									disabled
									value={calculatePersonAmounts(
										form.watch("rm1RevenuePercent") || 0,
										form.watch("rm1FeePercent") || 0,
									).feeAmount.toFixed(2)}
								/>
							</FormControl>
						</FormItem>
					</div>
					<div className="col-span-1">
						<FormItem>
							<FormLabel className="text-xs">
								{t("fields.originalCurrency")}
							</FormLabel>
							<FormControl>
								<Input
									type="number"
									step="1"
									placeholder="0.00"
									disabled
									value={calculatePersonAmounts(
										form.watch("rm1RevenuePercent") || 0,
										form.watch("rm1FeePercent") || 0,
									).totalAmount.toFixed(2)}
								/>
							</FormControl>
						</FormItem>
					</div>
					<div className="col-span-1">
						<FormItem>
							<FormLabel className="text-xs">
								{t("fields.usdAmount")}
							</FormLabel>
							<FormControl>
								<Input
									type="number"
									step="1"
									placeholder="0.00"
									disabled
									value={(
										calculatePersonAmounts(
											form.watch("rm1RevenuePercent") ||
												0,
											form.watch("rm1FeePercent") || 0,
										).totalAmount *
										(form.watch("fxRate") || 1)
									).toFixed(2)}
								/>
							</FormControl>
						</FormItem>
					</div>
				</div>

				{/* RM2 分潤 */}
				<div className="grid grid-cols-8 gap-4 items-end border-b border-border pb-4">
					<div className="col-span-1">
						<FormLabel className="text-sm font-medium">
							{t("rm2.title")}
						</FormLabel>
						<div className="text-xs text-muted-foreground mt-1">
							{t("rm2.description")}
						</div>
					</div>
					<div className="col-span-1">
						<FormField
							control={form.control}
							name="rm2Id"
							render={({ field }) => (
								<SearchableSelect<RelationshipManager>
									field={{
										...field,
										onChange: (value) => {
											field.onChange(value);
											const selectedRM = allRMs.find(
												(rm) => rm.id === value,
											);
											if (selectedRM) {
												form.setValue(
													"rm2Name",
													selectedRM.name,
												);
											}
										},
									}}
									label="RM"
									placeholder={
										isLoadingRMsAndFinders
											? t("selectors.loading")
											: t("selectors.selectRM")
									}
									searchPlaceholder={t("selectors.searchRM")}
									emptyText={
										isLoadingRMsAndFinders
											? t("selectors.loading")
											: t("selectors.noRMFound")
									}
									disabled={isLoadingRMsAndFinders}
									options={allRMs}
									getDisplayValue={(rm) =>
										rm ? rm.name : ""
									}
									getSearchValue={(rm) => rm.name}
									getOptionDisplayValue={(rm) => rm.name}
								/>
							)}
						/>
					</div>
					<div className="col-span-1">
						<FormField
							control={form.control}
							name="rm2RevenuePercent"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-xs">
										{t("fields.revenuePercentage")}
									</FormLabel>
									<FormControl>
										<PercentageInput
											placeholder="0.00"
											value={field.value}
											onChange={(value) => {
												field.onChange(value);
											}}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
					<div className="col-span-1">
						<FormField
							control={form.control}
							name="rm2FeePercent"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-xs">
										{t("fields.feePercentage")}
									</FormLabel>
									<FormControl>
										<PercentageInput
											placeholder="0.00"
											value={field.value}
											onChange={(value) => {
												field.onChange(value);
											}}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
					<div className="col-span-1">
						<FormItem>
							<FormLabel className="text-xs">
								{t("fields.revenueAmount")}
							</FormLabel>
							<FormControl>
								<Input
									type="number"
									step="1"
									placeholder="0.00"
									disabled
									value={calculatePersonAmounts(
										form.watch("rm2RevenuePercent") || 0,
										form.watch("rm2FeePercent") || 0,
									).revenueAmount.toFixed(2)}
								/>
							</FormControl>
						</FormItem>
					</div>
					<div className="col-span-1">
						<FormItem>
							<FormLabel className="text-xs">
								{t("fields.feeAmount")}
							</FormLabel>
							<FormControl>
								<Input
									type="number"
									step="1"
									placeholder="0.00"
									disabled
									value={calculatePersonAmounts(
										form.watch("rm2RevenuePercent") || 0,
										form.watch("rm2FeePercent") || 0,
									).feeAmount.toFixed(2)}
								/>
							</FormControl>
						</FormItem>
					</div>
					<div className="col-span-1">
						<FormItem>
							<FormLabel className="text-xs">
								{t("fields.originalCurrency")}
							</FormLabel>
							<FormControl>
								<Input
									type="number"
									step="1"
									placeholder="0.00"
									disabled
									value={calculatePersonAmounts(
										form.watch("rm2RevenuePercent") || 0,
										form.watch("rm2FeePercent") || 0,
									).totalAmount.toFixed(2)}
								/>
							</FormControl>
						</FormItem>
					</div>
					<div className="col-span-1">
						<FormItem>
							<FormLabel className="text-xs">
								{t("fields.usdAmount")}
							</FormLabel>
							<FormControl>
								<Input
									type="number"
									step="1"
									placeholder="0.00"
									disabled
									value={(
										calculatePersonAmounts(
											form.watch("rm2RevenuePercent") ||
												0,
											form.watch("rm2FeePercent") || 0,
										).totalAmount *
										(form.watch("fxRate") || 1)
									).toFixed(2)}
								/>
							</FormControl>
						</FormItem>
					</div>
				</div>

				{/* Finder1 分潤 */}
				<div className="grid grid-cols-8 gap-4 items-end border-b border-border pb-4">
					<div className="col-span-1">
						<FormLabel className="text-sm font-medium">
							{t("finder1.title")}
						</FormLabel>
						<div className="text-xs text-muted-foreground mt-1">
							{t("finder1.description")}
						</div>
					</div>
					<div className="col-span-1">
						<FormField
							control={form.control}
							name="finder1Id"
							render={({ field }) => (
								<SearchableSelect<RelationshipManager>
									field={{
										...field,
										onChange: (value) => {
											field.onChange(value);
											const selectedFinder =
												allFinders.find(
													(finder) =>
														finder.id === value,
												);
											if (selectedFinder) {
												form.setValue(
													"finder1Name",
													selectedFinder.name,
												);
											}
										},
									}}
									label="Finder"
									placeholder={
										isLoadingRMsAndFinders
											? t("selectors.loading")
											: t("selectors.selectFinder")
									}
									searchPlaceholder={t(
										"selectors.searchFinder",
									)}
									emptyText={
										isLoadingRMsAndFinders
											? t("selectors.loading")
											: t("selectors.noFinderFound")
									}
									disabled={isLoadingRMsAndFinders}
									options={allFinders}
									getDisplayValue={(finder) =>
										finder ? finder.name : ""
									}
									getSearchValue={(finder) => finder.name}
									getOptionDisplayValue={(finder) =>
										finder.name
									}
								/>
							)}
						/>
					</div>
					<div className="col-span-1">
						<FormField
							control={form.control}
							name="finder1RevenuePercent"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-xs">
										{t("fields.revenuePercentage")}
									</FormLabel>
									<FormControl>
										<PercentageInput
											placeholder="0.00"
											value={field.value}
											onChange={(value) => {
												field.onChange(value);
											}}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
					<div className="col-span-1">
						<FormField
							control={form.control}
							name="finder1FeePercent"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-xs">
										{t("fields.feePercentage")}
									</FormLabel>
									<FormControl>
										<PercentageInput
											placeholder="0.00"
											value={field.value}
											onChange={(value) => {
												field.onChange(value);
											}}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
					<div className="col-span-1">
						<FormItem>
							<FormLabel className="text-xs">
								{t("fields.revenueAmount")}
							</FormLabel>
							<FormControl>
								<Input
									type="number"
									step="1"
									placeholder="0.00"
									disabled
									value={calculatePersonAmounts(
										form.watch("finder1RevenuePercent") ||
											0,
										form.watch("finder1FeePercent") || 0,
									).revenueAmount.toFixed(2)}
								/>
							</FormControl>
						</FormItem>
					</div>
					<div className="col-span-1">
						<FormItem>
							<FormLabel className="text-xs">
								{t("fields.feeAmount")}
							</FormLabel>
							<FormControl>
								<Input
									type="number"
									step="1"
									placeholder="0.00"
									disabled
									value={calculatePersonAmounts(
										form.watch("finder1RevenuePercent") ||
											0,
										form.watch("finder1FeePercent") || 0,
									).feeAmount.toFixed(2)}
								/>
							</FormControl>
						</FormItem>
					</div>
					<div className="col-span-1">
						<FormItem>
							<FormLabel className="text-xs">
								{t("fields.originalCurrency")}
							</FormLabel>
							<FormControl>
								<Input
									type="number"
									step="1"
									placeholder="0.00"
									disabled
									value={calculatePersonAmounts(
										form.watch("finder1RevenuePercent") ||
											0,
										form.watch("finder1FeePercent") || 0,
									).totalAmount.toFixed(2)}
								/>
							</FormControl>
						</FormItem>
					</div>
					<div className="col-span-1">
						<FormItem>
							<FormLabel className="text-xs">
								{t("fields.usdAmount")}
							</FormLabel>
							<FormControl>
								<Input
									type="number"
									step="1"
									placeholder="0.00"
									disabled
									value={(
										calculatePersonAmounts(
											form.watch(
												"finder1RevenuePercent",
											) || 0,
											form.watch("finder1FeePercent") ||
												0,
										).totalAmount *
										(form.watch("fxRate") || 1)
									).toFixed(2)}
								/>
							</FormControl>
						</FormItem>
					</div>
				</div>

				{/* Finder2 分潤 */}
				<div className="grid grid-cols-8 gap-4 items-end border-b border-border pb-4">
					<div className="col-span-1">
						<FormLabel className="text-sm font-medium">
							{t("finder2.title")}
						</FormLabel>
						<div className="text-xs text-muted-foreground mt-1">
							{t("finder2.description")}
						</div>
					</div>
					<div className="col-span-1">
						<FormField
							control={form.control}
							name="finder2Id"
							render={({ field }) => (
								<SearchableSelect<RelationshipManager>
									field={{
										...field,
										onChange: (value) => {
											field.onChange(value);
											const selectedFinder =
												allFinders.find(
													(finder) =>
														finder.id === value,
												);
											if (selectedFinder) {
												form.setValue(
													"finder2Name",
													selectedFinder.name,
												);
											}
										},
									}}
									label="Finder"
									placeholder={
										isLoadingRMsAndFinders
											? t("selectors.loading")
											: t("selectors.selectFinder")
									}
									searchPlaceholder={t(
										"selectors.searchFinder",
									)}
									emptyText={
										isLoadingRMsAndFinders
											? t("selectors.loading")
											: t("selectors.noFinderFound")
									}
									disabled={isLoadingRMsAndFinders}
									options={allFinders}
									getDisplayValue={(finder) =>
										finder ? finder.name : ""
									}
									getSearchValue={(finder) => finder.name}
									getOptionDisplayValue={(finder) =>
										finder.name
									}
								/>
							)}
						/>
					</div>
					<div className="col-span-1">
						<FormField
							control={form.control}
							name="finder2RevenuePercent"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-xs">
										{t("fields.revenuePercentage")}
									</FormLabel>
									<FormControl>
										<PercentageInput
											placeholder="0.00"
											value={field.value}
											onChange={(value) => {
												field.onChange(value);
											}}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
					<div className="col-span-1">
						<FormField
							control={form.control}
							name="finder2FeePercent"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-xs">
										{t("fields.feePercentage")}
									</FormLabel>
									<FormControl>
										<PercentageInput
											placeholder="0.00"
											value={field.value}
											onChange={(value) => {
												field.onChange(value);
											}}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
					<div className="col-span-1">
						<FormItem>
							<FormLabel className="text-xs">
								{t("fields.revenueAmount")}
							</FormLabel>
							<FormControl>
								<Input
									type="number"
									step="1"
									placeholder="0.00"
									disabled
									value={calculatePersonAmounts(
										form.watch("finder2RevenuePercent") ||
											0,
										form.watch("finder2FeePercent") || 0,
									).revenueAmount.toFixed(2)}
								/>
							</FormControl>
						</FormItem>
					</div>
					<div className="col-span-1">
						<FormItem>
							<FormLabel className="text-xs">
								{t("fields.feeAmount")}
							</FormLabel>
							<FormControl>
								<Input
									type="number"
									step="1"
									placeholder="0.00"
									disabled
									value={calculatePersonAmounts(
										form.watch("finder2RevenuePercent") ||
											0,
										form.watch("finder2FeePercent") || 0,
									).feeAmount.toFixed(2)}
								/>
							</FormControl>
						</FormItem>
					</div>
					<div className="col-span-1">
						<FormItem>
							<FormLabel className="text-xs">
								{t("fields.originalCurrency")}
							</FormLabel>
							<FormControl>
								<Input
									type="number"
									step="1"
									placeholder="0.00"
									disabled
									value={calculatePersonAmounts(
										form.watch("finder2RevenuePercent") ||
											0,
										form.watch("finder2FeePercent") || 0,
									).totalAmount.toFixed(2)}
								/>
							</FormControl>
						</FormItem>
					</div>
					<div className="col-span-1">
						<FormItem>
							<FormLabel className="text-xs">
								{t("fields.usdAmount")}
							</FormLabel>
							<FormControl>
								<Input
									type="number"
									step="1"
									placeholder="0.00"
									disabled
									value={(
										calculatePersonAmounts(
											form.watch(
												"finder2RevenuePercent",
											) || 0,
											form.watch("finder2FeePercent") ||
												0,
										).totalAmount *
										(form.watch("fxRate") || 1)
									).toFixed(2)}
								/>
							</FormControl>
						</FormItem>
					</div>
				</div>

				{/* 總計驗證 */}
				<div className="mt-4 p-3 bg-muted/20 rounded-lg">
					<div className="flex justify-between items-center mb-2">
						<span className="text-sm font-medium">
							{t("summary.totalRevenuePercentage")}:
						</span>
						<span
							className={cn(
								"text-sm font-bold",
								Math.abs(
									totalPercentages.revenuePercent - 100,
								) < 0.01
									? "text-green-600"
									: "text-red-600",
							)}
						>
							{totalPercentages.revenuePercent.toFixed(2)}%
						</span>
					</div>
					<div className="flex justify-between items-center">
						<span className="text-sm font-medium">
							{t("summary.totalFeePercentage")}:
						</span>
						<span
							className={cn(
								"text-sm font-bold",
								Math.abs(totalPercentages.feePercent - 100) <
									0.01
									? "text-green-600"
									: "text-red-600",
							)}
						>
							{totalPercentages.feePercent.toFixed(2)}%
						</span>
					</div>
					{!isValid && (
						<div className="text-xs text-red-600 mt-1">
							{t("summary.validationError")}
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
