import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator } from "hono-openapi/zod";
import { z } from "zod";

export const exchangeRateRouter = new Hono().basePath("/exchange-rate").get(
	"/",
	validator(
		"query",
		z.object({
			date: z.string(),
			// from: z.string(),
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
								rates: {
									type: "object",
									additionalProperties: { type: "number" },
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

			// 如果是同一幣別，直接返回1
			const apiUrl = `https://${date}.currency-api.pages.dev/v1/currencies/sgd.json`;

			const response = await fetch(apiUrl);

			if (!response.ok) {
				throw new Error(`Exchange rate API error: ${response.status}`);
			}

			const data = await response.json();

			// 只返回我們需要的幣別匯率
			const neededCurrencies = [
				"SGD",
				"HKD",
				"TWD",
				"USD",
				"EUR",
				"JPY",
				"CNY",
			];
			const rates: Record<string, number> = {};

			neededCurrencies.forEach((currency) => {
				if (currency === "SGD") {
					rates[currency] = 1;
				} else {
					// API返回的是SGD對其他貨幣的匯率，我們需要的是其他貨幣對SGD的匯率
					// 所以需要取倒數
					const rate = data.sgd[currency.toLowerCase()];
					if (rate) {
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
