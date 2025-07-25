import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator } from "hono-openapi/zod";
import { z } from "zod";

export const exchangeRateRouter = new Hono()
	.basePath("/exchange-rate")
	.get(
		"/",
		validator(
			"query",
			z.object({
				date: z.string(),
				to: z.string().optional().default("SGD"), // 預設為 SGD
			}),
		),
		describeRoute({
			summary: "Get exchange rate for a specific date",
			tags: ["Exchange Rate"],
			description:
				"Fetch historical exchange rate between two currencies for a given date",
			responses: {
				200: {
					description: "Exchange rate data",
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									rates: {
										type: "object",
										additionalProperties: {
											type: "number",
										},
									},
									date: { type: "string" },
								},
							},
						},
					},
				},
				400: {
					description: "Bad request",
				},
				404: {
					description: "Exchange rate not found",
				},
				500: {
					description: "Internal server error",
				},
			},
		}),
		async (c) => {
			try {
				const { date, to } = c.req.valid("query");

				// 只返回我們需要的幣別匯率
				const neededCurrencies = [
					"TWD", // 新台幣
					"USD", // 美元
					"CNY", // 人民幣
					"HKD", // 港幣
					"JPY", // 日圓
					"EUR", // 歐元
					"GBP", // 英鎊
					"AUD", // 澳幣
					"SGD", // 新加坡幣
					"CHF", // 瑞士法郎
				];
				const rates: Record<string, number> = {};

				// 根據 to 參數選擇 base 幣別
				const baseCurrency = to.toUpperCase();

				// 構建 API URL
				const apiUrl = `https://${date}.currency-api.pages.dev/v1/currencies/${baseCurrency.toLowerCase()}.json`;
				console.log("apiUrl", apiUrl);
				let response = await fetch(apiUrl);

				if (!response.ok) {
					// 嘗試抓前一天的資料
					const prevDate = new Date(date);
					prevDate.setDate(prevDate.getDate() - 1);
					const prevDateStr = prevDate.toISOString().slice(0, 10);
					const prevApiUrl = `https://${prevDateStr}.currency-api.pages.dev/v1/currencies/${baseCurrency.toLowerCase()}.json`;
					response = await fetch(prevApiUrl);
					if (!response.ok) {
						throw new Error(
							`Exchange rate API error: ${response.status} and previous day ${response.status}`,
						);
					}
					// 用前一天的 response
					// return prevResponse;
				}

				const data = await response.json();

				neededCurrencies.forEach((currency) => {
					if (currency === baseCurrency) {
						// 相同幣別的匯率固定為 1
						rates[currency] = 1;
					} else {
						// 從 API 獲取其他幣別對 base 幣別的匯率
						const rate =
							data[baseCurrency.toLowerCase()]?.[
								currency.toLowerCase()
							];
						if (rate) {
							rates[currency] = rate;
						}
					}
				});

				return c.json({
					rates,
					date: data.date,
				});
			} catch (error) {
				console.error("Exchange rate API error:", error);
				return c.json({ error: "Failed to fetch exchange rates" }, 500);
			}
		},
	)
	.get(
		"/usd",
		validator(
			"query",
			z.object({
				date: z.string(),
			}),
		),
		describeRoute({
			summary: "Get USD-based exchange rates",
			tags: ["Exchange Rate"],
			description:
				"Fetch exchange rates relative to USD for a given date",
			responses: {
				200: {
					description: "USD-based exchange rate data",
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									rates: {
										type: "object",
										additionalProperties: {
											type: "number",
										},
									},
									date: { type: "string" },
								},
							},
						},
					},
				},
				400: {
					description: "Bad request",
				},
				404: {
					description: "Exchange rate not found",
				},
				500: {
					description: "Internal server error",
				},
			},
		}),
		async (c) => {
			try {
				const { date } = c.req.valid("query");

				// 只返回我們需要的幣別匯率
				const neededCurrencies = [
					"TWD", // 新台幣
					"USD", // 美元
					"CNY", // 人民幣
					"HKD", // 港幣
					"JPY", // 日圓
					"EUR", // 歐元
					"GBP", // 英鎊
					"AUD", // 澳幣
					"SGD", // 新加坡幣
					"CHF", // 瑞士法郎
				];
				const rates: Record<string, number> = {};

				// 使用 USD 作為 base 幣別
				const apiUrl = `https://${date}.currency-api.pages.dev/v1/currencies/usd.json`;
				console.log("apiUrl", apiUrl);
				let response = await fetch(apiUrl);

				if (!response.ok) {
					// 嘗試抓前一天的資料
					const prevDate = new Date(date);
					prevDate.setDate(prevDate.getDate() - 1);
					const prevDateStr = prevDate.toISOString().slice(0, 10);
					const prevApiUrl = `https://${prevDateStr}.currency-api.pages.dev/v1/currencies/usd.json`;
					response = await fetch(prevApiUrl);
					if (!response.ok) {
						throw new Error(
							`Exchange rate API error: ${response.status} and previous day ${response.status}`,
						);
					}
				}

				const data = await response.json();

				neededCurrencies.forEach((currency) => {
					if (currency === "USD") {
						// USD 對 USD 的匯率固定為 1
						rates[currency] = 1;
					} else {
						// 從 API 獲取其他幣別對 USD 的匯率
						const rate = data.usd?.[currency.toLowerCase()];
						if (rate) {
							// 取倒數：如果 1 USD = 1.35 SGD，則 1 SGD = 1/1.35 USD
							rates[currency] = 1 / rate;
						}
					}
				});

				return c.json({
					rates,
					date: data.date,
				});
			} catch (error) {
				console.error("Exchange rate API error:", error);
				return c.json({ error: "Failed to fetch exchange rates" }, 500);
			}
		},
	);
