import { getOrganizationBySlug } from "@repo/database";
import slugify from "@sindresorhus/slugify";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator } from "hono-openapi/zod";
import { nanoid } from "nanoid";
import { z } from "zod";
import { assetTransactionsRouter } from "./asset-transactions";
import { bankAccountsRouter } from "./bank-accounts";
import { customersRouter } from "./customers";
import { expensesRouter } from "./expenses";
import { productsRouter } from "./products";
import { profitSharingRouter } from "./profit-sharing";
import { relationshipManagersRouter } from "./relationship-managers";

export const organizationsRouter = new Hono()
	.basePath("/organizations")
	.route("/", assetTransactionsRouter)
	.route("/", bankAccountsRouter)
	.route("/", customersRouter)
	.route("/", expensesRouter)
	.route("/", productsRouter)
	.route("/", profitSharingRouter)
	.route("/", relationshipManagersRouter)
	.get(
		"/generate-slug",
		validator(
			"query",
			z.object({
				name: z.string(),
			}),
		),
		describeRoute({
			summary: "Generate a slug for an organization",
			tags: ["Organizations"],
		}),
		async (c) => {
			const { name } = c.req.valid("query");

			const baseSlug = slugify(name, {
				lowercase: true,
			});

			let slug = baseSlug;
			let hasAvailableSlug = false;

			for (let i = 0; i < 3; i++) {
				const existing = await getOrganizationBySlug(slug);

				if (!existing) {
					hasAvailableSlug = true;
					break;
				}

				slug = `${baseSlug}-${nanoid(5)}`;
			}

			if (!hasAvailableSlug) {
				return c.json(
					{
						error: "No available slug found",
					},
					400,
				);
			}

			return c.json({
				slug,
			});
		},
	);
