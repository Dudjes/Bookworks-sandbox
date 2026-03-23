import { BrowserWindow } from "electron";
import { getInvoice } from "./invoice";

export async function generateInvoicePDF(invoiceId: number){
    const invoice = await getInvoice(invoiceId);
    if(!invoice) throw new Error("Invoice not found");

    const win = new BrowserWindow({show: false});

    try {
        await win.loadURL(`http://localhost:3000/invoice/${invoiceId}?print=true`);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const pdfBuffer = await win.webContents.printToPDF({
            printBackground: true,
            pageSize: 'A4',
        });

        return pdfBuffer;
    } finally {
        win.close();
    }
}