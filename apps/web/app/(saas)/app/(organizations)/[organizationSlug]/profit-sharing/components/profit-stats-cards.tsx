import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { useTranslations } from "next-intl";
import { useQueryState } from "nuqs";
import {
	aggregatePersonProfits,
	calculateProfitStats,
	formatCurrency,
} from "../lib/profit-stats";
import type { ProfitSharingRecord } from "./columns";

interface ProfitStatsCardsProps {
	data: ProfitSharingRecord[];
}

export function ProfitStatsCards({ data }: ProfitStatsCardsProps) {
	const t = useTranslations();
	// 使用 nuqs 管理 URL 參數
	const [rmName, setRmName] = useQueryState("rmName");
	const [finderName, setFinderName] = useQueryState("finderName");
	const [currency, setCurrency] = useQueryState("currency");

	// 使用抽象化的統計函式
	const stats = calculateProfitStats(data);
	const rmStats = aggregatePersonProfits(data, "rm");
	const finderStats = aggregatePersonProfits(data, "finder");

	// 處理人名點擊
	const handlePersonClick = (name: string, type: "rm" | "finder") => {
		if (type === "rm") {
			setRmName(name);
		} else {
			setFinderName(name);
		}
	};

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			<Card className="text-primary">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">
						{t("organization.profitSharing.stats.totalShareable")}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">
						{formatCurrency(stats.totalShareable, "USD")}
					</div>
					{/* 各幣別 Shareable 總和 */}
					{Object.entries(stats.shareableByCurrency).length > 0 && (
						<div className="mt-4 space-y-1.5">
							{Object.entries(stats.shareableByCurrency)
								.sort(([, a], [, b]) => b.totalUSD - a.totalUSD) // 按 USD 金額排序
								.map(([currency, data]) => {
									// 計算該幣別在總計中的佔比
									const percentage =
										stats.totalShareable > 0
											? (data.totalUSD /
													stats.totalShareable) *
												100
											: 0;

									return (
										<div
											key={currency}
											className="flex items-center justify-between text-sm"
										>
											<span className="font-medium">
												<span className="font-mono">
													{formatCurrency(
														data.amount,
														currency,
													)}
												</span>
											</span>
											<div className="text-right">
												<span className="ml-2 text-xs text-muted-foreground">
													{data.count}{" "}
													{t("common.format.items")} •{" "}
													{percentage.toFixed(1)}
													{t(
														"common.format.percentage",
													)}
												</span>
											</div>
										</div>
									);
								})}
						</div>
					)}
				</CardContent>
			</Card>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">
						{t(
							"organization.profitSharing.stats.totalCompanyProfit",
						)}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">
						{formatCurrency(stats.totalCompanyProfit, "USD")}
					</div>
					{/* 各幣別分潤總和 */}
					{Object.entries(stats.companyProfitByCurrency).length >
						0 && (
						<div className="mt-4 space-y-1.5">
							{Object.entries(stats.companyProfitByCurrency)
								.sort(([, a], [, b]) => b.totalUSD - a.totalUSD) // 按 USD 金額排序
								.map(([currencyKey, data]) => {
									const percentage =
										stats.totalCompanyProfit > 0
											? (data.totalUSD /
													stats.totalCompanyProfit) *
												100
											: 0;
									return (
										<div
											key={currencyKey}
											className="flex items-center justify-between text-sm"
										>
											<button
												type="button"
												onClick={() =>
													setCurrency(currencyKey)
												}
												className="flex items-center gap-1 font-medium text-primary underline underline-offset-2 hover:bg-primary/10 rounded px-1 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary"
												aria-label={t(
													"common.filter.currency",
													{ currency: currencyKey },
												)}
											>
												{/* <MousePointerClick className="size-4" /> */}
												<span className="font-mono">
													{formatCurrency(
														data.amount,
														currencyKey,
													)}
												</span>
											</button>
											<div className="text-right">
												<span className="ml-2 text-xs text-muted-foreground">
													{data.count}{" "}
													{t("common.format.items")} •{" "}
													{percentage.toFixed(1)}
													{t(
														"common.format.percentage",
													)}
												</span>
											</div>
										</div>
									);
								})}
						</div>
					)}
				</CardContent>
			</Card>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">
						{t("organization.profitSharing.stats.totalRMProfit")}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">
						{formatCurrency(stats.totalRMProfit, "USD")}
					</div>
					{/* RM 分潤明細列表 */}
					{rmStats.persons.length > 0 && (
						<div className="mt-4 space-y-1.5">
							{rmStats.persons.map((p) => (
								<div
									key={p.name}
									className="flex items-center justify-between text-sm"
								>
									<button
										type="button"
										onClick={() =>
											handlePersonClick(p.name, "rm")
										}
										className="flex items-center gap-1 font-medium text-primary underline underline-offset-2 hover:bg-primary/10 rounded px-1 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary"
										aria-label={t("common.filter.profit", {
											name: p.name,
										})}
									>
										{/* <MousePointerClick className="size-4" /> */}
										{p.name}
									</button>
									<div className="text-right">
										<span className="font-mono">
											{formatCurrency(p.profit, "USD")}
										</span>
										<span className="ml-2 text-xs text-muted-foreground">
											{p.count} {t("common.format.items")}{" "}
											•{" "}
											{(
												(p.profit /
													(rmStats.total || 1)) *
												100
											).toFixed(1)}
											{t("common.format.percentage")}
										</span>
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">
						{t(
							"organization.profitSharing.stats.totalFinderProfit",
						)}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">
						{formatCurrency(stats.totalFinderProfit, "USD")}
					</div>
					{/* Finder 分潤明細列表 */}
					{finderStats.persons.length > 0 && (
						<div className="mt-4 space-y-1.5">
							{finderStats.persons.map((p) => (
								<div
									key={p.name}
									className="flex items-center justify-between text-sm"
								>
									<button
										type="button"
										onClick={() =>
											handlePersonClick(p.name, "finder")
										}
										className="flex items-center gap-1 font-medium text-primary underline underline-offset-2 hover:bg-primary/10 rounded px-1 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary"
										aria-label={t("common.filter.profit", {
											name: p.name,
										})}
									>
										{/* <MousePointerClick className="size-4" /> */}
										{p.name}
									</button>
									<div className="text-right">
										<span className="font-mono">
											{formatCurrency(p.profit, "USD")}
										</span>
										<span className="ml-2 text-xs text-muted-foreground">
											{p.count} {t("common.format.items")}{" "}
											•{" "}
											{(
												(p.profit /
													(finderStats.total || 1)) *
												100
											).toFixed(1)}
											{t("common.format.percentage")}
										</span>
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
