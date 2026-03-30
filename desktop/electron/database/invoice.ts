import { prisma } from "../database.js";
import { VAT, InvoiceStatus, PaymentType, Prisma } from "@prisma/client";

function normalizeInvoiceStatus(status: string | InvoiceStatus): InvoiceStatus {
    const normalized = String(status).toUpperCase();

    if (normalized in InvoiceStatus) {
        return InvoiceStatus[normalized as keyof typeof InvoiceStatus];
    }

    throw new Error(`Invalid invoice status: ${status}`);
}

export async function generateSalesInvoiceNumber(userId: number): Promise<string> {
    const currentYear = new Date().getFullYear().toString().slice(-2);
    const prefix = `S${currentYear}/${userId}/`;

    const last = await prisma.salesInvoice.findFirst({
        where: {
            invoiceNumber: { startsWith: prefix },
        },
        orderBy: { invoiceNumber: "desc" },
        select: { invoiceNumber: true },
    });

    let nextNumber = 1;
    if (last && last.invoiceNumber) {
        const lastNumber = parseInt(last.invoiceNumber.split("/")[2], 10);
        nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber}`;
}

export async function generatePurchaseInvoiceNumber(userId: number): Promise<string> {
    const currentYear = new Date().getFullYear().toString().slice(-2);
    const prefix = `P${currentYear}/${userId}/`;

    const last = await prisma.purchaseInvoice.findFirst({
        where: {
            invoiceNumber: { startsWith: prefix },
        },
        orderBy: { invoiceNumber: "desc" },
        select: { invoiceNumber: true },
    });

    let nextNumber = 1;
    if (last && last.invoiceNumber) {
        const lastNumber = parseInt(last.invoiceNumber.split("/")[2], 10);
        nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber}`;
}

export async function createSalesInvoice(
    userId: number,
    invoice: {
        invoiceNumber: string;
        companyId: number;
        debtorId: number;
        createdById: number;
        title: string;
        invoiceDate: string;
        dueDate: string;
        paymentTerm: number;
        subTotal: number;
        vatTotal: number;
        total: number;
        status: string | InvoiceStatus;
    },
    invoiceLines: {
        rowDescription: string;
        quantity: number;
        price: number;
        vat: VAT;
        lineTotalExcl: number;
        vatAmount: number;
        lineTotalIncl: number;
    }[]
) {
    if (invoiceLines.length === 0) {
        throw new Error("An invoice must have at least one line.");
    }

    if (invoice.invoiceNumber) {
        const existing = await prisma.salesInvoice.findFirst({
            where: {
                invoiceNumber: invoice.invoiceNumber,
            }
        });
        if (existing) {
            throw new Error(`A sales invoice with this number "${invoice.invoiceNumber}" already exists.`);
        }
    }

    try {
        const created = await prisma.salesInvoice.create({
            data: {
                invoiceNumber: invoice.invoiceNumber,
                companyId: invoice.companyId,
                debtorId: invoice.debtorId,
                createdById: invoice.createdById,
                title: invoice.title,
                invoiceDate: new Date(invoice.invoiceDate),
                dueDate: new Date(invoice.dueDate),
                paymentTerm: invoice.paymentTerm,
                subTotal: parseFloat(String(invoice.subTotal)),
                vatTotal: parseFloat(String(invoice.vatTotal)),
                total: parseFloat(String(invoice.total)),
                status: normalizeInvoiceStatus(invoice.status),
                invoiceLines: {
                    create: invoiceLines.map((line) => ({
                        rowDescription: line.rowDescription,
                        quantity: line.quantity,
                        price: line.price,
                        vat: line.vat,
                        lineTotalExcl: line.lineTotalExcl,
                        vatAmount: line.vatAmount,
                        lineTotalIncl: line.lineTotalIncl,
                    })),
                },
            },
            include: {
                invoiceLines: true,
            },
        });

        console.log("Created sales invoice with amounts:", { subTotal: created.subTotal, vatTotal: created.vatTotal, total: created.total });

        return JSON.parse(JSON.stringify(created));
    } catch (error) {
        throw new Error(`Failed to create sales invoice: ${(error as Error).message}`);
    }
}


export async function getSalesInvoices(userId: number) {
    const invoices = await prisma.salesInvoice.findMany({
        where: { createdById: userId },
        include: {
            invoiceLines: true,
            debtor: true,
            company: true,
        },
    });

    if (invoices.length === 0) {
        return [];
    }

    return invoices.map(invoice => ({
        ...invoice,
        subTotal: Number(invoice.subTotal),
        vatTotal: Number(invoice.vatTotal),
        total: Number(invoice.total),
    }));
}

