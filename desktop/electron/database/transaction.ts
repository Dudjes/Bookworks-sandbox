import { prisma } from "../database.js";
import { VAT } from "@prisma/client";

export interface TransactionLineInput {
  id?: number; // For updates - if present, it's an existing line
  debtorId?: number | null;
  creditorId?: number | null;
  amount: number;
  VAT: VAT | string;
  vatAmount: number;
  type: "betalen" | "ontvangen";
  description: string;
  ledgerId: number;
  createdById: number;
  salesInvoiceId?: number | null;
  purchaseInvoiceId?: number | null;
}

export interface TransactionHeaderInput {
  date: string; // iso date string
  totalPre: number;
  totalPost: number;
  vatAmount: number;
  TotalIncl: number;
  userId: number;
  companyId: number;
  lines: TransactionLineInput[];
}

function normalizeVAT(vat: VAT | string): VAT {
  const value = String(vat).trim();

  if (value === VAT.VAT_0 || value === "0" || value === "0%") return VAT.VAT_0;
  if (value === VAT.VAT_9 || value === "9" || value === "9%") return VAT.VAT_9;
  if (value === VAT.VAT_21 || value === "21" || value === "21%") return VAT.VAT_21;

  throw new Error(`Invalid VAT value: ${vat}`);
}

export async function createTransaction(
  userId: number,
  transactionData: TransactionHeaderInput
){
    if (!transactionData || typeof transactionData !== "object") {
        throw new Error("Transaction data is required");
    }

    if (!transactionData.date || Number.isNaN(new Date(transactionData.date).getTime())) {
        throw new Error("Invalid transaction date");
    }

    if (!Array.isArray(transactionData.lines) || transactionData.lines.length === 0) {
        throw new Error("Transaction must contain at least one line");
    }

    if (!transactionData.userId || !transactionData.companyId) {
        throw new Error("userId and companyId are required");
    }

    try {
        const created = await prisma.transactionHeader.create({
            data: {
                date: new Date(transactionData.date),
                totalPre: parseFloat(String(transactionData.totalPre)),
                totalPost: parseFloat(String(transactionData.totalPost)),
                vatAmount: parseFloat(String(transactionData.vatAmount)),
                TotalIncl: parseFloat(String(transactionData.TotalIncl)),
                userId: transactionData.userId,
                companyId: transactionData.companyId,
                lines: {
                    create: transactionData.lines.map((line) => ({
                        debtorId: line.type === "ontvangen" ? (line.debtorId ?? null) : null,
                        creditorId: line.type === "betalen" ? (line.creditorId ?? null) : null,
                        amount: parseFloat(String(line.amount)),
                        VAT: normalizeVAT(line.VAT),
                        vatAmount: parseFloat(String(line.vatAmount)),
                        type: line.type,
                        description: line.description,
                        ledgerId: line.ledgerId,
                        createdById: line.createdById,
                        salesInvoiceId: line.type === "ontvangen" ? (line.salesInvoiceId ?? null) : null,
                        purchaseInvoiceId: line.type === "betalen" ? (line.purchaseInvoiceId ?? null) : null,
                    })),
                },
            },
            include: {
            lines: true,
            },
      });

      return JSON.parse(JSON.stringify(created));

    } catch (error) {
        throw new Error(`transaction:createTransaction: ${error}`);
    }
}

export async function getTransactions(userId: number){
    try {
        const lines = await prisma.transaction.findMany({
            where: { createdBy: { id: userId } },
            include: {
                transactionHeader: true,
                debtor: true,
                creditor: true,
                ledger: true,
            },
            orderBy: { transactionHeader: { date: 'desc' } }
        });
        
        // Convert Decimal and Date objects to JSON-safe types
        return lines.map(line => ({
            ...line,
            amount: Number(line.amount),
            vatAmount: Number(line.vatAmount),
            transactionHeader: {
                ...line.transactionHeader,
                totalPre: Number(line.transactionHeader.totalPre),
                totalPost: Number(line.transactionHeader.totalPost),
                vatAmount: Number(line.transactionHeader.vatAmount),
                TotalIncl: Number(line.transactionHeader.TotalIncl),
                date: line.transactionHeader.date.toISOString(),
            }
        }));
    } catch (error) {
        throw new Error(`transaction:getTransactions: ${error}`);
    }
}

export async function getTransaction(transactionHeaderId: number){
    try {
        const transactionHeader = await prisma.transactionHeader.findFirst({
            where: {id: transactionHeaderId},
            include: {
                lines: {
                    include: {
                        debtor: true,
                        creditor: true,
                        ledger: true,
                        salesInvoice: true,
                        purchaseInvoice: true,
                    }
                }
            }
        });
        
        if (!transactionHeader) {
            return null;
        }

        return {
            ...transactionHeader,
            date: transactionHeader.date.toISOString(),
            totalPre: Number(transactionHeader.totalPre),
            totalPost: Number(transactionHeader.totalPost),
            vatAmount: Number(transactionHeader.vatAmount),
            TotalIncl: Number(transactionHeader.TotalIncl),
            lines: transactionHeader.lines.map(line => ({
                id: line.id,
                description: line.description,
                debtorId: line.debtorId,
                creditorId: line.creditorId,
                amount: Number(line.amount),
                VAT: line.VAT,
                vatAmount: Number(line.vatAmount),
                type: line.type,
                ledgerId: line.ledgerId,
                createdById: line.createdById,
                salesInvoiceId: line.salesInvoiceId,
                purchaseInvoiceId: line.purchaseInvoiceId,
            }))
        };
    } catch (error) {
        throw new Error(`transaction:getTransaction: ${error}`);
    }
}

