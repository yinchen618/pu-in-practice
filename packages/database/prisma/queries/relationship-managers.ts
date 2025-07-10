import { db } from "../client";

export interface CreateRelationshipManagerData {
	name: string;
	email: string;
	phone?: string;
	category?: "FINDER" | "RM" | "BOTH";
	organizationId: string;
	joinDate?: Date;
	resignDate?: Date;
	status?: "active" | "inactive";
}

export interface UpdateRelationshipManagerData {
	name?: string;
	email?: string;
	phone?: string;
	status?: "active" | "inactive";
	category?: "FINDER" | "RM" | "BOTH";
	joinDate?: Date;
	resignDate?: Date | null;
}

export async function getRelationshipManagersByOrganizationId(
	organizationId: string,
) {
	return await db.relationshipManager.findMany({
		where: {
			organizationId,
		},
		orderBy: {
			createdAt: "desc",
		},
	});
}

export async function createRelationshipManager(
	data: CreateRelationshipManagerData,
) {
	return await db.relationshipManager.create({
		data: {
			...data,
			joinDate: data.joinDate || new Date(),
			status: data.status || "active",
		},
	});
}

export async function getRelationshipManagerById(id: string) {
	return await db.relationshipManager.findUnique({
		where: {
			id,
		},
	});
}

export async function updateRelationshipManager(
	id: string,
	data: UpdateRelationshipManagerData,
) {
	return await db.relationshipManager.update({
		where: { id },
		data: {
			...data,
			// 如果有離職日期，自動設定狀態為離職
			status: data.resignDate ? "inactive" : data.status,
		},
	});
}

export async function deleteRelationshipManager(id: string) {
	return await db.relationshipManager.delete({
		where: {
			id,
		},
	});
}
