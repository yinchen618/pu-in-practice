import { db } from "@repo/database";

async function main() {
	// 獲取所有沒有 code 的客戶
	const customers = await db.customer.findMany({
		where: {
			code: null,
		},
	});

	console.log(`找到 ${customers.length} 個需要更新的客戶`);

	// 為每個客戶生成並更新 code
	for (const customer of customers) {
		// 生成客戶編號：CUS + 隨機6位數字
		const code = `CUS${Math.floor(Math.random() * 900000 + 100000)}`;

		// 更新客戶
		await db.customer.update({
			where: { id: customer.id },
			data: { code },
		});

		console.log(`已更新客戶 ${customer.name} 的編號為 ${code}`);
	}

	console.log("所有客戶更新完成");
}

main()
	.catch((e) => {
		console.error("更新失敗:", e);
		process.exit(1);
	})
	.finally(async () => {
		await db.$disconnect();
	});
