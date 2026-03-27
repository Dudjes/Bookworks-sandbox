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
}

export { prisma };
