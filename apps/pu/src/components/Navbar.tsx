"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
	Brain,
	FlaskConical,
	Home,
	Menu,
	Microscope,
	Network,
	User,
	X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

// 核心頁面導覽 (Core Academic Pages)
const corePages = [
	{
		name: "Risk Principle",
		href: "/pu-learning",
		description: "Positive-Unlabeled Learning theory and applications",
		icon: Microscope,
	},
	{
		name: "Testbed",
		href: "/testbed",
		description: "Smart residential IoT data collection platform",
		icon: Network,
	},
	// {
	// 	name: "Case Study",
	// 	href: "/case-study",
	// 	description: "Applying PU Learning to real-world IoT anomaly detection",
	// 	icon: FlaskConical,
	// },
	{
		name: "Case Study",
		href: "/case-study",
		description: "Advanced PU Learning experimental workbench",
		icon: FlaskConical,
	},
	{
		name: "About Me",
		href: "/about",
		description: "About me",
		icon: User,
	},
];

export default function Navbar() {
	const [isOpen, setIsOpen] = useState(false);
	const pathname = usePathname();

	return (
		<nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
			<div className="w-full px-4 sm:px-6 lg:px-8">
				<div className="flex h-16 items-center justify-between">
					{/* 左側 Logo + 主選單群組 */}
					<div className="flex items-center">
						{/* Logo */}
						<Link
							href="/"
							className="flex items-center space-x-2 flex-shrink-0"
						>
							<div className="rounded-lg bg-gradient-to-r from-slate-600 to-slate-800 p-2">
								<Brain className="h-6 w-6 text-white" />
							</div>
							<span className="hidden sm:block text-xl font-bold bg-gradient-to-r from-slate-600 to-slate-800 bg-clip-text text-transparent">
								Risk Estimation in Practice
							</span>
							<span className="block sm:hidden text-lg font-bold bg-gradient-to-r from-slate-600 to-slate-800 bg-clip-text text-transparent">
								Risk Estimation in Practice
							</span>
						</Link>

						{/* Desktop Navigation */}
						<div className="hidden lg:flex items-center space-x-4 ml-8">
							<Link
								href="/"
								className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
									pathname === "/"
										? "bg-accent text-accent-foreground"
										: "text-muted-foreground"
								}`}
							>
								<Home className="h-4 w-4" />
								Home
							</Link>

							{/* Core Pages Navigation */}
							{corePages.map((page) => {
								const Icon = page.icon;
								return (
									<Link
										key={page.href}
										href={page.href}
										className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
											pathname === page.href
												? "bg-accent text-accent-foreground"
												: "text-muted-foreground"
										}`}
									>
										<Icon className="h-4 w-4" />
										{page.name}
									</Link>
								);
							})}
						</div>

						{/* Medium Screen Navigation - Simplified */}
						<div className="hidden md:flex lg:hidden items-center space-x-2 ml-4">
							<Link
								href="/"
								className={`flex items-center gap-1 px-2 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
									pathname === "/"
										? "bg-accent text-accent-foreground"
										: "text-muted-foreground"
								}`}
							>
								<Home className="h-4 w-4" />
								Home
							</Link>

							{corePages.map((page) => {
								const Icon = page.icon;
								return (
									<Link
										key={page.href}
										href={page.href}
										className={`flex items-center gap-1 px-2 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
											pathname === page.href
												? "bg-accent text-accent-foreground"
												: "text-muted-foreground"
										}`}
									>
										<Icon className="h-4 w-4" />
										<span className="hidden xl:inline">
											{page.name}
										</span>
									</Link>
								);
							})}
						</div>
					</div>

					{/* Mobile Navigation */}
					<div className="md:hidden flex items-center gap-2">
						<Sheet open={isOpen} onOpenChange={setIsOpen}>
							<SheetTrigger asChild>
								<Button variant="ghost" size="icon">
									<Menu className="h-6 w-6" />
									<span className="sr-only">Open Menu</span>
								</Button>
							</SheetTrigger>
							<SheetContent side="right" className="w-80">
								<div className="flex items-center justify-between pb-4 mb-4 border-b">
									<div className="flex items-center space-x-2">
										<div className="rounded-lg bg-gradient-to-r from-slate-600 to-slate-800 p-2">
											<Brain className="h-5 w-5 text-white" />
										</div>
										<span className="text-lg font-bold">
											Research Portfolio
										</span>
									</div>
									<Button
										variant="ghost"
										size="icon"
										onClick={() => setIsOpen(false)}
									>
										<X className="h-5 w-5" />
									</Button>
								</div>
								<div className="flex flex-col space-y-3">
									<Link
										href="/"
										onClick={() => setIsOpen(false)}
										className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
											pathname === "/"
												? "bg-accent text-accent-foreground"
												: "text-muted-foreground"
										}`}
									>
										<Home className="h-4 w-4" />
										Home
									</Link>

									{corePages.map((page) => {
										const Icon = page.icon;
										return (
											<Link
												key={page.href}
												href={page.href}
												onClick={() => setIsOpen(false)}
												className={`flex items-start gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
													pathname === page.href
														? "bg-accent text-accent-foreground"
														: "text-muted-foreground"
												}`}
											>
												<Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
												<div>
													<div className="font-medium">
														{page.name}
													</div>
													<div className="text-xs text-muted-foreground mt-0.5">
														{page.description}
													</div>
												</div>
											</Link>
										);
									})}
								</div>
							</SheetContent>
						</Sheet>
					</div>

					{/* 右側語言選單 */}
					{/* <div className="hidden md:flex items-center">
						<div className="flex items-center gap-2">
							<Languages className="h-4 w-4" />
							<span className="text-sm">🇺🇸 EN</span>
						</div>
					</div> */}
				</div>
			</div>
		</nav>
	);
}
