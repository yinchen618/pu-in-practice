import { Input } from "@ui/components/input";
import { cn } from "@ui/lib";
import type { ComponentPropsWithoutRef } from "react";

interface PercentageInputProps
	extends Omit<
		ComponentPropsWithoutRef<typeof Input>,
		"type" | "step" | "min" | "max" | "onChange" | "value"
	> {
	value: number | undefined;
	onChange: (value: number) => void;
	defaultValue?: number;
}

export function PercentageInput({
	value,
	onChange,
	defaultValue = 0,
	className,
	...props
}: PercentageInputProps) {
	// 確保 value 是有效的數字
	const displayValue = value !== undefined && value !== null ? value : defaultValue;
	
	return (
		<div className="relative">
			<Input
				type="number"
				step="0.01"
				min="0"
				max="100"
				placeholder="0.00"
				value={displayValue}
				onChange={(e) => {
					const newValue = e.target.value;
					if (newValue === "") {
						onChange(defaultValue);
					} else {
						const numValue = Number(newValue);
						if (!isNaN(numValue)) {
							onChange(numValue);
						}
					}
				}}
				className={cn("pr-7", className)}
				{...props}
			/>
			<span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
				%
			</span>
		</div>
	);
}
