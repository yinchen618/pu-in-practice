import {
	createCustomer,
	deleteCustomer,
	getCustomerById,
	getCustomerProducts,
	getCustomersByOrganizationId,
	getRelationshipManagersByOrganizationId,
	updateCustomer,
} from "@repo/database";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator } from "hono-openapi/zod";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { authMiddleware } from "../../middleware/auth";
import { verifyOrganizationMembership } from "./lib/membership";

const CreateCustomerSchema = z.object({
	name: z.string().min(1, "客戶名稱是必填的"),
	code: z.string().min(1, "客戶編號是必填的"),
	email: z
		.string()
		.optional()
		.or(z.literal(""))
		.refine((val) => !val || z.string().email().safeParse(val).success, {
			message: "請輸入有效的電子郵件",
		}),
	phone: z.string().optional(),
	rm1Id: z.string().optional(),
	rm1ProfitShare: z.number().min(0).max(100).optional().nullable(),
	rm2Id: z.string().optional(),
	rm2ProfitShare: z.number().min(0).max(100).optional().nullable(),
	finder1Id: z.string().optional(),
	finder1ProfitShare: z.number().min(0).max(100).optional().nullable(),
	finder2Id: z.string().optional(),
	finder2ProfitShare: z.number().min(0).max(100).optional().nullable(),
});

const UpdateCustomerSchema = z.object({
	name: z.string().min(1, "客戶名稱是必填的"),
	code: z.string().min(1, "客戶編號是必填的"),
	email: z
		.string()
		.optional()
		.or(z.literal(""))
		.refine((val) => !val || z.string().email().safeParse(val).success, {
			message: "請輸入有效的電子郵件",
		}),
	phone: z.string().optional(),
	rm1Id: z.string().optional().nullable(),
	rm1ProfitShare: z.number().min(0).max(100).optional().nullable(),
	rm2Id: z.string().optional().nullable(),
	rm2ProfitShare: z.number().min(0).max(100).optional().nullable(),
	finder1Id: z.string().optional().nullable(),
	finder1ProfitShare: z.number().min(0).max(100).optional().nullable(),
	finder2Id: z.string().optional().nullable(),
	finder2ProfitShare: z.number().min(0).max(100).optional().nullable(),
});

