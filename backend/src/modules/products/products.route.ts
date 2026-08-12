import { Router } from "express";

import { getProductsHandler } from "./products.controller";
import { getProductByIdHandler } from "./products.controller";
import { getProductBySkuHandler } from "./products.controller";

export const productsRouter = Router();

productsRouter.get("/", getProductsHandler);

productsRouter.get("/sku/:sku", getProductBySkuHandler);

productsRouter.get("/:id", getProductByIdHandler);