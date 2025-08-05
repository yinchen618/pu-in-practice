import type { AnomalyEventStatus } from "@prisma/client";
import { db } from "../client";

export interface CreateAnomalyEventData {
	eventId: string;
	meterId: string;
	eventTimestamp: Date;
	detectionRule: string;
	score: number;
	dataWindow: {
		timestamps: string[];
		values: number[];
	};
	organizationId: string;
}

export interface UpdateAnomalyEventData {
	status?: AnomalyEventStatus;
	reviewerId?: string;
	reviewTimestamp?: Date;
	justificationNotes?: string;
}

export interface AnomalyEventFilters {
	status?: AnomalyEventStatus;
	meterId?: string;
	search?: string;
	dateFrom?: Date;
	dateTo?: Date;
}

// 創建異常事件
export async function createAnomalyEvent(data: CreateAnomalyEventData) {
	return await db.anomalyEvent.create({
		data: {
			eventId: data.eventId,
			meterId: data.meterId,
			eventTimestamp: data.eventTimestamp,
			detectionRule: data.detectionRule,
			score: data.score,
			dataWindow: data.dataWindow,
			organizationId: data.organizationId,
		},
	});
}

// 獲取異常事件列表（不包含 dataWindow 以節省流量）
export async function getAnomalyEventsByOrganizationId(
	organizationId: string,
	filters: AnomalyEventFilters = {},
	page = 1,
	limit = 50,
) {
	const where: any = {
		organizationId,
	};

	if (filters.status) {
		where.status = filters.status;
	}

	if (filters.meterId) {
		where.meterId = filters.meterId;
	}

	if (filters.search) {
		where.OR = [
			{ eventId: { contains: filters.search, mode: "insensitive" } },
			{ meterId: { contains: filters.search, mode: "insensitive" } },
			{
				detectionRule: {
					contains: filters.search,
					mode: "insensitive",
				},
			},
		];
	}

	if (filters.dateFrom || filters.dateTo) {
		where.eventTimestamp = {};
		if (filters.dateFrom) {
			where.eventTimestamp.gte = filters.dateFrom;
		}
		if (filters.dateTo) {
			where.eventTimestamp.lte = filters.dateTo;
		}
	}

	const [events, total] = await Promise.all([
		db.anomalyEvent.findMany({
			where,
			select: {
				id: true,
				eventId: true,
				meterId: true,
				eventTimestamp: true,
				detectionRule: true,
				score: true,
				status: true,
				reviewerId: true,
				reviewTimestamp: true,
				justificationNotes: true,
				createdAt: true,
				updatedAt: true,
				// 不包含 dataWindow
			},
			orderBy: { eventTimestamp: "desc" },
			skip: (page - 1) * limit,
			take: limit,
		}),
		db.anomalyEvent.count({ where }),
	]);

	return {
		events,
		total,
		page,
		limit,
		totalPages: Math.ceil(total / limit),
	};
}

// 獲取單個異常事件的完整資訊（包含 dataWindow）
export async function getAnomalyEventById(id: string) {
	return await db.anomalyEvent.findUnique({
		where: { id },
		include: {
			eventLabelLinks: {
				include: {
					label: true,
				},
			},
		},
	});
}

// 根據 eventId 獲取異常事件
export async function getAnomalyEventByEventId(eventId: string) {
	return await db.anomalyEvent.findUnique({
		where: { eventId },
		include: {
			eventLabelLinks: {
				include: {
					label: true,
				},
			},
		},
	});
}

// 更新異常事件
export async function updateAnomalyEvent(
	id: string,
	data: UpdateAnomalyEventData,
) {
	return await db.anomalyEvent.update({
		where: { id },
		data,
	});
}

// 審核異常事件（包含標籤）
export async function reviewAnomalyEvent(
	id: string,
	reviewData: {
		status: AnomalyEventStatus;
		reviewerId: string;
		justificationNotes?: string;
		labelIds?: string[];
	},
) {
	const { labelIds, ...eventData } = reviewData;

	// 使用事務確保數據一致性
	return await db.$transaction(async (tx) => {
		// 更新事件狀態
		const updatedEvent = await tx.anomalyEvent.update({
			where: { id },
			data: {
				...eventData,
				reviewTimestamp: new Date(),
			},
		});

		// 如果提供了標籤，先刪除舊的關聯，再創建新的
		if (labelIds !== undefined) {
			// 刪除現有標籤關聯
			await tx.eventLabelLink.deleteMany({
				where: { eventId: id },
			});

			// 創建新的標籤關聯
			if (labelIds.length > 0) {
				await tx.eventLabelLink.createMany({
					data: labelIds.map((labelId) => ({
						eventId: id,
						labelId,
					})),
				});
			}
		}

		return updatedEvent;
	});
}

// 刪除異常事件
export async function deleteAnomalyEvent(id: string) {
	return await db.anomalyEvent.delete({
		where: { id },
	});
}

// 獲取統計資訊
export async function getAnomalyEventStats(organizationId: string) {
	const [total, unreviewed, confirmed, rejected] = await Promise.all([
		db.anomalyEvent.count({
			where: { organizationId },
		}),
		db.anomalyEvent.count({
			where: { organizationId, status: "UNREVIEWED" },
		}),
		db.anomalyEvent.count({
			where: { organizationId, status: "CONFIRMED_POSITIVE" },
		}),
		db.anomalyEvent.count({
			where: { organizationId, status: "REJECTED_NORMAL" },
		}),
	]);

	return {
		total,
		unreviewed,
		confirmed,
		rejected,
	};
}
