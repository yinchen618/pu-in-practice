export const CURRENCY_OPTIONS = [
	{ value: "TWD", label: "新台幣 (TWD)" },
	{ value: "USD", label: "美元 (USD)" },
	{ value: "CNY", label: "人民幣 (CNY)" },
	{ value: "HKD", label: "港幣 (HKD)" },
	{ value: "JPY", label: "日圓 (JPY)" },
	{ value: "EUR", label: "歐元 (EUR)" },
	{ value: "GBP", label: "英鎊 (GBP)" },
	{ value: "AUD", label: "澳幣 (AUD)" },
	{ value: "SGD", label: "新加坡幣 (SGD)" },
	{ value: "CHF", label: "瑞士法郎 (CHF)" },
] as const;

export const DISTRIBUTION_TYPE_OPTIONS = [
	{ value: "IRREGULAR", label: "不固定" },
	{ value: "MONTHLY", label: "每月配息" },
	{ value: "NONE", label: "無固定配息" },
	{ value: "ACCUMULATE", label: "每月累積" },
	{ value: "REBATE", label: "基金管理費退佣" },
] as const;

export const PRODUCT_CATEGORIES = [
	{ value: "AQ", label: "AQ" },
	{ value: "Bond", label: "債券" },
	{ value: "DCI", label: "DCI" },
	{ value: "EQ", label: "股票" },
	{ value: "FCN", label: "FCN" },
	{ value: "Fund", label: "基金" },
	{ value: "FX", label: "外匯" },
] as const;

export const PRODUCT_STATUSES = [
	{ value: "active", label: "銷售中" },
	{ value: "inactive", label: "已下架" },
] as const;

export type Currency = (typeof CURRENCY_OPTIONS)[number]["value"];
export type DistributionType =
	(typeof DISTRIBUTION_TYPE_OPTIONS)[number]["value"];
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]["value"];
export type ProductStatus = (typeof PRODUCT_STATUSES)[number]["value"];
