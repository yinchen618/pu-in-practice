import { db } from "../client";

export interface CreateProfitSharingData {
	customerId: string;
	productId: string;
	amount: number;
	profitDate: Date;
	currency: string;
	companyRevenue: number;
	directTradeBookingFee: number;

	// RM1 資訊
	rm1Id?: string;
	rm1Name?: string;
	rm1ProfitSharePercent?: number;

	// RM2 資訊
	rm2Id?: string;
	rm2Name?: string;
	rm2ProfitSharePercent?: number;

	// Finder1 資訊
	finder1Id?: string;
	finder1Name?: string;
	finder1ProfitSharePercent?: number;

	// Finder2 資訊
	finder2Id?: string;
	finder2Name?: string;
	finder2ProfitSharePercent?: number;

	// 總分潤比例
	rmProfitSharePercent: number;
	finderProfitSharePercent: number;
	companyProfitSharePercent: number;

	fxRate: number;
	organizationId: string;
	bankAccountId?: string;
}

export interface UpdateProfitSharingData {
	customerId?: string;
	productId?: string;
	amount?: number;
	profitDate?: Date;
	currency?: string;
	companyRevenue?: number;
	directTradeBookingFee?: number;

	// RM1 資訊
	rm1Id?: string;
	rm1Name?: string;
	rm1ProfitSharePercent?: number;

	// RM2 資訊
	rm2Id?: string;
	rm2Name?: string;
	rm2ProfitSharePercent?: number;

	// Finder1 資訊
	finder1Id?: string;
	finder1Name?: string;
	finder1ProfitSharePercent?: number;

	// Finder2 資訊
	finder2Id?: string;
	finder2Name?: string;
	finder2ProfitSharePercent?: number;

	// 總分潤比例
	rmProfitSharePercent?: number;
	finderProfitSharePercent?: number;
	companyProfitSharePercent?: number;

	fxRate?: number;
	bankAccountId?: string;
}

// 計算自動欄位的輔助函數
function calculateAutoFields(
	data: any, // 使用 any 類型以支援 Prisma 的 Decimal 類型
) {
	const companyRevenue = Number(data.companyRevenue) || 0;
	const directTradeBookingFee = Number(data.directTradeBookingFee) || 0;
	const bankRetroPercent = Number(data.bankRetroPercent) || 50;
	const fxRate = Number(data.fxRate) || 1;

	// 計算總分潤金額的新邏輯
	// 可分潤金額1 = Company Revenue - Direct Trade Booking Fee
	const shareable1 = companyRevenue - directTradeBookingFee;
	// 可分潤金額2 = Direct Trade Booking Fee * Bank Retro(%)
	const shareable2 = (directTradeBookingFee * bankRetroPercent) / 100;
	// 總分潤金額 = 可分潤金額1 + 可分潤金額2
	const shareable = shareable1 + shareable2;

	// 計算總分潤比例
	const rmPercent = Number(data.rmProfitSharePercent) || 50;
	const finderPercent = Number(data.finderProfitSharePercent) || 0;
	const companyPercent = Number(data.companyProfitSharePercent) || 50;

	// 計算總分潤金額 (原幣)
	const rmRevenueOriginal = (shareable * rmPercent) / 100;
	const findersRevenueOriginal = (shareable * finderPercent) / 100;
	const companyRevenueOriginal = (shareable * companyPercent) / 100;

	// 計算總 USD 金額
	const rmRevenueUSD = rmRevenueOriginal * fxRate;
	const findersRevenueUSD = findersRevenueOriginal * fxRate;

	// 計算 RM1 分潤
	const rm1Percent = Number(data.rm1ProfitSharePercent) || 0;
	const rm1RevenueOriginal =
		rm1Percent > 0 ? (shareable * rm1Percent) / 100 : 0;
	const rm1RevenueUSD = rm1RevenueOriginal * fxRate;

	// 計算 RM2 分潤
	const rm2Percent = Number(data.rm2ProfitSharePercent) || 0;
	const rm2RevenueOriginal =
		rm2Percent > 0 ? (shareable * rm2Percent) / 100 : 0;
	const rm2RevenueUSD = rm2RevenueOriginal * fxRate;

	// 計算 Finder1 分潤
	const finder1Percent = Number(data.finder1ProfitSharePercent) || 0;
	const finder1RevenueOriginal =
		finder1Percent > 0 ? (shareable * finder1Percent) / 100 : 0;
	const finder1RevenueUSD = finder1RevenueOriginal * fxRate;

	// 計算 Finder2 分潤
	const finder2Percent = Number(data.finder2ProfitSharePercent) || 0;
	const finder2RevenueOriginal =
		finder2Percent > 0 ? (shareable * finder2Percent) / 100 : 0;
	const finder2RevenueUSD = finder2RevenueOriginal * fxRate;

	return {
		shareable: Number(shareable.toFixed(2)),
		rmRevenueOriginal: Number(rmRevenueOriginal.toFixed(2)),
		findersRevenueOriginal: Number(findersRevenueOriginal.toFixed(2)),
		companyRevenueOriginal: Number(companyRevenueOriginal.toFixed(2)),
		rmRevenueUSD: Number(rmRevenueUSD.toFixed(2)),
		findersRevenueUSD: Number(findersRevenueUSD.toFixed(2)),

		// RM1 分潤
		rm1RevenueOriginal: Number(rm1RevenueOriginal.toFixed(2)),
		rm1RevenueUSD: Number(rm1RevenueUSD.toFixed(2)),

		// RM2 分潤
		rm2RevenueOriginal: Number(rm2RevenueOriginal.toFixed(2)),
		rm2RevenueUSD: Number(rm2RevenueUSD.toFixed(2)),

		// Finder1 分潤
		finder1RevenueOriginal: Number(finder1RevenueOriginal.toFixed(2)),
		finder1RevenueUSD: Number(finder1RevenueUSD.toFixed(2)),

		// Finder2 分潤
		finder2RevenueOriginal: Number(finder2RevenueOriginal.toFixed(2)),
		finder2RevenueUSD: Number(finder2RevenueUSD.toFixed(2)),
	};
}

