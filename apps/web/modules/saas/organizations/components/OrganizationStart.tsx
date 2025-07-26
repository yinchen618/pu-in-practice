"use client";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { StatsTile } from "@saas/start/components/StatsTile";
import { Card } from "@ui/components/card";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

// 統計數據介面
interface ProfitStats {
	totalShareable: number;
	totalCompanyProfit: number;
	totalRMProfit: number;
	totalFinderProfit: number;
}

export default function OrganizationStart() {
	const t = useTranslations();
	const { activeOrganization, loaded } = useActiveOrganization();
	const [stats, setStats] = useState<ProfitStats>({
		totalShareable: 0,
		totalCompanyProfit: 0,
		totalRMProfit: 0,
		totalFinderProfit: 0,
	});
	const [isLoading, setIsLoading] = useState(true);

	// 獲取分潤統計數據
	const fetchProfitStats = async () => {
		if (!activeOrganization?.id) {
			return;
		}

		setIsLoading(true);
		try {
			const response = await fetch(
				`/api/organizations/profit-sharing?organizationId=${activeOrganization.id}`,
				{
					method: "GET",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
				},
			);

			if (response.ok) {
				const result = await response.json();
				const data = result.data || [];

				// 計算統計數據
				const calculatedStats = {
					totalShareable: 0,
					totalCompanyProfit: 0,
					totalRMProfit: 0,
					totalFinderProfit: 0,
				};

				data.forEach((record: any) => {
					const fxRate = record.fxRate || 1;
					calculatedStats.totalShareable +=
						(record.shareable || 0) * fxRate;
					calculatedStats.totalCompanyProfit +=
						(record.companyRevenueOriginal || 0) * fxRate;
					calculatedStats.totalRMProfit += record.rmRevenueUSD || 0;
					calculatedStats.totalFinderProfit +=
						record.findersRevenueUSD || 0;
				});

				setStats(calculatedStats);
			}
		} catch (error) {
			console.error("獲取分潤統計失敗:", error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (activeOrganization?.id && loaded) {
			fetchProfitStats();
		}
	}, [activeOrganization?.id, loaded]);

	if (!loaded || isLoading) {
		return (
			<div className="@container">
				<div className="grid @2xl:grid-cols-4 gap-4">
					<StatsTile
						title={t("organization.start.loading")}
						value={0}
						valueFormat="currency"
					/>
					<StatsTile
						title={t("organization.start.loading")}
						value={0}
						valueFormat="currency"
					/>
					<StatsTile
						title={t("organization.start.loading")}
						value={0}
						valueFormat="currency"
					/>
					<StatsTile
						title={t("organization.start.loading")}
						value={0}
						valueFormat="currency"
					/>
				</div>
			</div>
		);
	}

	return (
		<div className="@container">
			<div className="grid @2xl:grid-cols-4 gap-4">
				<StatsTile
					title={t("organization.start.totalShareable")}
					value={stats.totalShareable}
					valueFormat="currency"
				/>
				<StatsTile
					title={t("organization.start.totalCompanyProfit")}
					value={stats.totalCompanyProfit}
					valueFormat="currency"
				/>
				<StatsTile
					title={t("organization.start.totalRMProfit")}
					value={stats.totalRMProfit}
					valueFormat="currency"
				/>
				<StatsTile
					title={t("organization.start.totalFinderProfit")}
					value={stats.totalFinderProfit}
					valueFormat="currency"
				/>
			</div>

			<Card className="mt-6">
				<div className="flex h-64 items-center justify-center p-8 text-foreground/60">
					{t("organization.start.placeholder")}
				</div>
			</Card>
		</div>
	);
}
