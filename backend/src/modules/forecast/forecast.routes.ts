import { Router, Request, Response } from "express";
import { calculateReorderPoint, movingAverageDemand } from "./forecast.service";

export const forecastRouter = Router();

forecastRouter.get("/moving-average", async (req: Request, res: Response) => {
  const { productId, warehouseId, windowDays } = req.query as {
    productId: string;
    warehouseId: string;
    windowDays?: string;
  };
  const avg = await movingAverageDemand(productId, warehouseId, Number(windowDays ?? 30));
  res.json({ avgDailyDemand: avg });
});

forecastRouter.post("/reorder-point", async (req: Request, res: Response) => {
  const { productId, warehouseId, leadTimeDays, serviceLevelZ } = req.body as {
    productId: string;
    warehouseId: string;
    leadTimeDays: number;
    serviceLevelZ?: number;
  };
  const result = await calculateReorderPoint(productId, warehouseId, leadTimeDays, serviceLevelZ);
  res.json(result);
});
