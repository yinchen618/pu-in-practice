"use client";

import type { ReactNode } from "react";

export function PageHeader({
	title,
	subtitle,
	actions,
}: {
	title: string;
	subtitle?: string;
	actions?: ReactNode;
}) {
	return (
		<div className="mb-8 flex items-center justify-between">
			<div>
				<h2 className="font-bold text-2xl lg:text-3xl">{title}</h2>
				{subtitle && <p className="mt-1 opacity-60">{subtitle}</p>}
			</div>
			{actions && <div className="flex gap-2">{actions}</div>}
		</div>
	);
}
