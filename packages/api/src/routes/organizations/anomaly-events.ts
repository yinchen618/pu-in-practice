import {
	type CreateAnomalyEventData,
	type UpdateAnomalyEventData,
	createAnomalyEvent,
	deleteAnomalyEvent,
	getAnomalyEventById,
	getAnomalyEventsByOrganizationId,
	reviewAnomalyEvent,
	updateAnomalyEvent,
} from "@repo/database";
import { Hono } from "hono";
import { validator } from "hono-openapi/zod";
import { z } from "zod";
import { authMiddleware } from "../../middleware/auth";
import { verifyOrganizationMembership } from "./lib/membership";

const GetEventsSchema = z.object({
	organizationId: z.string(),
	status: z
		.enum(["UNREVIEWED", "CONFIRMED_POSITIVE", "REJECTED_NORMAL"])
		.optional(),
	meterId: z.string().optional(),
	search: z.string().optional(),
	dateFrom: z.string().optional(),
	dateTo: z.string().optional(),
	page: z.coerce.number().min(1).default(1),
	limit: z.coerce.number().min(1).max(100).default(50),
});

const CreateEventSchema = z.object({
	eventId: z.string().min(1, "事件ID是必填的"),
	meterId: z.string().min(1, "電錶ID是必填的"),
	eventTimestamp: z.string().datetime("事件時間格式不正確"),
	detectionRule: z.string().min(1, "檢測規則是必填的"),
	score: z.number().min(0, "評分不能為負數"),
	dataWindow: z.object({
		timestamps: z.array(z.string()),
		values: z.array(z.number()),
	}),
	organizationId: z.string().min(1, "組織ID是必填的"),
});

const ReviewEventSchema = z.object({
	status: z.enum(["CONFIRMED_POSITIVE", "REJECTED_NORMAL"]),
	reviewerId: z.string().min(1, "審核者ID是必填的"),
	justificationNotes: z.string().optional(),
	labelIds: z.array(z.string()).optional(),
});

const UpdateEventSchema = CreateEventSchema.partial();

export const anomalyEventsRouter = new Hono()
	.use(authMiddleware)
	.get("/anomaly-events", validator("query", GetEventsSchema), async (c) => {
		const { organizationId, ...filters } = c.req.valid("query");
		const user = c.get("user");

		await verifyOrganizationMembership(organizationId, user.id);

		// 轉換日期字串為 Date 物件
		const processedFilters = {
			...filters,
			dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
			dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
		};

		const data = await getAnomalyEventsByOrganizationId(
			organizationId,
			processedFilters,
			filters.page,
			filters.limit,
		);

		return c.json({
			success: true,
			data,
			message: `成功獲取 ${data.events.length} 個異常事件`,
		});
	})
	.get(
		"/anomaly-events/:id",
		validator("param", z.object({ id: z.string() })),
		async (c) => {
			const { id } = c.req.valid("param");
			const user = c.get("user");

			const event = await getAnomalyEventById(id);
			if (!event) {
				return c.json(
					{
						success: false,
						message: "異常事件不存在",
					},
					404,
				);
			}

			await verifyOrganizationMembership(event.organizationId, user.id);

			return c.json({
				success: true,
				data: event,
				message: "成功獲取異常事件詳情",
			});
		},
	)
	.post(
		"/anomaly-events",
		validator("json", CreateEventSchema),
		async (c) => {
			const data = c.req.valid("json");
			const user = c.get("user");

			await verifyOrganizationMembership(data.organizationId, user.id);

			const eventData: CreateAnomalyEventData = {
				...data,
				eventTimestamp: new Date(data.eventTimestamp),
			};

			const result = await createAnomalyEvent(eventData);
			return c.json(
				{
					success: true,
					data: result,
					message: "成功創建異常事件",
				},
				201,
			);
		},
	)
	.put(
		"/anomaly-events/:id",
		validator("param", z.object({ id: z.string() })),
		validator("json", UpdateEventSchema),
		async (c) => {
			const { id } = c.req.valid("param");
			const data = c.req.valid("json");
			const user = c.get("user");

			const existingEvent = await getAnomalyEventById(id);
			if (!existingEvent) {
				return c.json(
					{
						success: false,
						message: "異常事件不存在",
					},
					404,
				);
			}

			await verifyOrganizationMembership(
				existingEvent.organizationId,
				user.id,
			);

			const updateData: UpdateAnomalyEventData = {
				...data,
				eventTimestamp: data.eventTimestamp
					? new Date(data.eventTimestamp)
					: undefined,
			};

			const result = await updateAnomalyEvent(id, updateData);
			return c.json({
				success: true,
				data: result,
				message: "成功更新異常事件",
			});
		},
	)
	.patch(
		"/anomaly-events/:id/review",
		validator("param", z.object({ id: z.string() })),
		validator("json", ReviewEventSchema),
		async (c) => {
			const { id } = c.req.valid("param");
			const reviewData = c.req.valid("json");
			const user = c.get("user");

			const existingEvent = await getAnomalyEventById(id);
			if (!existingEvent) {
				return c.json(
					{
						success: false,
						message: "異常事件不存在",
					},
					404,
				);
			}

			await verifyOrganizationMembership(
				existingEvent.organizationId,
				user.id,
			);

			const result = await reviewAnomalyEvent(id, reviewData);
			return c.json({
				success: true,
				data: result,
				message: "成功審核異常事件",
			});
		},
	)
	.delete(
		"/anomaly-events/:id",
		validator("param", z.object({ id: z.string() })),
		async (c) => {
			const { id } = c.req.valid("param");
			const user = c.get("user");

			const existingEvent = await getAnomalyEventById(id);
			if (!existingEvent) {
				return c.json(
					{
						success: false,
						message: "異常事件不存在",
					},
					404,
				);
			}

			await verifyOrganizationMembership(
				existingEvent.organizationId,
				user.id,
			);

			await deleteAnomalyEvent(id);
			return c.json({
				success: true,
				message: "成功刪除異常事件",
			});
		},
	);
