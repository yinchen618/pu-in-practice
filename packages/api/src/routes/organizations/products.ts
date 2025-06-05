import {
	createProduct,
	deleteProduct,
	getProductByCode,
	getProductById,
	getProductsByOrganizationId,
	updateProduct,
} from "@repo/database";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator } from "hono-openapi/zod";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { authMiddleware } from "../../middleware/auth";
import { verifyOrganizationMembership } from "./lib/membership";

const CreateProductSchema = z.object({
	name: z.string().min(1, "產品名稱是必填的"),
	code: z.string().min(1, "產品代碼是必填的"),
	category: z.enum(["AQ", "Bond", "DCI", "EQ", "FCN", "Fund", "FX"]),
	description: z.string().optional(),
	price: z.number().positive().optional(),
	currency: z.string().optional().default("TWD"),
});

const UpdateProductSchema = z.object({
	name: z.string().min(1, "產品名稱是必填的"),
	code: z.string().min(1, "產品代碼是必填的"),
	category: z.enum(["AQ", "Bond", "DCI", "EQ", "FCN", "Fund", "FX"]),
	description: z.string().optional(),
	status: z.enum(["active", "inactive"]),
	price: z.number().positive().optional(),
	currency: z.string().optional(),
});

export const productsRouter = new Hono()
	.use(authMiddleware)
	.get(
		"/products",
		describeRoute({
			tags: ["Products"],
			summary: "Get all products",
			description: "Get all products for an organization",
			responses: {
				200: {
					description: "Products",
					content: {
						"application/json": {
							schema: resolver(
								z.object({
									products: z.array(
										z.object({
											id: z.string(),
											name: z.string(),
											code: z.string(),
											category: z.string(),
											description: z.string().nullable(),
											status: z.string(),
											price: z.number().nullable(),
											currency: z.string(),
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

			const products = await getProductsByOrganizationId(organizationId);

			return c.json({ products });
		},
	)
	.post(
		"/products",
		describeRoute({
			tags: ["Products"],
			summary: "Create product",
			description: "Create a new product",
			responses: {
				201: {
					description: "Created product",
					content: {
						"application/json": {
							schema: resolver(
								z.object({
									product: z.object({
										id: z.string(),
										name: z.string(),
										code: z.string(),
										category: z.string(),
										description: z.string().nullable(),
										status: z.string(),
										price: z.number().nullable(),
										currency: z.string(),
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
			CreateProductSchema.extend({
				organizationId: z.string(),
			}),
		),
		async (c) => {
			const data = c.req.valid("json");
			const user = c.get("user");

			await verifyOrganizationMembership(data.organizationId, user.id);

			try {
				// 檢查產品代碼是否已存在
				const existingProduct = await getProductByCode(
					data.organizationId,
					data.code,
				);
				if (existingProduct) {
					throw new HTTPException(400, {
						message: "該產品代碼已被使用",
					});
				}

				const product = await createProduct(data);
				return c.json({ product }, 201);
			} catch (error: any) {
				if (error.code === "P2002") {
					throw new HTTPException(400, {
						message: "該產品代碼已被使用",
					});
				}
				throw error;
			}
		},
	)
	.put(
		"/products/:id",
		describeRoute({
			tags: ["Products"],
			summary: "Update product",
			description: "Update an existing product",
			responses: {
				200: {
					description: "Updated product",
					content: {
						"application/json": {
							schema: resolver(
								z.object({
									product: z.object({
										id: z.string(),
										name: z.string(),
										code: z.string(),
										category: z.string(),
										description: z.string().nullable(),
										status: z.string(),
										price: z.number().nullable(),
										currency: z.string(),
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
		validator("json", UpdateProductSchema),
		async (c) => {
			const { id } = c.req.valid("param");
			const data = c.req.valid("json");
			const user = c.get("user");

			try {
				const product = await updateProduct(id, data);

				// 驗證用戶是否有權限修改此產品（通過組織成員資格）
				await verifyOrganizationMembership(
					product.organizationId,
					user.id,
				);

				return c.json({ product });
			} catch (error: any) {
				if (error.code === "P2002") {
					throw new HTTPException(400, {
						message: "該產品代碼已被使用",
					});
				}
				if (error.code === "P2025") {
					throw new HTTPException(404, {
						message: "找不到該產品",
					});
				}
				throw error;
			}
		},
	)
	.delete(
		"/products/:id",
		describeRoute({
			tags: ["Products"],
			summary: "Delete product",
			description: "Delete a product",
			responses: {
				200: {
					description: "Deleted product",
					content: {
						"application/json": {
							schema: resolver(
								z.object({
									success: z.boolean(),
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
				// 先獲取產品以驗證權限
				const product = await getProductById(id);
				if (!product) {
					throw new HTTPException(404, {
						message: "找不到該產品",
					});
				}

				// 驗證用戶是否有權限刪除此產品（通過組織成員資格）
				await verifyOrganizationMembership(
					product.organizationId,
					user.id,
				);

				await deleteProduct(id);

				return c.json({ success: true });
			} catch (error: any) {
				if (error.code === "P2025") {
					throw new HTTPException(404, {
						message: "找不到該產品",
					});
				}
				throw error;
			}
		},
	);
