import { db } from "../client";

/**
 * 刪除 ammeter_log 表中 success 為 false 的所有記錄
 */
export async function deleteFailedAmmeterLogs() {
	const result = await db.ammeter_log.deleteMany({
		where: {
			success: false,
		},
	});

	return result;
}

/**
 * 獲取 ammeter_log 記錄
 */
export async function getAmmeterLogs(deviceNumber?: string, limit = 100) {
	const where = deviceNumber ? { deviceNumber } : {};

	return await db.ammeter_log.findMany({
		where,
		orderBy: {
			createdAt: "desc",
		},
		take: limit,
	});
}

/**
 * 獲取成功的 ammeter_log 記錄（用於歷史分析）
 */
export async function getSuccessfulAmmeterLogs(
	deviceNumber: string,
	startDate?: Date,
	endDate?: Date,
	limit = 1000,
) {
	const where: any = {
		deviceNumber,
		action: "ammeterDetail",
		success: true,
	};

	if (startDate) {
		where.createdAt = {
			...where.createdAt,
			gte: startDate,
		};
	}

	if (endDate) {
		where.createdAt = {
			...where.createdAt,
			lte: endDate,
		};
	}

	return await db.ammeter_log.findMany({
		where,
		orderBy: {
			createdAt: "desc",
		},
		take: limit,
	});
}

/**
 * 統計 ammeter_log 記錄數量
 */
export async function getAmmeterLogStats() {
	const [total, successful, failed] = await Promise.all([
		db.ammeter_log.count(),
		db.ammeter_log.count({
			where: { success: true },
		}),
		db.ammeter_log.count({
			where: { success: false },
		}),
	]);

	return {
		total,
		successful,
		failed,
		successRate: total > 0 ? (successful / total) * 100 : 0,
	};
}
