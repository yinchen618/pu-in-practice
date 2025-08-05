"use client";

import * as React from "react";

const cn = (...inputs: (string | undefined | false)[]) =>
	inputs.filter(Boolean).join(" ");

const Collapsible = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement> & {
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
	}
>(({ className, open, onOpenChange, children, ...props }, ref) => {
	const [isOpen, setIsOpen] = React.useState(open ?? false);

	React.useEffect(() => {
		if (open !== undefined) {
			setIsOpen(open);
		}
	}, [open]);

	const handleToggle = React.useCallback(() => {
		const newOpen = !isOpen;
		setIsOpen(newOpen);
		onOpenChange?.(newOpen);
	}, [isOpen, onOpenChange]);

	return (
		<div
			ref={ref}
			className={cn("", className)}
			data-state={isOpen ? "open" : "closed"}
			{...props}
		>
			{React.Children.map(children, (child) => {
				if (React.isValidElement(child)) {
					if (child.type === CollapsibleTrigger) {
						return React.cloneElement(child, {
							onClick: handleToggle,
						} as any);
					}
					if (child.type === CollapsibleContent) {
						return React.cloneElement(child, {
							open: isOpen,
						} as any);
					}
				}
				return child;
			})}
		</div>
	);
});
Collapsible.displayName = "Collapsible";

const CollapsibleTrigger = React.forwardRef<
	HTMLButtonElement,
	React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => (
	<button
		ref={ref}
		type="button"
		className={cn(
			"flex w-full items-center justify-between py-2 text-sm font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
			className,
		)}
		{...props}
	>
		{children}
	</button>
));
CollapsibleTrigger.displayName = "CollapsibleTrigger";

const CollapsibleContent = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement> & { open?: boolean }
>(({ className, children, open, ...props }, ref) => (
	<div
		ref={ref}
		className={cn(
			"overflow-hidden transition-all duration-200 ease-in-out",
			open
				? "animate-in slide-in-from-top-1"
				: "animate-out slide-out-to-top-1",
			!open && "hidden",
			className,
		)}
		{...props}
	>
		<div className="pb-4">{children}</div>
	</div>
));
CollapsibleContent.displayName = "CollapsibleContent";

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
