import express from "express";
import cors from "cors";
import { rateLimiter } from "./middleware/rateLimiter";
import { inventoryRouter } from "./modules/inventory/inventory.routes";
import { ordersRouter } from "./modules/orders/orders.routes";
import { logisticsRouter } from "./modules/logistics/logistics.routes";
import { forecastRouter } from "./modules/forecast/forecast.routes";

export const app = express();

app.use(cors());
app.use(express.json());
app.use(rateLimiter(20, 5)); // 20-token bucket, refills 5 tokens/sec

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/inventory", inventoryRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/logistics", logisticsRouter);
app.use("/api/forecast", forecastRouter);
