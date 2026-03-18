import {prisma} from "../database.js";

export async function createDebitor(
    userId: number,
    companyId: number,
    debitor: {
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
    if(debitor.email){
        const existing = await prisma.relation.findFirst({
            where: {
                email: debitor.email,
                companyId,
            },
        })
        if (existing) {
            throw new Error(`A relation with email "${debitor.email}" already exists.`);
        }
    }

    try {
        return await prisma.relation.create({
            data: {
                companyId,
                companyName: debitor.companyName,
                contactPerson: debitor.contactPerson,
                type: "DEBTOR",
                kvkNumber: debitor.kvkNumber,
                btwNumber: debitor.btwNumber,
                IBAN: debitor.IBAN,
                paymentTerm: debitor.paymentTerm,
                email: debitor.email,
                phonenumber: debitor.phonenumber,
                address: debitor.address,
                postcode: debitor.postcode,
                city: debitor.city,
                country: debitor.country,
            },
        })
    } catch (error) {
        console.error("Error creating debitor:", error);
        throw error;
    }
}

export async function getDebitors(userId: number) {
    const company = await prisma.company.findFirst({
        where: {
            users: {
                some: { id: userId }
            }
        }
    });

    if (!company) {
        throw new Error(`User ${userId} is not part of a company`);
    }

    return prisma.relation.findMany({
        where: {
            type: "DEBTOR",
            companyId: company.id,
        }
    });
}

export async function deleteDebitor(debitorId: number) {
    await prisma.relation.delete({
        where: {
            id: debitorId,
            type: "DEBTOR"
        }
    });
}

export async function updateDebitor(
    debitor: {
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
    debitorId: number
){
    return prisma.relation.update({
        where: {
            id: debitorId,
            type: "DEBTOR",
        },
        data: {
            companyName: debitor.companyName,
            contactPerson: debitor.contactPerson,
            kvkNumber: debitor.kvkNumber,
            btwNumber: debitor.btwNumber,
            IBAN: debitor.IBAN,
            paymentTerm: debitor.paymentTerm,
            email: debitor.email,
            phonenumber: debitor.phonenumber,
            address: debitor.address,
            postcode: debitor.postcode,
            city: debitor.city,
            country: debitor.country,
        },
    });
}