"use client";
import { config } from "@repo/config";
import { useSession } from "@saas/auth/hooks/use-session";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { UserMenu } from "@saas/shared/components/UserMenu";
import { sidebarCollapsed } from "@saas/shared/lib/state";
import { Logo } from "@shared/components/Logo";
import { cn } from "@ui/lib";
import { useAtom } from "jotai";
import {
	BuildingIcon,
	ChevronRightIcon,
	HomeIcon,
	MenuIcon,
	PackageIcon,
	PanelLeftIcon,
	ReceiptIcon,
	SettingsIcon,
	UserCog2Icon,
	UserCogIcon,
	UserIcon,
	UsersIcon,
	WalletIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LanguageSwitcher } from "../../../../components/language-switcher";
import { OrganzationSelect } from "../../organizations/components/OrganizationSelect";

export function NavBar() {
	const t = useTranslations();
	const pathname = usePathname();
	const { user } = useSession();
	const { activeOrganization } = useActiveOrganization();
	const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
	const [isSidebarCollapsed, setIsSidebarCollapsed] =
		useAtom(sidebarCollapsed);

	const { useSidebarLayout } = config.ui.saas;

	const basePath = activeOrganization
		? `/app/${activeOrganization.slug}`
		: "/app";

	const toggleMenu = (menuKey: string) => {
		setExpandedMenus((prev) =>
			prev.includes(menuKey)
				? prev.filter((key) => key !== menuKey)
				: [...prev, menuKey],
		);
	};

	const toggleSidebar = () => {
		setIsSidebarCollapsed((prev) => !prev);
		// Close all expanded submenus when collapsed
		if (!isSidebarCollapsed) {
			setExpandedMenus([]);
		}
	};

	const menuItems = [
		{
			label: t("app.menu.start"),
			href: basePath,
			icon: HomeIcon,
			isActive: pathname === basePath,
		},
		// {
		// 	label: t("app.menu.aiChatbot"),
		// 	href: activeOrganization
		// 		? `/app/${activeOrganization.slug}/chatbot`
		// 		: "/app/chatbot",
		// 	icon: BotMessageSquareIcon,
		// 	isActive: pathname.includes("/chatbot"),
		// },
		...(activeOrganization
			? [
					{
						label: t("app.menu.profitSharing"),
						href: `${basePath}/profit-sharing`,
						icon: WalletIcon,
						isActive: pathname.startsWith(
							`${basePath}/profit-sharing/`,
						),
					},
					{
						label: t("app.menu.expenses"),
						href: `${basePath}/expenses`,
						icon: ReceiptIcon,
						isActive: pathname.startsWith(`${basePath}/expenses/`),
					},
					{
						label: t("app.menu.customers"),
						href: `${basePath}/customers`,
						icon: UsersIcon,
						isActive: pathname.startsWith(`${basePath}/customers/`),
					},
					{
						label: t("app.menu.relationshipManagers"),
						href: `${basePath}/relationship-managers`,
						icon: UserIcon,
						isActive: pathname.startsWith(
							`${basePath}/relationship-managers/`,
						),
					},
					{
						label: t("app.menu.products"),
						href: `${basePath}/products`,
						icon: PackageIcon,
						isActive: pathname.startsWith(`${basePath}/products/`),
					},
					{
						label: t("app.menu.bankAccounts"),
						href: `${basePath}/bank-accounts`,
						icon: BuildingIcon,
						isActive: pathname.startsWith(
							`${basePath}/bank-accounts/`,
						),
					},
					{
						label: t("app.menu.organizationSettings"),
						href: `${basePath}/settings`,
						icon: SettingsIcon,
						isActive: pathname.startsWith(`${basePath}/settings/`),
					},
				]
			: []),
		{
			label: t("app.menu.accountSettings"),
			href: "/app/settings",
			icon: UserCog2Icon,
			isActive: pathname.startsWith("/app/settings/"),
		},
		...(user?.role === "admin"
			? [
					{
						label: t("app.menu.admin"),
						href: "/app/admin",
						icon: UserCogIcon,
						isActive: pathname.startsWith("/app/admin/"),
					},
				]
			: []),
	];

	return (
		<nav
			className={cn("w-full", {
				"w-full md:fixed md:top-0 md:left-0 md:h-full md:w-[280px] transition-all duration-300":
					useSidebarLayout && !isSidebarCollapsed,
				"w-full md:fixed md:top-0 md:left-0 md:h-full md:w-[60px] transition-all duration-300":
					useSidebarLayout && isSidebarCollapsed,
			})}
		>
			<div
				className={cn("container max-w-6xl py-4", {
					"container max-w-6xl py-4 md:flex md:h-full md:flex-col md:px-6 md:pt-6 md:pb-0":
						useSidebarLayout && !isSidebarCollapsed,
					"container max-w-6xl py-4 md:flex md:h-full md:flex-col md:px-3 md:pt-6 md:pb-0":
						useSidebarLayout && isSidebarCollapsed,
				})}
			>
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div
						className={cn("flex items-center gap-4 md:gap-2", {
							"md:flex md:w-full md:flex-col md:items-stretch md:align-stretch":
								useSidebarLayout && !isSidebarCollapsed,
							"md:flex md:w-full md:flex-col md:items-center":
								useSidebarLayout && isSidebarCollapsed,
						})}
					>
						<Link href="/app" className="block">
							<Logo />
						</Link>

						{config.organizations.enable &&
							!config.organizations.hideOrganization &&
							!isSidebarCollapsed && (
								<>
									<span
										className={cn(
											"hidden opacity-30 md:block",
											{
												"md:hidden": useSidebarLayout,
											},
										)}
									>
										<ChevronRightIcon className="size-4" />
									</span>

									{/* Organization selector and collapse button in same row */}
									{useSidebarLayout ? (
										<div className="md:flex md:items-center md:justify-between md:gap-2 md:-mx-2 md:mt-2">
											<div className="flex-1">
												<OrganzationSelect />
											</div>
											<button
												type="button"
												onClick={toggleSidebar}
												className="flex items-center justify-center p-2 rounded-md hover:bg-muted transition-colors shrink-0"
												title={
													isSidebarCollapsed
														? t(
																"app.sidebar.expand",
															)
														: t(
																"app.sidebar.collapse",
															)
												}
											>
												<PanelLeftIcon className="size-4" />
											</button>
										</div>
									) : (
										<OrganzationSelect />
									)}
								</>
							)}
					</div>

					<div
						className={cn(
							"mr-0 ml-auto flex items-center justify-end gap-4",
							{
								"md:hidden": useSidebarLayout,
							},
						)}
					>
						{/* <LanguageSwitcher /> */}
						<UserMenu />
					</div>
				</div>

				{/* Collapse button in collapsed state */}
				{useSidebarLayout && isSidebarCollapsed && (
					<div className="hidden md:flex md:justify-center md:mt-4">
						<button
							type="button"
							onClick={toggleSidebar}
							className="flex items-center justify-center p-2 rounded-md hover:bg-muted transition-colors"
							title={t("app.sidebar.expand")}
						>
							<MenuIcon className="size-4" />
						</button>
					</div>
				)}

				{!isSidebarCollapsed && (
					<ul
						className={cn(
							"no-scrollbar -mx-4 -mb-4 mt-6 flex list-none items-center justify-start gap-4 overflow-x-auto px-4 text-sm",
							{
								"md:mx-0 md:my-4 md:flex md:flex-col md:items-stretch md:gap-1 md:px-0":
									useSidebarLayout,
							},
						)}
					>
						{menuItems.map((menuItem, index) => (
							<li key={menuItem.href || `menu-${index}`}>
								<Link
									href={menuItem.href || "#"}
									className={cn(
										"flex items-center gap-2 whitespace-nowrap border-b-2 px-1 pb-3",
										[
											menuItem.isActive
												? "border-primary font-bold"
												: "border-transparent",
										],
										{
											"md:-mx-6 md:border-b-0 md:border-l-2 md:px-6 md:py-2":
												useSidebarLayout,
										},
									)}
								>
									<menuItem.icon
										className={`size-4 shrink-0 ${
											menuItem.isActive
												? "text-primary"
												: "opacity-50"
										}`}
									/>
									<span>{menuItem.label}</span>
								</Link>
							</li>
						))}
					</ul>
				)}

				{/* Icon menu in collapsed state */}
				{isSidebarCollapsed && useSidebarLayout && (
					<ul className="md:mx-0 md:my-4 md:flex md:flex-col md:items-center md:gap-2 md:px-0">
						{menuItems.map((menuItem, index) => (
							<li key={menuItem.href || `menu-${index}`}>
								<Link
									href={menuItem.href || "#"}
									className="flex items-center justify-center p-2 rounded-md hover:bg-muted transition-colors"
									title={menuItem.label}
								>
									<menuItem.icon
										className={`size-5 ${
											menuItem.isActive
												? "text-primary"
												: "opacity-50"
										}`}
									/>
								</Link>
							</li>
						))}
					</ul>
				)}

				<div
					className={cn(
						"-mx-4 md:-mx-6 mt-auto mb-0 hidden p-4 md:p-4",
						{
							"md:block": useSidebarLayout && !isSidebarCollapsed,
							"md:flex md:justify-center md:p-2":
								useSidebarLayout && isSidebarCollapsed,
						},
					)}
				>
					{!isSidebarCollapsed && (
						<div className="flex flex-col gap-2">
							<LanguageSwitcher />
							<UserMenu showUserName={!isSidebarCollapsed} />
						</div>
					)}
					{isSidebarCollapsed && (
						<div className="flex flex-col gap-2 items-center">
							<LanguageSwitcher />
							<UserMenu showUserName={!isSidebarCollapsed} />
						</div>
					)}
				</div>
			</div>
		</nav>
	);
}
