import { prisma } from "../database.js";

export async function registerUser(username: string, password: string, email: string, role: string) {
	return prisma.customer.create({
		data: {
			username,
			password,
			email,
			role,
		},
	});
}
