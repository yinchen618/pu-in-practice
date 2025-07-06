import { db } from "../client";

export interface CreateAssetTransactionData {
	customerId: string;
	date: Date;
	currency: string;
	type: "IN" | "OUT";
	amount: number;
	description?: string;
}

export interface UpdateAssetTransactionData {
	date?: Date;
	currency?: string;
	type?: "IN" | "OUT";
	amount?: number;
	description?: string;
}

export async function createAssetTransaction(data: CreateAssetTransactionData) {
	return await db.assetTransaction.create({
		data: {
			customerId: data.customerId,
			date: data.date,
			currency: data.currency,
			type: data.type,
			amount: data.amount,
			description: data.description,
		},
	});
}

export async function getAssetTransactionsByCustomerId(customerId: string) {
	return await db.assetTransaction.findMany({
		where: { customerId },
		orderBy: { date: "desc" },
	});
}

export async function updateAssetTransaction(
	id: string,
	data: UpdateAssetTransactionData,
) {
	return await db.assetTransaction.update({
		where: { id },
		data: {
			date: data.date,
			currency: data.currency,
			type: data.type,
			amount: data.amount,
			description: data.description,
		},
	});
}

export async function deleteAssetTransaction(id: string) {
	return await db.assetTransaction.delete({
		where: { id },
	});
}

export async function getAssetTransactionById(id: string) {
	return await db.assetTransaction.findUnique({
		where: { id },
	});
}
