import { getAssetTransactionsByCustomerId } from "@repo/database";
import { Hono } from "hono";
// import { describeRoute } from "hono-openapi"; // 已不再使用
import { validator } from "hono-openapi/zod";
import { z } from "zod";
import { authMiddleware } from "../../middleware/auth";
import { verifyOrganizationMembership } from "./lib/membership";

export const assetSummaryRouter = new Hono().use(authMiddleware).get(
	"/asset-summary",
	validator(
		"query",
		z.object({
			organizationId: z.string(),
			customerId: z.string(),
		}),
	),
	async (c) => {
		const { organizationId, customerId } = c.req.valid("query");
		const user = c.get("user");

		await verifyOrganizationMembership(organizationId, user.id);

		// 只用資產交易計算 inAmount/outAmount/balance
		const transactions = await getAssetTransactionsByCustomerId(customerId);
		const summaryMap = new Map<
			string,
			{ inAmount: number; outAmount: number }
		>();
		for (const tx of transactions) {
			if (!tx.currency) continue;
			const prev = summaryMap.get(tx.currency) || {
				inAmount: 0,
				outAmount: 0,
			};
			if (tx.type === "IN") {
				summaryMap.set(tx.currency, {
					...prev,
					inAmount: prev.inAmount + Number(tx.amount ?? 0),
				});
			} else if (tx.type === "OUT") {
				summaryMap.set(tx.currency, {
					...prev,
					outAmount: prev.outAmount + Number(tx.amount ?? 0),
				});
			}
		}

		const summary = Array.from(summaryMap.entries()).map(
			([currency, { inAmount, outAmount }]) => ({
				currency,
				balance: inAmount - outAmount,
				inAmount,
				outAmount,
			}),
		);
		return c.json({ summary });
	},
);
