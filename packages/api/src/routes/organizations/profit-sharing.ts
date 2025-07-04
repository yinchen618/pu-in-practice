import { db } from "@repo/database";
import { Hono } from "hono";
import { validator } from "hono-openapi/zod";
import { z } from "zod";
import { authMiddleware } from "../../middleware/auth";
import { verifyOrganizationMembership } from "./lib/membership";

const CreateSchema = z.object({
	revenueType: z.string(),
	category: z.string(),
	productCode: z.string(),
	productName: z.string(),
	customerId: z.string(),
	customerName: z.string(),
	bankAccountId: z.string(),
	bankRetro: z.number().min(0).max(100),
	companyRevenue: z.number().min(0).max(100),
	rmRevenue: z.number().min(0).max(100),
	findersRevenue: z.number().min(0).max(100),
	organizationId: z.string(),
});

const UpdateSchema = CreateSchema.partial().omit({ organizationId: true });

export const profitSharingRouter = new Hono()
	.use(authMiddleware)
	.get(
		"/profit-sharing",
		validator(
			"query",
			z.object({
				organizationId: z.string(),
				search: z.string().optional(),
				from: z.string().optional(),
				to: z.string().optional(),
			}),
		),
		async (c) => {
			const { organizationId, search, from, to } = c.req.valid("query");
			const user = c.get("user");

			await verifyOrganizationMembership(organizationId, user.id);

			const data = await db.profitSharing.findMany({
				where: {
					organizationId,
					...(search
						? {
								OR: [
									{ product: { name: { contains: search } } },
									{
										customer: {
											name: { contains: search },
										},
									},
								],
							}
						: {}),
					...(from || to
						? {
								profitDate: {
									...(from ? { gte: new Date(from) } : {}),
									...(to ? { lte: new Date(to) } : {}),
								},
							}
						: {}),
				},
				include: {
					customer: true,
					product: true,
				},
				orderBy: { profitDate: "desc" },
			});

			return c.json({ data });
		},
	)
	.post(
		"/profit-sharing",
		validator(
			"json",
			z.object({
				customerId: z.string(),
				productId: z.string(),
				amount: z.number(),
				profitDate: z.string(),
				organizationId: z.string(),
			}),
		),
		async (c) => {
			const data = c.req.valid("json");
			const user = c.get("user");

			await verifyOrganizationMembership(data.organizationId, user.id);

			const result = await db.profitSharing.create({
				data: {
					...data,
					profitDate: new Date(data.profitDate),
				},
				include: {
					customer: true,
					product: true,
				},
			});

			return c.json({ data: result }, 201);
		},
	)
	.put(
		"/profit-sharing/:id",
		validator("param", z.object({ id: z.string() })),
		validator(
			"json",
			z.object({
				customerId: z.string().optional(),
				productId: z.string().optional(),
				amount: z.number().optional(),
				profitDate: z.string().optional(),
			}),
		),
		async (c) => {
			const { id } = c.req.valid("param");
			const data = c.req.valid("json");
			const user = c.get("user");

			const existing = await db.profitSharing.findUnique({
				where: { id },
			});

			if (!existing) {
				return c.json({ message: "記錄不存在" }, 404);
			}

			await verifyOrganizationMembership(
				existing.organizationId,
				user.id,
			);

			const result = await db.profitSharing.update({
				where: { id },
				data: {
					...data,
					...(data.profitDate
						? { profitDate: new Date(data.profitDate) }
						: {}),
				},
				include: {
					customer: true,
					product: true,
				},
			});

			return c.json({ data: result });
		},
	)
	.delete(
		"/profit-sharing/:id",
		validator("param", z.object({ id: z.string() })),
		async (c) => {
			const { id } = c.req.valid("param");
			const user = c.get("user");

			const existing = await db.profitSharing.findUnique({
				where: { id },
			});

			if (!existing) {
				return c.json({ message: "記錄不存在" }, 404);
			}

			await verifyOrganizationMembership(
				existing.organizationId,
				user.id,
			);

			await db.profitSharing.delete({
				where: { id },
			});

			return c.json({ message: "記錄已成功刪除" });
		},
	);
