import { prisma } from "../../config/db";

export async function getAllProducts() {
    return prisma.product.findMany({
        orderBy: {
            createdAt: "desc",
        },
    });
}

export async function getProductById(id: string) {
    return prisma.product.findUnique({
        where: {
            id,
        },
    });
}

export async function getProductBySku(sku: string) {
    return prisma.product.findUnique({
        where: {
            sku,
        },
    });
}