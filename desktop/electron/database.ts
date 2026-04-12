import path from "path";
import { app } from "electron";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const dbPath = path.join(app.getPath("userData"), "database.sqlite");
const adapter = new PrismaBetterSqlite3({
  url: `file:${dbPath}`,
});
const prisma = new PrismaClient({
  adapter,
});

console.log("Database location:", dbPath);

export async function ensureDatabaseSchema() {
  // Add missing columns to existing tables if they don't exist
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Company" ADD COLUMN "logo" TEXT;
    `);
  } catch (e) {
    // Column likely already exists, ignore error
  }

  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Invoice" ADD COLUMN "title" TEXT;
    `);
  } catch (e) {
    // Column likely already exists, ignore error
  }

  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "PurchaseInvoice" ADD COLUMN "paymentType" TEXT;
    `);
  } catch (e) {
    // Column likely already exists, ignore error
  }

  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "PurchaseInvoice" ADD COLUMN "payedDate" DATETIME;
    `);
  } catch (e) {
    // Column likely already exists, ignore error
  }

  // Ensure companyId column exists on PurchaseInvoice for older DBs
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "PurchaseInvoice" ADD COLUMN "companyId" INTEGER NOT NULL DEFAULT 0;
    `);
  } catch (e) {
    // Column likely already exists, ignore error
  }

  // Ensure createdById column exists on PurchaseInvoice for older DBs
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "PurchaseInvoice" ADD COLUMN "createdById" INTEGER NOT NULL DEFAULT 0;
    `);
  } catch (e) {
    // Column likely already exists, ignore error
  }

  // Legacy `recievedDate` recreation logic removed to keep SQL matching Prisma schema.

  // Ensure invoiceNumber column exists on PurchaseInvoice for older DBs
  try {
    const info: Array<any> = await prisma.$queryRawUnsafe(`PRAGMA table_info("PurchaseInvoice");`);
    const invoiceNumberCol = info.find((c: any) => c.name === "invoiceNumber");

    if (!invoiceNumberCol) {
      try {
        await prisma.$executeRawUnsafe(`BEGIN TRANSACTION;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "PurchaseInvoice" ADD COLUMN "invoiceNumber" TEXT;`);
        await prisma.$executeRawUnsafe(`UPDATE "PurchaseInvoice" SET "invoiceNumber" = 'P' || strftime('%y','now') || '/0/' || id WHERE "invoiceNumber" IS NULL OR "invoiceNumber" = '';`);
        await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "PurchaseInvoice_invoiceNumber_key" ON "PurchaseInvoice" ("invoiceNumber");`);
        await prisma.$executeRawUnsafe(`COMMIT;`);
      } catch (e) {
        try { await prisma.$executeRawUnsafe(`ROLLBACK;`); } catch {};
      }
    }
  } catch (e) {
    // best-effort only
  }

  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Creditor" ADD COLUMN "paymentTerm" INTEGER NOT NULL DEFAULT 0;
    `);
  } catch (e) {
    // Column likely already exists, ignore error
  }

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "User" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "username" TEXT NOT NULL,
      "password" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "role" TEXT NOT NULL,
      "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" DATETIME
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Company" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "name" TEXT NOT NULL,
      "kvkNumber" TEXT,
      "btwNumber" TEXT,
      "address" TEXT NOT NULL,
      "postcode" TEXT NOT NULL,
      "city" TEXT NOT NULL,
      "country" TEXT NOT NULL,
      "iban" TEXT,
      "phone" TEXT,
      "email" TEXT,
      "website" TEXT,
      "logo" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "UserCompany" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "userId" INTEGER NOT NULL,
      "companyId" INTEGER NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "UserCompany_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT "UserCompany_companyId_fkey"
        FOREIGN KEY ("companyId") REFERENCES "Company"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "UserCompany_userId_companyId_key"
    ON "UserCompany" ("userId", "companyId");
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Debtor" (
      "id"            INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "companyId"     INTEGER NOT NULL,
      "companyName"   TEXT NOT NULL,
      "contactPerson" TEXT,
      "kvkNumber"     TEXT,
      "btwNumber"     TEXT,
      "IBAN"          TEXT,
      "paymentTerm"   INTEGER NOT NULL,
      "email"         TEXT NOT NULL,
      "phonenumber"   TEXT,
      "address"       TEXT,
      "postcode"      TEXT,
      "city"          TEXT,
      "country"       TEXT,
      "createdAt"     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt"     DATETIME NOT NULL,
      CONSTRAINT "Debtor_companyId_fkey"
        FOREIGN KEY ("companyId") REFERENCES "Company"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Creditor" (
      "id"            INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "companyId"     INTEGER NOT NULL,
      "companyName"   TEXT NOT NULL,
      "contactPerson" TEXT,
      "kvkNumber"     TEXT,
      "btwNumber"     TEXT,
      "IBAN"          TEXT,
      "paymentTerm"   INTEGER NOT NULL,
      "email"         TEXT NOT NULL,
      "phonenumber"   TEXT,
      "address"       TEXT,
      "postcode"      TEXT,
      "city"          TEXT,
      "country"       TEXT,
      "createdAt"     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt"     DATETIME NOT NULL,
      CONSTRAINT "Creditor_companyId_fkey"
        FOREIGN KEY ("companyId") REFERENCES "Company"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "SalesInvoice" (
      "id"            INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "invoiceNumber" TEXT NOT NULL UNIQUE,
      "companyId"     INTEGER NOT NULL,
      "debtorId"      INTEGER NOT NULL,
      "createdById"   INTEGER NOT NULL,
      "title"         TEXT NOT NULL,
      "invoiceDate"   DATETIME NOT NULL,
      "dueDate"       DATETIME NOT NULL,
      "paymentTerm"   INTEGER NOT NULL,
      "subTotal"      DECIMAL NOT NULL,
      "vatTotal"      DECIMAL NOT NULL,
      "total"         DECIMAL NOT NULL,
      "status"        TEXT NOT NULL DEFAULT 'DRAFT',
      CONSTRAINT "SalesInvoice_companyId_fkey"
        FOREIGN KEY ("companyId") REFERENCES "Company"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT "SalesInvoice_debtorId_fkey"
        FOREIGN KEY ("debtorId") REFERENCES "Debtor"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT "SalesInvoice_createdById_fkey"
        FOREIGN KEY ("createdById") REFERENCES "User"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "SalesInvoiceLine" (
      "id"             INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "invoiceId"      INTEGER NOT NULL,
      "rowDescription" TEXT NOT NULL,
      "quantity"       REAL NOT NULL,
      "price"          REAL NOT NULL,
      "vat"            TEXT NOT NULL,
      "lineTotalExcl"  REAL NOT NULL,
      "vatAmount"      REAL NOT NULL,
      "lineTotalIncl"  REAL NOT NULL,
      CONSTRAINT "SalesInvoiceLine_invoiceId_fkey"
        FOREIGN KEY ("invoiceId") REFERENCES "SalesInvoice"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "PurchaseInvoice" (
      "id"            INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "invoiceNumber" TEXT NOT NULL UNIQUE,
      "companyId"     INTEGER NOT NULL,
      "creditorId"    INTEGER NOT NULL,
      "createdById"   INTEGER NOT NULL,
      "title"         TEXT NOT NULL,
      "invoiceDate"   DATETIME NOT NULL,
      "dueDate"       DATETIME NOT NULL,
      "paymentTerm"   INTEGER NOT NULL,
      "subTotal"      DECIMAL NOT NULL,
      "vatTotal"      DECIMAL NOT NULL,
      "total"         DECIMAL NOT NULL,
      "paymentType"   TEXT,
      "payedDate"     DATETIME,
      "status"        TEXT NOT NULL DEFAULT 'DRAFT',
      CONSTRAINT "PurchaseInvoice_companyId_fkey"
        FOREIGN KEY ("companyId") REFERENCES "Company"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT "PurchaseInvoice_creditorId_fkey"
        FOREIGN KEY ("creditorId") REFERENCES "Creditor"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT "PurchaseInvoice_createdById_fkey"
        FOREIGN KEY ("createdById") REFERENCES "User"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "PurchaseInvoiceLine" (
      "id"             INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "invoiceId"      INTEGER NOT NULL,
      "rowDescription" TEXT NOT NULL,
      "quantity"       REAL NOT NULL,
      "price"          REAL NOT NULL,
      "vat"            TEXT NOT NULL,
      "lineTotalExcl"  REAL NOT NULL,
      "vatAmount"      REAL NOT NULL,
      "lineTotalIncl"  REAL NOT NULL,
      CONSTRAINT "PurchaseInvoiceLine_invoiceId_fkey"
        FOREIGN KEY ("invoiceId") REFERENCES "PurchaseInvoice"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);

  // Ensure userId column exists on Ledger for older DBs
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Ledger" ADD COLUMN "userId" INTEGER;
    `);
  } catch (e) {
    // Column likely already exists, ignore error
  }

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Ledger" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "number" INTEGER NOT NULL,
      "name" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "category" TEXT NOT NULL,
      "systemMade" INTEGER NOT NULL DEFAULT 1,
      "userId" INTEGER,
      CONSTRAINT "Ledger_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id")
        ON DELETE SET NULL ON UPDATE CASCADE
    );
  `);

  // New transaction model tables (aligned with current Prisma schema)
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "TransactionHeader" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "date" DATETIME NOT NULL,
      "totalPre" DECIMAL NOT NULL,
      "totalPost" DECIMAL NOT NULL,
      "vatAmount" DECIMAL NOT NULL,
      "TotalIncl" DECIMAL NOT NULL,
      "userId" INTEGER NOT NULL,
      "companyId" INTEGER NOT NULL,
      CONSTRAINT "TransactionHeader_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT "TransactionHeader_companyId_fkey"
        FOREIGN KEY ("companyId") REFERENCES "Company"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "transaction" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "transactionHeaderId" INTEGER NOT NULL,
      "createdById" INTEGER NOT NULL,
      "debtorId" INTEGER,
      "creditorId" INTEGER,
      "amount" DECIMAL NOT NULL,
      "VAT" TEXT NOT NULL,
      "vatAmount" DECIMAL NOT NULL,
      "type" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "ledgerId" INTEGER NOT NULL,
      "salesInvoiceId" INTEGER,
      "purchaseInvoiceId" INTEGER,
      CONSTRAINT "transaction_transactionHeaderId_fkey"
        FOREIGN KEY ("transactionHeaderId") REFERENCES "TransactionHeader"("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "transaction_createdById_fkey"
        FOREIGN KEY ("createdById") REFERENCES "User"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT "transaction_debtorId_fkey"
        FOREIGN KEY ("debtorId") REFERENCES "Debtor"("id")
        ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT "transaction_creditorId_fkey"
        FOREIGN KEY ("creditorId") REFERENCES "Creditor"("id")
        ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT "transaction_ledgerId_fkey"
        FOREIGN KEY ("ledgerId") REFERENCES "Ledger"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT "transaction_salesInvoiceId_fkey"
        FOREIGN KEY ("salesInvoiceId") REFERENCES "SalesInvoice"("id")
        ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT "transaction_purchaseInvoiceId_fkey"
        FOREIGN KEY ("purchaseInvoiceId") REFERENCES "PurchaseInvoice"("id")
        ON DELETE SET NULL ON UPDATE CASCADE
    );
  `);

  // Backfill for older transaction tables that may miss the new FK column.
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "transaction" ADD COLUMN "transactionHeaderId" INTEGER;
    `);
  } catch (e) {
    // Column likely already exists, ignore error
  }

  // Backfill for TransactionHeader columns
  const headerColumnsToEnsure = [
    `ALTER TABLE "TransactionHeader" ADD COLUMN "userId" INTEGER;`,
    `ALTER TABLE "TransactionHeader" ADD COLUMN "companyId" INTEGER;`,
  ];

  for (const statement of headerColumnsToEnsure) {
    try {
      await prisma.$executeRawUnsafe(statement);
    } catch (e) {
      // Column likely already exists, ignore error
    }
  }

  // Backfill other transaction columns for databases created from older legacy table definitions.
  const transactionColumnsToEnsure = [
    `ALTER TABLE "transaction" ADD COLUMN "debtorId" INTEGER;`,
    `ALTER TABLE "transaction" ADD COLUMN "creditorId" INTEGER;`,
    `ALTER TABLE "transaction" ADD COLUMN "amount" DECIMAL;`,
    `ALTER TABLE "transaction" ADD COLUMN "VAT" TEXT;`,
    `ALTER TABLE "transaction" ADD COLUMN "vatAmount" DECIMAL;`,
    `ALTER TABLE "transaction" ADD COLUMN "type" TEXT;`,
    `ALTER TABLE "transaction" ADD COLUMN "ledgerId" INTEGER;`,
    `ALTER TABLE "transaction" ADD COLUMN "createdById" INTEGER;`,
    `ALTER TABLE "transaction" ADD COLUMN "salesInvoiceId" INTEGER;`,
    `ALTER TABLE "transaction" ADD COLUMN "purchaseInvoiceId" INTEGER;`,
  ];

  for (const statement of transactionColumnsToEnsure) {
    try {
      await prisma.$executeRawUnsafe(statement);
    } catch (e) {
      // Column likely already exists, ignore error
    }
  }
}

