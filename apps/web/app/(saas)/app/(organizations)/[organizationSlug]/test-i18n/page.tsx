"use client";

import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "../../../../../../components/language-switcher";

export default function TestI18nPage() {
	const t = useTranslations("organization.expenses");

	return (
		<div className="container max-w-4xl mx-auto py-8 space-y-8">
			<div className="flex justify-between items-center">
				<h1 className="text-3xl font-bold">i18n 測試頁面</h1>
				<LanguageSwitcher />
			</div>

			<div className="grid gap-6">
				<div className="space-y-4">
					<h2 className="text-2xl font-semibold">支出模組翻譯測試</h2>
					<div className="grid grid-cols-2 gap-4">
						<div className="p-4 border rounded-lg">
							<h3 className="font-semibold text-lg">
								{t("title")}
							</h3>
							<p className="text-gray-600">{t("subtitle")}</p>
						</div>
						<div className="p-4 border rounded-lg">
							<h3 className="font-semibold text-lg">表單標籤</h3>
							<ul className="space-y-1 text-sm">
								<li>
									<strong>{t("category")}:</strong>{" "}
									{t("form.selectCategory")}
								</li>
								<li>
									<strong>{t("amount")}:</strong>{" "}
									{t("form.enterAmount")}
								</li>
								<li>
									<strong>{t("currency")}:</strong>{" "}
									{t("form.selectCurrency")}
								</li>
								<li>
									<strong>{t("description")}:</strong>{" "}
									{t("form.enterDescription")}
								</li>
							</ul>
						</div>
					</div>
				</div>

				<div className="space-y-4">
					<h2 className="text-2xl font-semibold">類別翻譯</h2>
					<div className="grid grid-cols-5 gap-2">
						{Object.entries(t.raw("categories")).map(
							([key, value]) => (
								<div
									key={key}
									className="p-2 bg-gray-100 rounded text-center text-sm"
								>
									{value as string}
								</div>
							),
						)}
					</div>
				</div>

				<div className="space-y-4">
					<h2 className="text-2xl font-semibold">按鈕和動作</h2>
					<div className="flex gap-2 flex-wrap">
						<button
							type="button"
							className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
						>
							{t("create")}
						</button>
						<button
							type="button"
							className="px-3 py-1 bg-green-500 text-white rounded text-sm"
						>
							{t("form.save")}
						</button>
						<button
							type="button"
							className="px-3 py-1 bg-yellow-500 text-white rounded text-sm"
						>
							{t("form.update")}
						</button>
						<button
							type="button"
							className="px-3 py-1 bg-red-500 text-white rounded text-sm"
						>
							{t("delete")}
						</button>
						<button
							type="button"
							className="px-3 py-1 bg-gray-500 text-white rounded text-sm"
						>
							{t("form.cancel")}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
