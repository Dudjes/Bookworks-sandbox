import { z } from "zod";

export const ledgerSchema = z.object({
  number: z
    .number()
    .int("Ledger number must be an integer")
    .positive("Ledger number must be positive"),
  name: z
    .string()
    .trim()
    .min(1, "Ledger name is required")
    .max(255, "Ledger name must be less than 255 characters"),
  type: z
    .enum(["B", "W"])
    .describe("B for Balance sheet, W for Profit & Loss"),
  category: z
    .string()
    .trim()
    .min(1, "Category is required")
    .max(255, "Category must be less than 255 characters"),
});

export type LedgerFormInput = z.infer<typeof ledgerSchema>;
