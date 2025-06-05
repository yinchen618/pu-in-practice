import { db } from "../client";

export async function getProductsByOrganizationId(organizationId: string) {
	return db.product.findMany({
		where: {
			organizationId,
		},
		orderBy: {
			createdAt: "desc",
		},
	});
}

export async function getProductById(id: string) {
	return db.product.findUnique({
		where: {
			id,
		},
	});
}

export async function createProduct(data: {
	name: string;
	code: string;
	category: string;
	description?: string;
	price?: number;
	currency?: string;
	organizationId: string;
}) {
	return db.product.create({
		data,
	});
}

export async function updateProduct(
	id: string,
	data: {
		name?: string;
		code?: string;
		category?: string;
		description?: string;
		status?: string;
		price?: number;
		currency?: string;
	},
) {
	return db.product.update({
		where: {
			id,
		},
		data,
	});
}

export async function deleteProduct(id: string) {
	return db.product.delete({
		where: {
			id,
		},
	});
}

export async function getProductByCode(organizationId: string, code: string) {
	return db.product.findUnique({
		where: {
			organizationId_code: {
				organizationId,
				code,
			},
		},
	});
}
