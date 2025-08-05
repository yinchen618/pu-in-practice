import type { ProfitSharingRecord } from "../components/columns";

// 格式化貨幣函數
export const formatCurrency = (value: number, currency: string) => {
	return `${currency} ${value.toLocaleString("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})}`;
};

// 統計所有 RM/Finder 的分潤金額與佔比
export function aggregatePersonProfits(
	data: ProfitSharingRecord[],
	personType: "rm" | "finder",
) {
	const personMap: Record<
		string,
		{ name: string; profit: number; count: number }
	> = {};
	let total = 0;

	for (const record of data) {
		if (personType === "rm") {
			if (record.rm1Name && record.rm1RevenueUSD) {
				const profit = record.rm1RevenueUSD || 0;

				personMap[record.rm1Name] = personMap[record.rm1Name]
					? {
							name: record.rm1Name,
							profit: personMap[record.rm1Name].profit + profit,
							count: personMap[record.rm1Name].count + 1,
						}
					: { name: record.rm1Name, profit, count: 1 };
				total += profit;
			}

			if (record.rm2Name && record.rm2RevenueUSD) {
				const profit = record.rm2RevenueUSD || 0;

				personMap[record.rm2Name] = personMap[record.rm2Name]
					? {
							name: record.rm2Name,
							profit: personMap[record.rm2Name].profit + profit,
							count: personMap[record.rm2Name].count + 1,
						}
					: { name: record.rm2Name, profit, count: 1 };
				total += profit;
			}
		} else if (personType === "finder") {
			if (record.finder1Name && record.finder1RevenueUSD) {
				const profit = record.finder1RevenueUSD || 0;

				personMap[record.finder1Name] = personMap[record.finder1Name]
					? {
							name: record.finder1Name,
							profit:
								personMap[record.finder1Name].profit + profit,
							count: personMap[record.finder1Name].count + 1,
						}
					: { name: record.finder1Name, profit, count: 1 };
				total += profit;
			}

			if (record.finder2Name && record.finder2RevenueUSD) {
				const profit = record.finder2RevenueUSD || 0;

				personMap[record.finder2Name] = personMap[record.finder2Name]
					? {
							name: record.finder2Name,
							profit:
								personMap[record.finder2Name].profit + profit,
							count: personMap[record.finder2Name].count + 1,
						}
					: { name: record.finder2Name, profit, count: 1 };
				total += profit;
			}
		}
	}

	const persons = Object.values(personMap).sort(
		(a, b) => b.profit - a.profit,
	);

	return { persons, total };
}

// 統計所有客戶的分潤金額與佔比
export function aggregateCustomerProfits(data: ProfitSharingRecord[]) {
	const customerMap: Record<
		string,
		{ name: string; profit: number; count: number; code: string }
	> = {};
	let total = 0;

	for (const record of data) {
		const customerName = record.customerName || "未知客戶";
		const customerCode = record.customerCode || "";
		const profit = record.companyRevenueOriginal || 0;

		customerMap[customerName] = customerMap[customerName]
			? {
					name: customerName,
					profit: customerMap[customerName].profit + profit,
					count: customerMap[customerName].count + 1,
					code: customerCode,
				}
			: { name: customerName, profit, count: 1, code: customerCode };
		total += profit;
	}

	const customers = Object.values(customerMap).sort(
		(a, b) => b.profit - a.profit,
	);

	return { customers, total };
}

// 計算所有統計數據
export function calculateProfitStats(data: ProfitSharingRecord[]) {
	const stats = {
		totalShareable: 0,
		totalCompanyProfit: 0,
		totalRMProfit: 0,
		totalFinderProfit: 0,
		// 各幣別的 Company 分潤統計
		companyProfitByCurrency: {} as Record<
			string,
			{ amount: number; count: number; totalUSD: number }
		>,
		// 各幣別的 Shareable 統計
		shareableByCurrency: {} as Record<
			string,
			{ amount: number; count: number; totalUSD: number }
		>,
	};

	data.forEach((record) => {
		// 將原幣金額轉換為美元
		const fxRate = record.fxRate || 1;

		// Shareable 總計（原幣轉美元）
		stats.totalShareable += (record.shareable || 0) * fxRate;

		// Company分潤總計（原幣轉美元）
		stats.totalCompanyProfit +=
			(record.companyRevenueOriginal || 0) * fxRate;

		// RM分潤總計（美金）
		stats.totalRMProfit += record.rmRevenueUSD || 0;

		// Finder分潤總計（美金）
		stats.totalFinderProfit +=
			(record.finder1RevenueUSD || 0) + (record.finder2RevenueUSD || 0);

		// 統計各幣別的 Company 分潤
		const currency = record.currency || "USD";
		const companyAmount = record.companyRevenueOriginal || 0;
		const companyAmountUSD = companyAmount * fxRate;

		if (!stats.companyProfitByCurrency[currency]) {
			stats.companyProfitByCurrency[currency] = {
				amount: 0,
				count: 0,
				totalUSD: 0,
			};
		}
		stats.companyProfitByCurrency[currency].amount += companyAmount;
		stats.companyProfitByCurrency[currency].totalUSD += companyAmountUSD;
		stats.companyProfitByCurrency[currency].count += 1;

		// 統計各幣別的 Shareable
		const shareableAmount = record.shareable || 0;
		const shareableAmountUSD = shareableAmount * fxRate;

		if (!stats.shareableByCurrency[currency]) {
			stats.shareableByCurrency[currency] = {
				amount: 0,
				count: 0,
				totalUSD: 0,
			};
		}
		stats.shareableByCurrency[currency].amount += shareableAmount;
		stats.shareableByCurrency[currency].totalUSD += shareableAmountUSD;
		stats.shareableByCurrency[currency].count += 1;
	});

	return stats;
}

// 類型定義
export interface PersonProfit {
	name: string;
	profit: number;
	count: number;
}

export interface CustomerProfit {
	name: string;
	profit: number;
	count: number;
	code: string;
}

export interface CurrencyStats {
	amount: number;
	count: number;
	totalUSD: number;
}

export interface ProfitStats {
	totalShareable: number;
	totalCompanyProfit: number;
	totalRMProfit: number;
	totalFinderProfit: number;
	companyProfitByCurrency: Record<string, CurrencyStats>;
	shareableByCurrency: Record<string, CurrencyStats>;
}

export interface PersonStats {
	persons: PersonProfit[];
	total: number;
}

export interface CustomerStats {
	customers: CustomerProfit[];
	total: number;
}
