import { Router } from "express";

import {
    getExpiringBatchesHandler,
    previewDispatchHandler,
} from "./inventory.controller";

export const inventoryRouter = Router();

// Get batches that are close to expiry
inventoryRouter.get(
    "/expiring",
    getExpiringBatchesHandler
);

// Preview FEFO dispatch plan
inventoryRouter.post(
    "/dispatch/preview",
    previewDispatchHandler
);