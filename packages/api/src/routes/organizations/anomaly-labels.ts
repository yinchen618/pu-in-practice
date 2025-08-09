import {
	checkAnomalyLabelNameExists,
	createAnomalyLabel,
	deleteAnomalyLabel,
	getAnomalyLabelById,
	getAnomalyLabelsByOrganizationId,
	updateAnomalyLabel,
} from "@repo/database";
import { Hono } from "hono";
import { validator } from "hono-openapi/zod";
import { z } from "zod";
import { authMiddleware } from "../../middleware/auth";
import { verifyOrganizationMembership } from "./lib/membership";

const CreateLabelSchema = z.object({
	name: z.string().min(1, "標籤名稱是必填的"),
	description: z.string().optional(),
	organizationId: z.string().min(1, "組織ID是必填的"),
});

const UpdateLabelSchema = z.object({
	name: z.string().min(1, "標籤名稱是必填的").optional(),
	description: z.string().optional(),
});

export const anomalyLabelsRouter = new Hono()
	.use(authMiddleware)
	.get(
		"/anomaly-labels",
		validator("query", z.object({ organizationId: z.string() })),
		async (c) => {
			const { organizationId } = c.req.valid("query");
			const user = c.get("user");

			await verifyOrganizationMembership(organizationId, user.id);

			const labels =
				await getAnomalyLabelsByOrganizationId(organizationId);

			return c.json({
				success: true,
				data: labels,
				message: `成功獲取 ${labels.length} 個異常標籤`,
			});
		},
	)
	.get(
		"/anomaly-labels/:id",
		validator("param", z.object({ id: z.string() })),
		async (c) => {
			const { id } = c.req.valid("param");
			const user = c.get("user");

			const label = await getAnomalyLabelById(id);
			if (!label) {
				return c.json(
					{
						success: false,
						message: "異常標籤不存在",
					},
					404,
				);
			}

			await verifyOrganizationMembership(label.organizationId, user.id);

			return c.json({
				success: true,
				data: label,
				message: "成功獲取異常標籤詳情",
			});
		},
	)
	.post(
		"/anomaly-labels",
		validator("json", CreateLabelSchema),
		async (c) => {
			const data = c.req.valid("json");
			const user = c.get("user");

			await verifyOrganizationMembership(data.organizationId, user.id);

			// 檢查標籤名稱是否重複
			const nameExists = await checkAnomalyLabelNameExists(
				data.organizationId,
				data.name,
			);
			if (nameExists) {
				return c.json(
					{
						success: false,
						message: "標籤名稱已存在",
					},
					400,
				);
			}

			const result = await createAnomalyLabel(data);
			return c.json(
				{
					success: true,
					data: result,
					message: "成功創建異常標籤",
				},
				201,
			);
		},
	)
	.put(
		"/anomaly-labels/:id",
		validator("param", z.object({ id: z.string() })),
		validator("json", UpdateLabelSchema),
		async (c) => {
			const { id } = c.req.valid("param");
			const data = c.req.valid("json");
			const user = c.get("user");

			const existingLabel = await getAnomalyLabelById(id);
			if (!existingLabel) {
				return c.json(
					{
						success: false,
						message: "異常標籤不存在",
					},
					404,
				);
			}

			await verifyOrganizationMembership(
				existingLabel.organizationId,
				user.id,
			);

			// 如果要更新名稱，檢查是否重複
			if (data.name && data.name !== existingLabel.name) {
				const nameExists = await checkAnomalyLabelNameExists(
					existingLabel.organizationId,
					data.name,
					id,
				);
				if (nameExists) {
					return c.json(
						{
							success: false,
							message: "標籤名稱已存在",
						},
						400,
					);
				}
			}

			const result = await updateAnomalyLabel(id, data);
			return c.json({
				success: true,
				data: result,
				message: "成功更新異常標籤",
			});
		},
	)
	.delete(
		"/anomaly-labels/:id",
		validator("param", z.object({ id: z.string() })),
		async (c) => {
			const { id } = c.req.valid("param");
			const user = c.get("user");

			const existingLabel = await getAnomalyLabelById(id);
			if (!existingLabel) {
				return c.json(
					{
						success: false,
						message: "異常標籤不存在",
					},
					404,
				);
			}

			await verifyOrganizationMembership(
				existingLabel.organizationId,
				user.id,
			);

			await deleteAnomalyLabel(id);
			return c.json({
				success: true,
				message: "成功刪除異常標籤",
			});
		},
	);
