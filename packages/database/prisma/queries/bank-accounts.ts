import { nanoid } from "nanoid";
import { db } from "../client";

export interface CreateBankAccountData {
	bankName: string;
	accountName: string;
	accountNumber: string;
	currency?: string;
	balance?: number;
	organizationId: string;
}

export interface UpdateBankAccountData {
	bankName?: string;
	accountName?: string;
	accountNumber?: string;
	currency?: string;
	balance?: number;
	status?: "active" | "inactive";
}

export async function getBankAccountsByOrganizationId(organizationId: string) {
	return await db.bankAccount.findMany({
		where: {
			organizationId,
		},
		orderBy: {
			createdAt: "desc",
		},
	});
}

export async function createBankAccount(data: CreateBankAccountData) {
	return await db.bankAccount.create({
		data: {
			id: nanoid(),
			...data,
			balance: data.balance || 0,
			currency: data.currency || "TWD",
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	});
}

export async function getBankAccountById(id: string) {
	return await db.bankAccount.findUnique({
		where: {
			id,
		},
	});
}

export async function updateBankAccount(
	id: string,
	data: UpdateBankAccountData,
) {
	return await db.bankAccount.update({
		where: {
			id,
		},
		data: {
			...data,
			updatedAt: new Date(),
		},
	});
}

export async function deleteBankAccount(id: string) {
	return await db.bankAccount.delete({
		where: {
			id,
		},
	});
}
