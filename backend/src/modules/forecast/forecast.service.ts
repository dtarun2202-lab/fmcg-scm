import { prisma } from "../../config/db";

/**
 * Simple moving average over the trailing `windowDays` - deliberately not
 * a heavyweight forecasting model. The point of this module is the
 * reorder-point / safety-stock math, which is what actually drives
 * inventory decisions; swap in exponential smoothing or a proper
 * time-series model later without touching the reorder-point logic below.
 */
export async function movingAverageDemand(
  productId: string,
  warehouseId: string,
  windowDays = 30
): Promise<number> {
  const since = new Date();
  since.setDate(since.getDate() - windowDays);

  const records = await prisma.demandHistory.findMany({
    where: { productId, warehouseId, date: { gte: since } },
    select: { unitsSold: true },
  });

  if (records.length === 0) return 0;
  const total = records.reduce((sum: number, r: { unitsSold: number }) => sum + r.unitsSold, 0);
  return total / windowDays; // avg units sold per day
}

function stdDevDaily(unitsSold: number[]): number {
  if (unitsSold.length < 2) return 0;
  const mean = unitsSold.reduce((a, b) => a + b, 0) / unitsSold.length;
  const variance =
    unitsSold.reduce((sum, x) => sum + (x - mean) ** 2, 0) / (unitsSold.length - 1);
  return Math.sqrt(variance);
}

/**
 * Reorder point = (avg daily demand x lead time days) + safety stock.
 * Safety stock = Z x std-dev of daily demand x sqrt(lead time days),
 * where Z is the service-level factor (1.65 ~= 95% service level).
 */
export async function calculateReorderPoint(
  productId: string,
  warehouseId: string,
  leadTimeDays: number,
  serviceLevelZ = 1.65
): Promise<{ reorderPoint: number; safetyStock: number; avgDailyDemand: number }> {
  const since = new Date();
  since.setDate(since.getDate() - 90);

  const records = await prisma.demandHistory.findMany({
    where: { productId, warehouseId, date: { gte: since } },
    select: { unitsSold: true },
  });

  const dailySales = records.map((r: { unitsSold: number }) => r.unitsSold);
  const avgDailyDemand =
    dailySales.length > 0
      ? dailySales.reduce((a: number, b: number) => a + b, 0) / dailySales.length
      : 0;
  const stdDev = stdDevDaily(dailySales);

  const safetyStock = Math.ceil(serviceLevelZ * stdDev * Math.sqrt(leadTimeDays));
  const reorderPoint = Math.ceil(avgDailyDemand * leadTimeDays + safetyStock);

  await prisma.product.update({
    where: { id: productId },
    data: { reorderPoint, safetyStock },
  });

  return { reorderPoint, safetyStock, avgDailyDemand };
}
