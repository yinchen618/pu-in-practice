import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator } from "hono-openapi/zod";
import { z } from "zod";

const API_KEY = "569cbed721e106b81754edc9";
const BASE_URL = "https://v6.exchangerate-api.com/v6";

export const exchangeRateRouter = new Hono().basePath("/exchange-rate").get(
	"/",
	validator(
		"query",
		z.object({
			date: z.string(),
			from: z.string(),
			to: z.string().optional().default("SGD"),
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
								rate: { type: "number" },
								date: { type: "string" },
								from: { type: "string" },
								to: { type: "string" },
								base_code: { type: "string" },
								time_last_update_utc: { type: "string" },
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
			const {
				date,
				from: fromCurrency,
				to: toCurrency,
			} = c.req.valid("query");

			// 如果是同一幣別，直接返回1
			if (fromCurrency === toCurrency) {
				return c.json({
					rate: 1,
					date: date,
					from: fromCurrency,
					to: toCurrency,
				});
			}

			// 解析日期為年、月、日
			const dateObj = new Date(date);
			const year = dateObj.getFullYear();
			const month = dateObj.getMonth() + 1; // getMonth() 返回 0-11
			const day = dateObj.getDate();

			// 使用歷史匯率 API，格式：/v6/YOUR-API-KEY/history/USD/YEAR/MONTH/DAY
			// https://www.exchangerate-api.com/#pricing 歷史查詢要付費
			const apiUrl = `${BASE_URL}/${API_KEY}/history/${fromCurrency}/${year}/${month}/${day}`;

			console.log("apiUrl", apiUrl);
			const response = await fetch(apiUrl);

			if (!response.ok) {
				throw new Error(`Exchange rate API error: ${response.status}`);
			}

			const data = await response.json();

			if (data.result !== "success") {
				throw new Error(data["error-type"] || "Unknown API error");
			}

			// 獲取目標幣別的匯率
			const rate = data.conversion_rates?.[toCurrency];

			if (rate === undefined) {
				return c.json(
					{ error: `Exchange rate not found for ${toCurrency}` },
					404,
				);
			}

			return c.json({
				rate: rate,
				date: date,
				from: fromCurrency,
				to: toCurrency,
				base_code: data.base_code,
				time_last_update_utc: data.time_last_update_utc,
			});
		} catch (error) {
			console.error("Exchange rate API error:", error);
			return c.json({ error: "Failed to fetch exchange rate" }, 500);
		}
	},
);
