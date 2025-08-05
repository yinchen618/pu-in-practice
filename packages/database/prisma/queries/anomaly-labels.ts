import { db } from "../client";

export interface CreateAnomalyLabelData {
	name: string;
	description?: string;
	organizationId: string;
}

export interface UpdateAnomalyLabelData {
	name?: string;
	description?: string;
}

// 創建異常標籤
export async function createAnomalyLabel(data: CreateAnomalyLabelData) {
	return await db.anomalyLabel.create({
		data,
	});
}

// 獲取組織的所有異常標籤
export async function getAnomalyLabelsByOrganizationId(organizationId: string) {
	return await db.anomalyLabel.findMany({
		where: { organizationId },
		orderBy: { name: "asc" },
	});
}

// 根據 ID 獲取異常標籤
export async function getAnomalyLabelById(id: string) {
	return await db.anomalyLabel.findUnique({
		where: { id },
	});
}

// 更新異常標籤
export async function updateAnomalyLabel(
	id: string,
	data: UpdateAnomalyLabelData,
) {
	return await db.anomalyLabel.update({
		where: { id },
		data,
	});
}

// 刪除異常標籤
export async function deleteAnomalyLabel(id: string) {
	return await db.anomalyLabel.delete({
		where: { id },
	});
}

// 檢查標籤名稱是否在組織內重複
export async function checkAnomalyLabelNameExists(
	organizationId: string,
	name: string,
	excludeId?: string,
) {
	const where: any = {
		organizationId,
		name,
	};

	if (excludeId) {
		where.id = { not: excludeId };
	}

	const existingLabel = await db.anomalyLabel.findFirst({ where });
	return !!existingLabel;
}
