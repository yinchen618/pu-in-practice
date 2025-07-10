import { Button } from "@ui/components/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@ui/components/command";
import {
	FormControl,
	FormItem,
	FormLabel,
	FormMessage,
} from "@ui/components/form";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@ui/components/popover";
import { cn } from "@ui/lib";
import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import type { ControllerRenderProps } from "react-hook-form";

interface Option {
	id: string;
	[key: string]: any;
}

interface SearchableSelectProps<T extends Option> {
	field: ControllerRenderProps<any, any>;
	label: string;
	placeholder: string;
	searchPlaceholder: string;
	emptyText: string;
	options: T[];
	getDisplayValue: (option: T | undefined) => string;
	getSearchValue: (option: T) => string;
	getOptionDisplayValue: (option: T) => string;
	required?: boolean;
	disabled?: boolean;
}

export function SearchableSelect<T extends Option>({
	field,
	label,
	placeholder,
	searchPlaceholder,
	emptyText,
	options,
	getDisplayValue,
	getSearchValue,
	getOptionDisplayValue,
	required,
	disabled,
}: SearchableSelectProps<T>) {
	const [open, setOpen] = useState(false);

	const selectedOption = options.find((option) => option.id === field.value);

	return (
		<FormItem>
			<FormLabel>
				{label}
				{required && " *"}
			</FormLabel>
			<Popover open={disabled ? false : open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<FormControl>
						<Button
							variant="outline"
							aria-expanded={open}
							className="w-full justify-between"
							disabled={disabled}
						>
							{field.value
								? getDisplayValue(selectedOption)
								: placeholder}
							<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
						</Button>
					</FormControl>
				</PopoverTrigger>
				<PopoverContent className="w-[400px] p-0">
					<Command>
						<CommandInput placeholder={searchPlaceholder} />
						<CommandList>
							<CommandEmpty>{emptyText}</CommandEmpty>
							<CommandGroup>
								{options.map((option) => (
									<CommandItem
										key={option.id}
										value={getSearchValue(option)}
										onSelect={() => {
											field.onChange(option.id);
											setOpen(false);
										}}
									>
										<Check
											className={cn(
												"mr-2 h-4 w-4",
												field.value === option.id
													? "opacity-100"
													: "opacity-0",
											)}
										/>
										{getOptionDisplayValue(option)}
									</CommandItem>
								))}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
			<FormMessage />
		</FormItem>
	);
}
