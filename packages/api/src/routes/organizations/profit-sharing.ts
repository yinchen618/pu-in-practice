import {
	getCustomersByOrganizationId,
	getProductsByOrganizationId,
} from "@repo/database";
import {
	createProfitSharing,
	deleteProfitSharing,
	getProfitSharingByOrganizationId,
	updateProfitSharing,
} from "@repo/database/prisma/queries/profit-sharing";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator } from "hono-openapi/zod";
import { z } from "zod";
import { authMiddleware } from "../../middleware/auth";
import { verifyOrganizationMembership } from "./lib/membership";

const CreateSchema = z.object({
	customerId: z.string().min(1, "客戶是必填的"),
	productId: z.string().min(1, "產品是必填的"),
	amount: z.number().min(0, "金額不能為負數"),
	profitDate: z.string().transform((str) => new Date(str)),
	currency: z.string().default("USD"),
	companyRevenue: z.number().min(0, "Company revenue 不能為負數"),
	directTradeBookingFee: z
		.number()
		.min(0, "Direct trade booking fee 不能為負數"),
	rmProfitSharePercent: z.number().min(0).max(100).default(50),
	finderProfitSharePercent: z.number().min(0).max(100).default(0),
	companyProfitSharePercent: z.number().min(0).max(100).default(50),
	fxRate: z.number().min(0, "FX Rate 不能為負數"),
	bankAccountId: z.string().optional(),
});

const UpdateSchema = CreateSchema.partial();

const QuerySchema = z.object({
	organizationId: z.string(),
	search: z.string().optional(),
	productCategory: z.string().optional(),
	dateFrom: z.string().optional(),
	dateTo: z.string().optional(),
});

export const profitSharingRouter = new Hono()
	.use(authMiddleware)

	// 獲取分潤記錄
	.get(
		"/profit-sharing",
		describeRoute({
			description: "獲取分潤記錄列表",
			responses: {
				200: {
					description: "成功獲取分潤記錄",
				},
			},
		}),
		validator("query", QuerySchema),
		async (c) => {
			const {
				organizationId,
				search,
				productCategory,
				dateFrom,
				dateTo,
			} = c.req.valid("query");
			const user = c.get("user");

			await verifyOrganizationMembership(organizationId, user.id);

			const data = await getProfitSharingByOrganizationId(organizationId);

			// 轉換資料格式
			const formattedData = data.map((item: any) => ({
				id: item.id,
				customerId: item.customerId,
				productId: item.productId,
				amount: Number(item.amount),
				profitDate: item.profitDate,
				organizationId: item.organizationId,
				createdAt: item.createdAt,
				updatedAt: item.updatedAt,

				// 新增欄位
				currency: item.currency || "USD",
				companyRevenue: Number(item.companyRevenue || 0),
				directTradeBookingFee: Number(item.directTradeBookingFee || 0),
				shareable: Number(item.shareable || 0),
				rmProfitSharePercent: Number(item.rmProfitSharePercent || 50),
				finderProfitSharePercent: Number(
					item.finderProfitSharePercent || 0,
				),
				companyProfitSharePercent: Number(
					item.companyProfitSharePercent || 50,
				),
				rmRevenueOriginal: Number(item.rmRevenueOriginal || 0),
				findersRevenueOriginal: Number(
					item.findersRevenueOriginal || 0,
				),
				companyRevenueOriginal: Number(
					item.companyRevenueOriginal || 0,
				),
				fxRate: Number(item.fxRate || 1),
				rmRevenueUSD: Number(item.rmRevenueUSD || 0),
				findersRevenueUSD: Number(item.findersRevenueUSD || 0),

				// 關聯資料
				customerName: item.customer?.name || "",
				customerCode: item.customer?.code || "",
				productName: item.product?.name || "",
				productCode: item.product?.code || "",
				productCategory: item.product?.category || "",
			}));

			// 應用篩選
			let filteredData = formattedData;

			if (search) {
				const searchTerm = search.toLowerCase();
				filteredData = filteredData.filter(
					(item) =>
						item.productName.toLowerCase().includes(searchTerm) ||
						item.productCode.toLowerCase().includes(searchTerm) ||
						item.customerName.toLowerCase().includes(searchTerm),
				);
			}

			if (productCategory) {
				filteredData = filteredData.filter(
					(item) => item.productCategory === productCategory,
				);
			}

			if (dateFrom) {
				const fromDate = new Date(dateFrom);
				filteredData = filteredData.filter(
					(item) => new Date(item.profitDate) >= fromDate,
				);
			}

			if (dateTo) {
				const toDate = new Date(dateTo);
				toDate.setHours(23, 59, 59, 999);
				filteredData = filteredData.filter(
					(item) => new Date(item.profitDate) <= toDate,
				);
			}

			return c.json({ data: filteredData });
		},
	)

	// 新增分潤記錄
	.post(
		"/profit-sharing",
		describeRoute({
			description: "新增分潤記錄",
			responses: {
				201: {
					description: "成功新增分潤記錄",
				},
			},
		}),
		validator("json", CreateSchema.extend({ organizationId: z.string() })),
		async (c) => {
			const data = c.req.valid("json");
			const user = c.get("user");

			await verifyOrganizationMembership(data.organizationId, user.id);

			const result = await createProfitSharing(data);
			return c.json({ data: result }, 201);
		},
	)

	// 更新分潤記錄
	.put(
		"/profit-sharing/:id",
		describeRoute({
			description: "更新分潤記錄",
			responses: {
				200: {
					description: "成功更新分潤記錄",
				},
			},
		}),
		validator("param", z.object({ id: z.string() })),
		validator("json", UpdateSchema),
		async (c) => {
			const { id } = c.req.valid("param");
			const data = c.req.valid("json");
			const user = c.get("user");

			const result = await updateProfitSharing(id, data);
			await verifyOrganizationMembership(result.organizationId, user.id);

			return c.json({ data: result });
		},
	)

	// 刪除分潤記錄
	.delete(
		"/profit-sharing/:id",
		describeRoute({
			description: "刪除分潤記錄",
			responses: {
				200: {
					description: "成功刪除分潤記錄",
				},
			},
		}),
		validator("param", z.object({ id: z.string() })),
		async (c) => {
			const { id } = c.req.valid("param");
			const user = c.get("user");

			const result = await deleteProfitSharing(id);
			await verifyOrganizationMembership(result.organizationId, user.id);

			return c.json({ message: "記錄已成功刪除" });
		},
	)

	// 獲取 RM 列表 (移除重複路由，使用專門的 relationship-managers 路由)

	// 獲取產品列表
	.get(
		"/products",
		describeRoute({
			description: "獲取產品列表",
			responses: {
				200: {
					description: "成功獲取產品列表",
				},
			},
		}),
		validator("query", z.object({ organizationId: z.string() })),
		async (c) => {
			const { organizationId } = c.req.valid("query");
			const user = c.get("user");

			await verifyOrganizationMembership(organizationId, user.id);

			const data = await getProductsByOrganizationId(organizationId);
			return c.json({ data });
		},
	)

	// 獲取客戶列表
	.get(
		"/customers",
		describeRoute({
			description: "獲取客戶列表",
			responses: {
				200: {
					description: "成功獲取客戶列表",
				},
			},
		}),
		validator("query", z.object({ organizationId: z.string() })),
		async (c) => {
			const { organizationId } = c.req.valid("query");
			const user = c.get("user");

			await verifyOrganizationMembership(organizationId, user.id);

			const data = await getCustomersByOrganizationId(organizationId);
			return c.json({ data });
		},
	);
