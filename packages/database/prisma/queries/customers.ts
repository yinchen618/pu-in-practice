import { nanoid } from "nanoid";
import { db } from "../client";

export interface CreateCustomerData {
	name: string;
	code: string;
	email: string;
	phone?: string;
	organizationId: string;
	rm1Id?: string;
	rm1ProfitShare?: number | null;
	rm2Id?: string;
	rm2ProfitShare?: number | null;
	finder1Id?: string;
	finder1ProfitShare?: number | null;
	finder2Id?: string;
	finder2ProfitShare?: number | null;
}

export interface UpdateCustomerData {
	name?: string;
	email?: string;
	phone?: string;
	rm1Id?: string | null;
	rm1ProfitShare?: number | null;
	rm2Id?: string | null;
	rm2ProfitShare?: number | null;
	finder1Id?: string | null;
	finder1ProfitShare?: number | null;
	finder2Id?: string | null;
	finder2ProfitShare?: number | null;
}

export async function getCustomersByOrganizationId(organizationId: string) {
	return await db.customer.findMany({
		where: {
			organizationId,
		},
		include: {
			bankAccounts: {
				select: {
					id: true,
					bankName: true,
					accountName: true,
					accountNumber: true,
					currency: true,
					balance: true,
					status: true,
				},
			},
			rm1: {
				select: {
					id: true,
					name: true,
				},
			},
			rm2: {
				select: {
					id: true,
					name: true,
				},
			},
			finder1: {
				select: {
					id: true,
					name: true,
				},
			},
			finder2: {
				select: {
					id: true,
					name: true,
				},
			},
		},
		orderBy: {
			createdAt: "desc",
		},
	});
}

export async function createCustomer(data: CreateCustomerData) {
	return await db.customer.create({
		data: {
			id: nanoid(),
			...data,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		include: {
			bankAccounts: {
				select: {
					id: true,
					bankName: true,
					accountName: true,
					accountNumber: true,
					currency: true,
					balance: true,
					status: true,
				},
			},
			rm1: {
				select: {
					id: true,
					name: true,
				},
			},
			rm2: {
				select: {
					id: true,
					name: true,
				},
			},
			finder1: {
				select: {
					id: true,
					name: true,
				},
			},
			finder2: {
				select: {
					id: true,
					name: true,
				},
			},
		},
	});
}

export async function getCustomerById(id: string) {
	return await db.customer.findUnique({
		where: {
			id,
		},
		include: {
			bankAccounts: {
				select: {
					id: true,
					bankName: true,
					accountName: true,
					accountNumber: true,
					currency: true,
					balance: true,
					status: true,
				},
			},
			rm1: {
				select: {
					id: true,
					name: true,
				},
			},
			rm2: {
				select: {
					id: true,
					name: true,
				},
			},
			finder1: {
				select: {
					id: true,
					name: true,
				},
			},
			finder2: {
				select: {
					id: true,
					name: true,
				},
			},
		},
	});
}

export async function updateCustomer(id: string, data: UpdateCustomerData) {
	return await db.customer.update({
		where: {
			id,
		},
		data: {
			...data,
			updatedAt: new Date(),
		},
		include: {
			bankAccounts: {
				select: {
					id: true,
					bankName: true,
					accountName: true,
					accountNumber: true,
					currency: true,
					balance: true,
					status: true,
				},
			},
			rm1: {
				select: {
					id: true,
					name: true,
				},
			},
			rm2: {
				select: {
					id: true,
					name: true,
				},
			},
			finder1: {
				select: {
					id: true,
					name: true,
				},
			},
			finder2: {
				select: {
					id: true,
					name: true,
				},
			},
		},
	});
}

export async function deleteCustomer(id: string) {
	return await db.customer.delete({
		where: {
			id,
		},
	});
}
