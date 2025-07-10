import {
	createRelationshipManager,
	db,
	deleteRelationshipManager,
	getRelationshipManagersByOrganizationId,
	updateRelationshipManager,
} from "@repo/database";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator } from "hono-openapi/zod";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { authMiddleware } from "../../middleware/auth";
import { verifyOrganizationMembership } from "./lib/membership";

const CreateRMSchema = z.object({
	name: z.string().min(1, "姓名是必填的"),
	email: z.string().email("請輸入有效的電子郵件"),
	phone: z.string().optional(),
	category: z.enum(["FINDER", "RM", "BOTH"]).optional().default("RM"),
	joinDate: z.string(),
	resignDate: z.string().optional(),
	status: z.enum(["active", "inactive"]).optional().default("active"),
});

const UpdateRMSchema = z.object({
	name: z.string().min(1, "姓名是必填的"),
	email: z.string().email("請輸入有效的電子郵件"),
	phone: z.string().optional(),
	status: z.enum(["active", "inactive"]),
	category: z.enum(["FINDER", "RM", "BOTH"]).optional(),
	joinDate: z.string(),
	resignDate: z.string().optional(),
});

export const relationshipManagersRouter = new Hono()
	.use(authMiddleware)
	.get(
		"/relationship-managers",
		describeRoute({
			tags: ["RelationshipManagers"],
			summary: "Get all relationship managers",
			description: "Get all relationship managers for an organization",
			responses: {
				200: {
					description: "Relationship managers",
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									relationshipManagers: {
										type: "array",
										items: {
											type: "object",
											properties: {
												id: { type: "string" },
												name: { type: "string" },
												email: { type: "string" },
												phone: {
													type: "string",
													nullable: true,
												},
												status: { type: "string" },
												category: { type: "string" },
												customerCount: {
													type: "number",
												},
												joinDate: {
													type: "string",
													format: "date-time",
												},
												resignDate: {
													type: "string",
													format: "date-time",
													nullable: true,
												},
												organizationId: {
													type: "string",
												},
												createdAt: {
													type: "string",
													format: "date-time",
												},
												updatedAt: {
													type: "string",
													format: "date-time",
												},
											},
											required: [
												"id",
												"name",
												"email",
												"status",
												"category",
												"customerCount",
												"joinDate",
												"organizationId",
												"createdAt",
												"updatedAt",
											],
										},
									},
								},
								required: ["relationshipManagers"],
							},
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

			const relationshipManagers =
				await getRelationshipManagersByOrganizationId(organizationId);

			return c.json({ relationshipManagers });
		},
	)
	.get(
		"/relationship-managers/ids",
		describeRoute({
			tags: ["RelationshipManagers"],
			summary: "Get relationship managers by IDs",
			description: "Get relationship managers by their IDs",
			responses: {
				200: {
					description: "Relationship managers",
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									relationshipManagers: {
										type: "array",
										items: {
											type: "object",
											properties: {
												id: { type: "string" },
												name: { type: "string" },
											},
											required: ["id", "name"],
										},
									},
								},
								required: ["relationshipManagers"],
							},
						},
					},
				},
			},
		}),
		validator("query", z.object({ ids: z.string() })),
		async (c) => {
			try {
				const { ids } = c.req.valid("query");

				// 將逗號分隔的 ID 字串轉換為陣列
				const rmIds = ids.split(",");
				console.log("rmIds", rmIds);

				// 從資料庫獲取 RM 資訊
				const rms = await db.user.findMany({
					where: {
						id: {
							in: rmIds,
						},
					},
					select: {
						id: true,
						name: true,
					},
				});

				return c.json({
					relationshipManagers: rms,
				});
			} catch (error) {
				console.error("獲取 RM 資訊失敗:", error);
				return c.json(
					{
						message: "獲取 RM 資訊失敗",
					},
					400,
				);
			}
		},
	)
	.post(
		"/relationship-managers",
		describeRoute({
			tags: ["RelationshipManagers"],
			summary: "Create relationship manager",
			description: "Create a new relationship manager",
			responses: {
				201: {
					description: "Created relationship manager",
					content: {
						"application/json": {
							schema: resolver(
								z.object({
									relationshipManager: z.object({
										id: z.string(),
										name: z.string(),
										email: z.string(),
										phone: z.string().nullable(),
										status: z.string(),
										category: z.string(),
										customerCount: z.number(),
										joinDate: z.date(),
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
			CreateRMSchema.extend({
				organizationId: z.string(),
			}),
		),
		async (c) => {
			const data = c.req.valid("json");
			const user = c.get("user");

			await verifyOrganizationMembership(data.organizationId, user.id);

			try {
				const processedData = {
					...data,
					joinDate: new Date(data.joinDate),
					resignDate: data.resignDate
						? new Date(data.resignDate)
						: undefined,
					status: data.status || "active",
				};
				const relationshipManager =
					await createRelationshipManager(processedData);
				return c.json({ relationshipManager }, 201);
			} catch (error: any) {
				if (error.code === "P2002") {
					throw new HTTPException(400, {
						message: "該電子郵件已被使用",
					});
				}
				throw error;
			}
		},
	)
	.put(
		"/relationship-managers/:id",
		describeRoute({
			tags: ["RelationshipManagers"],
			summary: "Update relationship manager",
			description: "Update an existing relationship manager",
			responses: {
				200: {
					description: "Updated relationship manager",
					content: {
						"application/json": {
							schema: resolver(
								z.object({
									relationshipManager: z.object({
										id: z.string(),
										name: z.string(),
										email: z.string(),
										phone: z.string().nullable(),
										status: z.string(),
										category: z.string(),
										customerCount: z.number(),
										joinDate: z.date(),
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
		validator("json", UpdateRMSchema),
		async (c) => {
			const { id } = c.req.valid("param");
			const data = c.req.valid("json");
			const user = c.get("user");

			try {
				// 將字串日期轉換為 Date 物件
				const processedData = {
					...data,
					joinDate: new Date(data.joinDate),
					resignDate: data.resignDate
						? new Date(data.resignDate)
						: null,
				};

				const relationshipManager = await updateRelationshipManager(
					id,
					processedData,
				);

				// 驗證用戶是否有權限修改此 RM（通過組織成員資格）
				await verifyOrganizationMembership(
					relationshipManager.organizationId,
					user.id,
				);

				return c.json({ relationshipManager });
			} catch (error: any) {
				if (error.code === "P2002") {
					throw new HTTPException(400, {
						message: "該電子郵件已被使用",
					});
				}
				if (error.code === "P2025") {
					throw new HTTPException(404, {
						message: "找不到該客戶關係經理",
					});
				}
				throw error;
			}
		},
	)
	.delete(
		"/relationship-managers/:id",
		describeRoute({
			tags: ["RelationshipManagers"],
			summary: "Delete relationship manager",
			description: "Delete an existing relationship manager",
			responses: {
				200: {
					description: "Deleted relationship manager",
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
				const relationshipManager = await deleteRelationshipManager(id);

				// 驗證用戶是否有權限刪除此 RM（通過組織成員資格）
				await verifyOrganizationMembership(
					relationshipManager.organizationId,
					user.id,
				);

				return c.json({ message: "客戶關係經理已成功刪除" });
			} catch (error: any) {
				if (error.code === "P2025") {
					throw new HTTPException(404, {
						message: "找不到該客戶關係經理",
					});
				}
				throw error;
			}
		},
	);
