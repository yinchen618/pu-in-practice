import { db } from "../client";

export interface CreateProfitSharingData {
	customerId: string;
	productId: string;
	amount: number;
	profitDate: Date;
	currency: string;
	companyRevenue: number;
	directTradeBookingFee: number;
	bankRetroPercent: number;
	shareable: number;

	// 新的分潤比例欄位
	companyRevenuePercent?: number;
	companyFeePercent?: number;

	// RM1 資訊
	rm1Id?: string;
	rm1Name?: string;
	rm1ProfitSharePercent?: number;
	rm1RevenuePercent?: number;
	rm1FeePercent?: number;

	// RM2 資訊
	rm2Id?: string;
	rm2Name?: string;
	rm2ProfitSharePercent?: number;
	rm2RevenuePercent?: number;
	rm2FeePercent?: number;

	// Finder1 資訊
	finder1Id?: string;
	finder1Name?: string;
	finder1ProfitSharePercent?: number;
	finder1RevenuePercent?: number;
	finder1FeePercent?: number;

	// Finder2 資訊
	finder2Id?: string;
	finder2Name?: string;
	finder2ProfitSharePercent?: number;
	finder2RevenuePercent?: number;
	finder2FeePercent?: number;

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
	bankRetroPercent?: number;
	shareable?: number;

	// 新的分潤比例欄位
	companyRevenuePercent?: number;
	companyFeePercent?: number;

	// RM1 資訊
	rm1Id?: string;
	rm1Name?: string;
	rm1ProfitSharePercent?: number;
	rm1RevenuePercent?: number;
	rm1FeePercent?: number;

	// RM2 資訊
	rm2Id?: string;
	rm2Name?: string;
	rm2ProfitSharePercent?: number;
	rm2RevenuePercent?: number;
	rm2FeePercent?: number;

	// Finder1 資訊
	finder1Id?: string;
	finder1Name?: string;
	finder1ProfitSharePercent?: number;
	finder1RevenuePercent?: number;
	finder1FeePercent?: number;

	// Finder2 資訊
	finder2Id?: string;
	finder2Name?: string;
	finder2ProfitSharePercent?: number;
	finder2RevenuePercent?: number;
	finder2FeePercent?: number;

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

	// 新的分潤計算邏輯
	// 分潤金額 = Company Revenue + Direct Trade Booking Fee × Bank Retro(%)
	const shareable = companyRevenue + (directTradeBookingFee * bankRetroPercent) / 100;

	// 使用新的 Revenue % 和 Fee % 欄位計算每個人的分潤
	const calculatePersonAmount = (revenuePercent: number, feePercent: number) => {
		// Revenue 部分: Company Revenue × Revenue Percentage
		const revenueAmount = (companyRevenue * revenuePercent) / 100;
		// Fee 部分: Direct Trade Booking Fee × Bank Retro(%) × Fee Percentage
		const feeAmount = (directTradeBookingFee * bankRetroPercent * feePercent) / 10000;
		return revenueAmount + feeAmount;
	};

	// 計算每個人的分潤金額
	const companyRevenuePercent = Number(data.companyRevenuePercent) || 0;
	const companyFeePercent = Number(data.companyFeePercent) || 0;
	const companyTotal = calculatePersonAmount(companyRevenuePercent, companyFeePercent);

	const rm1RevenuePercent = Number(data.rm1RevenuePercent) || 0;
	const rm1FeePercent = Number(data.rm1FeePercent) || 0;
	const rm1Total = calculatePersonAmount(rm1RevenuePercent, rm1FeePercent);

	const rm2RevenuePercent = Number(data.rm2RevenuePercent) || 0;
	const rm2FeePercent = Number(data.rm2FeePercent) || 0;
	const rm2Total = calculatePersonAmount(rm2RevenuePercent, rm2FeePercent);

	const finder1RevenuePercent = Number(data.finder1RevenuePercent) || 0;
	const finder1FeePercent = Number(data.finder1FeePercent) || 0;
	const finder1Total = calculatePersonAmount(finder1RevenuePercent, finder1FeePercent);

	const finder2RevenuePercent = Number(data.finder2RevenuePercent) || 0;
	const finder2FeePercent = Number(data.finder2FeePercent) || 0;
	const finder2Total = calculatePersonAmount(finder2RevenuePercent, finder2FeePercent);

	// 計算總分潤金額（用於向後相容）
	const rmTotal = rm1Total + rm2Total;
	const findersTotal = finder1Total + finder2Total;