export async function updateSalesInvoice(
    invoiceId: number,
    invoice: {
        debtorId: number;
        title: string;
        invoiceDate: string;
        dueDate: string;
        paymentTerm: number;
        subTotal: number;
        vatTotal: number;
        total: number;
        status: InvoiceStatus;
    },
    invoiceLines: {
        rowDescription: string;
        quantity: number;
        price: number;
        vat: VAT;
        lineTotalExcl: number;
        vatAmount: number;
        lineTotalIncl: number;
    }[]
) {
    try {
        const updateData = {
            debtorId: invoice.debtorId,
            title: invoice.title,
            invoiceDate: new Date(invoice.invoiceDate),
            dueDate: new Date(invoice.dueDate),
            paymentTerm: invoice.paymentTerm,
            subTotal: parseFloat(String(invoice.subTotal)),
            vatTotal: parseFloat(String(invoice.vatTotal)),
            total: parseFloat(String(invoice.total)),
            status: invoice.status,
        };

        const updated = await prisma.$transaction(async (tx) => {
            await tx.salesInvoiceLine.deleteMany({ where: { invoiceId: invoiceId } });

            const updatedInvoice = await tx.salesInvoice.update({
                where: { id: invoiceId },
                data: updateData,
            });

            await tx.salesInvoiceLine.createMany({
                data: invoiceLines.map((line) => ({
                    invoiceId: invoiceId,
                    rowDescription: line.rowDescription,
                    quantity: line.quantity,
                    price: line.price,
                    vat: line.vat,
                    lineTotalExcl: line.lineTotalExcl,
                    vatAmount: line.vatAmount,
                    lineTotalIncl: line.lineTotalIncl,
                })),
            });

            return tx.salesInvoice.findUnique({
                where: { id: invoiceId },
                include: {
                    invoiceLines: true,
                    debtor: true,
                    company: true,
                },
            });
        });

        console.log("Updated sales invoice with amounts:", { subTotal: updated?.subTotal, vatTotal: updated?.vatTotal, total: updated?.total });

        return JSON.parse(JSON.stringify({
            ...updated,
            subTotal: Number(updated?.subTotal),
            vatTotal: Number(updated?.vatTotal),
            total: Number(updated?.total),
        }));
    } catch (error) {
        throw new Error(`Failed to update sales invoice: ${(error as Error).message}`);
    }
}

export async function deleteSalesInvoice(invoiceId: number) {
    const invoice = await prisma.salesInvoice.findUnique({ where: { id: invoiceId } });

    if (!invoice) throw new Error("Sales invoice not found");
    if (invoice.status !== "DRAFT") throw new Error("Only draft sales invoices can be deleted");

    return prisma.$transaction(async (tx) => {
        await tx.salesInvoiceLine.deleteMany({ where: { invoiceId } });
        await tx.salesInvoice.delete({ where: { id: invoiceId } });
    });
}

export async function getSalesInvoice(invoiceId: number) {
    const invoice = await prisma.salesInvoice.findFirst({
        where: { id: invoiceId },
        include: {
            invoiceLines: true,
            debtor: true,
            company: true,
        },
    });

    if (!invoice) {
        throw new Error("Sales invoice not found");
    }

    return JSON.parse(JSON.stringify({
        ...invoice,
        subTotal: Number(invoice.subTotal),
        vatTotal: Number(invoice.vatTotal),
        total: Number(invoice.total),
    }));
}

export async function createPurchaseInvoice(
    userId: number,
    invoice: {
        invoiceNumber: string;
        companyId: number;
        creditorId: number;
        createdById: number;
        title: string;
        invoiceDate: string;
        dueDate: string;
        paymentTerm: number;
        subTotal: number;
        vatTotal: number;
        total: number;
        status: string | InvoiceStatus;
    },
    invoiceLines: {
        rowDescription: string;
        quantity: number;
        price: number;
        vat: VAT;
        lineTotalExcl: number;
        vatAmount: number;
        lineTotalIncl: number;
    }[]
) {
    if (invoiceLines.length === 0) {
        throw new Error("An invoice must have at least one line.");
    }

    if (invoice.invoiceNumber) {
        const existing = await prisma.purchaseInvoice.findFirst({
            where: { invoiceNumber: invoice.invoiceNumber },
        });
        if (existing) {
            throw new Error(`A purchase invoice with this number "${invoice.invoiceNumber}" already exists.`);
        }
    }

    // If no invoice number provided, generate one using the same method as sales invoices
    if (!invoice.invoiceNumber) {
        invoice.invoiceNumber = await generatePurchaseInvoiceNumber(userId);
    }

    try {
        const data = {
            invoiceNumber: invoice.invoiceNumber,
            companyId: invoice.companyId,
            creditorId: invoice.creditorId,
            createdById: invoice.createdById,
            title: invoice.title,
            invoiceDate: new Date(invoice.invoiceDate),
            dueDate: new Date(invoice.dueDate),
            paymentTerm: invoice.paymentTerm,
            subTotal: parseFloat(String(invoice.subTotal)),
            vatTotal: parseFloat(String(invoice.vatTotal)),
            total: parseFloat(String(invoice.total)),
            paymentType: (invoice as any).paymentType ?? PaymentType.OTHER,
            payedDate: (invoice as any).payedDate ? new Date((invoice as any).payedDate) : undefined,
            status: normalizeInvoiceStatus(invoice.status),
            invoiceLines: {
                create: invoiceLines.map((line) => ({
                    rowDescription: line.rowDescription,
                    quantity: line.quantity,
                    price: line.price,
                    vat: line.vat,
                    lineTotalExcl: line.lineTotalExcl,
                    vatAmount: line.vatAmount,
                    lineTotalIncl: line.lineTotalIncl,
                })),
            },
        };

        const created = await prisma.purchaseInvoice.create({ data, include: { invoiceLines: true } });
        console.log("Created purchase invoice with amounts:", { subTotal: created.subTotal, vatTotal: created.vatTotal, total: created.total });
        return JSON.parse(JSON.stringify(created));
    } catch (error) {
        throw new Error(`Failed to create purchase invoice: ${(error as Error).message}`);
    }
}

