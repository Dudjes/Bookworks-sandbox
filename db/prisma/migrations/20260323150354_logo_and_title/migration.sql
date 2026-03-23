/*
  Warnings:

  - You are about to drop the column `description` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `InvoiceLine` table. All the data in the column will be lost.
  - Added the required column `paymentTerm` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rowDescription` to the `InvoiceLine` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Company" ADD COLUMN "logo" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Invoice" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invoiceNumber" TEXT NOT NULL,
    "companyId" INTEGER NOT NULL,
    "relationId" INTEGER NOT NULL,
    "createdById" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "invoiceDate" DATETIME NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "paymentTerm" INTEGER NOT NULL,
    "subTotal" DECIMAL NOT NULL,
    "vatTotal" DECIMAL NOT NULL,
    "total" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    CONSTRAINT "Invoice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Invoice_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Invoice_relationId_fkey" FOREIGN KEY ("relationId") REFERENCES "Relation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Invoice" ("companyId", "createdById", "dueDate", "id", "invoiceDate", "invoiceNumber", "relationId", "status", "subTotal", "total", "vatTotal") SELECT "companyId", "createdById", "dueDate", "id", "invoiceDate", "invoiceNumber", "relationId", "status", "subTotal", "total", "vatTotal" FROM "Invoice";
DROP TABLE "Invoice";
ALTER TABLE "new_Invoice" RENAME TO "Invoice";
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");
CREATE TABLE "new_InvoiceLine" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invoiceId" INTEGER NOT NULL,
    "rowDescription" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "price" REAL NOT NULL,
    "vat" TEXT NOT NULL,
    "lineTotalExcl" REAL NOT NULL,
    "vatAmount" REAL NOT NULL,
    "lineTotalIncl" REAL NOT NULL,
    CONSTRAINT "InvoiceLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_InvoiceLine" ("id", "invoiceId", "lineTotalExcl", "lineTotalIncl", "price", "quantity", "vat", "vatAmount") SELECT "id", "invoiceId", "lineTotalExcl", "lineTotalIncl", "price", "quantity", "vat", "vatAmount" FROM "InvoiceLine";
DROP TABLE "InvoiceLine";
ALTER TABLE "new_InvoiceLine" RENAME TO "InvoiceLine";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
