import {
	createRelationshipManager,
	getRelationshipManagersByOrganizationId,
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
							schema: resolver(
								z.object({
									relationshipManagers: z.array(
										z.object({
											id: z.string(),
											name: z.string(),
											email: z.string(),
											phone: z.string().nullable(),
											status: z.string(),
											customerCount: z.number(),
											joinDate: z.date(),
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

			const relationshipManagers =
				await getRelationshipManagersByOrganizationId(organizationId);

			return c.json({ relationshipManagers });
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
				const relationshipManager =
					await createRelationshipManager(data);
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
	);
