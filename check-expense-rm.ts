import { db } from "./packages/database/prisma/client";

async function checkExpenseRM() {
	console.log("檢查支出 RM 關聯狀態...");

	try {
		// 檢查所有支出記錄
		const expenses = await db.expense.findMany({
			include: {
				rm: true,
			},
			take: 10,
		});

		console.log(`找到 ${expenses.length} 筆支出記錄：`);

		expenses.forEach((expense) => {
			console.log(`- 支出 ID: ${expense.id}`);
			console.log(`  rmId: ${expense.rmId}`);
			console.log(`  rm: ${expense.rm ? expense.rm.name : "null"}`);
			console.log(`  類別: ${expense.category}, 金額: ${expense.amount}`);
			console.log("---");
		});

		// 檢查所有 RM 記錄
		const rms = await db.relationshipManager.findMany({
			select: {
				id: true,
				name: true,
				category: true,
			},
		});

		console.log(`\n找到 ${rms.length} 筆 RM 記錄：`);
		rms.forEach((rm) => {
			console.log(
				`- ID: ${rm.id}, 名稱: ${rm.name}, 類別: ${rm.category}`,
			);
		});
	} catch (error) {
		console.error("檢查過程中發生錯誤:", error);
	}
}

checkExpenseRM();
