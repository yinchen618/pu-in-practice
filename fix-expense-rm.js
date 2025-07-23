const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function fixExpenseRM() {
	console.log("開始修復支出 RM 關聯...");

	try {
		// 1. 獲取所有有 rmId 但 RM 不存在的支出記錄
		const expensesWithInvalidRM = await prisma.expense.findMany({
			where: {
				rmId: {
					not: null,
				},
			},
			include: {
				rm: true,
			},
		});

		console.log(
			`找到 ${expensesWithInvalidRM.length} 筆有 rmId 的支出記錄`,
		);

		// 2. 檢查哪些 rmId 在 RelationshipManager 表中不存在
		const invalidExpenses = expensesWithInvalidRM.filter(
			(expense) => !expense.rm,
		);

		console.log(`其中 ${invalidExpenses.length} 筆的 RM 關聯無效`);

		if (invalidExpenses.length > 0) {
			console.log("無效的支出記錄：");
			invalidExpenses.forEach((expense) => {
				console.log(
					`- 支出 ID: ${expense.id}, rmId: ${expense.rmId}, 類別: ${expense.category}, 金額: ${expense.amount}`,
				);
			});

			// 3. 清理無效的 rmId
			const result = await prisma.expense.updateMany({
				where: {
					id: {
						in: invalidExpenses.map((e) => e.id),
					},
				},
				data: {
					rmId: null,
				},
			});

			console.log(`已清理 ${result.count} 筆無效的 RM 關聯`);
		}

		// 4. 顯示所有可用的 RelationshipManager
		const allRMs = await prisma.relationshipManager.findMany({
			select: {
				id: true,
				name: true,
				category: true,
			},
		});

		console.log("\n可用的 RM 列表：");
		allRMs.forEach((rm) => {
			console.log(
				`- ID: ${rm.id}, 名稱: ${rm.name}, 類別: ${rm.category}`,
			);
		});

		// 5. 檢查修復後的狀態
		const validExpenses = await prisma.expense.findMany({
			where: {
				rmId: {
					not: null,
				},
			},
			include: {
				rm: true,
			},
		});

		console.log(
			`\n修復後，${validExpenses.length} 筆支出記錄有有效的 RM 關聯`,
		);
	} catch (error) {
		console.error("修復過程中發生錯誤:", error);
	} finally {
		await prisma.$disconnect();
	}
}

fixExpenseRM();
