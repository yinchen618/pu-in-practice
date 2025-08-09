import { getAnomalyEventStats } from "@repo/database";
import { Hono } from "hono";
import { validator } from "hono-openapi/zod";
import { z } from "zod";
import { authMiddleware } from "../../middleware/auth";
import { verifyOrganizationMembership } from "./lib/membership";

export const anomalyStatsRouter = new Hono()
	.use(authMiddleware)
	.get(
		"/anomaly-stats",
		validator("query", z.object({ organizationId: z.string() })),
		async (c) => {
			const { organizationId } = c.req.valid("query");
			const user = c.get("user");

			await verifyOrganizationMembership(organizationId, user.id);

			const stats = await getAnomalyEventStats(organizationId);

			// 計算額外的統計資訊
			const avgScore = 0; // 需要從資料庫計算
			const maxScore = 0; // 需要從資料庫計算
			const uniqueMeters = 0; // 需要從資料庫計算

			const enhancedStats = {
				...stats,
				avgScore,
				maxScore,
				uniqueMeters,
			};

			return c.json({
				success: true,
				data: enhancedStats,
				message: "成功獲取異常事件統計",
			});
		},
	);
