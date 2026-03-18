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
    CREATE TABLE IF NOT EXISTS "Relation" (
      "id"            INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "companyId"     INTEGER NOT NULL,
      "companyName"   TEXT NOT NULL,
      "contactPerson" TEXT,
      "type"          TEXT NOT NULL,
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
      CONSTRAINT "Relation_companyId_fkey"
        FOREIGN KEY ("companyId") REFERENCES "Company"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
    );
  `);
}

export { prisma };
