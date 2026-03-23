import { z } from "zod";

export const companySchema = z.object({
  name: z.string().trim().min(1, "Company name is required"),
  address: z.string().optional(),
  postcode: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),

  kvkNumber: z
    .string()
    .trim()
    .min(1, "KvK number is required")
    .regex(/^\d{8}$/, "KvK number must be 8 digits"),

  btwNumber: z.string().optional(),
  iban: z.string().optional(),
  phone: z.string().optional(),

  email: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || z.string().email().safeParse(value).success, {
      message: "Invalid email address",
    }),

  website: z.string().optional(),
  logo: z.string().optional(),
});