import { Request, Response } from "express";
import {
    getAllProducts,
    getProductById,
    getProductBySku,
} from "./products.service";
export async function getProductBySkuHandler(
    req: Request,
    res: Response
) {
    try {
        const sku = req.params.sku;

        const product = await getProductBySku(sku);

        if (!product) {
            return res.status(404).json({
                error: "Product not found",
            });
        }

        return res.json(product);
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Failed to fetch product",
        });
    }
}

export async function getProductsHandler(
    req: Request,
    res: Response
) {
    try {
        const products = await getAllProducts();
        return res.json(products);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: "Failed to fetch products",
        });
    }
}

export async function getProductByIdHandler(
    req: Request,
    res: Response
) {
    try {
        const id = req.params.id;
        const product = await getProductById(id);

        if (!product) {
            return res.status(404).json({
                error: "Product not found",
            });
        }

        return res.json(product);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: "Failed to fetch product",
        });
    }
}