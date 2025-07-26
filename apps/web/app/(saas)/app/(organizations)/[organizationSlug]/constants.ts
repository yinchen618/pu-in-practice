// 為了向後兼容，保留原始常數
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

// 支持多國化的函數版本
export const getCurrencyOptions = (t: (key: string) => string) =>
	[
		{ value: "TWD", label: t("currency.twd") },
		{ value: "USD", label: t("currency.usd") },
		{ value: "CNY", label: t("currency.cny") },
		{ value: "HKD", label: t("currency.hkd") },
		{ value: "JPY", label: t("currency.jpy") },
		{ value: "EUR", label: t("currency.eur") },
		{ value: "GBP", label: t("currency.gbp") },
		{ value: "AUD", label: t("currency.aud") },
		{ value: "SGD", label: t("currency.sgd") },
		{ value: "CHF", label: t("currency.chf") },
	] as const;

export const getDistributionTypeOptions = (t: (key: string) => string) =>
	[
		{ value: "IRREGULAR", label: t("distributionType.irregular") },
		{ value: "MONTHLY", label: t("distributionType.monthly") },
		{ value: "NONE", label: t("distributionType.none") },
		{ value: "ACCUMULATE", label: t("distributionType.accumulate") },
		{ value: "REBATE", label: t("distributionType.rebate") },
	] as const;

export const getProductCategories = (t: (key: string) => string) =>
	[
		{ value: "AQ", label: t("productCategory.aq") },
		{ value: "Bond", label: t("productCategory.bond") },
		{ value: "DCI", label: t("productCategory.dci") },
		{ value: "EQ", label: t("productCategory.eq") },
		{ value: "FCN", label: t("productCategory.fcn") },
		{ value: "Fund", label: t("productCategory.fund") },
		{ value: "FX", label: t("productCategory.fx") },
	] as const;

export const getProductStatuses = (t: (key: string) => string) =>
	[
		{ value: "active", label: t("productStatus.active") },
		{ value: "inactive", label: t("productStatus.inactive") },
	] as const;

export type Currency = (typeof CURRENCY_OPTIONS)[number]["value"];
export type DistributionType =
	(typeof DISTRIBUTION_TYPE_OPTIONS)[number]["value"];
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]["value"];
export type ProductStatus = (typeof PRODUCT_STATUSES)[number]["value"];