export const customersRouter = new Hono()
	.use(authMiddleware)
	.get(
		"/customers",
		describeRoute({
			tags: ["Customers"],
			summary: "Get all customers",
			description: "Get all customers for an organization",
			responses: {
				200: {
					description: "Customers",
					content: {
						"application/json": {
							schema: resolver(
								z.object({
									customers: z.array(
										z.object({
											id: z.string(),
											name: z.string(),
											code: z.string(),
											email: z.string().nullable(),
											phone: z.string().nullable(),
											organizationId: z.string(),
											bankAccounts: z.array(
												z.object({
													id: z.string(),
													bankName: z.string(),
													accountName: z.string(),
													accountNumber: z.string(),
													currency: z.string(),
													balance: z.number(),
													status: z.string(),
												}),
											),
											rm1Id: z.string().nullable(),
											rm1ProfitShare: z
												.number()
												.nullable(),
											rm2Id: z.string().nullable(),
											rm2ProfitShare: z
												.number()
												.nullable(),
											finder1Id: z.string().nullable(),
											finder1ProfitShare: z
												.number()
												.nullable(),
											finder2Id: z.string().nullable(),
											finder2ProfitShare: z
												.number()
												.nullable(),
											rm1Name: z.string().nullable(),
											rm2Name: z.string().nullable(),
											finder1Name: z.string().nullable(),
											finder2Name: z.string().nullable(),
											createdAt: z.date(),
											updatedAt: z.date(),
										}),
									),
									relationshipManagers: z.array(
										z.object({
											id: z.string(),
											name: z.string(),
											category: z.enum([
												"RM",
												"FINDER",
												"BOTH",
											]),
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

			const [customersData, relationshipManagers] = await Promise.all([
				getCustomersByOrganizationId(organizationId),
				getRelationshipManagersByOrganizationId(organizationId),
			]);

			// 轉換數據格式，添加關聯名稱
			const customers = customersData.map((customer: any) => ({
				...customer,
				bankAccounts:
					customer.bankAccounts?.map((account: any) => ({
						...account,
						// 隱藏帳戶名稱
						accountName: undefined,
						balance: Number(account.balance),
					})) || [],
				rm1Name: customer.rm1?.name || null,
				rm2Name: customer.rm2?.name || null,
				finder1Name: customer.finder1?.name || null,
				finder2Name: customer.finder2?.name || null,
				// 將Decimal轉換為number
				rm1ProfitShare: customer.rm1ProfitShare
					? Number(customer.rm1ProfitShare)
					: null,
				rm2ProfitShare: customer.rm2ProfitShare
					? Number(customer.rm2ProfitShare)
					: null,
				finder1ProfitShare: customer.finder1ProfitShare
					? Number(customer.finder1ProfitShare)
					: null,
				finder2ProfitShare: customer.finder2ProfitShare
					? Number(customer.finder2ProfitShare)
					: null,
			}));

			return c.json({
				customers,
				relationshipManagers: relationshipManagers.map((rm: any) => ({
					id: rm.id,
					name: rm.name,
					category: rm.category || "RM", // 如果沒有設定，預設為 RM
				})),
			});
		},
	)
	.post(
		"/customers",
		describeRoute({
			tags: ["Customers"],
			summary: "Create customer",
			description: "Create a new customer",
			responses: {
				201: {
					description: "Created customer",
					content: {
						"application/json": {
							schema: resolver(
								z.object({
									customer: z.object({
										id: z.string(),
										name: z.string(),
										code: z.string(),
										email: z.string().nullable(),
										phone: z.string().nullable(),
										organizationId: z.string(),
										bankAccounts: z.array(
											z.object({
												id: z.string(),
												bankName: z.string(),
												accountName: z.string(),
												accountNumber: z.string(),
												currency: z.string(),
												balance: z.number(),
												status: z.string(),
											}),
										),
										rm1Id: z.string().nullable(),
										rm1ProfitShare: z.number().nullable(),
										rm2Id: z.string().nullable(),
										rm2ProfitShare: z.number().nullable(),
										finder1Id: z.string().nullable(),
										finder1ProfitShare: z
											.number()
											.nullable(),
										finder2Id: z.string().nullable(),
										finder2ProfitShare: z
											.number()
											.nullable(),
										rm1Name: z.string().nullable(),
										rm2Name: z.string().nullable(),
										finder1Name: z.string().nullable(),
										finder2Name: z.string().nullable(),
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
			CreateCustomerSchema.extend({
				organizationId: z.string(),
			}),
		),
		async (c) => {
			const data = c.req.valid("json");
			const user = c.get("user");

			await verifyOrganizationMembership(data.organizationId, user.id);

			try {
				const customerData = await createCustomer(data);

				// 轉換數據格式，添加關聯名稱
				const customer = {
					...customerData,
					bankAccounts:
						(customerData as any).bankAccounts?.map(
							(account: any) => ({
								...account,
								balance: Number(account.balance),
							}),
						) || [],
					rm1Name: (customerData as any).rm1?.name || null,
					rm2Name: (customerData as any).rm2?.name || null,
					finder1Name: (customerData as any).finder1?.name || null,
					finder2Name: (customerData as any).finder2?.name || null,
					// 將Decimal轉換為number
					rm1ProfitShare: (customerData as any).rm1ProfitShare
						? Number((customerData as any).rm1ProfitShare)
						: null,
					rm2ProfitShare: (customerData as any).rm2ProfitShare
						? Number((customerData as any).rm2ProfitShare)
						: null,
					finder1ProfitShare: (customerData as any).finder1ProfitShare
						? Number((customerData as any).finder1ProfitShare)
						: null,
					finder2ProfitShare: (customerData as any).finder2ProfitShare
						? Number((customerData as any).finder2ProfitShare)
						: null,
				};

				return c.json({ customer }, 201);
			} catch (error: any) {
				if (error.code === "P2002") {
					// 檢查是哪個欄位重複
					const target = error.meta?.target;
					if (target?.includes("code")) {
						throw new HTTPException(400, {
							message: "該客戶編號已被使用",
						});
					}
					throw new HTTPException(400, {
						message: "資料重複，請檢查客戶編號",
					});
				}
				throw error;
			}
		},
	)
	.put(
		"/customers/:id",
		describeRoute({
			tags: ["Customers"],
			summary: "Update customer",
			description: "Update an existing customer",
			responses: {
				200: {
					description: "Updated customer",
					content: {
						"application/json": {
							schema: resolver(
								z.object({
									customer: z.object({
										id: z.string(),
										name: z.string(),
										code: z.string(),
										email: z.string().nullable(),
										phone: z.string().nullable(),
										organizationId: z.string(),
										bankAccounts: z.array(
											z.object({
												id: z.string(),
												bankName: z.string(),
												accountName: z.string(),
												accountNumber: z.string(),
												currency: z.string(),
												balance: z.number(),
												status: z.string(),
											}),
										),
										rm1Id: z.string().nullable(),
										rm1ProfitShare: z.number().nullable(),
										rm2Id: z.string().nullable(),
										rm2ProfitShare: z.number().nullable(),
										finder1Id: z.string().nullable(),
										finder1ProfitShare: z
											.number()
											.nullable(),
										finder2Id: z.string().nullable(),
										finder2ProfitShare: z
											.number()
											.nullable(),
										rm1Name: z.string().nullable(),
										rm2Name: z.string().nullable(),
										finder1Name: z.string().nullable(),
										finder2Name: z.string().nullable(),
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
		validator("json", UpdateCustomerSchema),
		async (c) => {
			const { id } = c.req.valid("param");
			const data = c.req.valid("json");
			const user = c.get("user");

			try {
				const customerData = await updateCustomer(id, data);

				// 驗證用戶是否有權限修改此客戶（通過組織成員資格）
				await verifyOrganizationMembership(
					customerData.organizationId,
					user.id,
				);

				// 轉換數據格式，添加關聯名稱
				const customer = {
					...customerData,
					bankAccounts:
						(customerData as any).bankAccounts?.map(
							(account: any) => ({
								...account,
								balance: Number(account.balance),
							}),
						) || [],
					rm1Name: (customerData as any).rm1?.name || null,
					rm2Name: (customerData as any).rm2?.name || null,
					finder1Name: (customerData as any).finder1?.name || null,
					finder2Name: (customerData as any).finder2?.name || null,
					// 將Decimal轉換為number
					rm1ProfitShare: (customerData as any).rm1ProfitShare
						? Number((customerData as any).rm1ProfitShare)
						: null,
					rm2ProfitShare: (customerData as any).rm2ProfitShare
						? Number((customerData as any).rm2ProfitShare)
						: null,
					finder1ProfitShare: (customerData as any).finder1ProfitShare
						? Number((customerData as any).finder1ProfitShare)
						: null,
					finder2ProfitShare: (customerData as any).finder2ProfitShare
						? Number((customerData as any).finder2ProfitShare)
						: null,
				};

				return c.json({ customer });
			} catch (error: any) {
				if (error.code === "P2002") {
					// 檢查是哪個欄位重複
					const target = error.meta?.target;
					if (target?.includes("code")) {
						throw new HTTPException(400, {
							message: "該客戶編號已被使用",
						});
					}
					throw new HTTPException(400, {
						message: "資料重複，請檢查客戶編號",
					});
				}
				if (error.code === "P2025") {
					throw new HTTPException(404, {
						message: "找不到該客戶",
					});
				}
				throw error;
			}
		},
	)
	.delete(
		"/customers/:id",
		describeRoute({
			tags: ["Customers"],
			summary: "Delete customer",
			description: "Delete an existing customer",
			responses: {
				200: {
					description: "Deleted customer",
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
				const customer = await deleteCustomer(id);

				// 驗證用戶是否有權限刪除此客戶（通過組織成員資格）
				await verifyOrganizationMembership(
					customer.organizationId,
					user.id,
				);

				return c.json({ message: "客戶已成功刪除" });
			} catch (error: any) {
				if (error.code === "P2025") {
					throw new HTTPException(404, {
						message: "找不到該客戶",
					});
				}
				throw error;
			}
		},
	)
	// 獲取客戶產品
	.get(
		"/customers/:customerId/products",
		validator("query", z.object({ organizationId: z.string() })),
		validator("param", z.object({ customerId: z.string() })),
		async (c) => {
			const { organizationId } = c.req.valid("query");
			const { customerId } = c.req.valid("param");
			const user = c.get("user");

			await verifyOrganizationMembership(organizationId, user.id);

			const products = await getCustomerProducts(customerId);

			return c.json({ data: products });
		},
	)
	.get(
		"/customers/:id",
		describeRoute({
			tags: ["Customers"],
			summary: "Get customer by ID",
			description: "Get a customer by ID",
			responses: {
				200: {
					description: "Customer",
					content: {
						"application/json": {
							schema: resolver(
								z.object({
									customer: z.object({
										id: z.string(),
										name: z.string(),
										code: z.string(),
										email: z.string().nullable(),
										phone: z.string().nullable(),
										organizationId: z.string(),
										bankAccounts: z.array(
											z.object({
												id: z.string(),
												bankName: z.string(),
												accountName: z.string(),
												accountNumber: z.string(),
												currency: z.string(),
												balance: z.number(),
												status: z.string(),
											}),
										),
										rm1Id: z.string().nullable(),
										rm1ProfitShare: z.number().nullable(),
										rm2Id: z.string().nullable(),
										rm2ProfitShare: z.number().nullable(),
										finder1Id: z.string().nullable(),
										finder1ProfitShare: z
											.number()
											.nullable(),
										finder2Id: z.string().nullable(),
										finder2ProfitShare: z
											.number()
											.nullable(),
										rm1Name: z.string().nullable(),
										rm2Name: z.string().nullable(),
										finder1Name: z.string().nullable(),
										finder2Name: z.string().nullable(),
										createdAt: z.date(),
										updatedAt: z.date(),
									}),
								}),
							),
						},
					},
				},
				404: {
					description: "Customer not found",
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

			const customerData = await getCustomerById(id);

			if (!customerData) {
				throw new HTTPException(404, { message: "客戶不存在" });
			}

			if (customerData.organizationId !== organizationId) {
				throw new HTTPException(403, { message: "無權訪問此客戶" });
			}

			// 轉換數據格式，添加關聯名稱
			const customer = {
				...customerData,
				bankAccounts:
					(customerData as any).bankAccounts?.map((account: any) => ({
						...account,
						balance: Number(account.balance),
					})) || [],
				rm1Name: (customerData as any).rm1?.name || null,
				rm2Name: (customerData as any).rm2?.name || null,
				finder1Name: (customerData as any).finder1?.name || null,
				finder2Name: (customerData as any).finder2?.name || null,
				// 將Decimal轉換為number
				rm1ProfitShare: (customerData as any).rm1ProfitShare
					? Number((customerData as any).rm1ProfitShare)
					: null,
				rm2ProfitShare: (customerData as any).rm2ProfitShare
					? Number((customerData as any).rm2ProfitShare)
					: null,
				finder1ProfitShare: (customerData as any).finder1ProfitShare
					? Number((customerData as any).finder1ProfitShare)
					: null,
				finder2ProfitShare: (customerData as any).finder2ProfitShare
					? Number((customerData as any).finder2ProfitShare)
					: null,
			};

			return c.json({ customer });
		},
	);
