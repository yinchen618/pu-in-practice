"use client";

import { config } from "@repo/config";
import { Button } from "@ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import { Languages } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";

export function LanguageSwitcher() {
	const locale = useLocale();
	const router = useRouter();
	const pathname = usePathname();

	const handleLocaleChange = (newLocale: string) => {
		// 設置 locale cookie
		document.cookie = `${config.i18n.localeCookieName}=${newLocale}; path=/; max-age=31536000`;

		// 取得目前路徑，替換語言前綴
		const segments = pathname.split("/");
		if (segments[1] === "en" || segments[1] === "zh") {
			segments[1] = newLocale;
		} else {
			segments.splice(1, 0, newLocale);
		}
		const newPath = segments.join("/") || "/";

		// 導向新語言的路徑
		router.push(newPath);
	};

	const currentLocaleConfig =
		config.i18n.locales[locale as keyof typeof config.i18n.locales];

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="sm" className="gap-2">
					<Languages className="h-4 w-4" />
					{currentLocaleConfig?.label || locale}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{Object.entries(config.i18n.locales).map(
					([localeKey, localeConfig]) => (
						<DropdownMenuItem
							key={localeKey}
							onClick={() => handleLocaleChange(localeKey)}
							className={locale === localeKey ? "bg-accent" : ""}
						>
							{localeConfig.label}
						</DropdownMenuItem>
					),
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
