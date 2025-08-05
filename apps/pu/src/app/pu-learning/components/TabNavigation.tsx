"use client";

import { BookOpen, FlaskConical, Lightbulb, Users } from "lucide-react";
import Link from "next/link";
import React from "react";

export type TabKey = "demo" | "theory" | "applications" | "references";

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
		key: "demo",
		label: "Demo",
		icon: FlaskConical,
		href: "/pu-learning?tab=demo",
	},
	{
		key: "theory",
		label: "Theoretical Background",
		icon: BookOpen,
		href: "/pu-learning?tab=theory",
	},
	{
		key: "applications",
		label: "Practical Applications",
		icon: Lightbulb,
		href: "/pu-learning?tab=applications",
	},
	{
		key: "references",
		label: "References",
		icon: Users,
		href: "/pu-learning?tab=references",
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
							Interactive PU Learning Demonstrator
						</h1>
					</div>
					<div className="flex space-x-6">
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
