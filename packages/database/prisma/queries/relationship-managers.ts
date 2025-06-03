import { nanoid } from "nanoid";
import { db } from "../client";

export interface CreateRelationshipManagerData {
	name: string;
	email: string;
	phone?: string;
	organizationId: string;
}

export interface UpdateRelationshipManagerData {
	name?: string;
	email?: string;
	phone?: string;
	status?: "active" | "inactive";
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
			id: nanoid(),
			...data,
			createdAt: new Date(),
			updatedAt: new Date(),
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
		where: {
			id,
		},
		data: {
			...data,
			updatedAt: new Date(),
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
