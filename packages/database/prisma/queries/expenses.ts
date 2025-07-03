import { nanoid } from "nanoid";
import { db } from "../client";

export interface CreateExpenseData {
	category: string;
	amount: number;
	currency?: string;
	exchangeRate?: number;
	receiptUrl?: string;
	receiptUrls?: string[];
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
	receiptUrls?: string[];
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
	const amount = data.amount;
	const exchangeRate = data.exchangeRate || 1;
	const sgdAmount = amount * exchangeRate;

	return await db.expense.create({
		data: {
			id: nanoid(),
			...data,
			currency: data.currency || "TWD",
			exchangeRate: exchangeRate,
			sgdAmount: sgdAmount,
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
	// 獲取現有資料以計算sgdAmount
	const existingExpense = await db.expense.findUnique({
		where: { id },
		select: { amount: true, exchangeRate: true },
	});

	if (!existingExpense) {
		throw new Error("Expense not found");
	}

	// 計算新的sgdAmount
	const amount =
		data.amount !== undefined ? data.amount : existingExpense.amount;
	const exchangeRate =
		data.exchangeRate !== undefined
			? data.exchangeRate
			: existingExpense.exchangeRate;
	const sgdAmount = Number(amount) * Number(exchangeRate);

	return await db.expense.update({
		where: {
			id,
		},
		data: {
			...data,
			sgdAmount: sgdAmount,
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
