import { z } from "zod";

// 共用的 Schema 定義
export const profitSharingFormSchema = z.object({
	customerId: z.string().min(1, "客戶是必填的"),
	productId: z.string().min(1, "產品是必填的"),
	bankAccountId: z.string().min(1, "銀行帳戶是必填的"),
	amount: z.number().min(0, "金額不能為負數"),
	profitDate: z.string().min(1, "分潤日期是必填的"),
	currency: z.string().min(1, "幣別是必填的"),
	companyRevenue: z.number().min(0, "Company revenue 不能為負數"),
	directTradeBookingFee: z
		.number()
		.min(0, "Direct trade booking fee 不能為負數"),
	bankRetroPercent: z.number().min(0).max(100),

	// 自動計算欄位
	shareable: z.number().min(0),
	rmProfitSharePercent: z.number().min(0).max(100),
	finderProfitSharePercent: z.number().min(0).max(100),
	companyProfitSharePercent: z.number().min(0).max(100),

	// RM1 資訊
	rm1Id: z.string().optional(),
	rm1Name: z.string().optional(),
	rm1ProfitSharePercent: z.number().min(0).max(100).optional(),
	rm1RevenueOriginal: z.number().min(0).optional(),
	rm1RevenueUSD: z.number().min(0).optional(),

	// RM2 資訊
	rm2Id: z.string().optional(),
	rm2Name: z.string().optional(),
	rm2ProfitSharePercent: z.number().min(0).max(100).optional(),
	rm2RevenueOriginal: z.number().min(0).optional(),
	rm2RevenueUSD: z.number().min(0).optional(),

	// Finder1 資訊
	finder1Id: z.string().optional(),
	finder1Name: z.string().optional(),
	finder1ProfitSharePercent: z.number().min(0).max(100).optional(),
	finder1RevenueOriginal: z.number().min(0).optional(),
	finder1RevenueUSD: z.number().min(0).optional(),

	// Finder2 資訊
	finder2Id: z.string().optional(),
	finder2Name: z.string().optional(),
	finder2ProfitSharePercent: z.number().min(0).max(100).optional(),
	finder2RevenueOriginal: z.number().min(0).optional(),
	finder2RevenueUSD: z.number().min(0).optional(),

	// 原幣金額
	rmRevenueOriginal: z.number().min(0),
	findersRevenueOriginal: z.number().min(0),
	companyRevenueOriginal: z.number().min(0),

	// 美金金額
	rmRevenueUSD: z.number().min(0),
	findersRevenueUSD: z.number().min(0),

	// 匯率
	fxRate: z.number().min(0, "FX Rate 不能為負數"),
});

export type ProfitSharingFormData = z.infer<typeof profitSharingFormSchema>;

// 共用的介面定義
export interface Customer {
	id: string;
	name: string;
	code: string;
}

export interface RelationshipManager {
	id: string;
	name: string;
}

export interface Product {
	id: string;
	name: string;
	code: string;
	category: string;
}

export interface BankAccount {
	id: string;
	bankName: string;
	accountName: string;
	accountNumber: string;
	currency: string;
	status: string;
}

// 共用的 Props 介面
export interface BaseProfitSharingDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizationId: string;
	onSuccess?: () => void;
}
