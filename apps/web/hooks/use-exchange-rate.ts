import { useCallback, useEffect, useState } from "react";

interface ExchangeRateData {
	rates: Record<string, number>;
	date: string;
}

interface UseExchangeRateOptions {
	date: string;
	enabled?: boolean;
	useUsdRates?: boolean; // 新增參數，指定是否使用 USD 匯率
}

export function useExchangeRate({
	date,
	enabled = true,
	useUsdRates = false, // 預設使用 SGD 匯率
}: UseExchangeRateOptions) {
	const [data, setData] = useState<ExchangeRateData | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchExchangeRates = useCallback(async () => {
		if (!date) {
			return;
		}

		setLoading(true);
		setError(null);

		try {
			const params = new URLSearchParams({
				date,
			});

			// 根據 useUsdRates 參數選擇不同的端點
			const endpoint = useUsdRates ? "/usd" : "/";
			const response = await fetch(
				`/api/exchange-rate${endpoint}?${params}`,
			);

			if (!response.ok) {
				let errorMessage = "獲取匯率失敗";
				try {
					const responseText = await response.text();
					try {
						const error = JSON.parse(responseText);
						errorMessage = error.message || errorMessage;
					} catch {
						errorMessage = responseText || errorMessage;
					}
				} catch {
					errorMessage = "獲取匯率失敗";
				}
				throw new Error(errorMessage);
			}

			const result = await response.json();
			setData(result);
			setError(null);
		} catch (error) {
			console.error("匯率API錯誤:", error);
			setError(error instanceof Error ? error.message : "獲取匯率失敗");
		} finally {
			setLoading(false);
		}
	}, [date, useUsdRates]);

	useEffect(() => {
		if (!enabled) {
			return;
		}

		fetchExchangeRates();
	}, [date, enabled, fetchExchangeRates]);

	return {
		data,
		loading,
		error,
		refetch: fetchExchangeRates,
	};
}
