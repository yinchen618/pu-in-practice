"use client";
import { updateLocale } from "@i18n/lib/update-locale";
import { authClient } from "@repo/auth/client";
import { config } from "@repo/config";
import type { Locale } from "@repo/i18n";
import { useMutation } from "@tanstack/react-query";

import { Button } from "@ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function LanguageSwitcher() {
	const currentLocale = useLocale();
	const t = useTranslations();
	const router = useRouter();
	const [locale, setLocale] = useState<Locale | undefined>(
		currentLocale as Locale,
	);

	const updateLocaleMutation = useMutation({
		mutationFn: async () => {
			if (!locale) {
				return;
			}

			await authClient.updateUser({
				locale,
			});
			await updateLocale(locale);
			router.refresh();
		},
	});

	const saveLocale = async () => {
		try {
			await updateLocaleMutation.mutateAsync();

			toast.success(t("settings.account.language.notifications.success"));
		} catch {
			toast.error(t("settings.account.language.notifications.error"));
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="sm" className="gap-2">
					<Languages className="h-4 w-4" />
					{config.i18n.locales[locale as keyof typeof config.i18n.locales]?.label || locale}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{Object.entries(config.i18n.locales).map(
					([localeKey, localeConfig]) => (
						<DropdownMenuItem
							key={localeKey}
							onClick={() => {
								setLocale(localeKey as Locale);
								saveLocale();
							}}
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
