import { Router } from "express";
import { getExpiringBatchesHandler, previewDispatchHandler } from "./inventory.controller";

export const inventoryRouter = Router();

inventoryRouter.get("/expiring", getExpiringBatchesHandler);
inventoryRouter.post("/dispatch/preview", previewDispatchHandler);
