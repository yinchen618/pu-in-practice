import { nanoid } from "nanoid";
import { db } from "../client";

export interface CreateExpenseData {
	category: string;
	amount: number;
	currency?: string;
	exchangeRate?: number;
	receiptUrl?: string;
	description?: string;
	date?: Date;
	organizationId: string;
}

export interface UpdateExpenseData {
	category?: string;
	amount?: number;
	currency?: string;
	exchangeRate?: number;
	receiptUrl?: string;
	description?: string;
	date?: Date;
}

export async function getExpensesByOrganizationId(organizationId: string) {
	return await db.expense.findMany({
		where: {
			organizationId,
		},
		orderBy: {
			date: "desc",
		},
	});
}

export async function createExpense(data: CreateExpenseData) {
	return await db.expense.create({
		data: {
			id: nanoid(),
			...data,
			currency: data.currency || "TWD",
			exchangeRate: data.exchangeRate || 1,
			date: data.date || new Date(),
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	});
}

export async function getExpenseById(id: string) {
	return await db.expense.findUnique({
		where: {
			id,
		},
	});
}

export async function updateExpense(id: string, data: UpdateExpenseData) {
	return await db.expense.update({
		where: {
			id,
		},
		data: {
			...data,
			updatedAt: new Date(),
		},
	});
}

export async function deleteExpense(id: string) {
	return await db.expense.delete({
		where: {
			id,
		},
	});
}
