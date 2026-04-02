import { number } from "zod";
import { prisma, ensureDatabaseSchema, addDefaultsForUser } from "../database.js";

export async function getLedgers(userId: number) {
    await ensureDatabaseSchema();

    const count = await prisma.ledger.count({ where: { userId } as any });

    if (count === 0) {
        await addDefaultsForUser(userId);
    }

    return prisma.ledger.findMany({ where: { userId } as any, orderBy: { number: "asc" } });
}

export async function createLedger(
    userId: number,
    ledger: {
        number: number,
        name: string,
        type: string,
        category: string,
        systemMade: boolean,
    }
){
    const exists = await ledgerNumberExists(userId, ledger.number);
    if(exists){
        throw new Error(`Ledger number ${ledger.number} already exists`);
    }

    try {
        return await prisma.ledger.create({
            data: {
                userId,
                number: ledger.number,
                name: ledger.name,
                type: ledger.type,
                category: ledger.category,
                systemMade: ledger.systemMade,
            }
        });
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function ledgerNumberExists(userId: number, number: number){
    const response = await prisma.ledger.findFirst({
        where: {userId, number}
    });

    return !!response;
}

export async function deleteLedger(userId: number, ledgerId: number){
    const ledger = await prisma.ledger.findUnique({
        where: { id: ledgerId }
    });

    if (!ledger || ledger.userId !== userId) {
        throw new Error("Ledger not found or unauthorized");
    }

    await prisma.ledger.delete({
        where: { id: ledgerId }
    });
}

export async function updateLedger(
    userId: number, 
    ledgerId: number,
    ledger: {
        number: number,
        name: string,
        type: string,
        category: string,
    }
) {
    const existing = await prisma.ledger.findUnique({
        where: { id: ledgerId }
    });

    if (!existing || existing.userId !== userId) {
        throw new Error("Ledger not found or unauthorized");
    }

    try {
        return await prisma.ledger.update({
            where: { id: ledgerId },
            data: ledger
        });
    } catch (error) {
        console.error(error);
        throw error;
    }
}