export async function updateTransaction(
  transactionHeaderId: number,
  transactionData: TransactionHeaderInput
){
  const exists = await prisma.transactionHeader.findFirst({
    where: {id: transactionHeaderId}
  })

  if(!exists){
    throw new Error(`There is no transactionHeader with id: ${transactionHeaderId}`);
  }

  try {
    // Update header
    await prisma.transactionHeader.update({
        where: {id: transactionHeaderId},
        data: {
            date: new Date(transactionData.date),
            totalPre: parseFloat(String(transactionData.totalPre)),
            totalPost: parseFloat(String(transactionData.totalPost)),
            vatAmount: parseFloat(String(transactionData.vatAmount)),
            TotalIncl: parseFloat(String(transactionData.TotalIncl)),
        }
    });

    // Get existing line IDs
    const existingLines = await prisma.transaction.findMany({
      where: { transactionHeaderId },
      select: { id: true }
    });
    const existingLineIds = existingLines.map(l => l.id);
    const incomingLineIds = transactionData.lines.filter(l => l.id).map(l => l.id!);

    // Delete removed lines
    const linesToDelete = existingLineIds.filter(id => !incomingLineIds.includes(id));
    if (linesToDelete.length > 0) {
      await prisma.transaction.deleteMany({
        where: { id: { in: linesToDelete } }
      });
    }

    // Update/create lines
    for (const line of transactionData.lines) {
      if (line.id) {
        // Update existing line - make sure to clear mismatched invoice IDs
        await prisma.transaction.update({
          where: { id: line.id },
          data: {
            amount: parseFloat(String(line.amount)),
            VAT: normalizeVAT(line.VAT),
            vatAmount: parseFloat(String(line.vatAmount)),
            type: line.type,
            description: line.description,
            ledgerId: line.ledgerId,
            debtorId: line.type === "ontvangen" ? (line.debtorId ?? null) : null,
            creditorId: line.type === "betalen" ? (line.creditorId ?? null) : null,
            salesInvoiceId: line.type === "ontvangen" ? (line.salesInvoiceId ?? null) : null,
            purchaseInvoiceId: line.type === "betalen" ? (line.purchaseInvoiceId ?? null) : null,
          }
        });
      } else {
        // Create new line
        await prisma.transaction.create({
          data: {
            transactionHeaderId,
            amount: parseFloat(String(line.amount)),
            VAT: normalizeVAT(line.VAT),
            vatAmount: parseFloat(String(line.vatAmount)),
            type: line.type,
            description: line.description,
            ledgerId: line.ledgerId,
            createdById: line.createdById,
            debtorId: line.type === "ontvangen" ? (line.debtorId ?? null) : null,
            creditorId: line.type === "betalen" ? (line.creditorId ?? null) : null,
            salesInvoiceId: line.type === "ontvangen" ? (line.salesInvoiceId ?? null) : null,
            purchaseInvoiceId: line.type === "betalen" ? (line.purchaseInvoiceId ?? null) : null,
          }
        });
      }
    }

    const updated = await prisma.transactionHeader.findFirst({
      where: {id: transactionHeaderId},
      include: { lines: true }
    });

    return JSON.parse(JSON.stringify(updated));

  } catch (error) {
    throw new Error(`transaction:updateTransaction: ${error}`);
  }
}

export async function deleteTransaction(transactionId: number) {
  // TODO: Implement delete transaction logic
  throw new Error("Not implemented");
}

export async function getTransactionsByPeriod(
  userId: number,
  startDate: string,
  endDate: string
) {
  // TODO: Implement get transactions by period logic
  throw new Error("Not implemented");
}

export async function getLedgerBalance(ledgerId: number) {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { ledgerId },
      select: {
        amount: true,
        type: true,
      }
    });

    // Calculate balance: ontvangen (positive) - betalen (negative)
    const balance = transactions.reduce((total, transaction) => {
      const amount = Number(transaction.amount);
      if (transaction.type === "ontvangen") {
        return total + amount;
      } else {
        return total - amount;
      }
    }, 0);

    return balance;
  } catch (error) {
    throw new Error(`transaction:getLedgerBalance: ${error}`);
  }
}

export async function getLedgerTransactions(ledgerId: number) {
  try {
    const lines = await prisma.transaction.findMany({
      where: { ledgerId },
      include: {
        transactionHeader: true,
        debtor: true,
        creditor: true,
      },
      orderBy: { transactionHeader: { date: 'desc' } }
    });

    return lines.map(line => ({
      ...line,
      amount: Number(line.amount),
      vatAmount: Number(line.vatAmount),
      transactionHeader: {
        ...line.transactionHeader,
        totalPre: Number(line.transactionHeader.totalPre),
        totalPost: Number(line.transactionHeader.totalPost),
        vatAmount: Number(line.transactionHeader.vatAmount),
        TotalIncl: Number(line.transactionHeader.TotalIncl),
        date: line.transactionHeader.date.toISOString(),
      }
    }));
  } catch (error) {
    throw new Error(`transaction:getLedgerTransactions: ${error}`);
  }
}
