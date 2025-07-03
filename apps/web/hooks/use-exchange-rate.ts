import { useEffect, useState } from "react";

interface ExchangeRateData {
	rates: Record<string, number>;
	date: string;
}

interface UseExchangeRateOptions {
	date: string;
	enabled?: boolean;
}

export function useExchangeRate({
	date,
	enabled = true,
}: UseExchangeRateOptions) {
	const [data, setData] = useState<ExchangeRateData | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!enabled || !date) {
			return;
		}

		let isCancelled = false;

		const fetchExchangeRates = async () => {
			setLoading(true);
			setError(null);

			try {
				const params = new URLSearchParams({
					date,
				});

				const response = await fetch(`/api/exchange-rate/?${params}`);

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

				if (!isCancelled) {
					setData(result);
					setError(null);
				}
			} catch (error) {
				if (!isCancelled) {
					console.error("匯率API錯誤:", error);
					setError(
						error instanceof Error ? error.message : "獲取匯率失敗",
					);
				}
			} finally {
				if (!isCancelled) {
					setLoading(false);
				}
			}
		};

		fetchExchangeRates();

		return () => {
			isCancelled = true;
		};
	}, [date, enabled]);

	return {
		data,
		loading,
		error,
	};
}
