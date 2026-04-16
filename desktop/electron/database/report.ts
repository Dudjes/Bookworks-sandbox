import { prisma } from "../database.js";

export async function getReportByYear(year:number, userId:number){
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31T23:59:59`);
    
    try {
        const transactions = await prisma.transaction.findMany({
            where: {
                createdById: userId,
                transactionHeader: {
                    date: {
                        gte: startDate,
                        lte: endDate,
                    }
                },
                ledger: {
                    number: {
                        gte: 4000
                    }
                }
            },
            include: {
                transactionHeader: true,
                ledger: true,
            }
        });
    
        // Convert Decimal types to numbers for IPC serialization
        return transactions.map(t => ({
            ...t,
            amount: Number(t.amount),
            vatAmount: Number(t.vatAmount),
            transactionHeader: {
                ...t.transactionHeader,
                totalPre: Number(t.transactionHeader.totalPre),
                totalPost: Number(t.transactionHeader.totalPost),
                vatAmount: Number(t.transactionHeader.vatAmount),
                TotalIncl: Number(t.transactionHeader.TotalIncl),
            }
        }));
    } catch (error) {
        throw new Error(`report:getReportByYear failed: ${error}`);
    }
}

export async function getReportByQuarter(year:number, quarter:number, userId:number){
    //calculate quarter dates
    const quarterMonths = {
        1: { start: 1, end: 3 },
        2: { start: 4, end: 6 },
        3: { start: 7, end: 9 },
        4: { start: 10, end: 12 }
    };

    if (quarter < 1 || quarter > 4) {
        throw new Error(`Invalid quarter: ${quarter}. Must be 1-4`);
    }

    const { start: startMonth, end: endMonth } = quarterMonths[quarter as keyof typeof quarterMonths];
    const startDate = new Date(`${year}-${String(startMonth).padStart(2, '0')}-01`);
    const endDate = new Date(`${year}-${String(endMonth).padStart(2, '0')}-${new Date(year, endMonth, 0).getDate()}T23:59:59`);

    try {
        const transactions = await prisma.transaction.findMany({
            where: {
                createdById: userId,
                transactionHeader: {
                    date: {
                        gte: startDate,
                        lte: endDate,
                    }
                },
                ledger: {
                    number: {
                        gte: 4000
                    }
                }
            },
            include: {
                transactionHeader: true,
                ledger: true,
            }
        });

        // Convert Decimal types to numbers for IPC serialization
        return transactions.map(t => ({
            ...t,
            amount: Number(t.amount),
            vatAmount: Number(t.vatAmount),
            transactionHeader: {
                ...t.transactionHeader,
                totalPre: Number(t.transactionHeader.totalPre),
                totalPost: Number(t.transactionHeader.totalPost),
                vatAmount: Number(t.transactionHeader.vatAmount),
                TotalIncl: Number(t.transactionHeader.TotalIncl),
            }
        }));
    } catch (error) {
        throw new Error(`report:getReportByQuarter failed: ${error}`);
    }
}

export async function getBalansByYear(year:number, userId:number){
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31T23:59:59`);
    
    try {
        const transactions = await prisma.transaction.findMany({
            where: {
                createdById: userId,
                transactionHeader: {
                    date: {
                        gte: startDate,
                        lte: endDate,
                    }
                },
                ledger: {
                    number: {
                        lte: 3999
                    }
                }
            },
            include: {
                transactionHeader: true,
                ledger: true,
            }
        });
    
        // Convert Decimal types to numbers for IPC serialization
        return transactions.map(t => ({
            ...t,
            amount: Number(t.amount),
            vatAmount: Number(t.vatAmount),
            transactionHeader: {
                ...t.transactionHeader,
                totalPre: Number(t.transactionHeader.totalPre),
                totalPost: Number(t.transactionHeader.totalPost),
                vatAmount: Number(t.transactionHeader.vatAmount),
                TotalIncl: Number(t.transactionHeader.TotalIncl),
            }
        }));
    } catch (error) {
        throw new Error(`report:getBalansByYear failed: ${error}`);
    }
}

export async function getBalansByPeriod(year:number, quarter:number, userId:number){
    //calculate quarter dates
    const quarterMonths = {
        1: { start: 1, end: 3 },
        2: { start: 4, end: 6 },
        3: { start: 7, end: 9 },
        4: { start: 10, end: 12 }
    };

    if (quarter < 1 || quarter > 4) {
        throw new Error(`Invalid quarter: ${quarter}. Must be 1-4`);
    }

    const { start: startMonth, end: endMonth } = quarterMonths[quarter as keyof typeof quarterMonths];
    const startDate = new Date(`${year}-${String(startMonth).padStart(2, '0')}-01`);
    const endDate = new Date(`${year}-${String(endMonth).padStart(2, '0')}-${new Date(year, endMonth, 0).getDate()}T23:59:59`);

    try {
        const transactions = await prisma.transaction.findMany({
            where: {
                createdById: userId,
                transactionHeader: {
                    date: {
                        gte: startDate,
                        lte: endDate,
                    }
                },
                ledger: {
                    number: {
                        lte: 3999
                    }
                }
            },
            include: {
                transactionHeader: true,
                ledger: true,
            }
        });

        // Convert Decimal types to numbers for IPC serialization
        return transactions.map(t => ({
            ...t,
            amount: Number(t.amount),
            vatAmount: Number(t.vatAmount),
            transactionHeader: {
                ...t.transactionHeader,
                totalPre: Number(t.transactionHeader.totalPre),
                totalPost: Number(t.transactionHeader.totalPost),
                vatAmount: Number(t.transactionHeader.vatAmount),
                TotalIncl: Number(t.transactionHeader.TotalIncl),
            }
        }));
    } catch (error) {
        throw new Error(`report:getReportByQuarter failed: ${error}`);
    }
}