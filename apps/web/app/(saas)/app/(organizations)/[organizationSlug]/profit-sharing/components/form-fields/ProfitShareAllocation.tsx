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
	const totalPercent = calculateTotalProfitSharePercent(
		form.watch("companyProfitSharePercent") || 0,
		form.watch("rm1ProfitSharePercent") || 0,
		form.watch("rm2ProfitSharePercent") || 0,
		form.watch("finder1ProfitSharePercent") || 0,
		form.watch("finder2ProfitSharePercent") || 0,
	);

	const isValid = isValidProfitSharePercent(totalPercent);

	return (
		<Card className="mt-6">
			<CardHeader>
				<CardTitle>分潤比例分配</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Company 分潤 */}
				<div className="grid grid-cols-8 gap-4 items-end border-b pb-4">
					<div className="col-span-2">
						<FormLabel className="text-sm font-medium">
							Company 分潤
						</FormLabel>
						<div className="text-xs text-gray-500 mt-1">
							公司分潤
						</div>
					</div>
					<div className="col-span-1">
						<FormField
							control={form.control}
							name="companyProfitSharePercent"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-xs">
										比例 (%)
									</FormLabel>
									<FormControl>
										<PercentageInput
											placeholder="50.00"
											{...field}
											value={field.value || 0}
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
						<FormLabel className="text-xs">人員</FormLabel>
						<div className="text-sm text-gray-500 mt-2">-</div>
					</div>
					<div className="col-span-2">
						<FormItem>
							<FormLabel className="text-xs">原幣金額</FormLabel>
							<FormControl>
								<Input
									type="number"
									step="1"
									placeholder="0.00"
									disabled
									value={(
										((form.watch("shareable") || 0) *
											(form.watch(
												"companyProfitSharePercent",
											) || 0)) /
										100
									).toFixed(2)}
								/>
							</FormControl>
						</FormItem>
					</div>
					<div className="col-span-2">
						<FormItem>
							<FormLabel className="text-xs">美金金額</FormLabel>
							<FormControl>
								<Input
									type="number"
									step="1"
									placeholder="0.00"
									disabled
									value={(
										(((form.watch("shareable") || 0) *
											(form.watch(
												"companyProfitSharePercent",
											) || 0)) /
											100) *
										(form.watch("fxRate") || 1)
									).toFixed(2)}
								/>
							</FormControl>
						</FormItem>
					</div>
				</div>

				{/* RM1 分潤 */}
				<div className="grid grid-cols-8 gap-4 items-end border-b pb-4">
					<div className="col-span-2">
						<FormLabel className="text-sm font-medium">
							RM1 分潤
						</FormLabel>
						<div className="text-xs text-gray-500 mt-1">
							關係經理 1
						</div>
					</div>
					<div className="col-span-1">
						<FormField
							control={form.control}
							name="rm1ProfitSharePercent"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-xs">
										比例 (%)
									</FormLabel>
									<FormControl>
										<PercentageInput
											placeholder="0.00"
											{...field}
											value={field.value || 0}
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
											? "載入中..."
											: "選擇RM"
									}
									searchPlaceholder="搜尋RM..."
									emptyText={
										isLoadingRMsAndFinders
											? "載入中..."
											: "找不到RM。"
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
					<div className="col-span-2">
						<FormItem>
							<FormLabel className="text-xs">原幣金額</FormLabel>
							<FormControl>
								<Input
									type="number"
									step="1"
									placeholder="0.00"
									disabled
									value={(
										((form.watch("shareable") || 0) *
											(form.watch(
												"rm1ProfitSharePercent",
											) || 0)) /
										100
									).toFixed(2)}
								/>
							</FormControl>
						</FormItem>
					</div>
					<div className="col-span-2">
						<FormItem>
							<FormLabel className="text-xs">美金金額</FormLabel>
							<FormControl>
								<Input
									type="number"
									step="1"
									placeholder="0.00"
									disabled
									value={(
										(((form.watch("shareable") || 0) *
											(form.watch(
												"rm1ProfitSharePercent",
											) || 0)) /
											100) *
										(form.watch("fxRate") || 1)
									).toFixed(2)}
								/>
							</FormControl>
						</FormItem>
					</div>
				</div>

				{/* RM2 分潤 */}
				<div className="grid grid-cols-8 gap-4 items-end border-b pb-4">
					<div className="col-span-2">
						<FormLabel className="text-sm font-medium">
							RM2 分潤
						</FormLabel>
						<div className="text-xs text-gray-500 mt-1">
							關係經理 2
						</div>
					</div>
					<div className="col-span-1">
						<FormField
							control={form.control}
							name="rm2ProfitSharePercent"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-xs">
										比例 (%)
									</FormLabel>
									<FormControl>
										<PercentageInput
											placeholder="0.00"
											{...field}
											value={field.value || 0}
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
											? "載入中..."
											: "選擇RM"
									}
									searchPlaceholder="搜尋RM..."
									emptyText={
										isLoadingRMsAndFinders
											? "載入中..."
											: "找不到RM。"
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
					<div className="col-span-2">
						<FormItem>
							<FormLabel className="text-xs">原幣金額</FormLabel>
							<FormControl>
								<Input
									type="number"
									step="1"
									placeholder="0.00"
									disabled
									value={(
										((form.watch("shareable") || 0) *
											(form.watch(
												"rm2ProfitSharePercent",
											) || 0)) /
										100
									).toFixed(2)}
								/>
							</FormControl>
						</FormItem>
					</div>
					<div className="col-span-2">
						<FormItem>
							<FormLabel className="text-xs">美金金額</FormLabel>
							<FormControl>
								<Input
									type="number"
									step="1"
									placeholder="0.00"
									disabled
									value={(
										(((form.watch("shareable") || 0) *
											(form.watch(
												"rm2ProfitSharePercent",
											) || 0)) /
											100) *
										(form.watch("fxRate") || 1)
									).toFixed(2)}
								/>
							</FormControl>
						</FormItem>
					</div>
				</div>

				{/* Finder1 分潤 */}
				<div className="grid grid-cols-8 gap-4 items-end border-b pb-4">
					<div className="col-span-2">
						<FormLabel className="text-sm font-medium">
							Finder1 分潤
						</FormLabel>
						<div className="text-xs text-gray-500 mt-1">
							尋找者 1
						</div>
					</div>
					<div className="col-span-1">
						<FormField
							control={form.control}
							name="finder1ProfitSharePercent"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-xs">
										比例 (%)
									</FormLabel>
									<FormControl>
										<PercentageInput
											placeholder="0.00"
											{...field}
											value={field.value || 0}
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
											? "載入中..."
											: "選擇Finder"
									}
									searchPlaceholder="搜尋Finder..."
									emptyText={
										isLoadingRMsAndFinders
											? "載入中..."
											: "找不到Finder。"
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
					<div className="col-span-2">
						<FormItem>
							<FormLabel className="text-xs">原幣金額</FormLabel>
							<FormControl>
								<Input
									type="number"
									step="1"
									placeholder="0.00"
									disabled
									value={(
										((form.watch("shareable") || 0) *
											(form.watch(
												"finder1ProfitSharePercent",
											) || 0)) /
										100
									).toFixed(2)}
								/>
							</FormControl>
						</FormItem>
					</div>
					<div className="col-span-2">
						<FormItem>
							<FormLabel className="text-xs">美金金額</FormLabel>
							<FormControl>
								<Input
									type="number"
									step="1"
									placeholder="0.00"
									disabled
									value={(
										(((form.watch("shareable") || 0) *
											(form.watch(
												"finder1ProfitSharePercent",
											) || 0)) /
											100) *
										(form.watch("fxRate") || 1)
									).toFixed(2)}
								/>
							</FormControl>
						</FormItem>
					</div>
				</div>

				{/* Finder2 分潤 */}
				<div className="grid grid-cols-8 gap-4 items-end border-b pb-4">
					<div className="col-span-2">
						<FormLabel className="text-sm font-medium">
							Finder2 分潤
						</FormLabel>
						<div className="text-xs text-gray-500 mt-1">
							尋找者 2
						</div>
					</div>
					<div className="col-span-1">
						<FormField
							control={form.control}
							name="finder2ProfitSharePercent"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-xs">
										比例 (%)
									</FormLabel>
									<FormControl>
										<PercentageInput
											placeholder="0.00"
											{...field}
											value={field.value || 0}
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
											? "載入中..."
											: "選擇Finder"
									}
									searchPlaceholder="搜尋Finder..."
									emptyText={
										isLoadingRMsAndFinders
											? "載入中..."
											: "找不到Finder。"
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
					<div className="col-span-2">
						<FormItem>
							<FormLabel className="text-xs">原幣金額</FormLabel>
							<FormControl>
								<Input
									type="number"
									step="1"
									placeholder="0.00"
									disabled
									value={(
										((form.watch("shareable") || 0) *
											(form.watch(
												"finder2ProfitSharePercent",
											) || 0)) /
										100
									).toFixed(2)}
								/>
							</FormControl>
						</FormItem>
					</div>
					<div className="col-span-2">
						<FormItem>
							<FormLabel className="text-xs">美金金額</FormLabel>
							<FormControl>
								<Input
									type="number"
									step="1"
									placeholder="0.00"
									disabled
									value={(
										(((form.watch("shareable") || 0) *
											(form.watch(
												"finder2ProfitSharePercent",
											) || 0)) /
											100) *
										(form.watch("fxRate") || 1)
									).toFixed(2)}
								/>
							</FormControl>
						</FormItem>
					</div>
				</div>

				{/* 總計驗證 */}
				<div className="mt-4 p-3 bg-gray-50 rounded-lg">
					<div className="flex justify-between items-center">
						<span className="text-sm font-medium">總分潤比例:</span>
						<span
							className={cn(
								"text-sm font-bold",
								isValid ? "text-green-600" : "text-red-600",
							)}
						>
							{totalPercent.toFixed(2)}%
						</span>
					</div>
					{!isValid && (
						<div className="text-xs text-red-600 mt-1">
							分潤比例總和必須為 100%
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
