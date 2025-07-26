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
import { useTranslations } from "next-intl";
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
	const t = useTranslations("organization.profitSharing.shareableAmount");

	return (
		<div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
			<FormField
				control={form.control}
				name="shareable"
				render={({ field }) => (
					<FormItem>
						<FormLabel>{t("shareableLabel")}</FormLabel>
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
							{t("shareableDescription")}
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
						<FormLabel>{t("fxRateLabel")} *</FormLabel>
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
								{t("usdRateFixed")}
							</p>
						)}
						{exchangeRateError && watchedCurrency !== "USD" && (
							<p className="text-sm text-red-600 mt-1">
								{t("exchangeRateError")}: {exchangeRateError}
							</p>
						)}
						{exchangeRateData &&
							!exchangeRateError &&
							watchedCurrency !== "USD" && (
								<p className="text-sm text-green-600 mt-1">
									{exchangeRateData.date}{" "}
									{t("exchangeRateUpdated")}
								</p>
							)}
						<FormMessage />
					</FormItem>
				)}
			/>

			<div>
				<FormLabel className="text-sm font-medium">
					{t("shareableUsdLabel")}
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
