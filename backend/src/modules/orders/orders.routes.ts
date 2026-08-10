import { Router } from "express";
import { allocateStockHandler } from "./orders.controller";

export const ordersRouter = Router();

ordersRouter.post("/allocate", allocateStockHandler);
