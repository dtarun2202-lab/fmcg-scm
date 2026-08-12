import { Request, Response } from "express";
import { getExpiringBatches, planFefoDispatch } from "./inventory.service";

export async function getExpiringBatchesHandler(req: Request, res: Response) {
  const withinDays = Number(req.query.withinDays ?? 7);
  const batches = await getExpiringBatches(withinDays);
  res.json({ count: batches.length, batches });
}

export async function previewDispatchHandler(
  req: Request,
  res: Response
) {
  try {
    const { productId, warehouseId, quantity } = req.body;

    const plan = await planFefoDispatch(
      productId,
      warehouseId,
      quantity
    );

    res.json({
      quantityRequested: quantity,
      plan,
    });
  } catch (error) {
    res.status(409).json({
      error: (error as Error).message,
    });
  }
}