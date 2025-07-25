"use client";

import { Button } from "@ui/components/button";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@ui/components/form";
import { Input } from "@ui/components/input";
import { RefreshCw } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { ProfitSharingFormData } from "../shared/types";

interface ExchangeRateData {
	rates: Record<string, number>;
	date: string;
}

interface ShareableAmountSectionProps {
	form: UseFormReturn<ProfitSharingFormData>;
	exchangeRateLoading?: boolean;
	exchangeRateError?: string | null;
	exchangeRateData?: ExchangeRateData | null;
	onRefreshExchangeRate?: () => Promise<void>;
	watchedCurrency?: string;
}

export function ShareableAmountSection({
	form,
	exchangeRateLoading = false,
	exchangeRateError = null,
	exchangeRateData = null,
	onRefreshExchangeRate,
	watchedCurrency = "USD",
}: ShareableAmountSectionProps) {
	return (
		<div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
			<FormField
				control={form.control}
				name="shareable"
				render={({ field }) => (
					<FormItem>
						<FormLabel>總分潤金額 (Shareable)</FormLabel>
						<FormControl>
							<Input
								type="number"
								step="1"
								placeholder="0.00"
								disabled
								value={field.value || ""}
							/>
						</FormControl>
						<p className="text-sm text-gray-600 mt-1">
							Company Revenue + Direct Trade Booking Fee × Bank
							Retro(%)
						</p>
						<FormMessage />
					</FormItem>
				)}
			/>

			<FormField
				control={form.control}
				name="fxRate"
				render={({ field }) => (
					<FormItem>
						<FormLabel>FX Rate *</FormLabel>
						<div className="flex gap-2">
							<FormControl>
								<Input
									type="number"
									step="1"
									placeholder="1.00"
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
									disabled={watchedCurrency === "USD"}
									className={
										exchangeRateLoading ? "bg-muted" : ""
									}
								/>
							</FormControl>
							{watchedCurrency !== "USD" &&
								onRefreshExchangeRate && (
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={onRefreshExchangeRate}
										disabled={exchangeRateLoading}
										className="px-3"
									>
										{exchangeRateLoading ? (
											<RefreshCw className="size-4 animate-spin" />
										) : (
											<RefreshCw className="size-4" />
										)}
									</Button>
								)}
						</div>
						{watchedCurrency === "USD" && (
							<p className="text-sm text-gray-600 mt-1">
								美元匯率固定為 1.00
							</p>
						)}
						{exchangeRateError && watchedCurrency !== "USD" && (
							<p className="text-sm text-red-600 mt-1">
								無法獲取匯率: {exchangeRateError}
							</p>
						)}
						{exchangeRateData &&
							!exchangeRateError &&
							watchedCurrency !== "USD" && (
								<p className="text-sm text-green-600 mt-1">
									{exchangeRateData.date} 的美元匯率已更新
								</p>
							)}
						<FormMessage />
					</FormItem>
				)}
			/>

			<div>
				<FormLabel className="text-sm font-medium">
					Shareable (USD)
				</FormLabel>
				<Input
					type="number"
					step="1"
					placeholder="0.00"
					disabled
					value={(
						(form.watch("shareable") || 0) *
						(form.watch("fxRate") || 1)
					).toFixed(2)}
				/>
			</div>
		</div>
	);
}