	return {
		shareable: Number(shareable.toFixed(2)),
		
		// 總分潤金額（向後相容）
		rmRevenueOriginal: Number(rmTotal.toFixed(2)),
		findersRevenueOriginal: Number(findersTotal.toFixed(2)),
		companyRevenueOriginal: Number(companyTotal.toFixed(2)),
		rmRevenueUSD: Number((rmTotal * fxRate).toFixed(2)),
		findersRevenueUSD: Number((findersTotal * fxRate).toFixed(2)),

		// 個人分潤金額
		rm1RevenueOriginal: Number(rm1Total.toFixed(2)),
		rm1RevenueUSD: Number((rm1Total * fxRate).toFixed(2)),

		rm2RevenueOriginal: Number(rm2Total.toFixed(2)),
		rm2RevenueUSD: Number((rm2Total * fxRate).toFixed(2)),

		finder1RevenueOriginal: Number(finder1Total.toFixed(2)),
		finder1RevenueUSD: Number((finder1Total * fxRate).toFixed(2)),

		finder2RevenueOriginal: Number(finder2Total.toFixed(2)),
		finder2RevenueUSD: Number((finder2Total * fxRate).toFixed(2)),
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
		rm1RevenuePercent: data.rm1RevenuePercent ?? existing.rm1RevenuePercent,
		rm1FeePercent: data.rm1FeePercent ?? existing.rm1FeePercent,

		// RM2 資訊
		rm2Id: data.rm2Id ?? existing.rm2Id,
		rm2Name: data.rm2Name ?? existing.rm2Name,
		rm2ProfitSharePercent:
			data.rm2ProfitSharePercent ?? existing.rm2ProfitSharePercent,
		rm2RevenuePercent: data.rm2RevenuePercent ?? existing.rm2RevenuePercent,
		rm2FeePercent: data.rm2FeePercent ?? existing.rm2FeePercent,

		// Finder1 資訊
		finder1Id: data.finder1Id ?? existing.finder1Id,
		finder1Name: data.finder1Name ?? existing.finder1Name,
		finder1ProfitSharePercent:
			data.finder1ProfitSharePercent ??
			existing.finder1ProfitSharePercent,
		finder1RevenuePercent: data.finder1RevenuePercent ?? existing.finder1RevenuePercent,
		finder1FeePercent: data.finder1FeePercent ?? existing.finder1FeePercent,

		// Finder2 資訊
		finder2Id: data.finder2Id ?? existing.finder2Id,
		finder2Name: data.finder2Name ?? existing.finder2Name,
		finder2ProfitSharePercent:
			data.finder2ProfitSharePercent ??
			existing.finder2ProfitSharePercent,
		finder2RevenuePercent: data.finder2RevenuePercent ?? existing.finder2RevenuePercent,
		finder2FeePercent: data.finder2FeePercent ?? existing.finder2FeePercent,

		// Company 資訊
		companyRevenuePercent: data.companyRevenuePercent ?? existing.companyRevenuePercent,
		companyFeePercent: data.companyFeePercent ?? existing.companyFeePercent,
	};

	const autoFields = calculateAutoFields(mergedData);

	// 準備更新資料，移除不能直接更新的關聯欄位
	const updateData = {
		// 基本欄位
		amount: data.amount,
		profitDate: data.profitDate,
		currency: data.currency,
		companyRevenue: data.companyRevenue,
		directTradeBookingFee: data.directTradeBookingFee,
		bankRetroPercent: data.bankRetroPercent,
		shareable: data.shareable,
		fxRate: data.fxRate,
		bankAccountId: data.bankAccountId,

		// 新的分潤比例欄位
		companyRevenuePercent: data.companyRevenuePercent,
		companyFeePercent: data.companyFeePercent,

		// RM1 資訊
		rm1Id: data.rm1Id,
		rm1Name: data.rm1Name,
		rm1ProfitSharePercent: data.rm1ProfitSharePercent,
		rm1RevenuePercent: data.rm1RevenuePercent,
		rm1FeePercent: data.rm1FeePercent,
		rm1RevenueOriginal: autoFields.rm1RevenueOriginal,
		rm1RevenueUSD: autoFields.rm1RevenueUSD,

		// RM2 資訊
		rm2Id: data.rm2Id,
		rm2Name: data.rm2Name,
		rm2ProfitSharePercent: data.rm2ProfitSharePercent,
		rm2RevenuePercent: data.rm2RevenuePercent,
		rm2FeePercent: data.rm2FeePercent,
		rm2RevenueOriginal: autoFields.rm2RevenueOriginal,
		rm2RevenueUSD: autoFields.rm2RevenueUSD,

		// Finder1 資訊
		finder1Id: data.finder1Id,
		finder1Name: data.finder1Name,
		finder1ProfitSharePercent: data.finder1ProfitSharePercent,
		finder1RevenuePercent: data.finder1RevenuePercent,
		finder1FeePercent: data.finder1FeePercent,
		finder1RevenueOriginal: autoFields.finder1RevenueOriginal,
		finder1RevenueUSD: autoFields.finder1RevenueUSD,

		// Finder2 資訊
		finder2Id: data.finder2Id,
		finder2Name: data.finder2Name,
		finder2ProfitSharePercent: data.finder2ProfitSharePercent,
		finder2RevenuePercent: data.finder2RevenuePercent,
		finder2FeePercent: data.finder2FeePercent,
		finder2RevenueOriginal: autoFields.finder2RevenueOriginal,
		finder2RevenueUSD: autoFields.finder2RevenueUSD,

		// 總分潤比例
		rmProfitSharePercent: data.rmProfitSharePercent,
		finderProfitSharePercent: data.finderProfitSharePercent,
		companyProfitSharePercent: data.companyProfitSharePercent,

		// 自動計算的總分潤金額
		rmRevenueOriginal: autoFields.rmRevenueOriginal,
		findersRevenueOriginal: autoFields.findersRevenueOriginal,
		companyRevenueOriginal: autoFields.companyRevenueOriginal,
		rmRevenueUSD: autoFields.rmRevenueUSD,
		findersRevenueUSD: autoFields.findersRevenueUSD,
	};

	// 移除 undefined 值
	const cleanUpdateData = Object.fromEntries(
		Object.entries(updateData).filter(([_, value]) => value !== undefined)
	);

	return await db.profitSharing.update({
		where: { id },
		data: cleanUpdateData,
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
