/*
  Warnings:

  - You are about to drop the `Payment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `paymentId` on the `PaymentLine` table. All the data in the column will be lost.
  - Added the required column `paymentInvoiceId` to the `PaymentLine` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Payment_invoiceNumber_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Payment";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "PaymentInvoice" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invoiceNumber" TEXT NOT NULL,
    "companyId" INTEGER NOT NULL,
    "debitorId" INTEGER NOT NULL,
    "createdById" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "invoiceDate" DATETIME NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "paymentTerm" INTEGER NOT NULL,
    "subTotal" DECIMAL NOT NULL,
    "vatTotal" DECIMAL NOT NULL,
    "total" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    CONSTRAINT "PaymentInvoice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PaymentInvoice_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PaymentInvoice_debitorId_fkey" FOREIGN KEY ("debitorId") REFERENCES "Debitor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PaymentLine" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "paymentInvoiceId" INTEGER NOT NULL,
    "rowDescription" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "price" REAL NOT NULL,
    "vat" TEXT NOT NULL,
    "lineTotalExcl" REAL NOT NULL,
    "vatAmount" REAL NOT NULL,
    "lineTotalIncl" REAL NOT NULL,
    CONSTRAINT "PaymentLine_paymentInvoiceId_fkey" FOREIGN KEY ("paymentInvoiceId") REFERENCES "PaymentInvoice" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PaymentLine" ("id", "lineTotalExcl", "lineTotalIncl", "price", "quantity", "rowDescription", "vat", "vatAmount") SELECT "id", "lineTotalExcl", "lineTotalIncl", "price", "quantity", "rowDescription", "vat", "vatAmount" FROM "PaymentLine";
DROP TABLE "PaymentLine";
ALTER TABLE "new_PaymentLine" RENAME TO "PaymentLine";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "PaymentInvoice_invoiceNumber_key" ON "PaymentInvoice"("invoiceNumber");
