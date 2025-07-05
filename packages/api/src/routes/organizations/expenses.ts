import {
	createExpense,
	deleteExpense,
	getExpensesByOrganizationId,
	updateExpense,
} from "@repo/database";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator } from "hono-openapi/zod";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { authMiddleware } from "../../middleware/auth";
import { verifyOrganizationMembership } from "./lib/membership";

const CreateExpenseSchema = z.object({
	category: z.enum(["餐飲", "機票", "酒店", "快遞", "交通"], {
		required_error: "類別是必填的",
	}),
	amount: z.number().min(0, "金額不能為負數"),
	currency: z.string().optional(),
	exchangeRate: z.number().min(0, "匯率不能為負數").optional(),
	usdRate: z.number().min(0, "美元匯率不能為負數").optional(),
	receiptUrl: z.string().optional(),
	receiptUrls: z.array(z.string()).optional(),
	description: z.string().optional(),
	date: z.coerce.date().optional(),
});

const UpdateExpenseSchema = z.object({
	category: z.enum(["餐飲", "機票", "酒店", "快遞", "交通"]).optional(),
	amount: z.number().min(0, "金額不能為負數").optional(),
	currency: z.string().optional(),
	exchangeRate: z.number().min(0, "匯率不能為負數").optional(),
	usdRate: z.number().min(0, "美元匯率不能為負數").optional(),
	receiptUrl: z.string().optional(),
	receiptUrls: z.array(z.string()).optional(),
	description: z.string().optional(),
	date: z.coerce.date().optional(),
});

export const expensesRouter = new Hono()
	.use(authMiddleware)
	.get(
		"/expenses",
		describeRoute({
			tags: ["Expenses"],
			summary: "Get expenses",
			description: "Get all expenses for an organization",
			responses: {
				200: {
					description: "List of expenses",
					content: {
						"application/json": {
							schema: resolver(
								z.object({
									expenses: z.array(
										z.object({
											id: z.string(),
											category: z.string(),
											amount: z.number(),
											currency: z.string(),
											exchangeRate: z.number(),
											sgdAmount: z.number(),
											usdRate: z.number(),
											usdAmount: z.number(),
											receiptUrl: z.string().nullable(),
											receiptUrls: z
												.array(z.string())
												.optional(),
											description: z.string().nullable(),
											date: z.date(),
											organizationId: z.string(),
											createdAt: z.date(),
											updatedAt: z.date(),
										}),
									),
								}),
							),
						},
					},
				},
			},
		}),
		validator("query", z.object({ organizationId: z.string() })),
		async (c) => {
			const { organizationId } = c.req.valid("query");
			const user = c.get("user");

			await verifyOrganizationMembership(organizationId, user.id);

			const expenses = await getExpensesByOrganizationId(organizationId);
			return c.json({ expenses });
		},
	)
	.post(
		"/expenses",
		describeRoute({
			tags: ["Expenses"],
			summary: "Create expense",
			description: "Create a new expense",
			responses: {
				201: {
					description: "Created expense",
					content: {
						"application/json": {
							schema: resolver(
								z.object({
									expense: z.object({
										id: z.string(),
										category: z.string(),
										amount: z.number(),
										currency: z.string(),
										exchangeRate: z.number(),
										sgdAmount: z.number(),
										usdRate: z.number(),
										usdAmount: z.number(),
										receiptUrl: z.string().nullable(),
										receiptUrls: z
											.array(z.string())
											.optional(),
										description: z.string().nullable(),
										date: z.date(),
										organizationId: z.string(),
										createdAt: z.date(),
										updatedAt: z.date(),
									}),
								}),
							),
						},
					},
				},
			},
		}),
		validator(
			"json",
			CreateExpenseSchema.extend({
				organizationId: z.string(),
			}),
		),
		async (c) => {
			const data = c.req.valid("json");
			const user = c.get("user");

			await verifyOrganizationMembership(data.organizationId, user.id);

			try {
				const expense = await createExpense(data);
				return c.json({ expense }, 201);
			} catch (error: any) {
				console.error("新增支出失敗:", error);
				throw new HTTPException(500, {
					message: "新增支出失敗",
				});
			}
		},
	)
	.put(
		"/expenses/:id",
		describeRoute({
			tags: ["Expenses"],
			summary: "Update expense",
			description: "Update an existing expense",
			responses: {
				200: {
					description: "Updated expense",
					content: {
						"application/json": {
							schema: resolver(
								z.object({
									expense: z.object({
										id: z.string(),
										category: z.string(),
										amount: z.number(),
										currency: z.string(),
										exchangeRate: z.number(),
										sgdAmount: z.number(),
										usdRate: z.number(),
										usdAmount: z.number(),
										receiptUrl: z.string().nullable(),
										receiptUrls: z
											.array(z.string())
											.optional(),
										description: z.string().nullable(),
										date: z.date(),
										organizationId: z.string(),
										createdAt: z.date(),
										updatedAt: z.date(),
									}),
								}),
							),
						},
					},
				},
			},
		}),
		validator("param", z.object({ id: z.string() })),
		validator("json", UpdateExpenseSchema),
		async (c) => {
			const { id } = c.req.valid("param");
			const data = c.req.valid("json");
			const user = c.get("user");

			try {
				const expense = await updateExpense(id, data);

				// 驗證用戶是否有權限修改此支出（通過組織成員資格）
				await verifyOrganizationMembership(
					expense.organizationId,
					user.id,
				);

				return c.json({ expense });
			} catch (error: any) {
				if (error.code === "P2025") {
					throw new HTTPException(404, {
						message: "找不到該支出記錄",
					});
				}
				throw error;
			}
		},
	)
	.delete(
		"/expenses/:id",
		describeRoute({
			tags: ["Expenses"],
			summary: "Delete expense",
			description: "Delete an existing expense",
			responses: {
				200: {
					description: "Deleted expense",
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

			try {
				const expense = await deleteExpense(id);

				// 驗證用戶是否有權限刪除此支出（通過組織成員資格）
				await verifyOrganizationMembership(
					expense.organizationId,
					user.id,
				);

				return c.json({ message: "支出記錄已成功刪除" });
			} catch (error: any) {
				if (error.code === "P2025") {
					throw new HTTPException(404, {
						message: "找不到該支出記錄",
					});
				}
				throw error;
			}
		},
	);