export async function getPurchaseInvoices(userId: number) {
    const invoices = await prisma.purchaseInvoice.findMany({
        where: { createdById: userId },
        include: {
            invoiceLines: true,
            creditor: true,
            company: true,
        },
    });

    if (invoices.length === 0) return [];

    return invoices.map(invoice => ({
        ...invoice,
        subTotal: Number(invoice.subTotal),
        vatTotal: Number(invoice.vatTotal),
        total: Number(invoice.total),
    }));
}

export async function updatePurchaseInvoice(
    invoiceId: number,
    invoice: {
        creditorId: number;
        title: string;
        invoiceDate: string;
        dueDate: string;
        paymentTerm: number;
        subTotal: number;
        vatTotal: number;
        total: number;
        status: InvoiceStatus;
    },
    invoiceLines: {
        rowDescription: string;
        quantity: number;
        price: number;
        vat: VAT;
        lineTotalExcl: number;
        vatAmount: number;
        lineTotalIncl: number;
    }[]
) {
    try {
        const updateData = {
            creditorId: invoice.creditorId,
            title: invoice.title,
            invoiceDate: new Date(invoice.invoiceDate),
            dueDate: new Date(invoice.dueDate),
            paymentTerm: invoice.paymentTerm,
            subTotal: parseFloat(String(invoice.subTotal)),
            vatTotal: parseFloat(String(invoice.vatTotal)),
            total: parseFloat(String(invoice.total)),
            status: invoice.status,
        };

        const updated = await prisma.$transaction(async (tx) => {
            await tx.purchaseInvoiceLine.deleteMany({ where: { invoiceId: invoiceId } });

            await tx.purchaseInvoice.update({ where: { id: invoiceId }, data: updateData });

            await tx.purchaseInvoiceLine.createMany({
                data: invoiceLines.map(line => ({
                    invoiceId: invoiceId,
                    rowDescription: line.rowDescription,
                    quantity: line.quantity,
                    price: line.price,
                    vat: line.vat,
                    lineTotalExcl: line.lineTotalExcl,
                    vatAmount: line.vatAmount,
                    lineTotalIncl: line.lineTotalIncl,
                })),
            });

            return tx.purchaseInvoice.findUnique({ where: { id: invoiceId }, include: { invoiceLines: true, creditor: true, company: true } });
        });

        return JSON.parse(JSON.stringify({
            ...updated,
            subTotal: Number(updated?.subTotal),
            vatTotal: Number(updated?.vatTotal),
            total: Number(updated?.total),
        }));
    } catch (error) {
        throw new Error(`Failed to update purchase invoice: ${(error as Error).message}`);
    }
}

export async function deletePurchaseInvoice(invoiceId: number) {
    const invoice = await prisma.purchaseInvoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new Error("Purchase invoice not found");
    if (invoice.status !== "DRAFT") throw new Error("Only draft purchase invoices can be deleted");

    return prisma.$transaction(async (tx) => {
        await tx.purchaseInvoiceLine.deleteMany({ where: { invoiceId: invoiceId } });
        await tx.purchaseInvoice.delete({ where: { id: invoiceId } });
    });
}

export async function getPurchaseInvoice(invoiceId: number) {
    const invoice = await prisma.purchaseInvoice.findFirst({
        where: { id: invoiceId },
        include: { invoiceLines: true, creditor: true, company: true },
    });

    if (!invoice) throw new Error("Purchase invoice not found");

    return JSON.parse(JSON.stringify({
        ...invoice,
        subTotal: Number(invoice.subTotal),
        vatTotal: Number(invoice.vatTotal),
        total: Number(invoice.total),
    }));
}