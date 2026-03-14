import { prisma } from "../database.js";

export async function getUserById(userID: number) {
	return prisma.customer.findUnique({
		where: { userID },
	});
}
