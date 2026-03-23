import { prisma } from "../database.js";

export async function createOrUpdate(
    userId: number, 
    data: {
        name: string;
        kvkNumber?: string;
        btwNumber?: string;
        address: string;
        postcode: string;
        city: string;
        country: string;
        logo?: string;
    }
){
    //check if user is in a company
    const userCompany = await prisma.userCompany.findFirst({
        where: { userId },
        include: { company: true },
    });
   
    if (userCompany) {
        // user already has a company → update it
        return await prisma.company.update({
            where: { id: userCompany.companyId },
            data,
        });
    } else {
        // no company yet → create it and link the user
        const company = await prisma.company.create({ data });

        await prisma.userCompany.create({
            data: {
                userId,
                companyId: company.id,
            },
        });

        return company;
    }
}

export async function getCompanyByUser(userId: number){
    const userCompany = await prisma.userCompany.findFirst({
        where: { userId },
        include: {company: true},
    });

    return userCompany?.company ?? null; //null if not created yet
}