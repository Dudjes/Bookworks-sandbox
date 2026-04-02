import { app, BrowserWindow, ipcMain, Menu } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import { ensureDatabaseSchema } from "./database.js";
import * as auth from "./database/auth.js";
import * as company from "./database/company.js";
import * as debitor from "./database/debitor.js";
import * as creditor from "./database/creditor.js";
import * as invoice from "./database/invoice.js"
import * as ledger from "./database/ledger.js";
import { VAT, InvoiceStatus } from "@prisma/client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === "development";
if (isDev) {
  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch("disable-gpu");
}

let mainWindow: BrowserWindow | null = null;

const resolvePreloadPath = () => {
  const candidates = ["preload.cjs", "preload.js", "preload.mjs"];

  for (const fileName of candidates) {
    const fullPath = path.join(__dirname, fileName);
    if (existsSync(fullPath)) return fullPath;
  }

  throw new Error("Preload file not found in dist-electron output.");
};

const createWindow = () => {
  mainWindow = new BrowserWindow({
    minWidth: 1200,
    minHeight: 800,
    width: 1200,
    height: 800,
    webPreferences: {
      preload: resolvePreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  Menu.setApplicationMenu(null);

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL(`file://${path.join(__dirname, "../dist/index.html")}`);
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
};

type IpcHandler = (...args: any[]) => unknown;
const handlers: Record<string, IpcHandler> = {
  "auth:registerUser": auth.registerUser,
  "auth:loginUser": auth.loginUser,

  //unwrap object payload { userId, company }
  "company:createOrUpdate": (payload: {
    userId: number;
    company: {
      name: string;
      kvkNumber?: string;
      btwNumber?: string;
      address: string;
      postcode: string;
      city: string;
      country: string;
      logo?: string;
    };
  }) => company.createOrUpdate(payload.userId, payload.company),
  "company:getCompanyByUser": (userId: number) => company.getCompanyByUser(userId),

  "debitor:createDebitor": async (payload: {
    userId: number;
    debitor: {
      companyName: string;
      contactPerson: string;
      kvkNumber: string;
      btwNumber: string;
      IBAN: string;
      paymentTerm: number;
      email: string;
      phonenumber: string;
      address: string;
      postcode: string;
      city: string;
      country: string;
    };
  }) => {
    const userCompany = await company.getCompanyByUser(payload.userId);
    if (!userCompany) {
      throw new Error("User has no company. Please set up company details first.");
    }
    return debitor.createDebitor(payload.userId, userCompany.id, payload.debitor);
  },
  "debitor:getDebitors": debitor.getDebitors,
  "debitor:deleteDebitor": debitor.deleteDebitor,
  "debitor:updateDebitor": (payload: {
    debitorId: number;
    debitor: {
      companyName: string;
      contactPerson: string;
      kvkNumber: string;
      btwNumber: string;
      IBAN: string;
      paymentTerm: number;
      email: string;
      phonenumber: string;
      address: string;
      postcode: string;
      city: string;
      country: string;
    };
  }) => debitor.updateDebitor(payload.debitor, payload.debitorId),

  "creditor:createCreditor": async (payload: {
    userId: number;
    creditor: {
      companyName: string;
      contactPerson: string;
      kvkNumber: string;
      btwNumber: string;
      IBAN: string;
      paymentTerm: number;
      email: string;
      phonenumber: string;
      address: string;
      postcode: string;
      city: string;
      country: string;
    };
  }) => {
    const userCompany = await company.getCompanyByUser(payload.userId);
    if (!userCompany) {
      throw new Error("User has no company. Please set up company details first.");
    }
    return creditor.createCreditor(payload.userId, userCompany.id, payload.creditor);
  },
  "creditor:getCreditors": creditor.getCreditors,
  "creditor:deleteCreditor": creditor.deleteCreditor,
  "creditor:updateCreditor": (payload: {
    creditorId: number;
    creditor: {
      companyName: string;
      contactPerson: string;
      kvkNumber: string;
      btwNumber: string;
      IBAN: string;
      paymentTerm: number;
      email: string;
      phonenumber: string;
      address: string;
      postcode: string;
      city: string;
      country: string;
    };
  }) => creditor.updateCreditor(payload.creditor, payload.creditorId),

  "salesInvoice:generateNumber": (userId: number) => invoice.generateSalesInvoiceNumber(userId),
  "salesInvoice:createInvoice": (payload: {
    userId: number;
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
      status: InvoiceStatus;
    };
    invoiceLines: {
      rowDescription: string;
      quantity: number;
      price: number;
      vat: VAT;
      lineTotalExcl: number;
      vatAmount: number;
      lineTotalIncl: number;
    }[];
  }) => invoice.createSalesInvoice(payload.userId, payload.invoice, payload.invoiceLines),
  "salesInvoice:getInvoices": (userId: number) => invoice.getSalesInvoices(userId),
  "salesInvoice:updateInvoice": (payload: {
    invoiceId: number;
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
    };
    invoiceLines: {
      rowDescription: string;
      quantity: number;
      price: number;
      vat: VAT;
      lineTotalExcl: number;
      vatAmount: number;
      lineTotalIncl: number;
    }[];
  }) => invoice.updateSalesInvoice(payload.invoiceId, payload.invoice, payload.invoiceLines),
  "salesInvoice:deleteInvoice": (invoiceId: number) => invoice.deleteSalesInvoice(invoiceId),
  "salesInvoice:getInvoice": (invoiceId: number) => invoice.getSalesInvoice(invoiceId),

  "purchaseInvoice:generateNumber": (userId: number) => invoice.generatePurchaseInvoiceNumber(userId),
  "purchaseInvoice:createInvoice": (payload: {
    userId: number;
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
      status: InvoiceStatus;
    };
    invoiceLines: {
      rowDescription: string;
      quantity: number;
      price: number;
      vat: VAT;
      lineTotalExcl: number;
      vatAmount: number;
      lineTotalIncl: number;
    }[];
  }) => invoice.createPurchaseInvoice(payload.userId, payload.invoice, payload.invoiceLines),
  "purchaseInvoice:getInvoices": (userId: number) => invoice.getPurchaseInvoices(userId),
  "purchaseInvoice:updateInvoice": (payload: {
    invoiceId: number;
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
    };
    invoiceLines: {
      rowDescription: string;
      quantity: number;
      price: number;
      vat: VAT;
      lineTotalExcl: number;
      vatAmount: number;
      lineTotalIncl: number;
    }[];
  }) => invoice.updatePurchaseInvoice(payload.invoiceId, payload.invoice, payload.invoiceLines),
  "purchaseInvoice:deleteInvoice": (invoiceId: number) => invoice.deletePurchaseInvoice(invoiceId),
  "purchaseInvoice:getInvoice": (invoiceId: number) => invoice.getPurchaseInvoice(invoiceId),

  "ledger:getLedgers": ledger.getLedgers,
  "ledger:createLedger": (payload: {
    userId: number;
    ledger: {
      number: number;
      name: string;
      type: string;
      category: string;
    };
  }) => ledger.createLedger(payload.userId, {
    ...payload.ledger,
    systemMade: false,
  }),
  "ledger:deleteLedger": (payload: {
    userId: number;
    ledgerId: number;
  }) => ledger.deleteLedger(payload.userId, payload.ledgerId),
  "ledger:updateLedger": (payload: {
    userId: number;
    ledgerId: number;
    ledger: {
      number: number;
      name: string;
      type: string;
      category: string;
    };
  }) => ledger.updateLedger(payload.userId, payload.ledgerId, payload.ledger),
};

for (const [channel, handler] of Object.entries(handlers)) {
  ipcMain.handle(channel, (_event, ...args) => handler(...args));
}

app
  .whenReady()
  .then(async () => {
    await ensureDatabaseSchema();
    createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  })
  .catch((err) => {
    console.error("Failed to start Electron app:", err);
    app.quit();
  });

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
