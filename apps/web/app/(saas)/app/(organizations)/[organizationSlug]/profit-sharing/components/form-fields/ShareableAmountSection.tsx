"use client";

import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@ui/components/form";
import { Input } from "@ui/components/input";
import type { UseFormReturn } from "react-hook-form";
import type { ProfitSharingFormData } from "../shared/types";

interface ShareableAmountSectionProps {
	form: UseFormReturn<ProfitSharingFormData>;
}

export function ShareableAmountSection({ form }: ShareableAmountSectionProps) {
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
							/>
						</FormControl>
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
