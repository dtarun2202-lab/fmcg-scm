import { Router, Request, Response } from "express";
import { findBestRoute, planDeliveryRun } from "./logistics.service";

export const logisticsRouter = Router();

logisticsRouter.get("/route", async (req: Request, res: Response) => {
  const { warehouseId, retailerId } = req.query as { warehouseId: string; retailerId: string };
  const result = await findBestRoute(warehouseId, retailerId);
  if (!result) return res.status(404).json({ error: "No route found" });
  res.json(result);
});

logisticsRouter.post("/plan-run", async (req: Request, res: Response) => {
  const { depotWarehouseId, retailerIds } = req.body as {
    depotWarehouseId: string;
    retailerIds: string[];
  };
  const result = await planDeliveryRun(depotWarehouseId, retailerIds);
  res.json(result);
});
