// 格式化函數
export const formatCurrency = (value: number, currency: string) => {
	return `${currency} ${value.toLocaleString("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})}`;
};

// 計算分潤金額的函數
export const calculateProfitShare = (
	totalAmount: number,
	profitSharePercent: number,
) => {
	return Math.round(totalAmount * (profitSharePercent / 100) * 100) / 100;
};

// 計算總分潤比例
export const calculateTotalProfitSharePercent = (
	companyPercent: number,
	rm1Percent: number,
	rm2Percent: number,
	finder1Percent: number,
	finder2Percent: number,
) => {
	return (
		companyPercent +
		rm1Percent +
		rm2Percent +
		finder1Percent +
		finder2Percent
	);
};

// 檢查分潤比例是否有效（總和為 100%）
export const isValidProfitSharePercent = (total: number) => {
	return Math.abs(total - 100) < 0.01;
};
