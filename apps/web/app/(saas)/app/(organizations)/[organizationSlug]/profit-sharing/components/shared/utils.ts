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

// 計算總分潤比例 - 改為計算兩個分開的比例總和
export const calculateTotalProfitSharePercent = (
	companyRevenuePercent: number,
	companyFeePercent: number,
	rm1RevenuePercent: number,
	rm1FeePercent: number,
	rm2RevenuePercent: number,
	rm2FeePercent: number,
	finder1RevenuePercent: number,
	finder1FeePercent: number,
	finder2RevenuePercent: number,
	finder2FeePercent: number,
) => {
	const totalRevenuePercent =
		companyRevenuePercent +
		rm1RevenuePercent +
		rm2RevenuePercent +
		finder1RevenuePercent +
		finder2RevenuePercent;

	const totalFeePercent =
		companyFeePercent +
		rm1FeePercent +
		rm2FeePercent +
		finder1FeePercent +
		finder2FeePercent;

	return {
		revenuePercent: totalRevenuePercent,
		feePercent: totalFeePercent,
		total: totalRevenuePercent + totalFeePercent,
	};
};

// 檢查分潤比例是否有效（每個類別的總和為 100%）
export const isValidProfitSharePercent = (
	revenuePercent: number,
	feePercent: number,
) => {
	return (
		Math.abs(revenuePercent - 100) < 0.01 &&
		Math.abs(feePercent - 100) < 0.01
	);
};
