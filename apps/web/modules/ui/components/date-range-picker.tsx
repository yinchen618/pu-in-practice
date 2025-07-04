"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "../lib";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

interface DateRangePickerProps {
	from: Date;
	to: Date;
	onFromChange: (date: Date | undefined) => void;
	onToChange: (date: Date | undefined) => void;
	className?: string;
}

export function DateRangePicker({
	from,
	to,
	onFromChange,
	onToChange,
	className,
}: DateRangePickerProps) {
	return (
		<div className={cn("grid gap-2", className)}>
			<Popover>
				<PopoverTrigger asChild>
					<Button
						id="date"
						variant={"outline"}
						className={cn(
							"w-[300px] justify-start text-left font-normal",
							!from && "text-muted-foreground",
						)}
					>
						<CalendarIcon className="mr-2 size-4" />
						{from ? (
							to ? (
								<>
									{format(from, "yyyy-MM-dd")} 至{" "}
									{format(to, "yyyy-MM-dd")}
								</>
							) : (
								format(from, "yyyy-MM-dd")
							)
						) : (
							<span>選擇日期範圍</span>
						)}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="flex w-auto flex-col space-y-2 p-2">
					<div className="flex items-center gap-2">
						<Calendar
							mode="single"
							selected={from}
							onSelect={onFromChange}
							disabled={(date) =>
								date > new Date() || (to ? date > to : false)
							}
							initialFocus
						/>
						<Calendar
							mode="single"
							selected={to}
							onSelect={onToChange}
							disabled={(date) =>
								date > new Date() ||
								(from ? date < from : false)
							}
							initialFocus
						/>
					</div>
				</PopoverContent>
			</Popover>
		</div>
	);
}
