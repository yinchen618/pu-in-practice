"use client";

import { BarChart, BookOpen, Code, Database, NotebookPen } from "lucide-react";
import Link from "next/link";
import type React from "react";

export type TabKey =
	| "problem"
	| "implementation"
	| "workbench"
	| "evaluation"
	| "notes";

interface TabNavigationProps {
	activeTab: TabKey;
	onTabChange: (tab: TabKey) => void;
}

const tabs: {
	key: TabKey;
	label: string;
	icon: React.ComponentType<any>;
	href: string;
}[] = [
	{
		key: "problem",
		label: "Problem & Approach",
		icon: BookOpen,
		href: "/case-study?tab=problem#top",
	},
	{
		key: "implementation",
		label: "Implementation",
		icon: Code,
		href: "/case-study?tab=implementation#top",
	},
	{
		key: "workbench",
		label: "Data Workbench",
		icon: Database,
		href: "/case-study?tab=workbench#top",
	},
	{
		key: "evaluation",
		label: "Evaluation",
		icon: BarChart,
		href: "/case-study?tab=evaluation#top",
	},
	{
		key: "notes",
		label: "Research Notes",
		icon: NotebookPen,
		href: "/case-study?tab=notes#top",
	},
];

export default function TabNavigation({
	activeTab,
	onTabChange,
}: TabNavigationProps) {
	return (
		<nav className="sticky top-0 z-50 bg-white shadow-sm border-b">
			<div className="container mx-auto px-4 py-4">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-xl font-bold text-slate-800">
							Risk-Estimation–Driven PU Learning with LSTM
						</h1>
					</div>
					<div className="flex space-x-4">
						{tabs.map((tab) => {
							const Icon = tab.icon;
							return (
								<Link
									key={tab.key}
									href={tab.href}
									onClick={() => onTabChange(tab.key)}
									className={`px-3 py-2 text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer ${
										activeTab === tab.key
											? "text-blue-600 border-b-2 border-blue-600"
											: "text-slate-600 hover:text-slate-800"
									}`}
								>
									<Icon className="h-4 w-4" />
									{tab.label}
								</Link>
							);
						})}
					</div>
				</div>
			</div>
		</nav>
	);
}
