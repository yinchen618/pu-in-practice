import { nanoid } from "nanoid";
import { db } from "../client";

export interface CreateBankAccountData {
	bankName: string;
	accountName: string;
	accountNumber: string;
	currency?: string;
	balance?: number;
	organizationId: string;
	customerId?: string;
}

export interface UpdateBankAccountData {
	bankName?: string;
	accountName?: string;
	accountNumber?: string;
	currency?: string;
	balance?: number;
	status?: "active" | "inactive";
	customerId?: string;
}

export async function getBankAccountsByOrganizationId(organizationId: string) {
	return await db.bankAccount.findMany({
		where: {
			organizationId,
		},
		include: {
			customer: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
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
		include: {
			customer: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
		},
	});
}

export async function getBankAccountById(id: string) {
	return await db.bankAccount.findUnique({
		where: {
			id,
		},
		include: {
			customer: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
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
		include: {
			customer: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
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
