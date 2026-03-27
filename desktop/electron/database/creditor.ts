import {prisma} from "../database.js";

export async function createCreditor(
    userId: number,
    companyId: number,
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
    },
){
    if(creditor.email){
        const existing = await prisma.creditor.findFirst({
            where: {
                email: creditor.email,
                companyId,
            },
        })
        if (existing) {
            throw new Error(`A creditor with email "${creditor.email}" already exists.`);
        }
    }

    try {
        return await prisma.creditor.create({
            data: {
                companyId,
                companyName: creditor.companyName,
                contactPerson: creditor.contactPerson,
                kvkNumber: creditor.kvkNumber,
                btwNumber: creditor.btwNumber,
                IBAN: creditor.IBAN,
                paymentTerm: creditor.paymentTerm,
                email: creditor.email,
                phonenumber: creditor.phonenumber,
                address: creditor.address,
                postcode: creditor.postcode,
                city: creditor.city,
                country: creditor.country,
            },
        })
    } catch (error) {
        console.error("Error creating creditor:", error);
        throw error;
    }
}

export async function getCreditors(userId: number) {
    const company = await prisma.company.findFirst({
        where: {
            users: {
                some: { userId: userId }
            }
        }
    });

    if (!company) {
        throw new Error(`User ${userId} is not part of a company`);
    }

    return prisma.creditor.findMany({
        where: {
            companyId: company.id,
        }
    });
}

export async function deleteCreditor(creditorId: number) {
    await prisma.creditor.delete({
        where: {
            id: creditorId,
        }
    });
}

export async function updateCreditor(
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
    },
    creditorId: number
){
    return prisma.creditor.update({
        where: {
            id: creditorId,
        },
        data: {
            companyName: creditor.companyName,
            contactPerson: creditor.contactPerson,
            kvkNumber: creditor.kvkNumber,
            btwNumber: creditor.btwNumber,
            IBAN: creditor.IBAN,
            paymentTerm: creditor.paymentTerm,
            email: creditor.email,
            phonenumber: creditor.phonenumber,
            address: creditor.address,
            postcode: creditor.postcode,
            city: creditor.city,
            country: creditor.country,
        },
    });
}
