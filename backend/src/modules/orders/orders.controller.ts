import { Request, Response } from "express";
import { allocateStockForProduct } from "./orders.service";

export async function allocateStockHandler(req: Request, res: Response) {
  try {
    const { productId, warehouseId } = req.body as { productId: string; warehouseId: string };
    const result = await allocateStockForProduct(productId, warehouseId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}
