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

	// RM1 資訊
	rm1Id: z.string().optional(),
	rm1Name: z.string().optional(),
	rm1ProfitSharePercent: z.number().min(0).max(100).optional(),
	rm1RevenueOriginal: z.number().min(0).optional(),
	rm1RevenueUSD: z.number().min(0).optional(),

	// RM2 資訊
	rm2Id: z.string().optional(),
	rm2Name: z.string().optional(),
	rm2ProfitSharePercent: z.number().min(0).max(100).optional(),
	rm2RevenueOriginal: z.number().min(0).optional(),
	rm2RevenueUSD: z.number().min(0).optional(),

	// Finder1 資訊
	finder1Id: z.string().optional(),
	finder1Name: z.string().optional(),
	finder1ProfitSharePercent: z.number().min(0).max(100).optional(),
	finder1RevenueOriginal: z.number().min(0).optional(),
	finder1RevenueUSD: z.number().min(0).optional(),

	// Finder2 資訊
	finder2Id: z.string().optional(),
	finder2Name: z.string().optional(),
	finder2ProfitSharePercent: z.number().min(0).max(100).optional(),
	finder2RevenueOriginal: z.number().min(0).optional(),
	finder2RevenueUSD: z.number().min(0).optional(),

	// 其他計算欄位
	shareable: z.number().min(0).optional(),
	rmRevenueOriginal: z.number().min(0).optional(),
	findersRevenueOriginal: z.number().min(0).optional(),
	companyRevenueOriginal: z.number().min(0).optional(),
	rmRevenueUSD: z.number().min(0).optional(),
	findersRevenueUSD: z.number().min(0).optional(),
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
				bankAccountId: item.bankAccountId || null,
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

				// RM1 資訊
				rm1Id: item.rm1Id || null,
				rm1Name: item.rm1Name || null,
				rm1ProfitSharePercent: item.rm1ProfitSharePercent
					? Number(item.rm1ProfitSharePercent)
					: null,
				rm1RevenueOriginal: item.rm1RevenueOriginal
					? Number(item.rm1RevenueOriginal)
					: null,
				rm1RevenueUSD: item.rm1RevenueUSD
					? Number(item.rm1RevenueUSD)
					: null,

				// RM2 資訊
				rm2Id: item.rm2Id || null,
				rm2Name: item.rm2Name || null,
				rm2ProfitSharePercent: item.rm2ProfitSharePercent
					? Number(item.rm2ProfitSharePercent)
					: null,
				rm2RevenueOriginal: item.rm2RevenueOriginal
					? Number(item.rm2RevenueOriginal)
					: null,
				rm2RevenueUSD: item.rm2RevenueUSD
					? Number(item.rm2RevenueUSD)
					: null,

				// Finder1 資訊
				finder1Id: item.finder1Id || null,
				finder1Name: item.finder1Name || null,
				finder1ProfitSharePercent: item.finder1ProfitSharePercent
					? Number(item.finder1ProfitSharePercent)
					: null,
				finder1RevenueOriginal: item.finder1RevenueOriginal
					? Number(item.finder1RevenueOriginal)
					: null,
				finder1RevenueUSD: item.finder1RevenueUSD
					? Number(item.finder1RevenueUSD)
					: null,

				// Finder2 資訊
				finder2Id: item.finder2Id || null,
				finder2Name: item.finder2Name || null,
				finder2ProfitSharePercent: item.finder2ProfitSharePercent
					? Number(item.finder2ProfitSharePercent)
					: null,
				finder2RevenueOriginal: item.finder2RevenueOriginal
					? Number(item.finder2RevenueOriginal)
					: null,
				finder2RevenueUSD: item.finder2RevenueUSD
					? Number(item.finder2RevenueUSD)
					: null,

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
