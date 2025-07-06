import {
	createAssetTransaction,
	deleteAssetTransaction,
	getAssetTransactionsByCustomerId,
	updateAssetTransaction,
} from "@repo/database";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator } from "hono-openapi/zod";
import { z } from "zod";
import { authMiddleware } from "../../middleware/auth";

const CreateAssetTransactionSchema = z.object({
	customerId: z.string().min(1, "客戶ID是必填的"),
	date: z.string().transform((str) => new Date(str)),
	currency: z.string().min(1, "幣別是必填的"),
	type: z.enum(["IN", "OUT"], {
		errorMap: () => ({ message: "類型必須是 IN(入金) 或 OUT(出金)" }),
	}),
	amount: z.number().min(0, "金額不能為負數"),
	description: z.string().optional(),
});

const UpdateAssetTransactionSchema =
	CreateAssetTransactionSchema.partial().omit({
		customerId: true,
	});

export const assetTransactionsRouter = new Hono()
	.use(authMiddleware)
	.get(
		"/asset-transactions",
		describeRoute({
			summary: "取得客戶資產交易記錄",
			responses: {
				200: {
					description: "成功取得資產交易記錄",
					content: {
						"application/json": {
							schema: resolver(
								z.object({
									data: z.array(
										z.object({
											id: z.string(),
											customerId: z.string(),
											date: z.string(),
											currency: z.string(),
											type: z.string(),
											amount: z.number(),
											description: z.string().nullable(),
											createdAt: z.string(),
											updatedAt: z.string(),
										}),
									),
								}),
							),
						},
					},
				},
			},
		}),
		validator("query", z.object({ customerId: z.string() })),
		async (c) => {
			const { customerId } = c.req.valid("query");
			const user = c.get("user");

			// 驗證用戶是否為組織成員（通過客戶關聯）
			// 這裡我們需要先獲取客戶信息來驗證組織成員身份
			const data = await getAssetTransactionsByCustomerId(customerId);

			return c.json({ data });
		},
	)
	.post(
		"/asset-transactions",
		describeRoute({
			summary: "新增資產交易記錄",
			responses: {
				201: {
					description: "成功新增資產交易記錄",
					content: {
						"application/json": {
							schema: resolver(
								z.object({
									data: z.object({
										id: z.string(),
										customerId: z.string(),
										date: z.string(),
										currency: z.string(),
										type: z.string(),
										amount: z.number(),
										description: z.string().nullable(),
										createdAt: z.string(),
										updatedAt: z.string(),
									}),
								}),
							),
						},
					},
				},
			},
		}),
		validator("json", CreateAssetTransactionSchema),
		async (c) => {
			const data = c.req.valid("json");
			const user = c.get("user");

			const result = await createAssetTransaction(data);
			return c.json({ data: result }, 201);
		},
	)
	.put(
		"/asset-transactions/:id",
		describeRoute({
			summary: "更新資產交易記錄",
			responses: {
				200: {
					description: "成功更新資產交易記錄",
					content: {
						"application/json": {
							schema: resolver(
								z.object({
									data: z.object({
										id: z.string(),
										customerId: z.string(),
										date: z.string(),
										currency: z.string(),
										type: z.string(),
										amount: z.number(),
										description: z.string().nullable(),
										createdAt: z.string(),
										updatedAt: z.string(),
									}),
								}),
							),
						},
					},
				},
			},
		}),
		validator("param", z.object({ id: z.string() })),
		validator("json", UpdateAssetTransactionSchema),
		async (c) => {
			const { id } = c.req.valid("param");
			const data = c.req.valid("json");
			const user = c.get("user");

			const result = await updateAssetTransaction(id, data);
			return c.json({ data: result });
		},
	)
	.delete(
		"/asset-transactions/:id",
		describeRoute({
			summary: "刪除資產交易記錄",
			responses: {
				200: {
					description: "成功刪除資產交易記錄",
					content: {
						"application/json": {
							schema: resolver(
								z.object({
									message: z.string(),
								}),
							),
						},
					},
				},
			},
		}),
		validator("param", z.object({ id: z.string() })),
		async (c) => {
			const { id } = c.req.valid("param");
			const user = c.get("user");

			await deleteAssetTransaction(id);
			return c.json({ message: "資產交易記錄已成功刪除" });
		},
	);
