import { prisma } from "../../config/db";
import { allocateByKnapsack, allocateByGreedy, AllocationCandidate } from "../../utils/knapsack";

const PRIORITY_WEIGHT: Record<string, number> = {
  CRITICAL: 100,
  HIGH: 50,
  STANDARD: 10,
  LOW: 1,
};

// Above this many candidates the DP table gets too big to be worth it -
// fall back to the greedy value-density heuristic.
const KNAPSACK_DP_THRESHOLD = 500;

/**
 * When available stock for a product can't cover every pending order,
 * decide which order-items get fulfilled. Exact 0/1 knapsack for small
 * candidate sets, greedy fallback for large ones.
 */
export async function allocateStockForProduct(productId: string, warehouseId: string) {
  const availableStock = await prisma.inventoryBatch.aggregate({
    where: { productId, warehouseId },
    _sum: { quantity: true },
  });
  const stock = availableStock._sum.quantity ?? 0;

  const pendingItems = await prisma.orderItem.findMany({
    where: {
      productId,
      order: { status: "PENDING" },
    },
    include: { order: true },
  });

  const candidates: AllocationCandidate[] = pendingItems.map((item: (typeof pendingItems)[number]) => ({
    orderItemId: item.id,
    requestedQty: item.requestedQty - item.allocatedQty,
    value: PRIORITY_WEIGHT[item.order.priority] ?? 10,
  }));

  const result =
    candidates.length <= KNAPSACK_DP_THRESHOLD && stock <= 5000
      ? allocateByKnapsack(candidates, stock)
      : allocateByGreedy(candidates, stock);

  await prisma.$transaction(
    result.allocated.map((c) =>
      prisma.orderItem.update({
        where: { id: c.orderItemId },
        data: { allocatedQty: { increment: c.requestedQty } },
      })
    )
  );

  return result;
}
