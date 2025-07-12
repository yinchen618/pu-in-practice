import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
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
	// 使用抽象化的統計函式
	const stats = calculateProfitStats(data);
	const rmStats = aggregatePersonProfits(data, "rm");
	const finderStats = aggregatePersonProfits(data, "finder");

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			<Card className="text-primary">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">
						Shareable 總計
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
													{data.count} 筆 •{" "}
													{percentage.toFixed(1)}%
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
						Company分潤總計
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
								.map(([currency, data]) => {
									// 計算該幣別在總計中的佔比
									const percentage =
										stats.totalCompanyProfit > 0
											? (data.totalUSD /
													stats.totalCompanyProfit) *
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
													{data.count} 筆 •{" "}
													{percentage.toFixed(1)}%
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
						RM分潤總計
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
									<span className="font-medium">
										{p.name}
									</span>
									<div className="text-right">
										<span className="font-mono">
											{formatCurrency(p.profit, "USD")}
										</span>
										<span className="ml-2 text-xs text-muted-foreground">
											{p.count} 筆 •{" "}
											{(
												(p.profit /
													(rmStats.total || 1)) *
												100
											).toFixed(1)}
											%
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
						Finder分潤總計
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
									<span className="font-medium">
										{p.name}
									</span>
									<div className="text-right">
										<span className="font-mono">
											{formatCurrency(p.profit, "USD")}
										</span>
										<span className="ml-2 text-xs text-muted-foreground">
											{p.count} 筆 •{" "}
											{(
												(p.profit /
													(finderStats.total || 1)) *
												100
											).toFixed(1)}
											%
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