/**
 * Add default ledger accounts for a specific user.
 * Each inserted ledger will have `systemMade = 1` and the provided `userId`.
 */
export async function addDefaultsForUser(userId: number) {
  const defaultLedgers = [
    { number: 100, name: 'Immateriële vaste activa', type: 'B', category: 'Immateriële vaste activa' },
    { number: 200, name: 'Materiële vaste activa', type: 'B', category: 'Materiële vaste activa' },
    { number: 400, name: 'Financiële vaste activa', type: 'B', category: 'Financiële vaste activa' },
    { number: 600, name: 'Kapitaal', type: 'B', category: 'Kapitaal vennoot 1' },
    { number: 601, name: 'Prive opnames', type: 'B', category: 'Kapitaal vennoot 1' },
    { number: 602, name: 'Belastingen en ZvW', type: 'B', category: 'Kapitaal vennoot 1' },
    { number: 603, name: 'Prive verzekeringen', type: 'B', category: 'Kapitaal vennoot 1' },
    { number: 609, name: 'Overige prive betaling', type: 'B', category: 'Kapitaal vennoot 1' },
    { number: 610, name: 'Prive stortingen', type: 'B', category: 'Kapitaal vennoot 1' },
    { number: 615, name: 'Resultaat boekjaar', type: 'B', category: 'Kapitaal vennoot 1' },
    { number: 700, name: 'Voorzieningen', type: 'B', category: 'Voorzieningen' },
    { number: 900, name: 'Langlopende schulden', type: 'B', category: 'Langlopende schulden' },
    { number: 1000, name: 'Kas', type: 'B', category: 'liquide middelen' },
    { number: 1010, name: 'Bank', type: 'B', category: 'liquide middelen' },
    { number: 1250, name: 'Kruisposten', type: 'B', category: 'liquide middelen' },
    { number: 1290, name: 'Onverwerkte bankmutaties', type: 'B', category: 'liquide middelen' },
    { number: 1300, name: 'Debiteuren', type: 'B', category: 'Vorderingen en overlopende activa' },
    { number: 1350, name: 'Voorziening debiteuren', type: 'B', category: 'Vorderingen en overlopende activa' },
    { number: 1400, name: 'Vooruitbetaalde bedragen', type: 'B', category: 'Vorderingen en overlopende activa' },
    { number: 1410, name: 'Nog te ontvangen bedragen', type: 'B', category: 'Vorderingen en overlopende activa' },
    { number: 1420, name: 'Nog te factureren omzet', type: 'B', category: 'Vorderingen en overlopende activa' },
    { number: 1440, name: 'Overige vorderingen', type: 'B', category: 'Vorderingen en overlopende activa' },
    { number: 1445, name: 'Waarborgsommen', type: 'B', category: 'Vorderingen en overlopende activa' },
    { number: 1600, name: 'Crediteuren', type: 'B', category: 'Kortlopende schulden en overl. passiva' },
    { number: 1701, name: 'BTW te betalen hoog', type: 'B', category: 'Kortlopende schulden en overl. passiva' },
    { number: 1705, name: 'BTW te betalen laag', type: 'B', category: 'Kortlopende schulden en overl. passiva' },
    { number: 1710, name: 'BTW te vorderen hoog', type: 'B', category: 'Kortlopende schulden en overl. passiva' },
    { number: 1715, name: 'BTW te vorderen laag', type: 'B', category: 'Kortlopende schulden en overl. passiva' },
    { number: 1730, name: 'BTW te betalen buiten EU', type: 'B', category: 'Kortlopende schulden en overl. passiva' },
    { number: 1731, name: 'BTW te vorderen buiten EU', type: 'B', category: 'Kortlopende schulden en overl. passiva' },
    { number: 1740, name: 'BTW te betalen binnen EU', type: 'B', category: 'Kortlopende schulden en overl. passiva' },
    { number: 1741, name: 'BTW te vorderen binnen EU', type: 'B', category: 'Kortlopende schulden en overl. passiva' },
    { number: 1750, name: 'BTW afdracht', type: 'B', category: 'Kortlopende schulden en overl. passiva' },
    { number: 1760, name: 'Loonheffing af te dragen', type: 'B', category: 'Kortlopende schulden en overl. passiva' },
    { number: 1761, name: 'Afdracht loonheffing', type: 'B', category: 'Kortlopende schulden en overl. passiva' },
    { number: 1780, name: 'Af te dragen pensioenpremies', type: 'B', category: 'Kortlopende schulden en overl. passiva' },
    { number: 1781, name: 'Afdracht pensioenpremies', type: 'B', category: 'Kortlopende schulden en overl. passiva' },
    { number: 1900, name: 'Nog te betalen bedragen', type: 'B', category: 'Kortlopende schulden en overl. passiva' },
    { number: 1920, name: 'Vooruitgefactureerde omzet', type: 'B', category: 'Kortlopende schulden en overl. passiva' },
    { number: 1940, name: 'Overige schulden', type: 'B', category: 'Kortlopende schulden en overl. passiva' },
    { number: 2000, name: 'Netto lonen', type: 'B', category: 'Tussenrekeningen' },
    { number: 2500, name: 'Vraagposten', type: 'B', category: 'Tussenrekeningen' },
    { number: 3000, name: 'Voorraad', type: 'B', category: 'Totaal voorraden' },
    { number: 3200, name: 'Onderhanden werk', type: 'B', category: 'Totaal voorraden' },
    { number: 4000, name: 'Lonen en salarissen', type: 'W', category: 'Lonen en salarissen' },
    { number: 4020, name: 'Vakantiegeld', type: 'W', category: 'Lonen en salarissen' },
    { number: 4021, name: 'Mut. res. vakantiedagen', type: 'W', category: 'Lonen en salarissen' },
    { number: 4030, name: 'Ziekengeld', type: 'W', category: 'Lonen en salarissen' },
    { number: 4035, name: 'Ontvangen ziekengelduitk.', type: 'W', category: 'Lonen en salarissen' },
    { number: 4040, name: 'Soc. lasten bedrver.', type: 'W', category: 'Sociale lasten' },
    { number: 4050, name: 'Pensioenlasten', type: 'W', category: 'Pensioenlasten' },
    { number: 4060, name: 'Ontvangen subsidies', type: 'W', category: 'Lonen en salarissen' },
    { number: 4070, name: 'Beheervergoeding', type: 'W', category: 'Lonen en salarissen' },
    { number: 4080, name: 'Uitzendkrachten/inhuur derden', type: 'W', category: 'Lonen en salarissen' },
    { number: 4100, name: 'Afschr. Immateriële vaste activa', type: 'W', category: 'Afschrijving immateriële vaste activa' },
    { number: 4110, name: 'Afschr. Materiële vaste activa', type: 'W', category: 'Afschrijving materiële vaste activa' },
    { number: 4195, name: 'Boekresultaat desinv.', type: 'W', category: 'Afschrijving materiële vaste activa' },
    { number: 4200, name: 'Overige personeelskosten', type: 'W', category: 'Overige personeelskosten' },
    { number: 4300, name: 'Huisvestingskosten', type: 'W', category: 'Huisvestingskosten' },
    { number: 4400, name: 'Exploitatiekosten', type: 'W', category: 'Exploitatiekosten' },
    { number: 4500, name: 'Kantoorkosten', type: 'W', category: 'Kantoorkosten' },
    { number: 4600, name: 'Kosten vervoermiddelen', type: 'W', category: 'Autokosten' },
    { number: 4700, name: 'Verkoopkosten', type: 'W', category: 'Verkoopkosten' },
    { number: 4800, name: 'Algemene kosten', type: 'W', category: 'Algemene kosten' },
    { number: 4900, name: 'Rentelasten', type: 'W', category: 'Rentelasten en soortgelijke kosten' },
    { number: 4950, name: 'Rentebaten', type: 'W', category: 'Rentebaten en soortgelijke opbrengsten' },
    { number: 7000, name: 'Kostprijs verkopen', type: 'W', category: 'Grond- en hulpstoffen e.d.' },
    { number: 8000, name: 'Omzet', type: 'W', category: 'Totaal omzet' }
  ];

  // Use raw INSERT OR IGNORE to avoid Prisma client type mismatch when client isn't regenerated.
  const escape = (s: string) => s.replace(/'/g, "''");
  for (const l of defaultLedgers) {
    await prisma.$executeRawUnsafe(`
      INSERT OR IGNORE INTO "Ledger" ("number","name","type","category","systemMade","userId")
      VALUES (${l.number}, '${escape(l.name)}', '${l.type}', '${escape(l.category)}', 1, ${userId});
    `);
  }
}

export { prisma };
