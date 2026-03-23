import { z } from "zod";

export const InvoiceStatus = z.enum(["DRAFT", "OPEN", "PAYED", "DUE"]);
export const VAT = z.enum(["0%", "9%", "21%"]);

export const invoiceSchema = z.object({
    description: z.string().optional(),
    invoiceDate: z.string().date(),
    dueDate: z.string().date(),
    subTotal: z.number().min(0, "Subtotaal moet positief zijn"),
    vatTotal: z.number().min(0, "BTW Totaal moet positief zijn"),
    total: z.number().min(0, "Total moet positief zijn"),
    status: InvoiceStatus,
});

export const invoiceLineSchema = z.object({
    rowDescription: z.string(),
    quantity: z.number().min(0, "Aantal moet positief zijn"),
    price: z.number().min(0, "Prijs moet positief zijn"),
    vat: VAT,
    lineTotalExcl: z.number().min(0, "Subtotaal moet positief zijn"),
    vatAmount: z.number().min(0, "BTW Totaal moet positief zijn"),
    lineTotalIncl: z.number().min(0, "Total moet positief zijn"),
});