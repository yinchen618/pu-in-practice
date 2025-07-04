import { db } from "../client";

export interface CreateProfitSharingData {
	customerId: string;
	productId: string;
	amount: number;
	profitDate: Date;
	currency: string;
	companyRevenue: number;
	directTradeBookingFee: number;
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
	const rmPercent = Number(data.rmProfitSharePercent) || 50;
	const finderPercent = Number(data.finderProfitSharePercent) || 0;
	const companyPercent = Number(data.companyProfitSharePercent) || 50;
	const fxRate = Number(data.fxRate) || 1;

	// 計算 shareable
	const shareable = companyRevenue + directTradeBookingFee;

	// 計算各分潤金額 (原幣)
	const rmRevenueOriginal = (shareable * rmPercent) / 100;
	const findersRevenueOriginal = (shareable * finderPercent) / 100;
	const companyRevenueOriginal = (shareable * companyPercent) / 100;

	// 計算 USD 金額
	const rmRevenueUSD = rmRevenueOriginal * fxRate;
	const findersRevenueUSD = findersRevenueOriginal * fxRate;

	return {
		shareable: Number(shareable.toFixed(2)),
		rmRevenueOriginal: Number(rmRevenueOriginal.toFixed(2)),
		findersRevenueOriginal: Number(findersRevenueOriginal.toFixed(2)),
		companyRevenueOriginal: Number(companyRevenueOriginal.toFixed(2)),
		rmRevenueUSD: Number(rmRevenueUSD.toFixed(2)),
		findersRevenueUSD: Number(findersRevenueUSD.toFixed(2)),
	};
}

export async function createProfitSharing(data: CreateProfitSharingData) {
	const autoFields = calculateAutoFields(data);

	return await db.profitSharing.create({
		data: {
			...data,
			...autoFields,
		},
		include: {
			customer: true,
			product: true,
		},
	});
}

export async function getProfitSharingByOrganizationId(organizationId: string) {
	return await db.profitSharing.findMany({
		where: { organizationId },
		include: {
			customer: true,
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
	};

	const autoFields = calculateAutoFields(mergedData);

	return await db.profitSharing.update({
		where: { id },
		data: {
			...data,
			...autoFields,
		},
		include: {
			customer: true,
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
			customer: true,
			product: true,
		},
	});
}
