import {
	createRelationshipManager,
	deleteRelationshipManager,
	getRelationshipManagerById,
	getRelationshipManagersByOrganizationId,
	updateRelationshipManager,
} from "@repo/database/prisma/queries/relationship-managers";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator } from "hono-openapi/zod";

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
		"/relationship-managers/:id",
		describeRoute({
			tags: ["RelationshipManagers"],
			summary: "Get relationship manager by ID",
			description: "Get a specific relationship manager by their ID",
			responses: {
				200: {
					description: "Relationship manager",
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									relationshipManager: {
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
								required: ["relationshipManager"],
							},
						},
					},
				},
			},
		}),
		validator("param", z.object({ id: z.string() })),
		validator("query", z.object({ organizationId: z.string() })),
		async (c) => {
			const { id } = c.req.valid("param");
			const { organizationId } = c.req.valid("query");
			const user = c.get("user");

			await verifyOrganizationMembership(organizationId, user.id);

			const relationshipManager = await getRelationshipManagerById(id);

			if (!relationshipManager) {
				throw new HTTPException(404, {
					message: "找不到該客戶關係經理",
				});
			}

			// 驗證 RM 是否屬於該組織
			if (relationshipManager.organizationId !== organizationId) {
				throw new HTTPException(403, {
					message: "無權限訪問該客戶關係經理",
				});
			}

			return c.json({ relationshipManager });
		},
	)
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
	// .get(
	// 	"/relationship-managers/ids",
	// 	describeRoute({
	// 		tags: ["RelationshipManagers"],
	// 		summary: "Get relationship managers by IDs",
	// 		description: "Get relationship managers by their IDs",
	// 		responses: {
	// 			200: {
	// 				description: "Relationship managers",
	// 				content: {
	// 					"application/json": {
	// 						schema: {
	// 							type: "object",
	// 							properties: {
	// 								relationshipManagers: {
	// 									type: "array",
	// 									items: {
	// 										type: "object",
	// 										properties: {
	// 											id: { type: "string" },
	// 											name: { type: "string" },
	// 										},
	// 										required: ["id", "name"],
	// 									},
	// 								},
	// 							},
	// 							required: ["relationshipManagers"],
	// 						},
	// 					},
	// 				},
	// 			},
	// 		},
	// 	}),
	// 	validator("query", z.object({ ids: z.string() })),
	// 	async (c) => {
	// 		try {
	// 			const { ids } = c.req.valid("query");
	// 			const rmIds = ids.split(",");
	// 			const rms = await getRelationshipManagersByIds(rmIds);
	// 			return c.json({ relationshipManagers: rms });
	// 		} catch (error) {
	// 			return c.json({ message: "獲取 RM 資訊失敗" }, 400);
	// 		}
	// 	},
	// )
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
							schema: {
								type: "object",
								properties: {
									relationshipManager: {
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
											customerCount: { type: "number" },
											joinDate: {
												type: "string",
												format: "date-time",
											},
											organizationId: { type: "string" },
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
								required: ["relationshipManager"],
							},
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
							schema: {
								type: "object",
								properties: {
									relationshipManager: {
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
											customerCount: { type: "number" },
											joinDate: {
												type: "string",
												format: "date-time",
											},
											organizationId: { type: "string" },
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
								required: ["relationshipManager"],
							},
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
							schema: {
								type: "object",
								properties: {
									message: { type: "string" },
								},
								required: ["message"],
							},
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
