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
	rmId?: string | null;
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
	rmId?: string | null;
}

export async function getExpensesByOrganizationId(organizationId: string) {
	console.log("獲取支出記錄 - organizationId:", organizationId);

	const expenses = await db.expense.findMany({
		where: {
			organizationId,
		},
		include: {
			rm: {
				select: {
					id: true,
					name: true,
				},
			},
		},
		orderBy: {
			date: "desc",
		},
	});

	console.log("找到支出記錄數量:", expenses.length);

	// 檢查並清理無效的 RM 關聯
	const expensesWithInvalidRM = expenses.filter(
		(expense) => expense.rmId && !expense.rm,
	);

	if (expensesWithInvalidRM.length > 0) {
		console.log(
			`發現 ${expensesWithInvalidRM.length} 筆無效的 RM 關聯，正在清理...`,
		);

		// 批量清理無效的 rmId
		await db.expense.updateMany({
			where: {
				id: {
					in: expensesWithInvalidRM.map((e) => e.id),
				},
			},
			data: {
				rmId: null,
			},
		});

		console.log("已清理無效的 RM 關聯");

		// 重新查詢更新後的數據
		return await db.expense.findMany({
			where: {
				organizationId,
			},
			include: {
				rm: {
					select: {
						id: true,
						name: true,
					},
				},
			},
			orderBy: {
				date: "desc",
			},
		});
	}

	return expenses;
}

export async function createExpense(data: CreateExpenseData) {
	const amount = data.amount;
	const exchangeRate = data.exchangeRate || 1;
	const usdRate = data.usdRate || 1;
	const sgdAmount = amount * exchangeRate;
	const usdAmount = amount * usdRate;

	// 處理 rmId，確保空字串轉換為 null，並驗證 rmId 的有效性
	let processedRmId = data.rmId;
	if (
		processedRmId === "" ||
		processedRmId === "none" ||
		processedRmId === undefined
	) {
		processedRmId = null;
	} else if (processedRmId) {
		// 驗證 rmId 是否存在於 RelationshipManager 表中
		const rmExists = await db.relationshipManager.findUnique({
			where: { id: processedRmId },
			select: { id: true },
		});
		if (!rmExists) {
			processedRmId = null;
		}
	}

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
			rmId: processedRmId,
			organizationId: data.organizationId,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		include: {
			rm: {
				select: {
					id: true,
					name: true,
				},
			},
		},
	});
}

export async function getExpenseById(id: string) {
	return await db.expense.findUnique({
		where: {
			id,
		},
		include: {
			rm: {
				select: {
					id: true,
					name: true,
				},
			},
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

	// 處理 rmId，確保空字串轉換為 null，並驗證 rmId 的有效性
	let processedRmId = data.rmId;
	if (
		processedRmId === "" ||
		processedRmId === "none" ||
		processedRmId === undefined
	) {
		processedRmId = null;
	} else if (processedRmId) {
		// 驗證 rmId 是否存在於 RelationshipManager 表中
		const rmExists = await db.relationshipManager.findUnique({
			where: { id: processedRmId },
			select: { id: true },
		});
		if (!rmExists) {
			processedRmId = null;
		}
	}

	// 準備更新的資料，只包含提供的欄位
	const updateData: any = {
		sgdAmount: sgdAmount,
		usdAmount: usdAmount,
		updatedAt: new Date(),
	};

	// 只在有提供值時才更新這些欄位
	if (data.category !== undefined) {
		updateData.category = data.category;
	}
	if (data.amount !== undefined) {
		updateData.amount = data.amount;
	}
	if (data.currency !== undefined) {
		updateData.currency = data.currency;
	}
	if (data.exchangeRate !== undefined) {
		updateData.exchangeRate = data.exchangeRate;
	}
	if (data.usdRate !== undefined) {
		updateData.usdRate = data.usdRate;
	}
	if (data.receiptUrl !== undefined) {
		updateData.receiptUrl = data.receiptUrl;
	}
	if (data.receiptUrls !== undefined) {
		updateData.receiptUrls = data.receiptUrls;
	}
	if (data.description !== undefined) {
		updateData.description = data.description;
	}
	if (data.date !== undefined) {
		updateData.date = data.date;
	}
	if (data.rmId !== undefined) {
		updateData.rmId = processedRmId;
	}

	return await db.expense.update({
		where: {
			id,
		},
		data: updateData,
		include: {
			rm: {
				select: {
					id: true,
					name: true,
				},
			},
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
