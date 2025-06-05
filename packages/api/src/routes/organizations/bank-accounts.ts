import {
	createBankAccount,
	deleteBankAccount,
	getBankAccountsByOrganizationId,
	updateBankAccount,
} from "@repo/database";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator } from "hono-openapi/zod";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { authMiddleware } from "../../middleware/auth";
import { verifyOrganizationMembership } from "./lib/membership";

const CreateBankAccountSchema = z.object({
	bankName: z.string().min(1, "銀行名稱是必填的"),
	accountName: z.string().min(1, "帳戶名稱是必填的"),
	accountNumber: z.string().min(1, "帳號是必填的"),
	currency: z.string().optional(),
	balance: z.number().optional(),
	customerId: z.string().nullable().optional(),
});

const UpdateBankAccountSchema = z.object({
	bankName: z.string().min(1, "銀行名稱是必填的").optional(),
	accountName: z.string().min(1, "帳戶名稱是必填的").optional(),
	accountNumber: z.string().min(1, "帳號是必填的").optional(),
	currency: z.string().optional(),
	balance: z.number().optional(),
	status: z.enum(["active", "inactive"]).optional(),
	customerId: z.string().nullable().optional(),
});

export const bankAccountsRouter = new Hono()
	.use(authMiddleware)
	.get(
		"/bank-accounts",
		describeRoute({
			tags: ["BankAccounts"],
			summary: "Get bank accounts",
			description: "Get all bank accounts for an organization",
			responses: {
				200: {
					description: "List of bank accounts",
					content: {
						"application/json": {
							schema: resolver(
								z.object({
									bankAccounts: z.array(
										z.object({
											id: z.string(),
											bankName: z.string(),
											accountName: z.string(),
											accountNumber: z.string(),
											currency: z.string(),
											balance: z.number(),
											status: z.string(),
											organizationId: z.string(),
											customerId: z.string().nullable(),
											customer: z
												.object({
													id: z.string(),
													name: z.string(),
													email: z.string(),
												})
												.nullable(),
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

			const bankAccounts =
				await getBankAccountsByOrganizationId(organizationId);
			return c.json({ bankAccounts });
		},
	)
	.post(
		"/bank-accounts",
		describeRoute({
			tags: ["BankAccounts"],
			summary: "Create bank account",
			description: "Create a new bank account",
			responses: {
				201: {
					description: "Created bank account",
					content: {
						"application/json": {
							schema: resolver(
								z.object({
									bankAccount: z.object({
										id: z.string(),
										bankName: z.string(),
										accountName: z.string(),
										accountNumber: z.string(),
										currency: z.string(),
										balance: z.number(),
										status: z.string(),
										organizationId: z.string(),
										customerId: z.string().nullable(),
										customer: z
											.object({
												id: z.string(),
												name: z.string(),
												email: z.string(),
											})
											.nullable(),
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
			CreateBankAccountSchema.extend({
				organizationId: z.string(),
			}),
		),
		async (c) => {
			const data = c.req.valid("json");
			const user = c.get("user");

			await verifyOrganizationMembership(data.organizationId, user.id);

			try {
				const bankAccount = await createBankAccount(data);
				return c.json({ bankAccount }, 201);
			} catch (error: any) {
				if (error.code === "P2002") {
					throw new HTTPException(400, {
						message: "該帳號已存在",
					});
				}
				if (error.code === "P2003") {
					throw new HTTPException(400, {
						message: "指定的客戶不存在",
					});
				}
				throw error;
			}
		},
	)
	.put(
		"/bank-accounts/:id",
		describeRoute({
			tags: ["BankAccounts"],
			summary: "Update bank account",
			description: "Update an existing bank account",
			responses: {
				200: {
					description: "Updated bank account",
					content: {
						"application/json": {
							schema: resolver(
								z.object({
									bankAccount: z.object({
										id: z.string(),
										bankName: z.string(),
										accountName: z.string(),
										accountNumber: z.string(),
										currency: z.string(),
										balance: z.number(),
										status: z.string(),
										organizationId: z.string(),
										customerId: z.string().nullable(),
										customer: z
											.object({
												id: z.string(),
												name: z.string(),
												email: z.string(),
											})
											.nullable(),
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
		validator("json", UpdateBankAccountSchema),
		async (c) => {
			const { id } = c.req.valid("param");
			const data = c.req.valid("json");
			const user = c.get("user");

			try {
				const bankAccount = await updateBankAccount(id, data);

				// 驗證用戶是否有權限修改此銀行帳戶（通過組織成員資格）
				await verifyOrganizationMembership(
					bankAccount.organizationId,
					user.id,
				);

				return c.json({ bankAccount });
			} catch (error: any) {
				if (error.code === "P2002") {
					throw new HTTPException(400, {
						message: "該帳號已存在",
					});
				}
				if (error.code === "P2025") {
					throw new HTTPException(404, {
						message: "找不到該銀行帳戶",
					});
				}
				throw error;
			}
		},
	)
	.delete(
		"/bank-accounts/:id",
		describeRoute({
			tags: ["BankAccounts"],
			summary: "Delete bank account",
			description: "Delete an existing bank account",
			responses: {
				200: {
					description: "Deleted bank account",
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
				const bankAccount = await deleteBankAccount(id);

				// 驗證用戶是否有權限刪除此銀行帳戶（通過組織成員資格）
				await verifyOrganizationMembership(
					bankAccount.organizationId,
					user.id,
				);

				return c.json({ message: "銀行帳戶已成功刪除" });
			} catch (error: any) {
				if (error.code === "P2025") {
					throw new HTTPException(404, {
						message: "找不到該銀行帳戶",
					});
				}
				throw error;
			}
		},
	);
