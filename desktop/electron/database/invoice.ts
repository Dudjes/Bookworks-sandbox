import { prisma } from "../database.js";
import { VAT, InvoiceStatus, Prisma } from "@prisma/client";

function normalizeInvoiceStatus(status: string | InvoiceStatus): InvoiceStatus {
    const normalized = String(status).toUpperCase();

    if (normalized in InvoiceStatus) {
        return InvoiceStatus[normalized as keyof typeof InvoiceStatus];
    }

    throw new Error(`Invalid invoice status: ${status}`);
}

export async function generateInvoiceNumber(userId: number): Promise<string> {
    const currentYear = new Date().getFullYear().toString().slice(-2); //Get last 2 digits of year (26 for 2026)
    const prefix = `${currentYear}/${userId}/`; 

    //Find the highest invoice number for this year and user
    const lastInvoice = await prisma.invoice.findFirst({
        where: {
            invoiceNumber: {
                startsWith: prefix,
            },
        },
        orderBy: {
            invoiceNumber: "desc",
        },
    });

    let nextNumber = 1;
    if (lastInvoice) {
        // Extract the auto-increment number from the last invoice number
        const lastNumber = parseInt(lastInvoice.invoiceNumber.split("/")[2], 10);
        nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber}`;
}

export async function createInvoice(
    userId: number,
    invoice: {
        invoiceNumber: string,
        companyId: number,
        relationId: number,
        createdById: number,
        description: string,
        invoiceDate: string,
        dueDate: string,
        paymentTerm: number,
        subTotal: number,
        vatTotal: number,
        total: number,
        status: string | InvoiceStatus,
    },
    invoiceLines: {
        rowDescription: string,
        quantity: number,
        price: number,
        vat: VAT,
        lineTotalExcl: number,
        vatAmount: number,
        lineTotalIncl: number,
    }[]
){
    if (invoiceLines.length === 0) {
        throw new Error("An invoice must have at least one line.");
    }

    if(invoice.invoiceNumber){
        const existing = await prisma.invoice.findFirst({
            where : {
                invoiceNumber: invoice.invoiceNumber,
            }
        })
        if(existing){
            throw new Error(`A invoice with this number "${invoice.invoiceNumber}" already exists.`);
        }
    }

    try {
        const created = await prisma.invoice.create({
            data: {
                invoiceNumber: invoice.invoiceNumber,
                companyId:     invoice.companyId,
                relationId:    invoice.relationId,
                createdById:   invoice.createdById,
                description:   invoice.description,
                invoiceDate:   new Date(invoice.invoiceDate),
                dueDate:       new Date(invoice.dueDate),
                paymentTerm:   invoice.paymentTerm,
                subTotal:      parseFloat(String(invoice.subTotal)),
                vatTotal:      parseFloat(String(invoice.vatTotal)),
                total:         parseFloat(String(invoice.total)),
                status:        normalizeInvoiceStatus(invoice.status),
                invoiceLines: {
                    create: invoiceLines.map((line) => ({
                        rowDescription: line.rowDescription,
                        quantity:       line.quantity,
                        price:          line.price,
                        vat:            line.vat,
                        lineTotalExcl:  line.lineTotalExcl,
                        vatAmount:      line.vatAmount,
                        lineTotalIncl:  line.lineTotalIncl,
                    })),
                },
            },
            include: {
                invoiceLines: true, // return the lines in the response
            },
        });

        console.log("Created invoice with amounts:", { subTotal: created.subTotal, vatTotal: created.vatTotal, total: created.total });

        // Electron IPC requires structured-cloneable return values.
        // Prisma Decimal instances are not cloneable, so return plain JSON data.
        return JSON.parse(JSON.stringify(created));
    } catch (error) {
        throw new Error(`Failed to create invoice: ${(error as Error).message}`);
    }
}

export async function getInvoices(userId: number) {
  const invoices = await prisma.invoice.findMany({
    where: { createdById: userId },
    include: {
      invoiceLines: true,
      relation: true,
    },
  });

  if (invoices.length === 0) {
    throw new Error("There are no invoices");
  }

  // Electron IPC requires structured-cloneable return values.
  // Prisma Decimal instances are not cloneable, so convert to numbers and return plain JSON data.
  return invoices.map(invoice => ({
    ...invoice,
    subTotal: Number(invoice.subTotal),
    vatTotal: Number(invoice.vatTotal),
    total: Number(invoice.total),
  }));
}

export async function updateInvoice(
  invoiceId: number,
  invoice: {
    relationId: number;
    description: string;
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
      relationId: invoice.relationId,
      description: invoice.description,
      invoiceDate: new Date(invoice.invoiceDate),
      dueDate: new Date(invoice.dueDate),
      paymentTerm: invoice.paymentTerm,
      subTotal: parseFloat(String(invoice.subTotal)),
      vatTotal: parseFloat(String(invoice.vatTotal)),
      total: parseFloat(String(invoice.total)),
      status: invoice.status,
    };

    const updated = await prisma.$transaction(async (tx) => {
      await tx.invoiceLine.deleteMany({ where: { invoiceId } });

      return tx.invoice.update({
        where: { id: invoiceId },
        data: {
          ...updateData,
          invoiceLines: { create: invoiceLines },
        },
        include: { invoiceLines: true },
      });
    });

    console.log("Updated invoice with amounts:", { subTotal: updated.subTotal, vatTotal: updated.vatTotal, total: updated.total });

    // Convert to structured-cloneable format
    return JSON.parse(JSON.stringify({
      ...updated,
      subTotal: Number(updated.subTotal),
      vatTotal: Number(updated.vatTotal),
      total: Number(updated.total),
    }));
  } catch (error) {
    throw new Error(`Failed to update invoice: ${(error as Error).message}`);
  }
}

export async function deleteInvoice(invoiceId: number){
    const invoice = await prisma.invoice.findUnique({where: {id: invoiceId}});

    if(!invoice) throw new Error("Invoice not found");
    if(invoice.status !== "DRAFT") throw new Error("Only draft invoices can be deleted");

    return prisma.$transaction(async (tx) => {
        await tx.invoiceLine.deleteMany({where: {invoiceId}});
        await tx.invoice.delete({where: {id: invoiceId}});
    })
}

export async function getInvoice(invoiceId: number) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId },
    include: {
      invoiceLines: true,
      relation: true,
    },
  });

  return invoice;
}