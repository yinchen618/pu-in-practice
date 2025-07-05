import { nanoid } from "nanoid";
import { db } from "../client";

export interface CreateExpenseData {
	category: string;
	amount: number;
	currency?: string;
	exchangeRate?: number;
	usdRate?: number;
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
	usdRate?: number;
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
	const usdRate = data.usdRate || 1;
	const sgdAmount = amount * exchangeRate;
	const usdAmount = amount * usdRate;

	return await db.expense.create({
		data: {
			id: nanoid(),
			category: data.category,
			amount: data.amount,
			currency: data.currency || "TWD",
			exchangeRate: exchangeRate,
			usdRate: usdRate,
			sgdAmount: sgdAmount,
			usdAmount: usdAmount,
			receiptUrl: data.receiptUrl,
			receiptUrls: data.receiptUrls || [],
			description: data.description,
			date: data.date || new Date(),
			organizationId: data.organizationId,
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
	// 獲取現有資料以計算sgdAmount和usdAmount
	const existingExpense = await db.expense.findUnique({
		where: { id },
		select: { amount: true, exchangeRate: true, usdRate: true },
	});

	if (!existingExpense) {
		throw new Error("Expense not found");
	}

	// 計算新的sgdAmount和usdAmount
	const amount =
		data.amount !== undefined ? data.amount : existingExpense.amount;
	const exchangeRate =
		data.exchangeRate !== undefined
			? data.exchangeRate
			: existingExpense.exchangeRate;
	const usdRate =
		data.usdRate !== undefined ? data.usdRate : existingExpense.usdRate;
	const sgdAmount = Number(amount) * Number(exchangeRate);
	const usdAmount = Number(amount) * Number(usdRate);

	return await db.expense.update({
		where: {
			id,
		},
		data: {
			category: data.category,
			amount: data.amount,
			currency: data.currency,
			exchangeRate: data.exchangeRate,
			usdRate: data.usdRate,
			receiptUrl: data.receiptUrl,
			receiptUrls: data.receiptUrls,
			description: data.description,
			date: data.date,
			sgdAmount: sgdAmount,
			usdAmount: usdAmount,
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
