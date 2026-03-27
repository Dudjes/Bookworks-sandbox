/*
  Warnings:

  - You are about to drop the `Debitor` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PaymentInvoice` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PaymentLine` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `paymentDate` on the `PurchaseInvoice` table. All the data in the column will be lost.
  - You are about to drop the column `paymentType` on the `PurchaseInvoice` table. All the data in the column will be lost.
  - You are about to drop the column `recievedDate` on the `PurchaseInvoice` table. All the data in the column will be lost.
  - Added the required column `paymentTerm` to the `Creditor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `PurchaseInvoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdById` to the `PurchaseInvoice` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "PaymentInvoice_invoiceNumber_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Debitor";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PaymentInvoice";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PaymentLine";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "SalesInvoice" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invoiceNumber" TEXT NOT NULL,
    "companyId" INTEGER NOT NULL,
    "debtorId" INTEGER NOT NULL,
    "createdById" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "invoiceDate" DATETIME NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "paymentTerm" INTEGER NOT NULL,
    "subTotal" DECIMAL NOT NULL,
    "vatTotal" DECIMAL NOT NULL,
    "total" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    CONSTRAINT "SalesInvoice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SalesInvoice_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SalesInvoice_debtorId_fkey" FOREIGN KEY ("debtorId") REFERENCES "Debtor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SalesInvoiceLine" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invoiceId" INTEGER NOT NULL,
    "rowDescription" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "price" REAL NOT NULL,
    "vat" TEXT NOT NULL,
    "lineTotalExcl" REAL NOT NULL,
    "vatAmount" REAL NOT NULL,
    "lineTotalIncl" REAL NOT NULL,
    CONSTRAINT "SalesInvoiceLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "SalesInvoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PurchaseInvoiceLine" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invoiceId" INTEGER NOT NULL,
    "rowDescription" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "price" REAL NOT NULL,
    "vat" TEXT NOT NULL,
    "lineTotalExcl" REAL NOT NULL,
    "vatAmount" REAL NOT NULL,
    "lineTotalIncl" REAL NOT NULL,
    CONSTRAINT "PurchaseInvoiceLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "PurchaseInvoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Debtor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyId" INTEGER NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactPerson" TEXT,
    "kvkNumber" TEXT,
    "btwNumber" TEXT,
    "IBAN" TEXT,
    "paymentTerm" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "phonenumber" TEXT,
    "address" TEXT,
    "postcode" TEXT,
    "city" TEXT,
    "country" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Debtor_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Creditor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyId" INTEGER NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactPerson" TEXT,
    "kvkNumber" TEXT,
    "btwNumber" TEXT,
    "IBAN" TEXT,
    "paymentTerm" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "phonenumber" TEXT,
    "address" TEXT,
    "postcode" TEXT,
    "city" TEXT,
    "country" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Creditor_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Creditor" ("IBAN", "address", "btwNumber", "city", "companyId", "companyName", "contactPerson", "country", "createdAt", "email", "id", "kvkNumber", "phonenumber", "postcode", "updatedAt") SELECT "IBAN", "address", "btwNumber", "city", "companyId", "companyName", "contactPerson", "country", "createdAt", "email", "id", "kvkNumber", "phonenumber", "postcode", "updatedAt" FROM "Creditor";
DROP TABLE "Creditor";
ALTER TABLE "new_Creditor" RENAME TO "Creditor";
CREATE TABLE "new_PurchaseInvoice" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invoiceNumber" TEXT NOT NULL,
    "companyId" INTEGER NOT NULL,
    "creditorId" INTEGER NOT NULL,
    "createdById" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "invoiceDate" DATETIME NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "paymentTerm" INTEGER NOT NULL,
    "subTotal" DECIMAL NOT NULL,
    "vatTotal" DECIMAL NOT NULL,
    "total" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    CONSTRAINT "PurchaseInvoice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PurchaseInvoice_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PurchaseInvoice_creditorId_fkey" FOREIGN KEY ("creditorId") REFERENCES "Creditor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PurchaseInvoice" ("creditorId", "dueDate", "id", "invoiceDate", "invoiceNumber", "paymentTerm", "status", "subTotal", "title", "total", "vatTotal") SELECT "creditorId", "dueDate", "id", "invoiceDate", "invoiceNumber", "paymentTerm", "status", "subTotal", "title", "total", "vatTotal" FROM "PurchaseInvoice";
DROP TABLE "PurchaseInvoice";
ALTER TABLE "new_PurchaseInvoice" RENAME TO "PurchaseInvoice";
CREATE UNIQUE INDEX "PurchaseInvoice_invoiceNumber_key" ON "PurchaseInvoice"("invoiceNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "SalesInvoice_invoiceNumber_key" ON "SalesInvoice"("invoiceNumber");
