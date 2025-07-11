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
	return (
		<div className="relative">
			<Input
				type="number"
				step="1"
				min="0"
				max="100"
				placeholder="0.00"
				value={value || ""}
				onChange={(e) => {
					const newValue = e.target.value;
					onChange(newValue === "" ? defaultValue : Number(newValue));
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