export async function createProfitSharing(data: CreateProfitSharingData) {
	// 過濾掉 undefined 欄位
	const filteredData = Object.fromEntries(
		Object.entries(data).filter(([_, v]) => v !== undefined),
	);

	const autoFields = calculateAutoFields(data); // 用原始 data

	// 合併 autoFields（只覆蓋有值的欄位）
	const finalData = { ...filteredData };
	for (const [k, v] of Object.entries(autoFields)) {
		if (v !== undefined) finalData[k] = v;
	}

	return await db.profitSharing.create({
		data: finalData as any,
		include: {
			customer: {
				include: {
					rm1: true,
					rm2: true,
					finder1: true,
					finder2: true,
				},
			},
			product: true,
		},
	});
}

export async function getProfitSharingByOrganizationId(
	organizationId: string,
	customerId?: string,
) {
	return await db.profitSharing.findMany({
		where: {
			organizationId,
			...(customerId ? { customerId } : {}),
		},
		include: {
			customer: {
				include: {
					rm1: true,
					rm2: true,
					finder1: true,
					finder2: true,
				},
			},
			product: true,
		},
		orderBy: { profitDate: "desc" },
	});
}

export async function updateProfitSharing(
	id: string,
	data: UpdateProfitSharingData,
) {
	// 先取得現有資料，用於計算自動欄位
	const existing = await db.profitSharing.findUnique({
		where: { id },
	});

	if (!existing) {
		throw new Error("找不到分潤記錄");
	}

	// 合併現有資料和更新資料
	const mergedData = {
		companyRevenue: data.companyRevenue ?? existing.companyRevenue,
		directTradeBookingFee:
			data.directTradeBookingFee ?? existing.directTradeBookingFee,
		rmProfitSharePercent:
			data.rmProfitSharePercent ?? existing.rmProfitSharePercent,
		finderProfitSharePercent:
			data.finderProfitSharePercent ?? existing.finderProfitSharePercent,
		companyProfitSharePercent:
			data.companyProfitSharePercent ??
			existing.companyProfitSharePercent,
		fxRate: data.fxRate ?? existing.fxRate,

		// RM1 資訊
		rm1Id: data.rm1Id ?? existing.rm1Id,
		rm1Name: data.rm1Name ?? existing.rm1Name,
		rm1ProfitSharePercent:
			data.rm1ProfitSharePercent ?? existing.rm1ProfitSharePercent,

		// RM2 資訊
		rm2Id: data.rm2Id ?? existing.rm2Id,
		rm2Name: data.rm2Name ?? existing.rm2Name,
		rm2ProfitSharePercent:
			data.rm2ProfitSharePercent ?? existing.rm2ProfitSharePercent,

		// Finder1 資訊
		finder1Id: data.finder1Id ?? existing.finder1Id,
		finder1Name: data.finder1Name ?? existing.finder1Name,
		finder1ProfitSharePercent:
			data.finder1ProfitSharePercent ??
			existing.finder1ProfitSharePercent,

		// Finder2 資訊
		finder2Id: data.finder2Id ?? existing.finder2Id,
		finder2Name: data.finder2Name ?? existing.finder2Name,
		finder2ProfitSharePercent:
			data.finder2ProfitSharePercent ??
			existing.finder2ProfitSharePercent,
	};

	const autoFields = calculateAutoFields(mergedData);

	return await db.profitSharing.update({
		where: { id },
		data: {
			...data,
			...autoFields,
		},
		include: {
			customer: {
				include: {
					rm1: true,
					rm2: true,
					finder1: true,
					finder2: true,
				},
			},
			product: true,
		},
	});
}

export async function deleteProfitSharing(id: string) {
	return await db.profitSharing.delete({ where: { id } });
}

export async function getProfitSharingById(id: string) {
	return db.profitSharing.findUnique({
		where: {
			id,
		},
		include: {
			customer: {
				include: {
					rm1: true,
					rm2: true,
					finder1: true,
					finder2: true,
				},
			},
			product: true,
		},
	});
}
