import { z } from "zod";

export const relationTypeEnum = z.enum(["debitor", "creditor"]);

// Form schema for input validation
export const debitorFormSchema = z.object({
    companyName: z.string().min(1, "Bedrijfsnaam is verplicht"),
    contactPerson: z.string().optional(),
    kvkNumber: z.string().optional(),
    btwNumber: z.string().optional(),
    IBAN: z.string().optional(),
    paymentTerm: z.number().min(0, "Betalingstermijn moet positief zijn"),
    email: z.string().email("Geldig e-mailadres verplicht"),
    phonenumber: z.string().optional(),
    address: z.string().optional(),
    postcode: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
});

// Database schema
export const debitorSchema = z.object({
    id: z.number(),
    companyName: z.string(),
    contactPerson: z.string().optional(),
    type: relationTypeEnum,
    
    kvkNumber: z.string().optional(),
    btwNumber: z.string().optional(),
    IBAN: z.string().optional(),
    paymentTerm: z.number(),

    email: z.string().email(),
    phonenumber: z.string().optional(),

    address: z.string().optional(),
    postcode: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),

    createdAt: z.string().datetime(),
    updateAt: z.string().datetime(),
});
